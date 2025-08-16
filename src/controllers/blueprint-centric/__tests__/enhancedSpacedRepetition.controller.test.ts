import { Request, Response } from 'express';
import { EnhancedSpacedRepetitionController } from '../enhancedSpacedRepetition.controller';

// Mock the services
jest.mock('../../../services/mastery/enhancedSpacedRepetition.service', () => ({
  enhancedSpacedRepetitionService: {
    getDueCriteria: jest.fn(),
    getMasteryStats: jest.fn(),
    updateMasteryProgress: jest.fn(),
    getNextReview: jest.fn()
  }
}));

jest.mock('../../../services/mastery/enhancedBatchReview.service', () => ({
  EnhancedBatchReviewService: jest.fn().mockImplementation(() => ({
    processBatchReview: jest.fn()
  }))
}));

jest.mock('../../../services/mastery/masteryTracking.service', () => ({
  getMasteryProgress: jest.fn(),
  getMasteryStats: jest.fn()
}));

describe('EnhancedSpacedRepetitionController', () => {
  let controller: EnhancedSpacedRepetitionController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Import the controller
    const { EnhancedSpacedRepetitionController: ControllerClass } = await import('../enhancedSpacedRepetition.controller');
    
    // Create controller instance
    controller = new ControllerClass(
      { getDueCriteria: jest.fn(), getMasteryStats: jest.fn(), updateMasteryProgress: jest.fn(), getNextReview: jest.fn() },
      { processBatchReview: jest.fn() }
    );

    // Setup mock response methods
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Setup mock request
    mockRequest = {
      user: { userId: 123 },
      body: {},
      params: {},
      query: {}
    };
  });

  describe('getDailyTasks', () => {
    it('should return daily tasks successfully', async () => {
      const mockDueCriteria = [
        { id: 'criterion_1', description: 'Test Criterion 1' },
        { id: 'criterion_2', description: 'Test Criterion 2' }
      ];

      // Mock the service method
      (controller as any).enhancedSpacedRepetitionService.getDueCriteria.mockResolvedValue(mockDueCriteria);

      await controller.getDailyTasks(mockRequest as any, mockResponse as Response);

      expect((controller as any).enhancedSpacedRepetitionService.getDueCriteria).toHaveBeenCalledWith(123);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          tasks: [
            { id: 'criterion_1', title: 'Test Criterion 1', bucket: 'core', masteryScore: 0, nextReviewAt: expect.any(Date), estimatedTime: 5 },
            { id: 'criterion_2', title: 'Test Criterion 2', bucket: 'core', masteryScore: 0, nextReviewAt: expect.any(Date), estimatedTime: 5 }
          ],
          totalTasks: 2,
          bucketBreakdown: { critical: 0, core: 2, plus: 0 }
        }
      });
    });

    it('should handle unauthenticated user', async () => {
      mockRequest.user = undefined;

      await controller.getDailyTasks(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });
  });

  describe('submitReviewOutcome', () => {
    it('should submit review outcome successfully', async () => {
      const reviewData = {
        criterionId: 'criterion_1',
        outcome: 'correct',
        timeSpent: 120
      };

      mockRequest.body = reviewData;

      // Mock the service method
      (controller as any).enhancedSpacedRepetitionService.updateMasteryProgress.mockResolvedValue(undefined);

      await controller.submitReviewOutcome(mockRequest as any, mockResponse as Response);

      expect((controller as any).enhancedSpacedRepetitionService.updateMasteryProgress).toHaveBeenCalledWith(123, 'criterion_1', {
        outcome: 'correct',
        timeSpent: 120,
        reviewedAt: expect.any(Date)
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Review outcome submitted successfully'
      });
    });

    it('should handle missing required fields', async () => {
      mockRequest.body = {};

      await controller.submitReviewOutcome(mockRequest as any, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });
  });

  describe('getMasteryStats', () => {
    it('should return mastery stats successfully', async () => {
      const mockStats = {
        totalCriteria: 10,
        masteredCriteria: 5
      };

      // Mock the service method
      (controller as any).enhancedSpacedRepetitionService.getMasteryStats.mockResolvedValue(mockStats);

      await controller.getMasteryStats(mockRequest as any, mockResponse as Response);

      expect((controller as any).enhancedSpacedRepetitionService.getMasteryStats).toHaveBeenCalledWith(123);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });
  });
});
