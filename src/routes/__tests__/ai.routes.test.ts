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
      
      // Verify the first question has the expected structure
      const firstQuestion = res.body.questionSet.questions[0];
      expect(firstQuestion).toHaveProperty('id');
      expect(firstQuestion).toHaveProperty('text');
      expect(firstQuestion).toHaveProperty('answer');
      expect(firstQuestion).toHaveProperty('questionType');
      expect(firstQuestion).toHaveProperty('options');
      expect(firstQuestion).toHaveProperty('questionSetId', res.body.questionSet.id);
      
      // Verify the question set was actually saved to the database
      const savedQuestionSet = await prisma.questionSet.findUnique({
        where: { id: res.body.questionSet.id },
        include: { questions: true }
      });
      
      expect(savedQuestionSet).not.toBeNull();
      expect(savedQuestionSet?.folderId).toEqual(user1Folder.id);
      expect(savedQuestionSet?.questions.length).toEqual(3);
    });

    it('should return 401 if user is not authenticated', async () => {
      const res = await request(app)
        .post('/api/ai/generate-from-source')
        .send({
          sourceText: 'Test source text',
          folderId: user1Folder.id,
          questionCount: 3
        });

      expect(res.statusCode).toEqual(401);
    });

    it('should return 404 if folder does not exist', async () => {
      const nonExistentFolderId = 9999;
      
      const res = await request(app)
        .post('/api/ai/generate-from-source')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          sourceText: 'Test source text',
          folderId: nonExistentFolderId,
          questionCount: 3
        });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'Folder not found or access denied');
    });

    it('should return 404 if folder belongs to another user', async () => {
      // User 1 tries to access User 2's folder
      const res = await request(app)
        .post('/api/ai/generate-from-source')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          sourceText: 'Test source text',
          folderId: user2Folder.id,
          questionCount: 3
        });

      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('message', 'Folder not found or access denied');
    });

    it('should return 400 if sourceText is missing', async () => {
      const res = await request(app)
        .post('/api/ai/generate-from-source')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          folderId: user1Folder.id,
          questionCount: 3
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return 400 if folderId is missing', async () => {
      const res = await request(app)
        .post('/api/ai/generate-from-source')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          sourceText: 'Test source text',
          questionCount: 3
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should return 400 if questionCount is invalid', async () => {
      const res = await request(app)
        .post('/api/ai/generate-from-source')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          sourceText: 'Test source text',
          folderId: user1Folder.id,
          questionCount: -1 // Invalid count
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should use default questionCount if not provided', async () => {
      const sourceText = 'This is another test source text.';
      
      const res = await request(app)
        .post('/api/ai/generate-from-source')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          sourceText,
          folderId: user1Folder.id
          // questionCount not provided, should default to 5
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.questionSet.questions.length).toEqual(5); // Default count
    });

    it('should handle a large source text correctly', async () => {
      // Create a large source text (over 1000 characters)
      const largeSourceText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20);
      
      const res = await request(app)
        .post('/api/ai/generate-from-source')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          sourceText: largeSourceText,
          folderId: user1Folder.id,
          questionCount: 2
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.questionSet.questions.length).toEqual(2);
      
      // Verify the title was truncated appropriately
      expect(res.body.questionSet.name.length).toBeLessThan(largeSourceText.length);
    });

    it('should generate different question types', async () => {
      const sourceText = 'Test source text for question type verification.';
      
      const res = await request(app)
        .post('/api/ai/generate-from-source')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          sourceText,
          folderId: user1Folder.id,
          questionCount: 4 // Request 4 questions to get different types
        });

      expect(res.statusCode).toEqual(201);
      
      // Get the question types from the response
      const questionTypes = res.body.questionSet.questions.map((q: any) => q.questionType);
      
      // Check that we have at least 2 different question types
      const uniqueTypes = new Set(questionTypes);
      expect(uniqueTypes.size).toBeGreaterThanOrEqual(2);
      
      // Check for multiple-choice questions with options
      const multipleChoiceQuestions = res.body.questionSet.questions.filter(
        (q: any) => q.questionType === 'multiple-choice'
      );
      
      if (multipleChoiceQuestions.length > 0) {
        expect(multipleChoiceQuestions[0].options.length).toBeGreaterThan(0);
      }
    });
  });
});
