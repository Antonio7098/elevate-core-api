import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import * as primitiveController from '../../src/controllers/primitive.controller';
import { protect } from '../../src/middleware/auth.middleware';

// Mock PrismaClient constructor with factory function
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    userPrimitiveProgress: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    knowledgePrimitive: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    userCriterionMastery: {
      findMany: jest.fn(),
    },
    masteryCriteria: {
      findMany: jest.fn(),
    },
  })),
}));

// Get reference to the mocked Prisma instance
const mockPrisma = new PrismaClient() as any;

// Mock other dependencies
jest.mock('../../src/services/cachedPrimitiveSR.service');
jest.mock('../../src/services/primitiveSR.service');

// Mock services
jest.mock('../../src/services/cachedPrimitiveSR.service', () => ({
  cachedPrimitiveService: {
    invalidateUserCache: jest.fn(),
  },
}));

jest.mock('../../src/services/primitiveSR.service', () => ({
  processBatchReviewOutcomes: jest.fn(),
  checkUeeProgression: jest.fn(),
}));

// Import mocked services
import { cachedPrimitiveService } from '../../src/services/cachedPrimitiveSR.service';
import * as primitiveSRService from '../../src/services/primitiveSR.service';



// Mock auth middleware
const mockProtect = (req: any, res: any, next: any) => {
  req.user = { userId: 1 };
  next();
};

jest.mock('../../src/middleware/auth.middleware', () => ({
  protect: mockProtect,
}));

describe('Primitive Controller', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Setup routes
    app.post('/api/primitives/review', mockProtect, primitiveController.submitReview);
    app.post('/api/primitives/:id/tracking', mockProtect, primitiveController.toggleTracking);
    app.get('/api/primitives', mockProtect, primitiveController.listPrimitives);
    app.get('/api/primitives/:id/details', mockProtect, primitiveController.getPrimitiveDetails);
    app.post('/api/primitives/:id/tracking-intensity', mockProtect, primitiveController.setTrackingIntensity);
    app.get('/api/primitives/:id/tracking-intensity', mockProtect, primitiveController.getTrackingIntensity);
    app.delete('/api/primitives/:id/tracking-intensity', mockProtect, primitiveController.deleteTrackingIntensity);

    // Inject mocked Prisma client
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
      expect((primitiveSRService.processBatchReviewOutcomes as jest.Mock)).toHaveBeenCalledWith(
        1,
        reviewOutcomes
      );
      expect((cachedPrimitiveService.invalidateUserCache as jest.Mock)).toHaveBeenCalledWith(1);
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
  });

  describe('POST /api/primitives/:id/tracking', () => {
    it('should successfully toggle tracking on', async () => {
      const mockProgress = {
        id: 1,
        userId: 1,
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
      expect((cachedPrimitiveService.invalidateUserCache as jest.Mock)).toHaveBeenCalledWith(1);
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
          primitiveId: 'prim-1',
          title: 'Test Primitive',
          description: 'A primitive for testing',
          primitiveType: 'KNOWLEDGE',
          difficultyLevel: 'MEDIUM',
          userPrimitiveProgresses: [{ isTracking: true }],
        },
      ];

      const mockProgress = [
        {
          primitiveId: 'prim-1',
          masteryLevel: 'UNDERSTAND',
          nextReviewAt: new Date(),
          lastReviewedAt: new Date(),
          reviewCount: 5,
          successfulReviews: 4,
          trackingIntensity: 'NORMAL',
        },
      ];

      mockPrisma.knowledgePrimitive.findMany.mockResolvedValue(mockPrimitives);
      mockPrisma.userPrimitiveProgress.findMany.mockResolvedValue(mockProgress);

      const response = await request(app).get('/api/primitives');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.primitives).toHaveLength(1);
      expect(response.body.data.primitives[0].primitiveId).toBe('prim-1');
      expect(response.body.data.primitives[0].isTracking).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      mockPrisma.knowledgePrimitive.findMany.mockResolvedValue([]);
      mockPrisma.userPrimitiveProgress.findMany.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/primitives')
        .query({ page: 2, limit: 10 });

      expect(response.status).toBe(200);
      expect(mockPrisma.knowledgePrimitive.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe('GET /api/primitives/:id/details', () => {
    beforeEach(() => {
      // Reset mocks before each test in this suite
      jest.clearAllMocks();
      primitiveController.setPrismaClient(mockPrisma as unknown as PrismaClient);
    });

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

      mockPrisma.knowledgePrimitive.findUnique.mockResolvedValue(mockPrimitive as any);
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
          userId: 1,
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
        expect((cachedPrimitiveService.invalidateUserCache as jest.Mock)).toHaveBeenCalledWith(1);
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
          userId: 1,
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
        expect((cachedPrimitiveService.invalidateUserCache as jest.Mock)).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.knowledgePrimitive.findMany.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/primitives');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to retrieve primitives');
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
            },
          ],
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to process review outcomes');
    });
  });
});
