import request from 'supertest';
import { app } from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Premium Models', () => {
  let userToken: string;
  let userId: number;
  let testPrimitiveId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'premium-test@example.com',
        password: 'hashedpassword',
        name: 'Premium Test User',
      },
    });
    userId = user.id;
    userToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');

    // Create a test knowledge primitive
    const primitive = await prisma.knowledgePrimitive.create({
      data: {
        primitiveId: 'test-premium-primitive',
        title: 'Test Premium Concept',
        description: 'A test concept for premium features',
        primitiveType: 'concept',
        difficultyLevel: 'intermediate',
        userId: user.id,
        blueprintId: 1,
        complexityScore: 7.5,
        isCoreConcept: true,
        conceptTags: ['test', 'premium', 'concept'],
        prerequisiteIds: [],
        relatedConceptIds: [],
        estimatedPrerequisites: 3,
      },
    });
    testPrimitiveId = primitive.primitiveId;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'premium-test@example.com' } });
    await prisma.$disconnect();
  });

  describe('LearningPath creation and management', () => {
    test('should create a learning path', async () => {
      const response = await request(app)
        .post('/api/premium/learning-paths')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          pathName: 'Test Learning Path',
          description: 'A test learning path',
          targetMasteryLevel: 'EXPLORE',
          estimatedDurationDays: 14,
        });

      expect(response.status).toBe(201);
      expect(response.body.pathName).toBe('Test Learning Path');
      expect(response.body.userId).toBe(userId);
      expect(response.body.targetMasteryLevel).toBe('EXPLORE');
    });

    test('should get user learning paths', async () => {
      const response = await request(app)
        .get('/api/premium/learning-paths')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('should add step to learning path', async () => {
      // First get a learning path
      const pathsResponse = await request(app)
        .get('/api/premium/learning-paths')
        .set('Authorization', `Bearer ${userToken}`);

      const pathId = pathsResponse.body[0].id;

      const response = await request(app)
        .post(`/api/premium/learning-paths/${pathId}/steps`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          primitiveId: testPrimitiveId,
          estimatedTimeMinutes: 30,
        });

      expect(response.status).toBe(201);
      expect(response.body.primitiveId).toBe(testPrimitiveId);
      expect(response.body.learningPathId).toBe(pathId);
    });

    test('should update learning path step', async () => {
      // Get a learning path with steps
      const pathsResponse = await request(app)
        .get('/api/premium/learning-paths')
        .set('Authorization', `Bearer ${userToken}`);

      const path = pathsResponse.body[0];
      const stepId = path.pathSteps[0]?.id;

      if (stepId) {
        const response = await request(app)
          .put(`/api/premium/learning-paths/${path.id}/steps/${stepId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            isCompleted: true,
          });

        expect(response.status).toBe(200);
        expect(response.body.isCompleted).toBe(true);
        expect(response.body.completedAt).toBeTruthy();
      }
    });
  });

  describe('UserMemoryInsight generation', () => {
    test('should create memory insight', async () => {
      const response = await request(app)
        .post('/api/premium/analytics/memory-insights')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          insightType: 'LEARNING_PATTERN',
          title: 'Test Learning Pattern',
          content: 'User shows strong pattern in understanding basic concepts',
          relatedPrimitiveIds: [testPrimitiveId],
          confidenceScore: 0.85,
          isActionable: true,
        });

      expect(response.status).toBe(201);
      expect(response.body.insightType).toBe('LEARNING_PATTERN');
      expect(response.body.title).toBe('Test Learning Pattern');
      expect(response.body.confidenceScore).toBe(0.85);
    });

    test('should get memory insights', async () => {
      const response = await request(app)
        .get('/api/premium/analytics/memory-insights')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.insights).toBeDefined();
      expect(response.body.insightsByType).toBeDefined();
      expect(response.body.totalInsights).toBeGreaterThan(0);
    });

    test('should filter insights by type', async () => {
      const response = await request(app)
        .get('/api/premium/analytics/memory-insights?insightType=LEARNING_PATTERN')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.insights.every((insight: any) => 
        insight.insightType === 'LEARNING_PATTERN'
      )).toBe(true);
    });
  });

  describe('KnowledgePrimitive premium fields', () => {
    test('should search similar concepts', async () => {
      const response = await request(app)
        .get('/api/premium/search/similar-concepts?query=test')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.query).toBe('test');
      expect(response.body.results).toBeDefined();
      expect(response.body.totalResults).toBeGreaterThan(0);
    });

    test('should search by complexity level', async () => {
      const response = await request(app)
        .get('/api/premium/search/complexity?minComplexity=5&maxComplexity=10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.results).toBeDefined();
      expect(response.body.complexityRange).toEqual({
        min: '5',
        max: '10',
      });
    });

    test('should get prerequisites for concept', async () => {
      const response = await request(app)
        .get(`/api/premium/search/prerequisites/${testPrimitiveId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.concept).toBeDefined();
      expect(response.body.prerequisites).toBeDefined();
      expect(response.body.totalPrerequisites).toBeDefined();
      expect(response.body.completedPrerequisites).toBeDefined();
    });

    test('should get related concepts', async () => {
      const response = await request(app)
        .get(`/api/premium/search/related/${testPrimitiveId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.concept).toBeDefined();
      expect(response.body.relatedConcepts).toBeDefined();
      expect(response.body.totalRelated).toBeDefined();
    });
  });

  describe('Learning Analytics', () => {
    test('should get learning analytics', async () => {
      const response = await request(app)
        .get('/api/premium/analytics/learning')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalStudyTime).toBeDefined();
      expect(response.body.totalConceptsReviewed).toBeDefined();
      expect(response.body.totalConceptsMastered).toBeDefined();
      expect(response.body.averageEfficiency).toBeDefined();
      expect(response.body.dailyAnalytics).toBeDefined();
    });

    test('should update daily analytics', async () => {
      const response = await request(app)
        .post('/api/premium/analytics/daily')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          totalStudyTimeMinutes: 45,
          conceptsReviewed: 3,
          conceptsMastered: 1,
          averageMasteryScore: 0.75,
          learningEfficiency: 0.8,
          focusAreas: ['mathematics', 'physics'],
          achievements: ['Completed first concept', 'Maintained streak'],
        });

      expect(response.status).toBe(200);
      expect(response.body.totalStudyTimeMinutes).toBe(45);
      expect(response.body.conceptsReviewed).toBe(3);
      expect(response.body.conceptsMastered).toBe(1);
      expect(response.body.averageMasteryScore).toBe(0.75);
    });
  });

  describe('Knowledge Graph', () => {
    test('should get knowledge graph data', async () => {
      const response = await request(app)
        .get('/api/premium/analytics/knowledge-graph')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.nodes).toBeDefined();
      expect(response.body.edges).toBeDefined();
      expect(response.body.totalNodes).toBeDefined();
      expect(response.body.totalEdges).toBeDefined();
      expect(Array.isArray(response.body.nodes)).toBe(true);
      expect(Array.isArray(response.body.edges)).toBe(true);
    });
  });
});
