import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateQuestionsFromSource, chatWithAI } from '../ai.controller';
import { aiService } from '../../services/aiService';

// Mock the AI service
jest.mock('../../services/aiService', () => ({
  aiService: {
    isAvailable: jest.fn(),
    generateQuestions: jest.fn(),
    chat: jest.fn()
  }
}));

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    folder: {
      findFirst: jest.fn(),
    },
    questionSet: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    question: {
      create: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('AI Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let prisma: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request, response, and next function
    mockReq = {
      user: { userId: 1 },
      body: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();

    // Get the mocked Prisma instance
    prisma = new PrismaClient();
  });

  describe('generateQuestionsFromSource', () => {
    beforeEach(() => {
      mockReq.body = {
        sourceText: 'Test source text for generating questions',
        folderId: 1,
        questionCount: 3
      };

      // Mock folder exists and belongs to user
      prisma.folder.findFirst.mockResolvedValue({
        id: 1,
        name: 'Test Folder',
        userId: 1
      });

      // Mock question set creation
      prisma.questionSet.create.mockResolvedValue({
        id: 1,
        name: 'Test Question Set',
        folderId: 1
      });

      // Mock question creation
      prisma.question.create.mockImplementation((data) => ({
        id: Math.floor(Math.random() * 1000),
        ...data.data
      }));
    });

    it('should use AI service when available', async () => {
      // Mock AI service is available
      (aiService.isAvailable as jest.Mock).mockResolvedValue(true);

      // Mock AI service response
      (aiService.generateQuestions as jest.Mock).mockResolvedValue({
        success: true,
        questions: [
          {
            text: 'What is test question 1?',
            answer: 'Test answer 1',
            questionType: 'multiple-choice',
            options: ['Option A', 'Option B', 'Option C']
          },
          {
            text: 'What is test question 2?',
            answer: 'Test answer 2',
            questionType: 'short-answer',
            options: []
          }
        ],
        metadata: {
          processingTime: '1.2s',
          model: 'gpt-4',
          sourceTextLength: 100
        }
      });

      await generateQuestionsFromSource(mockReq as any, mockRes as any, mockNext);

      // Verify AI service was called
      expect(aiService.isAvailable).toHaveBeenCalled();
      expect(aiService.generateQuestions).toHaveBeenCalledWith({
        sourceText: 'Test source text for generating questions',
        questionCount: 3,
        questionTypes: undefined,
        difficulty: undefined
      });

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();
      const jsonResponse = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonResponse).toHaveProperty('questionSet');
      expect(jsonResponse.questionSet).toHaveProperty('questions');
      expect(jsonResponse.questionSet.questions.length).toBe(2);
    });

    it('should fall back to simulation when AI service is unavailable', async () => {
      // Mock AI service is unavailable
      (aiService.isAvailable as jest.Mock).mockResolvedValue(false);

      await generateQuestionsFromSource(mockReq as any, mockRes as any, mockNext);

      // Verify AI service was checked but not called
      expect(aiService.isAvailable).toHaveBeenCalled();
      expect(aiService.generateQuestions).not.toHaveBeenCalled();

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should handle AI service errors gracefully', async () => {
      // Mock AI service is available but throws an error
      (aiService.isAvailable as jest.Mock).mockResolvedValue(true);
      (aiService.generateQuestions as jest.Mock).mockRejectedValue(new Error('AI service error'));

      await generateQuestionsFromSource(mockReq as any, mockRes as any, mockNext);

      // Verify AI service was called
      expect(aiService.isAvailable).toHaveBeenCalled();
      expect(aiService.generateQuestions).toHaveBeenCalled();

      // Verify response (should still work, falling back to simulation)
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;

      await generateQuestionsFromSource(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return 404 if folder is not found', async () => {
      prisma.folder.findFirst.mockResolvedValue(null);

      await generateQuestionsFromSource(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Folder not found or access denied' });
    });
  });

  describe('chatWithAI', () => {
    beforeEach(() => {
      mockReq.body = {
        message: 'What is photosynthesis?',
        questionSetId: 1
      };

      // Mock question set exists and belongs to user
      prisma.questionSet.findFirst.mockResolvedValue({
        id: 1,
        name: 'Biology 101',
        questions: [
          { text: 'What is photosynthesis?', answer: 'A process used by plants to convert light energy into chemical energy' }
        ]
      });
    });

    it('should use AI service when available', async () => {
      // Mock AI service is available
      (aiService.isAvailable as jest.Mock).mockResolvedValue(true);

      // Mock AI service response
      (aiService.chat as jest.Mock).mockResolvedValue({
        success: true,
        response: {
          message: 'Photosynthesis is the process used by plants to convert light energy into chemical energy.',
          references: [
            { text: 'A process used by plants to convert light energy into chemical energy', source: 'Biology 101 Question Set' }
          ],
          suggestedQuestions: ['What are the stages of photosynthesis?']
        },
        metadata: {
          processingTime: '0.8s',
          model: 'gpt-4',
          tokensUsed: 150
        }
      });

      await chatWithAI(mockReq as any, mockRes as any, mockNext);

      // Verify AI service was called
      expect(aiService.isAvailable).toHaveBeenCalled();
      expect(aiService.chat).toHaveBeenCalled();
      const chatRequest = (aiService.chat as jest.Mock).mock.calls[0][0];
      expect(chatRequest).toHaveProperty('message', 'What is photosynthesis?');
      expect(chatRequest).toHaveProperty('context');
      expect(chatRequest.context).toHaveProperty('questionSets');

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      const jsonResponse = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonResponse).toHaveProperty('response');
      expect(jsonResponse).toHaveProperty('references');
      expect(jsonResponse).toHaveProperty('suggestedQuestions');
      expect(jsonResponse).toHaveProperty('metadata');
    });

    it('should fall back to simulation when AI service is unavailable', async () => {
      // Mock AI service is unavailable
      (aiService.isAvailable as jest.Mock).mockResolvedValue(false);

      await chatWithAI(mockReq as any, mockRes as any, mockNext);

      // Verify AI service was checked but not called
      expect(aiService.isAvailable).toHaveBeenCalled();
      expect(aiService.chat).not.toHaveBeenCalled();

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      const jsonResponse = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonResponse).toHaveProperty('response');
    });

    it('should handle AI service errors gracefully', async () => {
      // Mock AI service is available but throws an error
      (aiService.isAvailable as jest.Mock).mockResolvedValue(true);
      (aiService.chat as jest.Mock).mockRejectedValue(new Error('AI service error'));

      await chatWithAI(mockReq as any, mockRes as any, mockNext);

      // Verify AI service was called
      expect(aiService.isAvailable).toHaveBeenCalled();
      expect(aiService.chat).toHaveBeenCalled();

      // Verify response (should still work, falling back to simulation)
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;

      await chatWithAI(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return 404 if question set is not found', async () => {
      prisma.questionSet.findFirst.mockResolvedValue(null);

      await chatWithAI(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Question set not found or access denied' });
    });

    it('should handle folder context', async () => {
      mockReq.body = {
        message: 'What is photosynthesis?',
        folderId: 1
      };

      // Mock folder exists and belongs to user
      prisma.folder.findFirst.mockResolvedValue({
        id: 1,
        name: 'Biology Folder',
        questionSets: [
          {
            id: 1,
            name: 'Biology 101',
            questions: [
              { text: 'What is photosynthesis?', answer: 'A process used by plants to convert light energy into chemical energy' }
            ]
          }
        ]
      });

      // Mock AI service is available
      (aiService.isAvailable as jest.Mock).mockResolvedValue(true);
      (aiService.chat as jest.Mock).mockResolvedValue({
        success: true,
        response: {
          message: 'Photosynthesis is the process used by plants to convert light energy into chemical energy.',
          references: [],
          suggestedQuestions: []
        },
        metadata: {
          processingTime: '0.8s',
          model: 'gpt-4',
          tokensUsed: 150
        }
      });

      await chatWithAI(mockReq as any, mockRes as any, mockNext);

      // Verify AI service was called with folder context
      expect(aiService.chat).toHaveBeenCalled();
      const chatRequest = (aiService.chat as jest.Mock).mock.calls[0][0];
      expect(chatRequest.context).toHaveProperty('questionSets');
      expect(chatRequest.context.questionSets.length).toBe(1);
      expect(chatRequest.context.questionSets[0].name).toBe('Biology 101');
    });
  });
});
