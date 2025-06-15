import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../../app';
import prisma from '../../lib/prisma';
import { createTestUser } from '../../scripts/create-test-user';
import { aiService } from '../../services/aiService';

// Mock AI service
jest.mock('../../services/aiService', () => ({
  evaluateAnswer: jest.fn()
}));

// Type the mock function
const mockedEvaluateAnswer = aiService.evaluateAnswer as jest.MockedFunction<typeof aiService.evaluateAnswer>;

// Ensure Prisma connection
beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

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
        text: 'What is 2+2?',
        answer: '4',
        autoMark: true,
        selfMark: false,
        questionType: 'SHORT_ANSWER',
        questionSet: { connect: { id: testQuestionSet.id } }
      }
    });

    selfMarkQuestion = await prisma.question.create({
      data: {
        questionSetId: testQuestionSet.id,
        text: 'Explain quantum mechanics',
        answer: 'A complex answer',
        autoMark: false,
        selfMark: true,
        questionType: 'ESSAY',
        questionSet: { connect: { id: testQuestionSet.id } }
      }
    });

    aiQuestion = await prisma.question.create({
      data: {
        questionSetId: testQuestionSet.id,
        text: 'Explain the theory of relativity',
        answer: 'A detailed answer',
        autoMark: false,
        selfMark: false,
        markingCriteria: 'Focus on key concepts and clarity',
        uueFocus: 'Understanding of core principles',
        questionType: 'ESSAY',
        questionSet: { connect: { id: testQuestionSet.id } }
      }
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.question.deleteMany({
      where: {
        id: {
          in: [autoMarkQuestion.id, selfMarkQuestion.id, aiQuestion.id]
        }
      }
    });
    
    await prisma.questionSet.delete({
      where: { id: testQuestionSet.id }
    });
    
    await prisma.folder.delete({
      where: { id: testFolder.id }
    });
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      console.log('Running test: should return 401 for unauthenticated requests');
      const response = await request(app).post('/api/ai/evaluate-answer')
        .send({
          questionId: autoMarkQuestion.id,
          answer: '4'
        });

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);
      expect(response.statusCode).toBe(401);
    });

    it('should return 404 when user does not own the question', async () => {
      console.log('Running test: should return 404 when user does not own the question');
      // Create another user
      const otherUser = await createTestUser('other@example.com');
      
      const response = await request(app).post('/api/ai/evaluate-answer')
        .set("Authorization", `Bearer ${otherUser.token}`)
        .send({
          questionId: autoMarkQuestion.id,
          answer: '4'
        });

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);
      expect(response.statusCode).toBe(404);
    });
  });

  describe('Auto-mark questions', () => {
    it('should return score 1.0 for correct answer without calling AI service', async () => {
      console.log('Running test: should return score 1.0 for correct answer');
      const response = await request(app).post('/api/ai/evaluate-answer')
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          questionId: autoMarkQuestion.id,
          answer: '4'
        });

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);
      expect(response.statusCode).toBe(200);
      expect(response.body.score).toBe(1.0);
      expect(mockedEvaluateAnswer).not.toHaveBeenCalled();
    });

    it('should return score 0.0 for incorrect answer without calling AI service', async () => {
      console.log('Running test: should return score 0.0 for incorrect answer');
      const response = await request(app).post('/api/ai/evaluate-answer')
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          questionId: autoMarkQuestion.id,
          answer: '5'
        });

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);
      expect(response.statusCode).toBe(200);
      expect(response.body.score).toBe(0.0);
      expect(mockedEvaluateAnswer).not.toHaveBeenCalled();
    });
  });

  describe('Self-mark questions', () => {
    it('should return requiresSelfMark flag without calling AI service', async () => {
      console.log('Running test: should return requiresSelfMark flag');
      const response = await request(app).post('/api/ai/evaluate-answer')
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          questionId: selfMarkQuestion.id,
          answer: 'Some answer'
        });

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);
      expect(response.statusCode).toBe(200);
      expect(response.body.requiresSelfMark).toBe(true);
      expect(mockedEvaluateAnswer).not.toHaveBeenCalled();
    });
  });

  describe('AI evaluation questions', () => {
    it('should call AI service and return evaluation result', async () => {
      console.log('Running test: should call AI service');
      const mockScore = 0.8;
      const mockFeedback = 'Good answer';
      
      // Mock the AI service
      mockedEvaluateAnswer.mockResolvedValue({
        score: mockScore,
        feedback: mockFeedback
      });

      const response = await request(app).post('/api/ai/evaluate-answer')
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          questionId: aiQuestion.id,
          answer: 'A detailed explanation of relativity'
        });

      console.log('Response status:', response.status);
      console.log('Response body:', response.body);
      expect(response.statusCode).toBe(200);
      expect(response.body.score).toBe(mockScore);
      expect(response.body.feedback).toBe(mockFeedback);

      // Verify AI service was called with correct parameters
      expect(mockedEvaluateAnswer).toHaveBeenCalledWith({
        questionContext: {
          questionId: aiQuestion.id,
          questionText: aiQuestion.text,
          expectedAnswer: aiQuestion.answer,
          questionType: aiQuestion.questionType,
          options: aiQuestion.options,
          markingCriteria: aiQuestion.markingCriteria,
          uueFocus: aiQuestion.uueFocus
        },
        userAnswer: 'A detailed explanation of relativity'
      });
    });
  });
});