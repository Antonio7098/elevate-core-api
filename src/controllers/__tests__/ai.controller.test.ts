import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

// Define standalone mock functions for the AI service methods
const mockIsAvailable = jest.fn();
const mockGenerateQuestions = jest.fn();
const mockChat = jest.fn();

// Standalone mock functions for Prisma Client methods
// These must be defined before jest.mock('@prisma/client', ...) below.
var mockPrismaFolderFindFirst = jest.fn();
var mockPrismaQuestionSetCreate = jest.fn();
var mockPrismaQuestionSetFindFirst = jest.fn();
var mockPrismaQuestionSetFindUnique = jest.fn();
var mockPrismaQuestionCreate = jest.fn();
var mockPrismaUserFindUnique = jest.fn();
var mockPrismaDisconnect = jest.fn();
var mockPrismaFolderFindMany = jest.fn();

// Mock the AI service module
jest.mock('../../services/aiService', () => {
  // This is the object that will be exported as 'aiService'
  // It uses the mock functions defined above, which are in the closure scope.
  const mockSingletonInstance = {
    isAvailable: mockIsAvailable,
    generateQuestions: mockGenerateQuestions,
    chat: mockChat,
    // Add other methods from AIService class as jest.fn() to prevent errors
    // if they were unexpectedly called by the controller.
    getApiVersion: jest.fn().mockReturnValue('mock-api-version'),
    evaluateAnswer: jest.fn(), 
  };

  return {
    __esModule: true, // Important for ES6 modules
    // Mock the AIService class itself. If anything tries to `new AIService()`,
    // it will get an instance that behaves like mockSingletonInstance.
    AIService: jest.fn().mockImplementation(() => mockSingletonInstance),
    // Mock the exported singleton instance `aiService`
    aiService: mockSingletonInstance,
  };
});

// Import controller functions AFTER mocks are defined and set up
import { generateQuestionsFromSource, chatWithAI } from '../ai.controller';

// Define custom type for request with user property
type RequestWithUser = Request & { user: { userId: number } };

// Mock Prisma Client
// IMPORTANT: Prisma mock functions (mockPrismaFolderFindFirst, etc.) must be defined *before* this block
jest.mock('@prisma/client', () => {
  return {
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
      $disconnect: mockPrismaDisconnect,
    })),
  };
});

describe('AI Controller', () => {
  let mockReq: Partial<RequestWithUser>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    jest.clearAllMocks(); // Reset all mocks before each test

    // Mock request, response, and next function
    mockReq = {
      user: { userId: 1 },
      body: {}
    } as Partial<RequestWithUser>;
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  describe('generateQuestionsFromSource', () => {
    beforeEach(() => {
      mockReq = {
        body: {
          sourceText: 'Test source text for generating questions',
          folderId: 1,
          questionCount: 3
        },
        user: {
          userId: 1
        }
      } as Request & { user: { userId: number } };

      // Mock folder exists and belongs to user
      mockPrismaFolderFindFirst.mockResolvedValue({
        id: 1,
        name: 'Test Folder',
        userId: 1
      });

      // Mock question set creation
      mockPrismaQuestionSetCreate.mockResolvedValue({
        id: 1,
        name: 'Test Question Set',
        folderId: 1
      });

      // Mock question creation
      mockPrismaQuestionCreate.mockImplementation((data: any) => ({
        id: Math.floor(Math.random() * 1000),
        ...data.data
      }));
    });

    it('should use AI service when available', async () => {
      // Mock AI service is available
      mockIsAvailable.mockResolvedValue(true);

      // Mock AI service response
      mockGenerateQuestions.mockResolvedValue({
        success: true,
        questions: [
          {
            text: 'What is test question 1?',
            answer: 'Test answer 1',
            questionType: 'multiple-choice',
            options: ['Option A', 'Option B', 'Option C'],
            uueFocus: 'Understand',
            conceptTags: ['concept1', 'concept2'],
            difficultyScore: 0.5,
            totalMarksAvailable: 3,
            markingCriteria: [
              { criterion: 'Correct identification of capital', marks: 1 },
              { criterion: 'Explanation of significance', marks: 2 }
            ]
          },
          {
            text: 'What is test question 2?',
            answer: 'Test answer 2',
            questionType: 'short-answer',
            options: [],
            uueFocus: 'Use',
            conceptTags: ['concept2', 'concept3'],
            difficultyScore: 0.7,
            totalMarksAvailable: 5,
            markingCriteria: [
              { criterion: 'Correct formula', marks: 2 },
              { criterion: 'Accurate calculation', marks: 2 },
              { criterion: 'Clear explanation', marks: 1 }
            ]
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
      expect(mockIsAvailable).toHaveBeenCalled();
      expect(mockGenerateQuestions).toHaveBeenCalledWith({
        sourceText: 'Test source text for generating questions',
        questionCount: 3,
      });

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();
      const jsonResponse = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonResponse).toHaveProperty('questionSet');
      expect(jsonResponse.questionSet).toHaveProperty('questions');
      expect(jsonResponse.questionSet.questions.length).toBe(2);
      
      // Verify new question attributes are included in the response
      expect(jsonResponse.questionSet.questions[0]).toHaveProperty('totalMarksAvailable', 3);
      expect(jsonResponse.questionSet.questions[0]).toHaveProperty('markingCriteria');
      expect(jsonResponse.questionSet.questions[0].markingCriteria).toHaveLength(2);
      expect(jsonResponse.questionSet.questions[0].markingCriteria[0]).toHaveProperty('criterion', 'Correct identification of capital');
      
      expect(jsonResponse.questionSet.questions[1]).toHaveProperty('totalMarksAvailable', 5);
      expect(jsonResponse.questionSet.questions[1]).toHaveProperty('markingCriteria');
      expect(jsonResponse.questionSet.questions[1].markingCriteria).toHaveLength(3);
      expect(jsonResponse.questionSet.questions[1].markingCriteria[2]).toHaveProperty('marks', 1);
    });

    it('should fall back to simulation when AI service is unavailable', async () => {
      // Mock AI service is unavailable
      mockIsAvailable.mockResolvedValue(false);

      await generateQuestionsFromSource(mockReq as any, mockRes as any, mockNext);

      // Verify AI service was checked
      expect(mockIsAvailable).toHaveBeenCalled();
      // generateQuestions should NOT be called if service is unavailable and controller uses simulation
      expect(mockGenerateQuestions).not.toHaveBeenCalled();

      // Verify response (should still work, falling back to simulation)
      expect(mockRes.status).toHaveBeenCalledWith(201); // Assuming simulation is successful
      expect(mockRes.json).toHaveBeenCalled();
      const jsonResponse = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonResponse.questionSet.name).toContain('AI Generated Quiz for'); // Check for simulation output
    });

    it('should handle AI service errors gracefully', async () => {
      // Mock AI service is available but throws an error
      mockIsAvailable.mockResolvedValue(true);
      mockGenerateQuestions.mockRejectedValue(new Error('AI service error'));

      await generateQuestionsFromSource(mockReq as any, mockRes as any, mockNext);

      // Verify AI service was called
      expect(mockIsAvailable).toHaveBeenCalled();
      expect(mockGenerateQuestions).toHaveBeenCalled();

      // Verify response (should still work, falling back to simulation)
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalled();
      const jsonResponse = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonResponse).toHaveProperty('questionSet');
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;

      await generateQuestionsFromSource(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return 404 if folder is not found', async () => {
      mockPrismaFolderFindFirst.mockResolvedValue(null);

      await generateQuestionsFromSource(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Folder not found or not owned by user' });
    });
  });

  describe('chatWithAI', () => {
    beforeEach(() => {
      mockReq.body = {
        message: 'What is photosynthesis?',
        questionSetId: 1
      };

      // Mock question set exists and belongs to user
      (mockPrismaQuestionSetFindFirst as jest.Mock).mockResolvedValue({
        id: 1,
        name: 'Photosynthesis Basics', // Consistent name
        folder: { id: 1, name: 'Biology Folder', userId: 1 }, // Crucially, add folder
        questions: [
          { id: 101, text: 'What is photosynthesis?', answer: 'A process', questionType: 'short_answer', uueFocus: 'Understand', difficultyScore: 0.5, timesAnswered: 0, lastAnswerCorrect: null, createdAt: new Date(), updatedAt: new Date() }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        currentUUESetStage: 'Understand', 
        understandScore: 0, 
        useScore: 0, 
        exploreScore: 0, 
        currentTotalMasteryScore: 0, 
        currentForgottenPercentage: 0, 
        reviewCount:0, 
        nextReviewAt: null, 
        currentIntervalDays: 0, 
        lastReviewedAt: null
      });

      // Mock user exists
      (mockPrismaUserFindUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        createdAt: new Date()
      });
    });

    it('should use AI service when available', async () => {
      // Mock AI service is available
      mockIsAvailable.mockResolvedValue(true);

      // Mock AI service response
      mockChat.mockResolvedValue({
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

      expect(mockPrismaQuestionSetFindFirst).toHaveBeenCalledWith({
        where: { id: 1, folder: { userId: 1 } },
        include: { questions: true, folder: true }
      });

      // Verify AI service was called
      expect(mockIsAvailable).toHaveBeenCalled();
      expect(mockChat).toHaveBeenCalled();
      const chatRequest = (mockChat as jest.Mock).mock.calls[0][0];
      expect(chatRequest).toHaveProperty('message', 'What is photosynthesis?');
      expect(chatRequest).toHaveProperty('context');
      expect(chatRequest.context).toHaveProperty('questionSets');

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      const jsonResponse = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonResponse).toHaveProperty('response');
      expect(jsonResponse.response).toHaveProperty('references');
      expect(jsonResponse.response).toHaveProperty('suggestedQuestions');
      expect(jsonResponse).toHaveProperty('metadata');
    });

    it('should fall back to simulation when AI service is unavailable', async () => {
      // Mock AI service is unavailable
      mockIsAvailable.mockResolvedValue(false);

      await chatWithAI(mockReq as any, mockRes as any, mockNext);

      // Verify AI service was called
      expect(mockIsAvailable).toHaveBeenCalled();
      // chat should NOT be called if service is unavailable and controller uses simulation
      expect(mockChat).not.toHaveBeenCalled();

      // Verify response (should still work, falling back to simulation)
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      const jsonResponse = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonResponse).toHaveProperty('response'); // Check for simulation output structure
      expect(jsonResponse.response).toContain('Simulated AI response for:');
    });

    it('should handle AI service errors gracefully (fallback to simulation)', async () => {
      // Mock AI service is available but throws an error
      mockIsAvailable.mockResolvedValue(true);
      mockChat.mockRejectedValue(new Error('AI service error'));

      await chatWithAI(mockReq as any, mockRes as any, mockNext);

      // Verify AI service was called
      expect(mockIsAvailable).toHaveBeenCalled();
      expect(mockChat).toHaveBeenCalled(); // It was called, but it threw an error

      // Verify response (should fall back to simulation)
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
      const jsonResponse = (mockRes.json as jest.Mock).mock.calls[0][0];
      expect(jsonResponse.response).toContain('Simulated AI response for:'); // Check for simulation output
    });

    it('should return 401 if user is not authenticated', async () => {
      mockReq.user = undefined;

      await chatWithAI(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return 404 if question set is not found', async () => {
      mockPrismaQuestionSetFindFirst.mockResolvedValue(null);

      await chatWithAI(mockReq as any, mockRes as any, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Question set not found or not owned by user' });
    });

    it('should handle folder context', async () => {
      mockReq.body = {
        message: 'What is photosynthesis?',
        folderId: 1
      };

      // Mock folder exists and belongs to user
      (mockPrismaFolderFindFirst as jest.Mock).mockResolvedValue({ // Ensure this is cast as jest.Mock
        id: 1,
        name: 'Biology Folder',
        userId: 1, // Added userId for completeness
        questionSets: [
          {
            id: 1, // This is questionSetId
            name: 'Biology 101',
            questions: [
              { id: 101, text: 'What is photosynthesis?', answer: 'A process', questionType: 'short_answer', uueFocus: 'Understand', difficultyScore: 0.5, timesAnswered: 0, lastAnswerCorrect: null, createdAt: new Date(), updatedAt: new Date() }
            ],
            createdAt: new Date(), updatedAt: new Date(), currentUUESetStage: 'Understand', understandScore: 0, useScore: 0, exploreScore: 0, currentTotalMasteryScore: 0, currentForgottenPercentage: 0, reviewCount:0, nextReviewAt: null, currentIntervalDays: 0, lastReviewedAt: null
          }
        ]
      });

      // Mock AI service is available
      mockIsAvailable.mockResolvedValue(true);
      // Mock AI service response
      mockChat.mockResolvedValue({
        success: true,
        response: { message: 'Chat response about Biology 101' },
        metadata: { processingTime: '0.1s', model: 'test-model', tokensUsed: 10 }
      });

      await chatWithAI(mockReq as any, mockRes as any, mockNext);

      // Verify Prisma calls
      expect(mockPrismaFolderFindFirst).toHaveBeenCalledWith({
        where: { id: 1, userId: 1 },
        include: { questionSets: { include: { questions: true } } }
      });
      
      // Verify AI service was called
      expect(mockIsAvailable).toHaveBeenCalled();
      expect(mockChat).toHaveBeenCalled();
      const chatRequest = mockChat.mock.calls[0][0];
      expect(chatRequest.context).toHaveProperty('questionSets');
      expect(chatRequest.context.questionSets.length).toBe(1);
      expect(chatRequest.context.questionSets[0].name).toBe('Biology 101');

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        response: { message: 'Chat response about Biology 101' }
      }));
    });
  });
}); 