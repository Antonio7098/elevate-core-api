import request from 'supertest';
import { app } from '../../app';
import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';

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

    // Create test question set
    const questionSet = await prisma.questionSet.create({
      data: {
        name: 'Test Question Set',
        folderId: folderId
      }
    });
    questionSetId = questionSet.id;

    // Create test question
    const question = await prisma.question.create({
      data: {
        text: 'What is the capital of France?',
        answer: 'Paris',
        questionType: 'short-answer',
        questionSetId: questionSetId,
        totalMarksAvailable: 2,
        markingCriteria: [
          { criterion: 'Correct city name', marks: 1 },
          { criterion: 'Correct spelling', marks: 1 }
        ]
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
      // Since the AI service endpoint doesn't exist, this should return 503
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
    });
  });
}); 