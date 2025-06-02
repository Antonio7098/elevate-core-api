import request from 'supertest';
import app from '../../app';
import { PrismaClient } from '@prisma/client';
import type { Prisma, PrismaClient as PrismaClientType } from '@prisma/client'; // For typing mocks

// Utility type for deep partial mocks of Prisma client and its delegates
type DeepPartialMocked<T> = T extends (...args: any[]) => any // Base case for T itself being a function
  ? jest.Mock // If T is a function, its mock is jest.Mock
  : T extends object
    ? {
        [P in keyof T]?: T[P] extends (...args: any[]) => any // If property T[P] is a function
          ? jest.Mock // Then its mock type in the partial mock is jest.Mock
          : DeepPartialMocked<T[P]>; // Otherwise, recurse for nested objects
      }
    : T;
import { aiService } from '../../services/aiService';

// Mock the AI service
jest.mock('../../services/aiService', () => ({
  aiService: {
    isAvailable: jest.fn(),
    evaluateAnswer: jest.fn()
  }
}));

// Mock Prisma
jest.mock('@prisma/client', (): { PrismaClient: jest.Mock<PrismaClientType> } => {
  const mockPrismaClient: DeepPartialMocked<PrismaClientType> = {
    question: { /* Prisma.QuestionDelegate */
      findFirst: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn().mockImplementation((args) => {
        // Basic mock for findUnique called by SpacedRepetitionService
        if (args && args.where && args.where.id) {
          return Promise.resolve({ id: args.where.id, text: 'Mock question', questionSetId: 1, uueFocus: 'Understand' });
        }
        return Promise.resolve(null);
      }),
    },
    questionSet: {
      findUnique: jest.fn().mockImplementation((args) => {
        if (args && args.where && args.where.id) {
          return Promise.resolve({
            id: args.where.id,
            name: 'Mock Question Set',
            currentTotalMasteryScore: 50,
            understandScore: 50,
            useScore: 50,
            exploreScore: 50,
            currentUUESetStage: 'Understand',
            questions: [{ id: 1, uueFocus: 'Understand', questionSetId: args.where.id, currentMasteryScore: 50 }], // Ensure all selected fields are present
            folderId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
            userId: 1, // Assuming a userId is associated or available via folder
            folder: { userId: 1 } // Ensure folder.userId is available if service logic needs it
          });
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation((args) => {
        if (args && args.data && args.where && args.where.id) {
          // Return an object that merges the ID with the update data
          return Promise.resolve({ id: args.where.id, ...args.data });
        }
        return Promise.resolve(null);
      }),
    },
    userQuestionAnswer: { /* Prisma.UserQuestionAnswerDelegate */
      create: jest.fn().mockImplementation((args) => {
        if (args && args.data) {
          return Promise.resolve({
            id: Math.floor(Math.random() * 10000),
            ...args.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        return Promise.resolve(null);
      }),
    },

    userStudySession: { /* Prisma.UserStudySessionDelegate */ // Added mock for userStudySession
      create: jest.fn().mockResolvedValue({ id: 1, userId: 1, sessionStartedAt: new Date(), sessionEndedAt: new Date(), timeSpentSeconds: 0, answeredQuestionsCount: 1 }), // Ensure it returns an ID
    },
    $disconnect: jest.fn(),
    // Added mock for $transaction
    $transaction: jest.fn(async (callback: (tx: Prisma.TransactionClient) => Promise<any>) => 
      callback(mockPrismaClient as unknown as Prisma.TransactionClient)
    ),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient as unknown as PrismaClientType),
  };
});

// Mock auth middleware
jest.mock('../../middleware/auth.middleware', () => ({
  protect: (req: any, res: any, next: any) => {
    req.user = { userId: 1 };
    next();
  }
}));

describe('Evaluation Routes', () => {
  let prisma: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Get the mocked Prisma instance
    prisma = new PrismaClient();
  });

  describe('POST /api/ai/evaluate-answer', () => {
    it('should evaluate a multiple-choice answer without AI when AI service is unavailable', async () => {
      // Mock question exists and belongs to user
      prisma.question.findFirst.mockResolvedValue({
        id: 1,
        text: 'What is the capital of France?', // Changed
        answer: 'Paris', // Changed
        questionType: 'multiple-choice', // Changed
        options: ['London', 'Paris', 'Berlin', 'Madrid'], // Changed
        uueFocus: 'Understand', // Changed to suit a typical MCQ
        difficultyScore: 0.5, // Adjusted
        marksAvailable: 1,
        questionSetId: 1,
        questionSet: { 
          id: 1,
          name: 'Geography', // Changed to suit MCQ
          overallMasteryScore: 70, // Adjusted
          understandScore: 80, // Adjusted
          useScore: 60, // Adjusted
          exploreScore: 50, // Adjusted
          folder: { 
            id: 1, 
            name: 'General Knowledge' // Changed
          }
        }
      });

      // Mock updated question
      prisma.question.findUnique.mockResolvedValue({
        id: 1,
        text: 'What is the capital of France?',
        questionSetId: 1,
        uueFocus: 'Understand'
      });
      
      // Mock updated question set
      prisma.questionSet.findUnique.mockResolvedValue({
        id: 1,
        name: 'Geography',
        overallMasteryScore: 75,
        understandScore: 85,
        useScore: 65,
        exploreScore: 55
      });

      // Mock AI service is unavailable
      (aiService.isAvailable as jest.Mock).mockResolvedValue(false);

      // Test with correct answer
      const correctResponse = await request(app)
        .post('/api/ai/evaluate-answer')
        .send({
          questionId: 1,
          userAnswer: 'Paris'
        });

      expect(correctResponse.status).toBe(200);
      expect(correctResponse.body.evaluation.isCorrect).toBe(true);
      expect(correctResponse.body.evaluation.score).toBe(1.0);
      expect(correctResponse.body.evaluation.feedback).toContain('Correct');

      // Test with incorrect answer
      const incorrectResponse = await request(app)
        .post('/api/ai/evaluate-answer')
        .send({
          questionId: 1,
          userAnswer: 'London'
        });

      expect(incorrectResponse.status).toBe(200);
      expect(incorrectResponse.body.evaluation.isCorrect).toBe(false);
      expect(incorrectResponse.body.evaluation.score).toBe(0.0);
      expect(incorrectResponse.body.evaluation.feedback).toContain('Incorrect');
    });

    it('should use AI service for evaluation when available', async () => {
      // Mock question exists and belongs to user
      prisma.question.findFirst.mockResolvedValue(JSON.parse(JSON.stringify({
        id: 1,
        text: 'Explain how photosynthesis works.',
        answer: 'Photosynthesis is the process used by plants to convert light energy into chemical energy.',
        questionType: 'short-answer',
        options: [],
        questionSetId: 1, // Added top-level questionSetId
        questionSet: {
          id: 1, // Added id for questionSet
          name: 'Biology',
          folder: {
            id: 1, // Added id for folder
            name: 'Science'
          }
        }
      })));

      // Mock updated question
      prisma.question.findUnique.mockResolvedValue({
        id: 1,
        text: 'Explain how photosynthesis works.',
        answer: 'Photosynthesis is the process used by plants to convert light energy into chemical energy.',
        questionType: 'short-answer',
        options: [],
        questionSetId: 1
      });

      // Mock AI service is available
      (aiService.isAvailable as jest.Mock).mockResolvedValue(true);

      // Mock AI service response
      (aiService.evaluateAnswer as jest.Mock).mockResolvedValue({
        success: true,
        evaluation: {
          isCorrect: 'partially_correct',
          score: 0.7,
          feedback: 'Your answer covers the basic concept but could include more details about the role of chlorophyll and the specific chemical reactions involved.',
          correctedAnswer: 'Photosynthesis is the process used by plants, algae, and certain bacteria to convert light energy from the sun into chemical energy in the form of glucose. It takes place in the chloroplasts, specifically using the green pigment chlorophyll, and involves the conversion of carbon dioxide and water into glucose and oxygen.'
        },
        metadata: {
          processingTime: '0.5s',
          model: 'gpt-4',
          confidenceScore: 0.85
        }
      });

      const response = await request(app)
        .post('/api/ai/evaluate-answer')
        .send({
          questionId: 1,
          userAnswer: 'Photosynthesis is how plants make their food using sunlight.'
        });

      // Verify response
      if (response.status !== 200) {
        console.log('Unexpected response status in AI test:', response.status);
        console.log('Unexpected response body in AI test:', JSON.stringify(response.body, null, 2));
      }
      expect(response.status).toBe(200);
      expect(response.body.evaluation.isCorrect).toBe('partially_correct');
      expect(response.body.evaluation.score).toBe(0.7);
      expect(response.body.evaluation.feedback).toContain('basic concept');
      expect(response.body.evaluation.correctedAnswer).toContain('chlorophyll');
      
      // Verify AI service was called with correct parameters
      expect(aiService.evaluateAnswer).toHaveBeenCalledTimes(1);
      const rawActualPayload = (aiService.evaluateAnswer as jest.Mock).mock.calls[0][0];
      const actualPayload = JSON.parse(JSON.stringify(rawActualPayload)); // Deep clone for assertion
      console.log('Actual payload (deep cloned) received by mock in test (line 222):', JSON.stringify(actualPayload, null, 2));

      // Check payload properties immediately after retrieval from mock
      expect(actualPayload.questionContext).toBeDefined();
      console.log('Value of actualPayload.questionContext.expectedAnswer JUST BEFORE ASSERTION (line 225):', actualPayload.questionContext.expectedAnswer);
      expect(actualPayload.questionContext.expectedAnswer).toEqual(
        'Photosynthesis is the process used by plants to convert light energy into chemical energy.'
      );

      // Assertions on the API response
      if (response.status !== 200) {
        console.log('Unexpected response status in AI test:', response.status);
        console.log('Unexpected response body in AI test:', JSON.stringify(response.body, null, 2));
      }
      expect(actualPayload.questionContext.questionId).toEqual(1);
      expect(actualPayload.questionContext.questionText).toEqual('Explain how photosynthesis works.');
      // expectedAnswer checked above
      expect(actualPayload.questionContext.questionType).toEqual('short-answer');
      expect(actualPayload.questionContext.marksAvailable).toEqual(1);
      expect(actualPayload.userAnswer).toEqual('Photosynthesis is how plants make their food using sunlight.');

      expect(actualPayload.context).toBeDefined();
      expect(actualPayload.context?.questionSetName).toEqual('Biology');
      expect(actualPayload.context?.folderName).toEqual('Science');
      expect(actualPayload.questionSetName).toBeUndefined(); // Explicitly check that top-level is undefined
      
      // Verify mastery was updated
      expect(prisma.question.update).toHaveBeenCalled();
      const updateCall = prisma.question.update.mock.calls[0][0];
      expect(updateCall.where.id).toBe(1);
    });

    it('should not update mastery if updateMastery is false', async () => {
      // Mock question exists and belongs to user
      prisma.question.findFirst.mockResolvedValue({
        id: 1,
        text: 'What is the capital of France?',
        answer: 'Paris',
        questionType: 'multiple-choice',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        questionSet: {
          name: 'Geography',
          folder: {
            name: 'Study Materials'
          }
        }
      });

      // Mock AI service is unavailable
      (aiService.isAvailable as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post('/api/ai/evaluate-answer')
        .send({
          questionId: 1,
          userAnswer: 'Paris',
          updateMastery: false
        });

      expect(response.status).toBe(200);
      expect(response.body.evaluation.isCorrect).toBe(true);
      
      // Verify mastery was not updated
      expect(prisma.question.update).not.toHaveBeenCalled();
      expect(prisma.questionSet.update).not.toHaveBeenCalled();
    });

    it('should return 404 if question is not found', async () => {
      // Mock question not found
      prisma.question.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/ai/evaluate-answer')
        .send({
          questionId: 999, // Non-existent ID
          userAnswer: 'Test answer'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 503 for non-multiple-choice questions when AI is unavailable', async () => {
      // Mock question exists and belongs to user
      prisma.question.findFirst.mockResolvedValue({
        id: 1,
        text: 'Explain quantum computing.',
        answer: 'Quantum computing uses quantum bits...',
        questionType: 'short-answer',
        options: [],
        questionSetId: 1, // Added top-level questionSetId
        questionSet: {
          id: 1, // Added id for questionSet
          name: 'Physics',
          folder: {
            id: 1, // Added id for folder
            name: 'Advanced Topics'
          }
        }
      });

      // Mock AI service is unavailable
      (aiService.isAvailable as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .post('/api/ai/evaluate-answer')
        .send({
          questionId: 1,
          userAnswer: 'Quantum computing uses qubits instead of regular bits.'
        });

      expect(response.status).toBe(503);
      expect(response.body.evaluation.feedback).toContain('unavailable');
      expect(response.body.fallback).toBe(false);
    });
  });
});
