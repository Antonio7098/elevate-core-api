import request from 'supertest';
import { app } from '../../app';
import { PrismaClient, User } from '@prisma/client';
import { generateToken } from '../../utils/jwt';

const prisma = new PrismaClient();

describe('AI RAG Routes', () => {
  let testUser: User;
  let authToken: string;

  beforeAll(async () => {
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        email: `test-rag-${Date.now()}@example.com`,
        password: 'hashedPassword',
        name: 'Test RAG User',
      },
    });

    // Generate auth token
    authToken = generateToken({ userId: testUser.id });
  });

  afterAll(async () => {
    // Clean up
    if (testUser) {
      await prisma.learningBlueprint.deleteMany({
        where: { userId: testUser.id },
      });
      await prisma.user.delete({
        where: { id: testUser.id },
      });
    }
    await prisma.$disconnect();
  });

  describe('POST /api/ai-rag/learning-blueprints', () => {
    it('should create a new learning blueprint', async () => {
      const blueprintData = {
        sourceText: 'This is the source text for our test blueprint.',
        title: 'Test Blueprint',
        description: 'A test blueprint for testing'
      };

      const response = await request(app)
        .post('/api/ai-rag/learning-blueprints')
        .set('Authorization', `Bearer ${authToken}`)
        .send(blueprintData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.sourceText).toBe(blueprintData.sourceText);
      expect(response.body.userId).toBe(testUser.id);
      expect(response.body.blueprintJson).toBeDefined();
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/ai-rag/learning-blueprints')
        .send({ sourceText: 'Test text' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/ai-rag/learning-blueprints', () => {
    it('should return user blueprints', async () => {
      const response = await request(app)
        .get('/api/ai-rag/learning-blueprints')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/ai-rag/learning-blueprints');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/ai-rag/chat/message', () => {
    it('should handle chat message', async () => {
      const messageData = {
        message: 'Hello, how are you?'
      };

      const response = await request(app)
        .post('/api/ai-rag/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('userId');
      expect(response.body.userId).toBe(testUser.id);
    });

    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/ai-rag/chat/message')
        .send({ message: 'Test message' });

      expect(response.status).toBe(401);
    });
  });
});
