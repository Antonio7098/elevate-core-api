// src/routes/__tests__/ai.integration.routes.test.ts
import request from 'supertest';
import { PrismaClient, Folder, QuestionSet, User, Question } from '@prisma/client';
import app from '../../app';
import jwt from 'jsonwebtoken';

// DO NOT MOCK AIService here for actual integration tests

const prisma = new PrismaClient();

// Environment variables needed for these tests
const AI_SERVICE_URL = process.env.AI_SERVICE_BASE_URL; // Using the existing env var from .env
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY; // Using the existing env var from .env

// Conditional describe block: only run if essential env vars are set
const describeIfAIConfigured = AI_SERVICE_URL && AI_SERVICE_API_KEY ? describe : describe.skip;

describeIfAIConfigured('AI Routes - REAL Integration Tests', () => {
  let user1Token: string;
  let user2Token: string;
  let user1: User;
  let user2: User;
  let user1Folder1: Folder;
  let user1Folder2: Folder;
  let user2Folder1: Folder;
  let user1QuestionSetForChat: QuestionSet;
  let user1EvalQuestionSet: QuestionSet;
  let user1ShortAnswerQuestion: Question;
  let user1McqQuestion: Question;

  beforeAll(async () => {
    if (!AI_SERVICE_URL || !AI_SERVICE_API_KEY) {
      console.warn(
        'Skipping AI integration tests: AI_SERVICE_BASE_URL or AI_SERVICE_API_KEY not set in environment. Make sure the AI service is running and environment variables are loaded (e.g., from .env file or exported).'
      );
      return;
    }

    // Clean up any existing test data
    await prisma.question.deleteMany();
    await prisma.questionSet.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    user1 = await prisma.user.create({
      data: {
        email: 'ai-integ-user1@example.com',
        password: 'hashedpassword1', // In a real app, use bcrypt.hashSync
      },
    });

    user2 = await prisma.user.create({
      data: {
        email: 'ai-integ-user2@example.com',
        password: 'hashedpassword2',
      },
    });

    // Create JWT tokens
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-here'; // Fallback for safety, but should be from .env
    user1Token = jwt.sign({ userId: user1.id }, jwtSecret, {
      expiresIn: '1h',
    });

    user2Token = jwt.sign({ userId: user2.id }, jwtSecret, {
      expiresIn: '1h',
    });

    // Create folders for testing
    user1Folder1 = await prisma.folder.create({
      data: { name: 'AI Integ Folder 1 - User 1', userId: user1.id },
    });

    user1Folder2 = await prisma.folder.create({
      data: { name: 'AI Integ Folder 2 - User 1', userId: user1.id },
    });

    user2Folder1 = await prisma.folder.create({
      data: { name: 'AI Integ Folder 1 - User 2', userId: user2.id },
    });

    // Create a question set for chat context testing
    user1QuestionSetForChat = await prisma.questionSet.create({
      data: {
        name: 'AI Integ QS 1 - User 1',
        folderId: user1Folder1.id,
      },
    });

    // Create a question set and questions for evaluation tests
    user1EvalQuestionSet = await prisma.questionSet.create({
      data: {
        name: 'AI Integ Eval QS - User 1',
        folderId: user1Folder1.id,
      },
    });

    user1ShortAnswerQuestion = await prisma.question.create({
      data: {
        text: "What is the powerhouse of the cell?",
        answer: "mitochondria",
        questionType: "short-answer",
        questionSetId: user1EvalQuestionSet.id,
        totalMarksAvailable: 2,
        // Ensure other required fields like uueFocus, conceptTags, etc. have defaults or are set if not nullable
      },
    });

    user1McqQuestion = await prisma.question.create({
      data: {
        text: "Which organelle is known as the powerhouse of the cell?",
        answer: "Mitochondria",
        questionType: "multiple-choice",
        options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi Apparatus"],
        questionSetId: user1EvalQuestionSet.id,
        totalMarksAvailable: 1,
      },
    });
  });

  afterAll(async () => {
    // Clean up database
    await prisma.question.deleteMany();
    await prisma.questionSet.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/ai/generate-questions-from-source', () => {
    it('should successfully generate questions from source text and save them to the database', async () => {
      const sourceText = "The mitochondria is the powerhouse of the cell. It generates most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy.";
      const numQuestions = 2;

      const res = await request(app)
        .post('/api/ai/generate-questions-from-source')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          sourceText,
          numQuestions,
          folderId: user1Folder1.id,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('questionSet');
      expect(res.body.questionSet).toHaveProperty('questions');
      expect(Array.isArray(res.body.questionSet.questions)).toBe(true);
      expect(res.body.questionSet.questions.length).toBeGreaterThan(0);
      expect(res.body.questionSet).toHaveProperty('folderId', user1Folder1.id);

      for (const question of res.body.questionSet.questions) {
        expect(question).toHaveProperty('text');
        expect(question).toHaveProperty('answer');
        expect(question).toHaveProperty('questionType');
        
        expect(question).toHaveProperty('totalMarksAvailable');
        expect(question).toHaveProperty('markingCriteria');
        expect(Array.isArray(question.markingCriteria)).toBe(true);
        
        const dbQuestion = await prisma.question.findFirst({
          where: { text: question.text, questionSetId: res.body.questionSet.id }
        });
        expect(dbQuestion).toBeTruthy();
      }
    });

    it('should return 400 for empty source text', async () => {
      const res = await request(app)
        .post('/api/ai/generate-questions-from-source')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          sourceText: '',
          numQuestions: 2,
          folderId: user1Folder1.id,
        });
      expect(res.statusCode).toBe(400);
    });

    it('should return 403 if user does not have access to the folder', async () => {
      const res = await request(app)
        .post('/api/ai/generate-questions-from-source')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          sourceText: 'Some text',
          numQuestions: 2,
          folderId: user2Folder1.id, 
        });
      expect(res.statusCode).toBe(403);
    });
  });

  describe('POST /api/ai/evaluate-answer', () => {
    it('should evaluate a short-answer question and provide feedback', async () => {
      const evaluationRequest = {
        questionId: user1ShortAnswerQuestion.id,
        userAnswer: "The mitochondria is the powerhouse of the cell",
      };

      const res = await request(app)
        .post('/api/ai/evaluate-answer')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(evaluationRequest);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('evaluation');
      expect(res.body.evaluation).toHaveProperty('isCorrect');
      expect(res.body.evaluation).toHaveProperty('score');
      expect(res.body.evaluation).toHaveProperty('feedback');
      expect(typeof res.body.evaluation.feedback).toBe('string');
      expect(res.body.evaluation.feedback.length).toBeGreaterThan(0);
      expect(res.body.evaluation).toHaveProperty('correctedAnswer');
      expect(typeof res.body.evaluation.correctedAnswer).toBe('string');
    });

    it('should evaluate a multiple-choice question', async () => {
      const evaluationRequest = {
        questionId: user1McqQuestion.id,
        userAnswer: "Mitochondria",
      };

      const res = await request(app)
        .post('/api/ai/evaluate-answer')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(evaluationRequest);

      expect(res.statusCode).toBe(200);
      expect(res.body.evaluation).toHaveProperty('isCorrect', true);
      expect(res.body.evaluation).toHaveProperty('score'); // Score can vary based on AI
    });

    it('should return 400 for missing required fields in evaluate-answer', async () => {
      const res = await request(app)
        .post('/api/ai/evaluate-answer')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({}); // Empty body
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/ai/chat', () => {
    it('should return a response to a general chat message', async () => {
      const chatRequest = {
        message: "Can you explain the process of photosynthesis?",
      };

      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(chatRequest);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('response');
      expect(res.body.response).toHaveProperty('message');
      expect(typeof res.body.response.message).toBe('string');
      expect(res.body.response.message.length).toBeGreaterThan(0);
      expect(res.body.response).toHaveProperty('references');
      expect(Array.isArray(res.body.response.references)).toBe(true);
      expect(res.body.response).toHaveProperty('suggestedQuestions');
      expect(Array.isArray(res.body.response.suggestedQuestions)).toBe(true);
    });

    it('should handle chat with question set context', async () => {
      const chatRequest = {
        message: "Tell me more about this set.",
        context: {
          questionSetId: user1QuestionSetForChat.id
        }
      };

      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(chatRequest);

      expect(res.statusCode).toBe(200);
      expect(res.body.response.message.length).toBeGreaterThan(0);
      // A simple check, actual AI response will vary
      // expect(res.body.response.message.toLowerCase()).toContain(user1QuestionSetForChat.name.toLowerCase());
    });

    it('should maintain conversation history if provided', async () => {
      const conversation = [
        {
          role: "user",
          content: "What is the capital of France?"
        },
        {
          role: "assistant",
          content: "The capital of France is Paris."
        }
      ];

      const chatRequest = {
        message: "What about Spain?",
        conversation: conversation
      };

      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${user1Token}`)
        .send(chatRequest);

      expect(res.statusCode).toBe(200);
      // Response should ideally consider the conversation context
      expect(res.body.response.message.toLowerCase()).toContain('spain');
    });

    it('should return 404 for chat with non-existent question set context', async () => {
      const nonExistentId = 999999;
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          message: "What's in this question set?",
          context: { questionSetId: nonExistentId }
        });
      expect(res.statusCode).toBe(404);
    });

     it('should return 400 for missing message in chat', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({}); // Empty body
      expect(res.statusCode).toBe(400);
    });
  });
});
