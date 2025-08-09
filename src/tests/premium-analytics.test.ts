import request from 'supertest';
import { app } from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Premium Analytics', () => {
  let userToken: string;
  let userId: number;
  let testPrimitiveId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'premium-analytics-test@example.com',
        password: 'hashedpassword',
        name: 'Premium Analytics Test User',
      },
    });
    userId = user.id;
    userToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');

    // Create test knowledge primitive
    const primitive = await prisma.knowledgePrimitive.create({
      data: {
        primitiveId: 'test-analytics-primitive',
        title: 'Test Analytics Concept',
        description: 'A test concept for analytics testing',
        primitiveType: 'concept',
        difficultyLevel: 'intermediate',
        userId: user.id,
        blueprintId: 1,
        complexityScore: 6.0,
        isCoreConcept: true,
        conceptTags: ['test', 'analytics', 'concept'],
        prerequisiteIds: [],
        relatedConceptIds: [],
        estimatedPrerequisites: 2,
      },
    });
    testPrimitiveId = primitive.primitiveId;

    // Create user memory profile
    await prisma.userMemory.create({
      data: {
        userId: user.id,
        cognitiveApproach: 'ADAPTIVE',
        explanationStyles: ['ANALOGY_DRIVEN', 'PRACTICAL_EXAMPLES'],
        interactionStyle: 'SOCRATIC',
        primaryGoal: 'Master complex concepts through active learning',
      },
    });

    // Create some learning analytics data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.userLearningAnalytics.create({
      data: {
        userId: user.id,
        date: today,
        totalStudyTimeMinutes: 120,
        conceptsReviewed: 5,
        conceptsMastered: 2,
        averageMasteryScore: 0.75,
        learningEfficiency: 0.85,
        focusAreas: ['mathematics', 'physics'],
        achievements: ['Completed first concept', 'Maintained streak'],
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'premium-analytics-test@example.com' } });
    await prisma.$disconnect();
  });

  describe('GET /api/premium/analytics/learning', () => {
    test('should get learning analytics successfully', async () => {
      const response = await request(app)
        .get('/api/premium/analytics/learning')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalStudyTime');
      expect(response.body).toHaveProperty('totalConceptsReviewed');
      expect(response.body).toHaveProperty('totalConceptsMastered');
      expect(response.body).toHaveProperty('averageEfficiency');
      expect(response.body).toHaveProperty('dailyAnalytics');
      expect(Array.isArray(response.body.dailyAnalytics)).toBe(true);
      expect(response.body.totalStudyTime).toBeGreaterThanOrEqual(0);
      expect(response.body.totalConceptsReviewed).toBeGreaterThanOrEqual(0);
      expect(response.body.totalConceptsMastered).toBeGreaterThanOrEqual(0);
    });

    test('should filter analytics by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await request(app)
        .get(`/api/premium/analytics/learning?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('dailyAnalytics');
      expect(Array.isArray(response.body.dailyAnalytics)).toBe(true);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/premium/analytics/learning');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/premium/analytics/memory-insights', () => {
    test('should get memory insights successfully', async () => {
      const response = await request(app)
        .get('/api/premium/analytics/memory-insights')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('insights');
      expect(response.body).toHaveProperty('insightsByType');
      expect(response.body).toHaveProperty('totalInsights');
      expect(Array.isArray(response.body.insights)).toBe(true);
      expect(typeof response.body.totalInsights).toBe('number');
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

    test('should filter insights by confidence threshold', async () => {
      const response = await request(app)
        .get('/api/premium/analytics/memory-insights?confidenceThreshold=0.8')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.insights.every((insight: any) => 
        insight.confidenceScore >= 0.8
      )).toBe(true);
    });
  });

  describe('POST /api/premium/analytics/memory-insights', () => {
    test('should create memory insight successfully', async () => {
      const insightData = {
        insightType: 'LEARNING_PATTERN',
        title: 'Strong Pattern in Basic Concepts',
        content: 'User shows consistent strength in understanding fundamental concepts',
        relatedPrimitiveIds: [testPrimitiveId],
        confidenceScore: 0.9,
        isActionable: true,
      };

      const response = await request(app)
        .post('/api/premium/analytics/memory-insights')
        .set('Authorization', `Bearer ${userToken}`)
        .send(insightData);

      expect(response.status).toBe(201);
      expect(response.body.insightType).toBe(insightData.insightType);
      expect(response.body.title).toBe(insightData.title);
      expect(response.body.content).toBe(insightData.content);
      expect(response.body.confidenceScore).toBe(insightData.confidenceScore);
      expect(response.body.isActionable).toBe(insightData.isActionable);
      expect(response.body.userId).toBe(userId);
      expect(Array.isArray(response.body.relatedPrimitiveIds)).toBe(true);
    });

    test('should create insight with default values', async () => {
      const insightData = {
        insightType: 'STRUGGLE_POINT',
        title: 'Difficulty with Advanced Concepts',
        content: 'User struggles with complex topics',
        relatedPrimitiveIds: [testPrimitiveId],
      };

      const response = await request(app)
        .post('/api/premium/analytics/memory-insights')
        .set('Authorization', `Bearer ${userToken}`)
        .send(insightData);

      expect(response.status).toBe(201);
      expect(response.body.confidenceScore).toBe(0.5); // Default value
      expect(response.body.isActionable).toBe(true); // Default value
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/api/premium/analytics/memory-insights')
        .send({
          insightType: 'LEARNING_PATTERN',
          title: 'Unauthorized Insight',
          content: 'This should fail',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/premium/analytics/knowledge-graph', () => {
    test('should get knowledge graph data successfully', async () => {
      const response = await request(app)
        .get('/api/premium/analytics/knowledge-graph')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('nodes');
      expect(response.body).toHaveProperty('edges');
      expect(response.body).toHaveProperty('totalNodes');
      expect(response.body).toHaveProperty('totalEdges');
      expect(Array.isArray(response.body.nodes)).toBe(true);
      expect(Array.isArray(response.body.edges)).toBe(true);
      expect(typeof response.body.totalNodes).toBe('number');
      expect(typeof response.body.totalEdges).toBe('number');

      // Check node structure
      if (response.body.nodes.length > 0) {
        const node = response.body.nodes[0];
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('title');
        expect(node).toHaveProperty('type');
        expect(node).toHaveProperty('difficulty');
        expect(node).toHaveProperty('complexity');
        expect(node).toHaveProperty('isCore');
        expect(node).toHaveProperty('masteryLevel');
        expect(node).toHaveProperty('conceptTags');
        expect(Array.isArray(node.conceptTags)).toBe(true);
      }
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/premium/analytics/knowledge-graph');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/premium/analytics/daily', () => {
    test('should update daily analytics successfully', async () => {
      const analyticsData = {
        totalStudyTimeMinutes: 90,
        conceptsReviewed: 4,
        conceptsMastered: 1,
        averageMasteryScore: 0.8,
        learningEfficiency: 0.9,
        focusAreas: ['mathematics', 'physics', 'chemistry'],
        achievements: ['Completed daily goal', 'Improved efficiency'],
      };

      const response = await request(app)
        .post('/api/premium/analytics/daily')
        .set('Authorization', `Bearer ${userToken}`)
        .send(analyticsData);

      expect(response.status).toBe(200);
      expect(response.body.totalStudyTimeMinutes).toBe(analyticsData.totalStudyTimeMinutes);
      expect(response.body.conceptsReviewed).toBe(analyticsData.conceptsReviewed);
      expect(response.body.conceptsMastered).toBe(analyticsData.conceptsMastered);
      expect(response.body.averageMasteryScore).toBe(analyticsData.averageMasteryScore);
      expect(response.body.learningEfficiency).toBe(analyticsData.learningEfficiency);
      expect(response.body.focusAreas).toEqual(analyticsData.focusAreas);
      expect(response.body.achievements).toEqual(analyticsData.achievements);
      expect(response.body.userId).toBe(userId);
    });

    test('should update existing daily analytics', async () => {
      const updatedData = {
        totalStudyTimeMinutes: 150,
        conceptsReviewed: 6,
        conceptsMastered: 3,
        averageMasteryScore: 0.85,
        learningEfficiency: 0.95,
        focusAreas: ['advanced-mathematics'],
        achievements: ['Mastered complex topic'],
      };

      const response = await request(app)
        .post('/api/premium/analytics/daily')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.totalStudyTimeMinutes).toBe(updatedData.totalStudyTimeMinutes);
      expect(response.body.conceptsReviewed).toBe(updatedData.conceptsReviewed);
      expect(response.body.conceptsMastered).toBe(updatedData.conceptsMastered);
    });

    test('should handle partial data updates', async () => {
      const partialData = {
        totalStudyTimeMinutes: 60,
        conceptsReviewed: 2,
      };

      const response = await request(app)
        .post('/api/premium/analytics/daily')
        .set('Authorization', `Bearer ${userToken}`)
        .send(partialData);

      expect(response.status).toBe(200);
      expect(response.body.totalStudyTimeMinutes).toBe(partialData.totalStudyTimeMinutes);
      expect(response.body.conceptsReviewed).toBe(partialData.conceptsReviewed);
      // Other fields should have default values
      expect(response.body.conceptsMastered).toBe(0);
      expect(response.body.averageMasteryScore).toBe(0);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .post('/api/premium/analytics/daily')
        .send({
          totalStudyTimeMinutes: 30,
          conceptsReviewed: 1,
        });

      expect(response.status).toBe(401);
    });
  });
});
