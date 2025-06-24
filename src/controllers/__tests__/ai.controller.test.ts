import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

// Standalone mock functions for Prisma Client methods
const mockPrismaFolderFindFirst = jest.fn();
const mockPrismaFolderFindMany = jest.fn();
const mockPrismaQuestionSetCreate = jest.fn();
const mockPrismaQuestionSetFindFirst = jest.fn();
const mockPrismaQuestionSetFindUnique = jest.fn();
const mockPrismaQuestionCreate = jest.fn();
const mockPrismaUserFindUnique = jest.fn();
const mockPrismaDisconnect = jest.fn();
const mockPrismaNoteFindfirst = jest.fn();

// Import controller functions AFTER mocks are defined and set up
import { generateQuestionsFromSource, chatWithAI } from '../ai.controller';
import { AuthRequest } from '../../middleware/auth.middleware';
import AiRAGService from '../../services/ai-rag.service';

// Mock AiRAGService
jest.mock('../../services/ai-rag.service');

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    folder: {
      findFirst: mockPrismaFolderFindFirst,
      findMany: mockPrismaFolderFindMany,
    },
    questionSet: {
      create: mockPrismaQuestionSetCreate,
      findFirst: mockPrismaQuestionSetFindFirst,
      findUnique: mockPrismaQuestionSetFindUnique,
    },
    question: {
      create: mockPrismaQuestionCreate,
    },
    user: {
      findUnique: mockPrismaUserFindUnique,
    },
    note: {
      findFirst: mockPrismaNoteFindfirst,
    },
    $disconnect: mockPrismaDisconnect,
  })),
}));

describe('AI Controller', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      user: { userId: 1 },
      body: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();

    jest.clearAllMocks(); // Reset all mocks before each test

    mockPrismaFolderFindFirst.mockReset();
    mockPrismaQuestionSetCreate.mockReset();
    mockPrismaQuestionCreate.mockReset();
    mockPrismaNoteFindfirst.mockReset();

    // Default mock implementations
    mockPrismaFolderFindFirst.mockResolvedValue({ id: 1, name: 'Test Folder', userId: 1 });
    mockPrismaQuestionSetCreate.mockResolvedValue({ id: 1, name: 'Test Question Set' });
    mockPrismaQuestionCreate.mockResolvedValue({ id: 1 });
    mockPrismaNoteFindfirst.mockResolvedValue({ 
      id: 123, 
      title: 'Test Note', 
      content: 'This is a test note content', 
      folderId: 1,
      userId: 1
    });
  });

  describe('generateQuestionsFromSource', () => {
    beforeEach(() => {
      mockReq = {
        user: { userId: 1 },
        body: {
          sourceId: 123,
          questionScope: 'lesson_summary',
          questionTone: 'neutral',
          questionCount: 3,
          folderId: 1,
        },
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      mockNext = jest.fn();
    });

    it('should generate questions and create a question set using simulation', async () => {
      // Mock successful note and folder lookup
      mockPrismaNoteFindfirst.mockResolvedValue({
        id: 123,
        title: 'Test Note',
        content: 'This is test content',
        folderId: 1,
        userId: 1
      });
      
      mockPrismaFolderFindFirst.mockResolvedValue({
        id: 1,
        name: 'Test Folder',
        userId: 1
      });
      
      mockPrismaQuestionSetCreate.mockResolvedValue({
        id: 1,
        name: 'Questions from Test Note',
        folderId: 1,
        questions: []
      });

      await generateQuestionsFromSource(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();
      const jsonResponse = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonResponse).toHaveProperty('questionSet');
      expect(jsonResponse.questionSet).toHaveProperty('id');
      expect(jsonResponse.questionSet).toHaveProperty('name');
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;
      await generateQuestionsFromSource(mockReq as any, mockRes as any, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return 404 if folder is not found', async () => {
      // Mock successful note lookup
      mockPrismaNoteFindfirst.mockResolvedValue({
        id: 123,
        title: 'Test Note',
        content: 'This is test content',
        folderId: 1,
        userId: 1
      });
      
      // Mock folder not found
      mockPrismaFolderFindFirst.mockResolvedValue(null);
      
      await generateQuestionsFromSource(mockReq as any, mockRes as any, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Folder not found or not owned by user' });
    });
    
    it('should return 404 if note is not found', async () => {
      // Mock note not found
      mockPrismaNoteFindfirst.mockResolvedValue(null);
      
      await generateQuestionsFromSource(mockReq as any, mockRes as any, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Note not found or not owned by user' });
    });
  });

  describe('chatWithAI', () => {
    beforeEach(() => {
      // The mock is on the imported module, so we cast it to jest.Mock
      (AiRAGService.handleChatMessage as jest.Mock).mockClear();

      mockReq = {
        user: { userId: 1 },
        body: {
          messageContent: 'What is a cell?',
          context: { questionSetId: 1 },
        },
      };
    });

    it('should call AiRAGService.handleChatMessage and return 200 on success', async () => {
      const mockServiceResponse = { response: 'This is the AI response.' };
      (AiRAGService.handleChatMessage as jest.Mock).mockResolvedValue(mockServiceResponse);

      await chatWithAI(mockReq as any, mockRes as any, mockNext);

      expect(AiRAGService.handleChatMessage).toHaveBeenCalledWith(mockReq.body, 1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockServiceResponse);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 404 when service throws a "not found" error', async () => {
      const errorMessage = 'Item not found or access denied.';
      (AiRAGService.handleChatMessage as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await chatWithAI(mockReq as any, mockRes as any, mockNext);

      expect(AiRAGService.handleChatMessage).toHaveBeenCalledWith(mockReq.body, 1);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: errorMessage });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with the error for other service failures', async () => {
      const genericError = new Error('AI service is down');
      (AiRAGService.handleChatMessage as jest.Mock).mockRejectedValue(genericError);

      await chatWithAI(mockReq as any, mockRes as any, mockNext);

      expect(AiRAGService.handleChatMessage).toHaveBeenCalledWith(mockReq.body, 1);
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(genericError);
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;

      await chatWithAI(mockReq as any, mockRes as any, mockNext);

      expect(AiRAGService.handleChatMessage).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });
  });
});