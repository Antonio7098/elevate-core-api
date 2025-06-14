import request from 'supertest';
import { app } from '../../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('UserMemory Routes', () => {
  let testUserId: number;

  beforeAll(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'password123'
      }
    });
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.userMemory.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.user.delete({
      where: { id: testUserId }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/user/memory', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .get('/api/user/memory')
        .expect(401);

      expect(response.body.message).toBe('No token, authorization denied');
    });

    it('should create and return default user memory if none exists', async () => {
      // Ensure no user memory exists for this user before the test
      await prisma.userMemory.deleteMany({ where: { userId: testUserId } });

      const response = await request(app)
        .get('/api/user/memory')
        .set('Authorization', 'Bearer test123')
        .set('x-test-user-id', String(testUserId))
        .expect(200);

      // Check the structure of the response without comparing userId
      const { userId, ...responseBody } = response.body;
      expect(responseBody).toMatchObject({
        cognitiveApproach: null,
        explanationStyles: [],
        interactionStyle: null,
        primaryGoal: null
      });
      expect(typeof userId).toBe('number');
    });
  });

  describe('PUT /api/user/memory', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .put('/api/user/memory')
        .send({
          cognitiveApproach: 'TOP_DOWN',
          explanationStyles: ['ANALOGY_DRIVEN'],
          interactionStyle: 'DIRECT',
          primaryGoal: 'Learn TypeScript'
        })
        .expect(401);

      expect(response.body.message).toBe('No token, authorization denied');
    });

    it('should update user memory successfully', async () => {
      const updateData = {
        cognitiveApproach: 'TOP_DOWN',
        explanationStyles: ['ANALOGY_DRIVEN', 'PRACTICAL_EXAMPLES'],
        interactionStyle: 'DIRECT',
        primaryGoal: 'Learn TypeScript'
      };

      const response = await request(app)
        .put('/api/user/memory')
        .set('Authorization', 'Bearer test123')
        .set('x-test-user-id', String(testUserId))
        .send(updateData)
        .expect(200);

      // Check the structure of the response without comparing userId
      const { userId, ...responseBody } = response.body;
      expect(responseBody).toMatchObject(updateData);
      expect(typeof userId).toBe('number');
    });

    it('should handle partial updates', async () => {
      const updateData = {
        explanationStyles: ['TEXTUAL_DETAILED']
      };

      const response = await request(app)
        .put('/api/user/memory')
        .set('Authorization', 'Bearer test123')
        .set('x-test-user-id', String(testUserId))
        .send(updateData)
        .expect(200);

      expect(response.body.explanationStyles).toEqual(['TEXTUAL_DETAILED']);
      // Other fields should remain unchanged
      expect(response.body.cognitiveApproach).toBe('TOP_DOWN');
      expect(response.body.interactionStyle).toBe('DIRECT');
      expect(response.body.primaryGoal).toBe('Learn TypeScript');
    });
  });
}); 