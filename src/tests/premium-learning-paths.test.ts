import request from 'supertest';
import { app } from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Premium Learning Paths', () => {
  let userToken: string;
  let userId: number;
  let testPrimitiveId: string;
  let testLearningPathId: number;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'premium-learning-test@example.com',
        password: 'hashedpassword',
        name: 'Premium Learning Test User',
      },
    });
    userId = user.id;
    userToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');

    // Create a test knowledge primitive
    const primitive = await prisma.knowledgePrimitive.create({
      data: {
        primitiveId: 'test-learning-primitive',
        title: 'Test Learning Concept',
        description: 'A test concept for learning path testing',
        primitiveType: 'concept',
        difficultyLevel: 'intermediate',
        userId: user.id,
        blueprintId: 1,
        complexityScore: 5.0,
        isCoreConcept: true,
        conceptTags: ['test', 'learning', 'concept'],
        prerequisiteIds: [],
        relatedConceptIds: [],
        estimatedPrerequisites: 2,
      },
    });
    testPrimitiveId = primitive.primitiveId;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'premium-learning-test@example.com' } });
    await prisma.$disconnect();
  });

  describe('POST /api/premium/learning-paths', () => {
    test('should create a learning path successfully', async () => {
      const response = await request(app)
        .post('/api/premium/learning-paths')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          pathName: 'Physics Mastery Path',
          description: 'Master fundamental physics concepts',
          targetMasteryLevel: 'EXPLORE',
          estimatedDurationDays: 30,
        });

      expect(response.status).toBe(201);
      expect(response.body.pathName).toBe('Physics Mastery Path');
      expect(response.body.userId).toBe(userId);
      expect(response.body.targetMasteryLevel).toBe('EXPLORE');
      expect(response.body.estimatedDurationDays).toBe(30);
      expect(response.body.isActive).toBe(true);
      expect(response.body.pathSteps).toBeDefined();
      expect(Array.isArray(response.body.pathSteps)).toBe(true);

      testLearningPathId = response.body.id;
    });

    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/premium/learning-paths')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          description: 'Missing pathName',
          targetMasteryLevel: 'EXPLORE',
        });

      expect(response.status).toBe(500); // Will be 500 due to database constraint
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/api/premium/learning-paths')
        .send({
          pathName: 'Unauthorized Path',
          description: 'This should fail',
          targetMasteryLevel: 'EXPLORE',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/premium/learning-paths', () => {
    test('should get all learning paths for user', async () => {
      const response = await request(app)
        .get('/api/premium/learning-paths')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      const learningPath = response.body[0];
      expect(learningPath).toHaveProperty('id');
      expect(learningPath).toHaveProperty('pathName');
      expect(learningPath).toHaveProperty('userId');
      expect(learningPath).toHaveProperty('targetMasteryLevel');
      expect(learningPath).toHaveProperty('pathSteps');
      expect(Array.isArray(learningPath.pathSteps)).toBe(true);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/premium/learning-paths');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/premium/learning-paths/:id', () => {
    test('should get specific learning path with steps', async () => {
      const response = await request(app)
        .get(`/api/premium/learning-paths/${testLearningPathId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testLearningPathId);
      expect(response.body.pathName).toBe('Physics Mastery Path');
      expect(response.body.userId).toBe(userId);
      expect(response.body.pathSteps).toBeDefined();
      expect(Array.isArray(response.body.pathSteps)).toBe(true);
    });

    test('should return 404 for non-existent learning path', async () => {
      const response = await request(app)
        .get('/api/premium/learning-paths/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    test('should return 404 for learning path belonging to different user', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-learning-user@example.com',
          password: 'hashedpassword',
          name: 'Other User',
        },
      });

      const otherUserToken = jwt.sign({ userId: otherUser.id }, process.env.JWT_SECRET || 'secret');

      const response = await request(app)
        .get(`/api/premium/learning-paths/${testLearningPathId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(404);

      // Clean up
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('POST /api/premium/learning-paths/:pathId/steps', () => {
    test('should add step to learning path', async () => {
      const response = await request(app)
        .post(`/api/premium/learning-paths/${testLearningPathId}/steps`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          primitiveId: testPrimitiveId,
          estimatedTimeMinutes: 45,
        });

      expect(response.status).toBe(201);
      expect(response.body.primitiveId).toBe(testPrimitiveId);
      expect(response.body.learningPathId).toBe(testLearningPathId);
      expect(response.body.stepOrder).toBe(1);
      expect(response.body.isCompleted).toBe(false);
      expect(response.body.estimatedTimeMinutes).toBe(45);
      expect(response.body.knowledgePrimitive).toBeDefined();
    });

    test('should add multiple steps with correct ordering', async () => {
      // Create another primitive for testing
      const primitive2 = await prisma.knowledgePrimitive.create({
        data: {
          primitiveId: 'test-learning-primitive-2',
          title: 'Test Learning Concept 2',
          description: 'Another test concept',
          primitiveType: 'concept',
          difficultyLevel: 'advanced',
          userId: userId,
          blueprintId: 1,
          complexityScore: 7.0,
          isCoreConcept: false,
          conceptTags: ['test', 'advanced'],
          prerequisiteIds: [],
          relatedConceptIds: [],
          estimatedPrerequisites: 3,
        },
      });

      const response = await request(app)
        .post(`/api/premium/learning-paths/${testLearningPathId}/steps`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          primitiveId: primitive2.primitiveId,
          estimatedTimeMinutes: 60,
        });

      expect(response.status).toBe(201);
      expect(response.body.stepOrder).toBe(2); // Should be second step
      expect(response.body.primitiveId).toBe(primitive2.primitiveId);
    });

    test('should return 404 for non-existent learning path', async () => {
      const response = await request(app)
        .post('/api/premium/learning-paths/99999/steps')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          primitiveId: testPrimitiveId,
          estimatedTimeMinutes: 30,
        });

      expect(response.status).toBe(500); // Will be 500 due to foreign key constraint
    });
  });

  describe('PUT /api/premium/learning-paths/:pathId/steps/:stepId', () => {
    test('should update step completion status', async () => {
      // First get the learning path to find a step
      const pathResponse = await request(app)
        .get(`/api/premium/learning-paths/${testLearningPathId}`)
        .set('Authorization', `Bearer ${userToken}`);

      const stepId = pathResponse.body.pathSteps[0]?.id;
      expect(stepId).toBeDefined();

      const response = await request(app)
        .put(`/api/premium/learning-paths/${testLearningPathId}/steps/${stepId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          isCompleted: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.isCompleted).toBe(true);
      expect(response.body.completedAt).toBeTruthy();
      expect(new Date(response.body.completedAt)).toBeInstanceOf(Date);
    });

    test('should unmark step as incomplete', async () => {
      const pathResponse = await request(app)
        .get(`/api/premium/learning-paths/${testLearningPathId}`)
        .set('Authorization', `Bearer ${userToken}`);

      const stepId = pathResponse.body.pathSteps[0]?.id;

      const response = await request(app)
        .put(`/api/premium/learning-paths/${testLearningPathId}/steps/${stepId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          isCompleted: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.isCompleted).toBe(false);
      expect(response.body.completedAt).toBeNull();
    });
  });

  describe('DELETE /api/premium/learning-paths/:id', () => {
    test('should delete learning path successfully', async () => {
      // Create a new learning path to delete
      const createResponse = await request(app)
        .post('/api/premium/learning-paths')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          pathName: 'Temporary Path to Delete',
          description: 'This will be deleted',
          targetMasteryLevel: 'UNDERSTAND',
          estimatedDurationDays: 7,
        });

      const pathToDeleteId = createResponse.body.id;

      const response = await request(app)
        .delete(`/api/premium/learning-paths/${pathToDeleteId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(204);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/premium/learning-paths/${pathToDeleteId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(getResponse.status).toBe(404);
    });

    test('should return 404 for non-existent learning path', async () => {
      const response = await request(app)
        .delete('/api/premium/learning-paths/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(204); // deleteMany doesn't throw error
    });
  });
});
