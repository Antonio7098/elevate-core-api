import request from 'supertest';
import { app } from '../../app';
import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';
import aiService from '../../services/aiService';

describe('AI Routes', () => {
  let authToken: string;
  let userId: number;
  let folderId: number;
  let questionSetId: number;
  let questionId: number;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      }
    });
    userId = user.id;

    // Create JWT token
    authToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'test-secret');

    // Create test folder
    const folder = await prisma.folder.create({
      data: {
        name: 'Test Folder',
        userId: userId
      }
    });
    folderId = folder.id;

    // Create test question set (schema requires title and userId via folder's user)
    const questionSet = await prisma.questionSet.create({
      data: {
        title: 'Test Question Set',
        userId: userId,
        folderId: folderId
      }
    });
    questionSetId = questionSet.id;

    // Create test question
    const question = await prisma.question.create({
      data: {
        questionText: 'What is the capital of France?',
        answerText: 'Paris',
        questionSetId: questionSetId,
        marksAvailable: 2,
      }
    });
    questionId = question.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.question.deleteMany({ where: { questionSetId } });
    await prisma.questionSet.deleteMany({ where: { id: questionSetId } });
    await prisma.folder.deleteMany({ where: { id: folderId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  describe('POST /api/ai/evaluate-answer', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/ai/evaluate-answer')
        .send({
          questionId: questionId,
          userAnswer: 'Paris'
        });

      expect(response.status).toBe(401);
    });

    it('should return 400 for missing questionId or userAnswer', async () => {
      const response = await request(app)
        .post('/api/ai/evaluate-answer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionId: questionId
          // missing userAnswer
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Question ID and user answer are required');
    });

    it('should return 404 for non-existent question', async () => {
      const response = await request(app)
        .post('/api/ai/evaluate-answer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionId: 99999,
          userAnswer: 'Paris'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Question not found or access denied');
    });

    it('should return 503 when AI service is unavailable', async () => {
      // Spy and mock the AI service to return false for availability check
      const isAvailableSpy = jest.spyOn(aiService, 'isServiceAvailable').mockResolvedValue(false);

      const response = await request(app)
        .post('/api/ai/evaluate-answer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionId: questionId,
          userAnswer: 'Paris'
        });

      // The endpoint should return 503 when AI service is not available
      expect(response.status).toBe(503);
      expect(response.body.message).toContain('AI service is currently unavailable');

      // Verify the mock was called
      expect(isAvailableSpy).toHaveBeenCalled();

      // Restore the mock
      isAvailableSpy.mockRestore();
    });

    it('should return evaluation results with feedback when AI service is available', async () => {
      // Spy and mock the AI service to return true for availability check
      const isAvailableSpy = jest.spyOn(aiService, 'isServiceAvailable').mockResolvedValue(true);
      const evaluateAnswerSpy = jest.spyOn(aiService, 'evaluateAnswer').mockResolvedValue({
        marks_achieved: 2,
        corrected_answer: 'Paris',
        feedback: 'Excellent answer! You correctly identified the capital of France.'
      });

      const response = await request(app)
        .post('/api/ai/evaluate-answer')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionId: questionId,
          userAnswer: 'Paris'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('correctedAnswer', 'Paris');
      expect(response.body).toHaveProperty('marksAvailable', 2);
      expect(response.body).toHaveProperty('marksAchieved', 2);
      expect(response.body).toHaveProperty('feedback', 'Excellent answer! You correctly identified the capital of France.');

      // Verify the mocks were called
      expect(isAvailableSpy).toHaveBeenCalled();
      expect(evaluateAnswerSpy).toHaveBeenCalled();

      // Restore the mocks
      isAvailableSpy.mockRestore();
      evaluateAnswerSpy.mockRestore();
    });
  });
}); 