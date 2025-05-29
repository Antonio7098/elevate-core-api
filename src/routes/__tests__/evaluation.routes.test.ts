import request from 'supertest';
import app from '../../app';
import { PrismaClient } from '@prisma/client';
import { aiService } from '../../services/aiService';

// Mock the AI service
jest.mock('../../services/aiService', () => ({
  aiService: {
    isAvailable: jest.fn(),
    evaluateAnswer: jest.fn()
  }
}));

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    question: {
      findFirst: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn()
    },
    questionSet: {
      findUnique: jest.fn(),
      update: jest.fn()
    },
    userQuestionAnswer: {
      create: jest.fn(),
      // Add other methods like findUnique, findMany, update if they are used by the service via this route
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
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
        text: 'What is the capital of France?',
        answer: 'Paris',
        questionType: 'multiple-choice',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        uueFocus: 'Understand',
        difficultyScore: 0.5,
        questionSetId: 1,
        questionSet: {
          id: 1,
          name: 'Geography',
          overallMasteryScore: 70,
          understandScore: 80,
          useScore: 60,
          exploreScore: 50,
          folder: {
            name: 'Study Materials'
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
        exploreScore: 55,
        nextReviewAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
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
      prisma.question.findFirst.mockResolvedValue({
        id: 1,
        text: 'Explain how photosynthesis works.',
        answer: 'Photosynthesis is the process used by plants to convert light energy into chemical energy.',
        questionType: 'short-answer',
        options: [],
        questionSet: {
          name: 'Biology',
          folder: {
            name: 'Science'
          }
        }
      });

      // Mock updated question
      prisma.question.findUnique.mockResolvedValue({
        masteryScore: 2,
        nextReviewAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // 4 days from now
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
      expect(response.status).toBe(200);
      expect(response.body.evaluation.isCorrect).toBe('partially_correct');
      expect(response.body.evaluation.score).toBe(0.7);
      expect(response.body.evaluation.feedback).toContain('basic concept');
      expect(response.body.evaluation.correctedAnswer).toContain('chlorophyll');
      
      // Verify AI service was called with correct parameters
      expect(aiService.evaluateAnswer).toHaveBeenCalledWith({
        questionContext: {
          questionId: 1,
          questionText: 'Explain how photosynthesis works.',
          expectedAnswer: 'Photosynthesis is the process used by plants to convert light energy into chemical energy.',
          questionType: 'short-answer',
          options: [],
          marksAvailable: 1 // Assuming default marksAvailable is 1 for this test case
        },
        userAnswer: 'Photosynthesis is how plants make their food using sunlight.',
        context: {
          questionSetName: 'Biology',
          folderName: 'Science'
        }
      });
      
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
    });

    it('should return 404 if question is not found', async () => {
      // Mock question not found
      prisma.question.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/ai/evaluate-answer')
        .send({
          questionId: 999,
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
        questionSet: {
          name: 'Physics',
          folder: {
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
