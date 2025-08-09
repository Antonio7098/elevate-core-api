import request from 'supertest';
import { app } from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Premium Features Integration', () => {
  let userToken: string;
  let userId: number;
  let testPrimitiveId: string;
  let learningPathId: number;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'premium-integration-test@example.com',
        password: 'hashedpassword',
        name: 'Premium Integration Test User',
      },
    });
    userId = user.id;
    userToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');

    // Create test knowledge primitive
    const primitive = await prisma.knowledgePrimitive.create({
      data: {
        primitiveId: 'integration-test-concept',
        title: 'Integration Test Concept',
        description: 'A concept for testing premium feature integration',
        primitiveType: 'concept',
        difficultyLevel: 'intermediate',
        userId: user.id,
        blueprintId: 1,
        complexityScore: 6.5,
        isCoreConcept: true,
        conceptTags: ['integration', 'test', 'premium'],
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

    // Create learning analytics data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.userLearningAnalytics.create({
      data: {
        userId: user.id,
        date: today,
        totalStudyTimeMinutes: 180,
        conceptsReviewed: 8,
        conceptsMastered: 3,
        averageMasteryScore: 0.8,
        learningEfficiency: 0.9,
        focusAreas: ['mathematics', 'physics', 'integration'],
        achievements: ['Completed integration test', 'High efficiency achieved'],
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'premium-integration-test@example.com' } });
    await prisma.$disconnect();
  });

  describe('Complete Premium Workflow', () => {
    test('should complete full premium feature workflow', async () => {
      // Step 1: Create a learning path
      const createPathResponse = await request(app)
        .post('/api/premium/learning-paths')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          pathName: 'Integration Test Path',
          description: 'Testing premium features integration',
          targetMasteryLevel: 'EXPLORE',
          estimatedDurationDays: 14,
        });

      expect(createPathResponse.status).toBe(201);
      learningPathId = createPathResponse.body.id;

      // Step 2: Add step to learning path
      const addStepResponse = await request(app)
        .post(`/api/premium/learning-paths/${learningPathId}/steps`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          primitiveId: testPrimitiveId,
          estimatedTimeMinutes: 45,
        });

      expect(addStepResponse.status).toBe(201);

      // Step 3: Search for similar concepts
      const searchResponse = await request(app)
        .get('/api/premium/search/similar-concepts?query=integration')
        .set('Authorization', `Bearer ${userToken}`);

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.results.length).toBeGreaterThan(0);

      // Step 4: Get learning analytics
      const analyticsResponse = await request(app)
        .get('/api/premium/analytics/learning')
        .set('Authorization', `Bearer ${userToken}`);

      expect(analyticsResponse.status).toBe(200);
      expect(analyticsResponse.body.totalStudyTime).toBeGreaterThan(0);

      // Step 5: Create memory insight
      const insightResponse = await request(app)
        .post('/api/premium/analytics/memory-insights')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          insightType: 'LEARNING_PATTERN',
          title: 'Integration Test Pattern',
          content: 'User shows strong pattern in integration testing',
          relatedPrimitiveIds: [testPrimitiveId],
          confidenceScore: 0.95,
          isActionable: true,
        });

      expect(insightResponse.status).toBe(201);

      // Step 6: Get knowledge graph
      const graphResponse = await request(app)
        .get('/api/premium/analytics/knowledge-graph')
        .set('Authorization', `Bearer ${userToken}`);

      expect(graphResponse.status).toBe(200);
      expect(graphResponse.body.nodes.length).toBeGreaterThan(0);

      // Step 7: Update daily analytics
      const updateAnalyticsResponse = await request(app)
        .post('/api/premium/analytics/daily')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          totalStudyTimeMinutes: 200,
          conceptsReviewed: 10,
          conceptsMastered: 4,
          averageMasteryScore: 0.85,
          learningEfficiency: 0.95,
          focusAreas: ['integration', 'testing', 'premium'],
          achievements: ['Completed full workflow', 'Premium features working'],
        });

      expect(updateAnalyticsResponse.status).toBe(200);

      // Step 8: Get memory insights
      const insightsResponse = await request(app)
        .get('/api/premium/analytics/memory-insights')
        .set('Authorization', `Bearer ${userToken}`);

      expect(insightsResponse.status).toBe(200);
      expect(insightsResponse.body.totalInsights).toBeGreaterThan(0);

      // Step 9: Complete learning path step
      const pathResponse = await request(app)
        .get(`/api/premium/learning-paths/${learningPathId}`)
        .set('Authorization', `Bearer ${userToken}`);

      const stepId = pathResponse.body.pathSteps[0]?.id;
      expect(stepId).toBeDefined();

      const completeStepResponse = await request(app)
        .put(`/api/premium/learning-paths/${learningPathId}/steps/${stepId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          isCompleted: true,
        });

      expect(completeStepResponse.status).toBe(200);
      expect(completeStepResponse.body.isCompleted).toBe(true);

      // Step 10: Verify all data is consistent
      const finalAnalyticsResponse = await request(app)
        .get('/api/premium/analytics/learning')
        .set('Authorization', `Bearer ${userToken}`);

      expect(finalAnalyticsResponse.status).toBe(200);
      expect(finalAnalyticsResponse.body.totalStudyTime).toBeGreaterThanOrEqual(200);
      expect(finalAnalyticsResponse.body.totalConceptsReviewed).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Premium Feature Interactions', () => {
    test('should handle complex search and analytics interactions', async () => {
      // Create additional primitives for complex testing
      await prisma.knowledgePrimitive.create({
        data: {
          primitiveId: 'complex-test-1',
          title: 'Complex Test Concept 1',
          description: 'First complex concept for testing',
          primitiveType: 'concept',
          difficultyLevel: 'advanced',
          userId: userId,
          blueprintId: 1,
          complexityScore: 8.5,
          isCoreConcept: true,
          conceptTags: ['complex', 'advanced', 'test'],
          prerequisiteIds: [testPrimitiveId],
          relatedConceptIds: ['complex-test-2'],
          estimatedPrerequisites: 3,
        },
      });

      await prisma.knowledgePrimitive.create({
        data: {
          primitiveId: 'complex-test-2',
          title: 'Complex Test Concept 2',
          description: 'Second complex concept for testing',
          primitiveType: 'application',
          difficultyLevel: 'advanced',
          userId: userId,
          blueprintId: 1,
          complexityScore: 9.0,
          isCoreConcept: false,
          conceptTags: ['complex', 'application', 'test'],
          prerequisiteIds: ['complex-test-1'],
          relatedConceptIds: ['complex-test-1'],
          estimatedPrerequisites: 4,
        },
      });

      // Test complex search with analytics
      const searchResponse = await request(app)
        .get('/api/premium/search/complexity?minComplexity=8&maxComplexity=10&isCoreOnly=false')
        .set('Authorization', `Bearer ${userToken}`);

      expect(searchResponse.status).toBe(200);
      expect(searchResponse.body.results.length).toBeGreaterThan(0);

      // Test prerequisites search
      const prereqResponse = await request(app)
        .get('/api/premium/search/prerequisites/complex-test-1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(prereqResponse.status).toBe(200);
      expect(prereqResponse.body.prerequisites.length).toBeGreaterThan(0);

      // Test related concepts
      const relatedResponse = await request(app)
        .get('/api/premium/search/related/complex-test-1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(relatedResponse.status).toBe(200);
      expect(relatedResponse.body.relatedConcepts.length).toBeGreaterThan(0);

      // Update analytics with complex data
      const complexAnalyticsResponse = await request(app)
        .post('/api/premium/analytics/daily')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          totalStudyTimeMinutes: 300,
          conceptsReviewed: 15,
          conceptsMastered: 6,
          averageMasteryScore: 0.9,
          learningEfficiency: 0.98,
          focusAreas: ['complex-concepts', 'advanced-topics'],
          achievements: ['Mastered complex concepts', 'High efficiency maintained'],
        });

      expect(complexAnalyticsResponse.status).toBe(200);

      // Verify analytics reflect complex interactions
      const finalAnalyticsResponse = await request(app)
        .get('/api/premium/analytics/learning')
        .set('Authorization', `Bearer ${userToken}`);

      expect(finalAnalyticsResponse.status).toBe(200);
      expect(finalAnalyticsResponse.body.totalStudyTime).toBeGreaterThanOrEqual(300);
      expect(finalAnalyticsResponse.body.totalConceptsReviewed).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Premium Feature Performance', () => {
    test('should handle multiple concurrent premium operations', async () => {
      const promises = [];

      // Concurrent analytics requests
      for (let i = 0; i < 3; i++) {
        promises.push(
          request(app)
            .get('/api/premium/analytics/learning')
            .set('Authorization', `Bearer ${userToken}`)
        );
      }

      // Concurrent search requests
      for (let i = 0; i < 3; i++) {
        promises.push(
          request(app)
            .get('/api/premium/search/similar-concepts?query=test')
            .set('Authorization', `Bearer ${userToken}`)
        );
      }

      // Concurrent memory insight creation
      for (let i = 0; i < 2; i++) {
        promises.push(
          request(app)
            .post('/api/premium/analytics/memory-insights')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              insightType: 'PERFORMANCE_METRIC',
              title: `Performance Test ${i + 1}`,
              content: `Performance test insight ${i + 1}`,
              relatedPrimitiveIds: [testPrimitiveId],
              confidenceScore: 0.8 + (i * 0.1),
              isActionable: true,
            })
        );
      }

      const responses = await Promise.all(promises);

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(300);
      });

      // Verify data consistency after concurrent operations
      const finalAnalyticsResponse = await request(app)
        .get('/api/premium/analytics/learning')
        .set('Authorization', `Bearer ${userToken}`);

      expect(finalAnalyticsResponse.status).toBe(200);
      expect(finalAnalyticsResponse.body).toHaveProperty('totalStudyTime');
      expect(finalAnalyticsResponse.body).toHaveProperty('totalConceptsReviewed');
    });
  });

  describe('Premium Feature Error Handling', () => {
    test('should handle errors gracefully across premium features', async () => {
      // Test with invalid primitive ID
      const invalidPrereqResponse = await request(app)
        .get('/api/premium/search/prerequisites/invalid-primitive-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(invalidPrereqResponse.status).toBe(404);

      // Test with invalid learning path
      const invalidPathResponse = await request(app)
        .get('/api/premium/learning-paths/99999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(invalidPathResponse.status).toBe(404);

      // Test with invalid search parameters
      const invalidSearchResponse = await request(app)
        .get('/api/premium/search/similar-concepts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(invalidSearchResponse.status).toBe(400);

      // Test with invalid analytics data
      const invalidAnalyticsResponse = await request(app)
        .post('/api/premium/analytics/daily')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          totalStudyTimeMinutes: -10, // Invalid negative value
          conceptsReviewed: 'invalid', // Invalid type
        });

      // Should still work with default values
      expect(invalidAnalyticsResponse.status).toBe(200);
    });
  });
});
