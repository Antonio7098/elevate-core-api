import request from 'supertest';
import { app } from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Premium Search', () => {
  let userToken: string;
  let userId: number;
  let testPrimitiveId: string;
  let relatedPrimitiveId: string;
  let prerequisitePrimitiveId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'premium-search-test@example.com',
        password: 'hashedpassword',
        name: 'Premium Search Test User',
      },
    });
    userId = user.id;
    userToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');

    // Create prerequisite primitive
    const prerequisite = await prisma.knowledgePrimitive.create({
      data: {
        primitiveId: 'prerequisite-concept',
        title: 'Basic Mathematics',
        description: 'Fundamental mathematical concepts',
        primitiveType: 'concept',
        difficultyLevel: 'beginner',
        userId: user.id,
        blueprintId: 1,
        complexityScore: 3.0,
        isCoreConcept: true,
        conceptTags: ['mathematics', 'basic', 'fundamental'],
        prerequisiteIds: [],
        relatedConceptIds: ['advanced-mathematics'],
        estimatedPrerequisites: 0,
      },
    });
    prerequisitePrimitiveId = prerequisite.primitiveId;

    // Create main test primitive
    const primitive = await prisma.knowledgePrimitive.create({
      data: {
        primitiveId: 'advanced-mathematics',
        title: 'Advanced Mathematics',
        description: 'Complex mathematical concepts building on basic principles',
        primitiveType: 'concept',
        difficultyLevel: 'advanced',
        userId: user.id,
        blueprintId: 1,
        complexityScore: 8.0,
        isCoreConcept: true,
        conceptTags: ['mathematics', 'advanced', 'complex'],
        prerequisiteIds: ['prerequisite-concept'],
        relatedConceptIds: ['related-concept'],
        estimatedPrerequisites: 2,
      },
    });
    testPrimitiveId = primitive.primitiveId;

    // Create related primitive
    const related = await prisma.knowledgePrimitive.create({
      data: {
        primitiveId: 'related-concept',
        title: 'Applied Mathematics',
        description: 'Practical applications of mathematical concepts',
        primitiveType: 'application',
        difficultyLevel: 'intermediate',
        userId: user.id,
        blueprintId: 1,
        complexityScore: 6.0,
        isCoreConcept: false,
        conceptTags: ['mathematics', 'applied', 'practical'],
        prerequisiteIds: ['advanced-mathematics'],
        relatedConceptIds: ['advanced-mathematics'],
        estimatedPrerequisites: 1,
      },
    });
    relatedPrimitiveId = related.primitiveId;

    // Create additional primitives for search testing
    await prisma.knowledgePrimitive.create({
      data: {
        primitiveId: 'physics-concepts',
        title: 'Physics Fundamentals',
        description: 'Core physics principles and laws',
        primitiveType: 'concept',
        difficultyLevel: 'intermediate',
        userId: user.id,
        blueprintId: 1,
        complexityScore: 7.0,
        isCoreConcept: true,
        conceptTags: ['physics', 'fundamentals', 'laws'],
        prerequisiteIds: [],
        relatedConceptIds: [],
        estimatedPrerequisites: 1,
      },
    });

    await prisma.knowledgePrimitive.create({
      data: {
        primitiveId: 'chemistry-basics',
        title: 'Chemistry Basics',
        description: 'Introduction to chemical principles',
        primitiveType: 'concept',
        difficultyLevel: 'beginner',
        userId: user.id,
        blueprintId: 1,
        complexityScore: 4.0,
        isCoreConcept: true,
        conceptTags: ['chemistry', 'basics', 'principles'],
        prerequisiteIds: [],
        relatedConceptIds: [],
        estimatedPrerequisites: 0,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'premium-search-test@example.com' } });
    await prisma.$disconnect();
  });

  describe('GET /api/premium/search/similar-concepts', () => {
    test('should search similar concepts successfully', async () => {
      const response = await request(app)
        .get('/api/premium/search/similar-concepts?query=mathematics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('query');
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('totalResults');
      expect(response.body.query).toBe('mathematics');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.totalResults).toBeGreaterThan(0);

      // Check result structure
      if (response.body.results.length > 0) {
        const result = response.body.results[0];
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('similarityScore');
        expect(result).toHaveProperty('masteryLevel');
        expect(result).toHaveProperty('complexityScore');
        expect(result).toHaveProperty('isCoreConcept');
        expect(result).toHaveProperty('conceptTags');
        expect(typeof result.similarityScore).toBe('number');
        expect(Array.isArray(result.conceptTags)).toBe(true);
      }
    });

    test('should filter by complexity range', async () => {
      const response = await request(app)
        .get('/api/premium/search/similar-concepts?query=concept&complexityRange=5,10')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.results.every((result: any) => 
        result.complexityScore >= 5 && result.complexityScore <= 10
      )).toBe(true);
    });

    test('should limit results', async () => {
      const response = await request(app)
        .get('/api/premium/search/similar-concepts?query=concept&limit=2')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.results.length).toBeLessThanOrEqual(2);
    });

    test('should return empty results for non-matching query', async () => {
      const response = await request(app)
        .get('/api/premium/search/similar-concepts?query=nonexistentconcept')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalResults).toBe(0);
      expect(response.body.results.length).toBe(0);
    });

    test('should return 400 for missing query', async () => {
      const response = await request(app)
        .get('/api/premium/search/similar-concepts')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/premium/search/similar-concepts?query=mathematics');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/premium/search/complexity', () => {
    test('should search by complexity level successfully', async () => {
      const response = await request(app)
        .get('/api/premium/search/complexity?minComplexity=5&maxComplexity=8')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('totalResults');
      expect(response.body).toHaveProperty('complexityRange');
      expect(Array.isArray(response.body.results)).toBe(true);
      expect(response.body.complexityRange).toEqual({
        min: '5',
        max: '8',
      });

      // Check that all results are within complexity range
      expect(response.body.results.every((result: any) => 
        result.complexityScore >= 5 && result.complexityScore <= 8
      )).toBe(true);
    });

    test('should filter core concepts only', async () => {
      const response = await request(app)
        .get('/api/premium/search/complexity?isCoreOnly=true')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.results.every((result: any) => 
        result.isCoreConcept === true
      )).toBe(true);
    });

    test('should limit results', async () => {
      const response = await request(app)
        .get('/api/premium/search/complexity?limit=3')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.results.length).toBeLessThanOrEqual(3);
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get('/api/premium/search/complexity?minComplexity=5&maxComplexity=8');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/premium/search/prerequisites/:primitiveId', () => {
    test('should get prerequisites for concept successfully', async () => {
      const response = await request(app)
        .get(`/api/premium/search/prerequisites/${testPrimitiveId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('concept');
      expect(response.body).toHaveProperty('prerequisites');
      expect(response.body).toHaveProperty('totalPrerequisites');
      expect(response.body).toHaveProperty('completedPrerequisites');
      expect(response.body.concept.id).toBe(testPrimitiveId);
      expect(Array.isArray(response.body.prerequisites)).toBe(true);
      expect(typeof response.body.totalPrerequisites).toBe('number');
      expect(typeof response.body.completedPrerequisites).toBe('number');

      // Check prerequisite structure
      if (response.body.prerequisites.length > 0) {
        const prereq = response.body.prerequisites[0];
        expect(prereq).toHaveProperty('id');
        expect(prereq).toHaveProperty('title');
        expect(prereq).toHaveProperty('masteryLevel');
        expect(prereq).toHaveProperty('isCompleted');
      }
    });

    test('should return 404 for non-existent concept', async () => {
      const response = await request(app)
        .get('/api/premium/search/prerequisites/nonexistent-concept')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    test('should return 404 for concept belonging to different user', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-search-user-2@example.com',
          password: 'hashedpassword',
          name: 'Other Search User',
        },
      });

      const otherUserToken = jwt.sign({ userId: otherUser.id }, process.env.JWT_SECRET || 'secret');

      const response = await request(app)
        .get(`/api/premium/search/prerequisites/${testPrimitiveId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(404);

      // Clean up
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get(`/api/premium/search/prerequisites/${testPrimitiveId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/premium/search/related/:primitiveId', () => {
    test('should get related concepts successfully', async () => {
      const response = await request(app)
        .get(`/api/premium/search/related/${testPrimitiveId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('concept');
      expect(response.body).toHaveProperty('relatedConcepts');
      expect(response.body).toHaveProperty('totalRelated');
      expect(response.body.concept.id).toBe(testPrimitiveId);
      expect(Array.isArray(response.body.relatedConcepts)).toBe(true);
      expect(typeof response.body.totalRelated).toBe('number');

      // Check related concept structure
      if (response.body.relatedConcepts.length > 0) {
        const related = response.body.relatedConcepts[0];
        expect(related).toHaveProperty('id');
        expect(related).toHaveProperty('title');
        expect(related).toHaveProperty('masteryLevel');
      }
    });

    test('should return 404 for non-existent concept', async () => {
      const response = await request(app)
        .get('/api/premium/search/related/nonexistent-concept')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
    });

    test('should return 404 for concept belonging to different user', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-related-user-2@example.com',
          password: 'hashedpassword',
          name: 'Other Related User',
        },
      });

      const otherUserToken = jwt.sign({ userId: otherUser.id }, process.env.JWT_SECRET || 'secret');

      const response = await request(app)
        .get(`/api/premium/search/related/${testPrimitiveId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(404);

      // Clean up
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    test('should return 401 for missing authentication', async () => {
      const response = await request(app)
        .get(`/api/premium/search/related/${testPrimitiveId}`);

      expect(response.status).toBe(401);
    });
  });
});
