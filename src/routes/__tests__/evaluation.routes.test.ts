import { describe, it, expect, beforeAll, afterEach, vi } from '@jest/globals';
import { app } from '../../app';
import prisma from '../../lib/prisma';
import { createTestUser } from '../../scripts/create-test-user';
import { aiService } from '../../services/aiService';  

describe('POST /api/ai/evaluate-answer', () => {
  let testUser: any;
  let testFolder: any;
  let testQuestionSet: any;
  let autoMarkQuestion: any;
  let selfMarkQuestion: any;
  let aiQuestion: any;
  let authToken: string;

  beforeAll(async () => {
    // Create test user and get auth token
    testUser = await createTestUser();
    authToken = testUser.token;

    // Create test folder
    testFolder = await prisma.folder.create({
      data: {
        name: 'Test Folder',
        userId: testUser.id
      }
    });

    // Create test question set
    testQuestionSet = await prisma.questionSet.create({
      data: {
        name: 'Test Question Set',
        folderId: testFolder.id
      }
    });

    // Create test questions
    autoMarkQuestion = await prisma.question.create({
      data: {
        questionSetId: testQuestionSet.id,
        question: 'What is 2+2?',
        answer: '4',
        autoMark: true,
        selfMark: false
      }
    });

    selfMarkQuestion = await prisma.question.create({
      data: {
        questionSetId: testQuestionSet.id,
        question: 'Explain quantum mechanics',
        answer: 'A complex answer',
        autoMark: false,
        selfMark: true
      }
    });

    aiQuestion = await prisma.question.create({
      data: {
        questionSetId: testQuestionSet.id,
        question: 'Explain the theory of relativity',
        answer: 'A detailed answer',
        autoMark: false,
        selfMark: false,
        markingCriteria: 'Focus on key concepts and clarity',
        uueFocus: 'Understanding of core principles'
      }
    });
  });

  afterEach(async () => {
    // Clean up any created data
    await prisma.question.deleteMany({
      where: {
        questionSetId: testQuestionSet.id
      }
    });
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/evaluate-answer',
        payload: {
          questionId: autoMarkQuestion.id,
          answer: '4'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 404 when user does not own the question', async () => {
      // Create another user
      const otherUser = await createTestUser('other@example.com');
      
      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/evaluate-answer',
        headers: {
          authorization: `Bearer ${otherUser.token}`
        },
        payload: {
          questionId: autoMarkQuestion.id,
          answer: '4'
        }
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('Auto-mark questions', () => {
    it('should return score 1.0 for correct answer without calling AI service', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/evaluate-answer',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          questionId: autoMarkQuestion.id,
          answer: '4'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.score).toBe(1.0);
      expect(aiService.evaluateAnswer).not.toHaveBeenCalled();
    });

    it('should return score 0.0 for incorrect answer without calling AI service', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/evaluate-answer',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          questionId: autoMarkQuestion.id,
          answer: '5'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.score).toBe(0.0);
      expect(aiService.evaluateAnswer).not.toHaveBeenCalled();
    });
  });

  describe('Self-mark questions', () => {
    it('should return requiresSelfMark flag without calling AI service', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/evaluate-answer',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          questionId: selfMarkQuestion.id,
          answer: 'Some answer'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.requiresSelfMark).toBe(true);
      expect(aiService.evaluateAnswer).not.toHaveBeenCalled();
    });
  });

  describe('AI evaluation questions', () => {
    it('should call AI service with correct context and return score', async () => {
      const mockScore = 0.8;
      const mockFeedback = 'Good answer';
      
      // Mock the AI service
      vi.spyOn(aiService, 'evaluateAnswer').mockResolvedValue({
        score: mockScore,
        feedback: mockFeedback
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/ai/evaluate-answer',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          questionId: aiQuestion.id,
          answer: 'A detailed explanation of relativity'
        }
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.payload);
      expect(data.score).toBe(mockScore);
      expect(data.feedback).toBe(mockFeedback);

      // Verify AI service was called with correct context
      expect(aiService.evaluateAnswer).toHaveBeenCalledWith(
        expect.objectContaining({
          questionContext: expect.objectContaining({
            markingCriteria: aiQuestion.markingCriteria,
            uueFocus: aiQuestion.uueFocus
          })
        })
      );
    });
  });
}); 