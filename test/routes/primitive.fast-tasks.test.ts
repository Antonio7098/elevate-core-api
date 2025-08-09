import request from 'supertest';
import express from 'express';
import { getDailyTasksPrimitive } from '../../src/controllers/primitive.controller.fast-tasks';
import { cachedPrimitiveService } from '../../src/services/cachedPrimitiveSR.service';
import { protect } from '../../src/middleware/auth.middleware';

// Mock the cached primitive service
jest.mock('../../src/services/cachedPrimitiveSR.service');
const mockCachedPrimitiveService = cachedPrimitiveService as jest.Mocked<typeof cachedPrimitiveService>;

// Mock auth middleware
jest.mock('../../src/middleware/auth.middleware');
const mockProtect = protect as jest.MockedFunction<typeof protect>;

describe('Fast Daily Tasks Endpoint', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock auth middleware to inject test user
    mockProtect.mockImplementation((req: any, res: any, next: any) => {
      req.user = { userId: 1 };
      next();
    });

    // Setup route
    app.get('/api/primitives/due', mockProtect, getDailyTasksPrimitive);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/primitives/due', () => {
    it('should return optimized daily tasks with performance metrics', async () => {
      // Mock cached service response
      const mockTasks = [
        {
          primitiveId: 'primitive-1',
          primitiveTitle: 'React Hooks',
          masteryLevel: 'UNDERSTAND',
          weightedMasteryScore: 0.75,
          bucket: 'core',
          questionCount: 5,
          nextReviewAt: new Date(),
          questions: [
            { questionId: 'q1', content: 'What is useState?' },
            { questionId: 'q2', content: 'How does useEffect work?' }
          ]
        },
        {
          primitiveId: 'primitive-2',
          primitiveTitle: 'JavaScript Closures',
          masteryLevel: 'EVALUATE',
          weightedMasteryScore: 0.85,
          bucket: 'critical',
          questionCount: 3,
          nextReviewAt: new Date(),
          questions: [
            { questionId: 'q3', content: 'What is a closure?' }
          ]
        }
      ];

      mockCachedPrimitiveService.getDailyTasks.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/primitives/due')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          tasks: [
            {
              primitiveId: 'primitive-1',
              title: 'React Hooks',
              masteryLevel: 'UNDERSTAND',
              weightedMasteryScore: 0.75,
              bucket: 'core',
              questionCount: 5,
              hasQuestions: true
            },
            {
              primitiveId: 'primitive-2',
              title: 'JavaScript Closures',
              masteryLevel: 'EVALUATE',
              weightedMasteryScore: 0.85,
              bucket: 'critical',
              questionCount: 3,
              hasQuestions: true
            }
          ],
          totalTasks: 2,
          bucketDistribution: {
            critical: 1,
            core: 1,
            plus: 0
          },
          performance: {
            processingTimeMs: expect.any(Number),
            cached: true,
            tasksPerSecond: expect.any(Number)
          },
          generatedAt: expect.any(String)
        }
      });

      expect(mockCachedPrimitiveService.getDailyTasks).toHaveBeenCalledWith(1);
    });

    it('should handle empty tasks list', async () => {
      mockCachedPrimitiveService.getDailyTasks.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/primitives/due')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          tasks: [],
          totalTasks: 0,
          bucketDistribution: {
            critical: 0,
            core: 0,
            plus: 0
          },
          performance: {
            processingTimeMs: expect.any(Number),
            cached: true,
            tasksPerSecond: expect.any(Number)
          }
        }
      });
    });

    it('should handle tasks without questions', async () => {
      const mockTasks = [
        {
          primitiveId: 'primitive-1',
          primitiveTitle: 'Empty Primitive',
          masteryLevel: 'UNDERSTAND',
          weightedMasteryScore: 0.5,
          bucket: 'plus',
          questionCount: 0,
          nextReviewAt: new Date(),
          questions: []
        }
      ];

      mockCachedPrimitiveService.getDailyTasks.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/primitives/due')
        .expect(200);

      expect(response.body.data.tasks[0]).toMatchObject({
        primitiveId: 'primitive-1',
        title: 'Empty Primitive',
        hasQuestions: false
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      // Mock auth middleware to not inject user
      mockProtect.mockImplementation((req: any, res: any, next: any) => {
        req.user = undefined;
        next();
      });

      const response = await request(app)
        .get('/api/primitives/due')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: 'User not authenticated'
      });
    });

    it('should handle service errors gracefully', async () => {
      mockCachedPrimitiveService.getDailyTasks.mockRejectedValue(
        new Error('Cache service unavailable')
      );

      const response = await request(app)
        .get('/api/primitives/due')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to retrieve daily tasks',
        details: 'Cache service unavailable'
      });
    });

    it('should include performance metrics in response', async () => {
      const mockTasks = [
        {
          primitiveId: 'primitive-1',
          primitiveTitle: 'Test Primitive',
          masteryLevel: 'UNDERSTAND',
          weightedMasteryScore: 0.7,
          bucket: 'core',
          questionCount: 2,
          nextReviewAt: new Date(),
          questions: []
        }
      ];

      mockCachedPrimitiveService.getDailyTasks.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/primitives/due')
        .expect(200);

      expect(response.body.data.performance).toMatchObject({
        processingTimeMs: expect.any(Number),
        cached: true,
        tasksPerSecond: expect.any(Number)
      });

      // Verify performance metrics are reasonable
      expect(response.body.data.performance.processingTimeMs).toBeGreaterThan(0);
      expect(response.body.data.performance.tasksPerSecond).toBeGreaterThan(0);
    });

    it('should correctly distribute tasks by bucket', async () => {
      const mockTasks = [
        {
          primitiveId: 'p1',
          primitiveTitle: 'Critical Task',
          masteryLevel: 'UNDERSTAND',
          weightedMasteryScore: 0.3,
          bucket: 'critical',
          questionCount: 1,
          nextReviewAt: new Date(),
          questions: []
        },
        {
          primitiveId: 'p2',
          primitiveTitle: 'Core Task 1',
          masteryLevel: 'APPLY',
          weightedMasteryScore: 0.6,
          bucket: 'core',
          questionCount: 2,
          nextReviewAt: new Date(),
          questions: []
        },
        {
          primitiveId: 'p3',
          primitiveTitle: 'Core Task 2',
          masteryLevel: 'APPLY',
          weightedMasteryScore: 0.65,
          bucket: 'core',
          questionCount: 1,
          nextReviewAt: new Date(),
          questions: []
        },
        {
          primitiveId: 'p4',
          primitiveTitle: 'Plus Task',
          masteryLevel: 'EVALUATE',
          weightedMasteryScore: 0.9,
          bucket: 'plus',
          questionCount: 3,
          nextReviewAt: new Date(),
          questions: []
        }
      ];

      mockCachedPrimitiveService.getDailyTasks.mockResolvedValue(mockTasks);

      const response = await request(app)
        .get('/api/primitives/due')
        .expect(200);

      expect(response.body.data.bucketDistribution).toEqual({
        critical: 1,
        core: 2,
        plus: 1
      });
      expect(response.body.data.totalTasks).toBe(4);
    });
  });
});
