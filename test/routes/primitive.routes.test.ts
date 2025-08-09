import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import primitiveRouter from '../../src/routes/primitive.routes';
import * as primitiveController from '../../src/controllers/primitive.controller';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    knowledgePrimitive: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userPrimitiveProgress: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    userCriterionMastery: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    masteryCriterion: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
}));

// Mock auth middleware
jest.mock('../../src/middleware/auth.middleware', () => ({
  protect: (req: any, res: any, next: any) => {
    req.user = { userId: 1 };
    next();
  },
}));

// Mock services
jest.mock('../../src/services/primitiveSR.service', () => ({
  processBatchReviewOutcomes: jest.fn(),
  checkUeeProgression: jest.fn(),
}));

jest.mock('../../src/services/cachedPrimitiveSR.service', () => ({
  cachedPrimitiveService: {
    invalidateUserCache: jest.fn(),
  },
}));

// Import mocked services
import * as primitiveSRService from '../../src/services/primitiveSR.service';
import { cachedPrimitiveService } from '../../src/services/cachedPrimitiveSR.service';

const mockPrisma = {
  knowledgePrimitive: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  userPrimitiveProgress: {
    findFirst: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
} as any;

describe('Primitive Routes Integration Tests', () => {
  let app: express.Application;
  const testUser = { id: 1, token: 'test-token' };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Setup routes (auth middleware is already mocked globally)
    app.use('/api/primitives', primitiveRouter);
    
    // Inject mocked Prisma client into controller
    primitiveController.setPrismaClient(mockPrisma);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset to default Prisma client after each test
    primitiveController.resetPrismaClient();
  });

  describe('POST /api/primitives/review', () => {
    it('should successfully process review outcomes', async () => {
      const reviewOutcomes = [
        {
          primitiveId: 'prim-1',
          blueprintId: 1,
          isCorrect: true,
          difficultyRating: 3,
        },
      ];

      (primitiveSRService.processBatchReviewOutcomes as jest.Mock).mockResolvedValue([
        { 
          primitiveId: 'prim-1', 
          blueprintId: 1, 
          isCorrect: true, 
          success: true, 
          newReviewCount: 1, 
          newSuccessfulReviews: 1, 
          nextReviewAt: new Date(), 
          difficultyMultiplier: 1.0 
        }
      ]);

      const response = await request(app)
        .post('/api/primitives/review')
        .send({ outcomes: reviewOutcomes });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.totalProcessed).toBe(1);
      expect(primitiveSRService.processBatchReviewOutcomes).toHaveBeenCalledWith(
        testUser.id,
        reviewOutcomes
      );
      expect(cachedPrimitiveService.invalidateUserCache).toHaveBeenCalledWith(testUser.id);
    });

    it('should return 400 for invalid request structure', async () => {
      const response = await request(app)
        .post('/api/primitives/review')
        .send({ outcomes: [] });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid request');
    });

    it('should return 400 for invalid outcome structure', async () => {
      const invalidOutcomes = [
        {
          primitiveId: 'prim-1',
          // Missing blueprintId and isCorrect
        },
      ];

      const response = await request(app)
        .post('/api/primitives/review')
        .send({ outcomes: invalidOutcomes });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid outcome structure');
    });

    it('should handle service errors gracefully', async () => {
      (primitiveSRService.processBatchReviewOutcomes as jest.Mock).mockRejectedValue(
        new Error('Service error')
      );

      const response = await request(app)
        .post('/api/primitives/review')
        .send({
          outcomes: [
            {
              primitiveId: 'prim-1',
              blueprintId: 1,
              isCorrect: true,
              difficultyRating: 3,
            },
          ],
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to process review outcomes');
    });
  });

  describe('POST /api/primitives/:id/tracking', () => {
    it('should successfully toggle tracking on', async () => {
      const mockProgress = {
        id: 1,
        userId: testUser.id,
        primitiveId: 'prim-1',
        blueprintId: 1,
        nextReviewAt: null,
      };

      mockPrisma.userPrimitiveProgress.findFirst.mockResolvedValue(mockProgress);
      mockPrisma.userPrimitiveProgress.update.mockResolvedValue({
        ...mockProgress,
        nextReviewAt: new Date(),
      });

      const response = await request(app)
        .post('/api/primitives/prim-1/tracking')
        .send({ isTracking: true });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isTracking).toBe(true);
      expect(cachedPrimitiveService.invalidateUserCache).toHaveBeenCalledWith(testUser.id);
    });

    it('should return 404 for non-existent primitive progress', async () => {
      mockPrisma.userPrimitiveProgress.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/primitives/prim-1/tracking')
        .send({ isTracking: true });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Primitive progress not found');
    });
  });

  describe('GET /api/primitives', () => {
    it('should successfully list primitives', async () => {
      const mockPrimitives = [
        {
          id: 1,
          primitiveId: 'prim-1',
          title: 'Test Primitive',
          description: 'A primitive for testing',
          primitiveType: 'concept',
          difficultyLevel: 'beginner',
          estimatedTimeMinutes: 10,
          createdAt: new Date(),
          userPrimitiveProgresses: [{ 
            isTracking: true, 
            masteryLevel: 'UNDERSTAND',
            nextReviewAt: new Date(),
            lastReviewedAt: null,
            reviewCount: 0,
            successfulReviews: 0,
            difficultyMultiplier: 1.0
          }],
          masteryCriteria: [{
            userCriterionMasteries: [{ isMastered: false }]
          }],
        },
      ];

      // Mock both count and findMany methods
      mockPrisma.knowledgePrimitive.count.mockResolvedValue(1);
      mockPrisma.knowledgePrimitive.findMany.mockResolvedValue(mockPrimitives);

      const response = await request(app).get('/api/primitives');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.primitives).toHaveLength(1);
      expect(response.body.data.primitives[0].primitiveId).toBe('prim-1');
      expect(response.body.data.primitives[0].isTracking).toBe(true);
      expect(response.body.data.pagination.total).toBe(1);
    });

    it('should handle pagination parameters', async () => {
      // Mock both count and findMany for pagination
      mockPrisma.knowledgePrimitive.count.mockResolvedValue(0);
      mockPrisma.knowledgePrimitive.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/primitives')
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.primitives).toEqual([]);
      expect(response.body.data.pagination.page).toBe(2);
      expect(response.body.data.pagination.limit).toBe(10);
      expect(response.body.data.pagination.total).toBe(0);
      expect(mockPrisma.knowledgePrimitive.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should handle database errors gracefully', async () => {
      // Mock count to succeed but findMany to fail
      mockPrisma.knowledgePrimitive.count.mockResolvedValue(1);
      mockPrisma.knowledgePrimitive.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/primitives');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to retrieve primitives');
    });
  });

  describe('GET /api/primitives/:id/details', () => {
    it('should successfully get primitive details', async () => {
      const mockPrimitive = {
        primitiveId: 'prim-1',
        title: 'Test Primitive',
        description: 'A primitive for testing',
        userPrimitiveProgresses: [
          {
            masteryLevel: 'UNDERSTAND',
            isTracking: true,
          },
        ],
        masteryCriteria: [
          {
            criterionId: 'crit-1',
            weight: 1,
            userCriterionMasteries: [{ successfulAttempts: 2, attemptCount: 2 }],
          },
        ],
      };

      mockPrisma.knowledgePrimitive.findUnique.mockResolvedValue(mockPrimitive);
      (primitiveSRService.checkUeeProgression as jest.Mock).mockResolvedValue({ canProgress: true });

      const response = await request(app).get('/api/primitives/prim-1/details');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Primitive');
    });

    it('should return 404 for non-existent primitive', async () => {
      mockPrisma.knowledgePrimitive.findUnique.mockResolvedValue(null);

      const response = await request(app).get('/api/primitives/prim-non-existent/details');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Primitive not found or not accessible to user');
    });
  });

  describe('Tracking Intensity Management', () => {
    describe('POST /api/primitives/:id/tracking-intensity', () => {
      it('should successfully set tracking intensity', async () => {
        const mockProgress = {
          id: 1,
          userId: testUser.id,
          primitiveId: 'prim-1',
          blueprintId: 1,
          trackingIntensity: 'NORMAL',
        };

        mockPrisma.userPrimitiveProgress.findFirst.mockResolvedValue(mockProgress);
        mockPrisma.userPrimitiveProgress.update.mockResolvedValue({
          ...mockProgress,
          trackingIntensity: 'DENSE',
        });

        const response = await request(app)
          .post('/api/primitives/prim-1/tracking-intensity')
          .send({ intensity: 'DENSE' });

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.intensity).toBe('DENSE');
        expect(cachedPrimitiveService.invalidateUserCache).toHaveBeenCalledWith(testUser.id);
      });

      it('should return 400 for invalid intensity', async () => {
        const response = await request(app)
          .post('/api/primitives/prim-1/tracking-intensity')
          .send({ intensity: 'INVALID' });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toContain('Invalid intensity');
      });
    });

    describe('GET /api/primitives/:id/tracking-intensity', () => {
      it('should successfully get tracking intensity', async () => {
        const mockProgress = {
          trackingIntensity: 'SPARSE',
        };

        mockPrisma.userPrimitiveProgress.findFirst.mockResolvedValue(mockProgress);

        const response = await request(app).get('/api/primitives/prim-1/tracking-intensity');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.intensity).toBe('SPARSE');
      });
    });

    describe('DELETE /api/primitives/:id/tracking-intensity', () => {
      it('should successfully reset tracking intensity to NORMAL', async () => {
        const mockProgress = {
          id: 1,
          userId: testUser.id,
          primitiveId: 'prim-1',
          blueprintId: 1,
          trackingIntensity: 'DENSE',
        };

        mockPrisma.userPrimitiveProgress.findFirst.mockResolvedValue(mockProgress);
        mockPrisma.userPrimitiveProgress.update.mockResolvedValue({
          ...mockProgress,
          trackingIntensity: 'NORMAL',
        });

        const response = await request(app).delete('/api/primitives/prim-1/tracking-intensity');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.intensity).toBe('NORMAL');
        expect(cachedPrimitiveService.invalidateUserCache).toHaveBeenCalledWith(testUser.id);
      });
    });
  });

  describe('Authorization', () => {
    it('should return 401 for unauthenticated requests', async () => {
      // Temporarily remove the mocked auth middleware to test real auth
      jest.unmock('../../src/middleware/auth.middleware');
      
      // Create a fresh app instance without auth mocking
      const express = require('express');
      const unauthApp = express();
      unauthApp.use(express.json());
      
      // Use the real auth middleware
      const { protect } = require('../../src/middleware/auth.middleware');
      const primitiveRoutes = require('../../src/routes/primitive.routes').default;
      
      unauthApp.use('/api/primitives', primitiveRoutes);

      const response = await request(unauthApp).get('/api/primitives');

      expect(response.status).toBe(401);
      
      // Restore the mock for other tests
      jest.doMock('../../src/middleware/auth.middleware', () => ({
        protect: (req: any, res: any, next: any) => {
          req.user = { userId: testUser.id };
          next();
        }
      }));
    });
  });
});
