import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../app';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('AI Routes Integration Tests', () => {
  let user1Token: string;
  let user2Token: string;
  let user1Id: number;
  let user2Id: number;
  let user1Folder: any;
  let user2Folder: any;
  let user1QuestionSet: any;

  // Setup test data before all tests
  beforeAll(async () => {
    // Clear existing test data
    await prisma.question.deleteMany();
    await prisma.questionSet.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const user1 = await prisma.user.create({
      data: {
        email: 'ai-test-user1@example.com',
        password: 'hashedpassword1',
      },
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'ai-test-user2@example.com',
        password: 'hashedpassword2',
      },
    });

    user1Id = user1.id;
    user2Id = user2.id;

    // Create JWT tokens
    user1Token = jwt.sign({ userId: user1.id }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h',
    });

    user2Token = jwt.sign({ userId: user2.id }, process.env.JWT_SECRET || 'test-secret', {
      expiresIn: '1h',
    });

    // Create folders for each user
    user1Folder = await prisma.folder.create({
      data: {
        name: 'AI Test Folder - User 1',
        userId: user1.id,
      },
    });

    user2Folder = await prisma.folder.create({
      data: {
        name: 'AI Test Folder - User 2',
        userId: user2.id,
      },
    });

    // Create a question set for user1
    user1QuestionSet = await prisma.questionSet.create({
      data: {
        name: 'AI Test Question Set - User 1',
        folderId: user1Folder.id,
      },
    });

    // Create some questions in the question set
    await prisma.question.create({
      data: {
        text: 'Test question 1',
        answer: 'Test answer 1',
        questionType: 'flashcard',
        options: [],
        questionSetId: user1QuestionSet.id,
        masteryScore: 0
      },
    });

    await prisma.question.create({
      data: {
        text: 'Test question 2',
        answer: 'Test answer 2',
        questionType: 'multiple-choice',
        options: ['Option A', 'Option B', 'Option C'],
        questionSetId: user1QuestionSet.id,
        masteryScore: 0
      },
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    await prisma.question.deleteMany();
    await prisma.questionSet.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/ai/generate-from-source', () => {
    it('should generate questions from source text and create a question set', async () => {
      const sourceText = 'This is a test source text for AI question generation. It contains information about testing and AI.';
      
      const res = await request(app)
        .post('/api/ai/generate-from-source')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          sourceText,
          folderId: user1Folder.id,
          questionCount: 3
        });

      // Check response status and structure
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('questionSet');
      expect(res.body.questionSet).toHaveProperty('id');
      expect(res.body.questionSet).toHaveProperty('name');
      expect(res.body.questionSet).toHaveProperty('folderId', user1Folder.id);
      
      // Check that questions were created
      expect(res.body.questionSet).toHaveProperty('questions');
      expect(Array.isArray(res.body.questionSet.questions)).toBe(true);
      expect(res.body.questionSet.questions.length).toEqual(3);
    });
  });

  describe('POST /api/ai/chat', () => {
    it('should return a chat response with no context', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          message: 'Help me understand this topic better'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('response');
      expect(typeof res.body.response).toBe('string');
      expect(res.body.response.length).toBeGreaterThan(0);
    });

    it('should return a chat response with question set context', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          message: 'Explain this concept',
          questionSetId: user1QuestionSet.id
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('response');
      expect(typeof res.body.response).toBe('string');
      expect(res.body.response.length).toBeGreaterThan(0);
      
      // Should include context about the question set
      expect(res.body).toHaveProperty('context');
      expect(res.body.context).toContain(user1QuestionSet.name);
    });

    it('should return a chat response with folder context', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          message: 'Give me an example',
          folderId: user1Folder.id
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('response');
      expect(typeof res.body.response).toBe('string');
      expect(res.body.response.length).toBeGreaterThan(0);
      
      // Should include context about the folder
      expect(res.body).toHaveProperty('context');
      expect(res.body.context).toContain(user1Folder.name);
    });

    it('should return 401 if user is not authenticated', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({
          message: 'Help me understand this topic'
        });

      expect(res.statusCode).toEqual(401);
    });

    it('should return 404 if question set does not exist or belongs to another user', async () => {
      const nonExistentQuestionSetId = 9999;
      
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          message: 'Help me understand this topic',
          questionSetId: nonExistentQuestionSetId
        });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'Question set not found or access denied');
    });

    it('should return 404 if folder does not exist or belongs to another user', async () => {
      // User 1 tries to access User 2's folder
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          message: 'Help me understand this topic',
          folderId: user2Folder.id
        });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'Folder not found or access denied');
    });

    it('should return 400 if message is missing', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          questionSetId: user1QuestionSet.id
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should handle different types of questions appropriately', async () => {
      // Test different question types to ensure the AI responds appropriately
      const questionTypes = [
        { message: 'help me with this topic', expectedKeyword: 'help' },
        { message: 'explain the concept of gravity', expectedKeyword: 'explain' },
        { message: 'what is the difference between X and Y', expectedKeyword: 'difference' },
        { message: 'give me an example of this concept', expectedKeyword: 'example' },
        { message: 'how to solve this problem', expectedKeyword: 'steps' }
      ];
      
      for (const question of questionTypes) {
        const res = await request(app)
          .post('/api/ai/chat')
          .set('Authorization', `Bearer ${user1Token}`)
          .send({
            message: question.message
          });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('response');
        expect(res.body.response.toLowerCase()).toContain(question.expectedKeyword.toLowerCase());
      }
    });
  });
});
