import { Request, Response } from 'express';

// Import after mocking
let EnhancedSpacedRepetitionController: any;
import { EnhancedSpacedRepetitionService } from '../../../services/enhancedSpacedRepetition.service';
import { MasteryTrackingService } from '../../../services/masteryTracking.service';
import { EnhancedBatchReviewService } from '../../../services/enhancedBatchReview.service';

// Mock the services
jest.mock('../../../services/enhancedSpacedRepetition.service', () => ({
  enhancedSpacedRepetitionService: {
    getDueCriteria: jest.fn(),
    processReviewOutcome: jest.fn(),
    getMasteryProgress: jest.fn(),
    updateTrackingIntensity: jest.fn(),
    getMasteryStats: jest.fn()
  }
}));
jest.mock('../../../services/masteryTracking.service');
jest.mock('../../../services/enhancedBatchReview.service');

const MockedMasteryTrackingService = MasteryTrackingService as jest.MockedClass<typeof MasteryTrackingService>;
const MockedEnhancedBatchReviewService = EnhancedBatchReviewService as jest.MockedClass<typeof EnhancedBatchReviewService>;

describe('EnhancedSpacedRepetitionController', () => {
  let controller: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockEnhancedSpacedRepetitionService: jest.Mocked<EnhancedSpacedRepetitionService>;
  let mockMasteryTrackingService: jest.Mocked<MasteryTrackingService>;
  let mockEnhancedBatchReviewService: jest.Mocked<EnhancedBatchReviewService>;

  beforeEach(async () => {
    // Reset mocks and modules
    jest.clearAllMocks();
    jest.resetModules();
    
    // Create mock service instances
    mockEnhancedSpacedRepetitionService = {
      getDueCriteria: jest.fn(),
      processReviewOutcome: jest.fn(),
      getMasteryProgress: jest.fn(),
      updateTrackingIntensity: jest.fn(),
      getMasteryStats: jest.fn()
    } as any;

    mockMasteryTrackingService = {
      getMasteryStats: jest.fn(),
      updateMasteryScore: jest.fn(),
      getMasteryProgress: jest.fn(),
      updateMasteryThreshold: jest.fn(),
      getUueStageProgress: jest.fn()
    } as any;

    mockEnhancedBatchReviewService = {
      processBatchWithOptimization: jest.fn()
    } as any;

    // Mock the service constructors
    (MockedMasteryTrackingService as any).mockImplementation(() => mockMasteryTrackingService);
    (MockedEnhancedBatchReviewService as any).mockImplementation(() => mockEnhancedBatchReviewService);

    // Import the controller after mocking
    const { EnhancedSpacedRepetitionController: ControllerClass } = await import('../enhancedSpacedRepetition.controller');
    EnhancedSpacedRepetitionController = ControllerClass;
    
    // Create controller instance
    controller = new EnhancedSpacedRepetitionController(
      mockEnhancedSpacedRepetitionService,
      mockMasteryTrackingService,
      mockEnhancedBatchReviewService
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

      mockEnhancedSpacedRepetitionService.getDueCriteria.mockResolvedValue(mockDueCriteria);

      await controller.getDailyTasks(mockRequest as Request, mockResponse as Response);

      expect(mockEnhancedSpacedRepetitionService.getDueCriteria).toHaveBeenCalledWith(123);
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

      await controller.getDailyTasks(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });

    it('should handle service errors gracefully', async () => {
      mockEnhancedSpacedRepetitionService.getDueCriteria.mockRejectedValue(new Error('Service error'));

      await controller.getDailyTasks(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to generate daily tasks' });
    });
  });

  describe('getDailySummary', () => {
    it('should get daily summary successfully', async () => {
      const mockMasteryStats = {
        totalCriteria: 10,
        overdueCriteria: 2,
        dueCriteria: 3,
        masteredCriteria: 5,
        averageMasteryScore: 0.7
      };

      mockEnhancedSpacedRepetitionService.getMasteryStats.mockResolvedValue(mockMasteryStats);

      await controller.getDailySummary(mockRequest as Request, mockResponse as Response);

      expect(mockEnhancedSpacedRepetitionService.getMasteryStats).toHaveBeenCalledWith(123);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          summaries: [],
          stats: {
            total: 10,
            critical: 0,
            core: 0,
            plus: 5,
            canProgress: 5
          }
        }
      });
    });

    it('should handle unauthenticated user', async () => {
      mockRequest.user = undefined;

      await controller.getDailySummary(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });
  });

  describe('submitReviewOutcome', () => {
    it('should process review outcome successfully', async () => {
      const mockResult = { 
        nextReviewAt: new Date('2024-01-02'),
        masteryScore: 0.8,
        isMastered: false,
        stageProgression: false,
        message: 'Review processed successfully'
      };
      mockRequest.body = {
        criterionId: 'criterion_1',
        isCorrect: true,
        timeSpentSeconds: 45,
        confidence: 0.9
      };

      mockEnhancedSpacedRepetitionService.processReviewOutcome.mockResolvedValue(mockResult);

      await controller.submitReviewOutcome(mockRequest as Request, mockResponse as Response);

      expect(mockEnhancedSpacedRepetitionService.processReviewOutcome).toHaveBeenCalledWith({
        userId: 123,
        criterionId: 'criterion_1',
        isCorrect: true,
        confidence: 0.9,
        timeSpentSeconds: 45,
        timestamp: expect.any(Date)
      });

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Review outcome processed successfully',
          criterionId: 'criterion_1',
          isCorrect: true,
          nextReviewAt: expect.any(Date),
          masteryUpdated: true
        }
      });
    });

    it('should handle missing required fields', async () => {
      mockRequest.body = { isCorrect: true };

      await controller.submitReviewOutcome(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields: criterionId, isCorrect'
      });
    });

    it('should use default values for optional fields', async () => {
      mockRequest.body = {
        criterionId: 'criterion_1',
        isCorrect: false
      };

      const mockResult = { nextReviewAt: new Date('2024-01-02') };
      // The original code had mockEnhancedSpacedRepetitionService.processReviewOutcome.mockResolvedValue(mockResult);
      // This line is removed as per the new_code, as the service name changed.
      // The mock implementation for EnhancedSpacedRepetitionService was removed in the new_code.
      // The mock implementation for MasteryTrackingService was added in the new_code.
      // The mock implementation for EnhancedBatchReviewService was added in the new_code.
      // The mock implementation for MasteryCriterionService was added in the new_code.

      await controller.submitReviewOutcome(mockRequest as Request, mockResponse as Response);

      expect(mockEnhancedSpacedRepetitionService.processReviewOutcome).toHaveBeenCalledWith({
        userId: 123,
        criterionId: 'criterion_1',
        isCorrect: false,
        confidence: 0.8,
        timeSpentSeconds: 30,
        timestamp: expect.any(Date)
      });
    });
  });

  describe('submitBatchReviewOutcomes', () => {
    it('should process batch review outcomes successfully', async () => {
      const mockOutcomes = [
        { criterionId: 'criterion_1', isCorrect: true, timeSpentSeconds: 30 },
        { criterionId: 'criterion_2', isCorrect: false, timeSpentSeconds: 45 }
      ];

      mockRequest.body = { outcomes: mockOutcomes };

      const mockResult = {
        success: true,
        processedCount: 2,
        successCount: 2,
        failureCount: 0,
        masteryUpdates: 2,
        stageProgressions: 1,
        processingTime: 150,
        errors: []
      };

      mockEnhancedBatchReviewService.processBatchWithOptimization.mockResolvedValue(mockResult);

      await controller.submitBatchReviewOutcomes(mockRequest as Request, mockResponse as Response);

      expect(mockEnhancedBatchReviewService.processBatchWithOptimization).toHaveBeenCalledWith(123, [
        { userId: 123, criterionId: 'criterion_1', isCorrect: true, reviewDate: expect.any(Date), timeSpentSeconds: 30, confidence: 0.8 },
        { userId: 123, criterionId: 'criterion_2', isCorrect: false, reviewDate: expect.any(Date), timeSpentSeconds: 45, confidence: 0.8 }
      ]);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Processed 2 review outcomes',
          totalProcessed: 2,
          successCount: 2,
          failureCount: 0,
          masteryUpdates: 2,
          stageProgressions: 1,
          processingTime: 150,
          errors: []
        }
      });
    });

    it('should handle missing outcomes array', async () => {
      mockRequest.body = {};

      await controller.submitBatchReviewOutcomes(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields: outcomes array'
      });
    });

    it('should handle empty outcomes array', async () => {
      mockRequest.body = { outcomes: [] };

      await controller.submitBatchReviewOutcomes(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields: outcomes array'
      });
    });

    it('should support both criterionId and primitiveId formats', async () => {
      const mockOutcomes = [
        { criterionId: 'criterion_1', isCorrect: true },
        { primitiveId: 'primitive_2', isCorrect: false }
      ];

      mockRequest.body = { outcomes: mockOutcomes };

      const mockResult = {
        success: true,
        processedCount: 2,
        successCount: 2,
        failureCount: 0,
        masteryUpdates: 2,
        stageProgressions: 0,
        processingTime: 100,
        errors: []
      };

      mockEnhancedBatchReviewService.processBatchWithOptimization.mockResolvedValue(mockResult);

      await controller.submitBatchReviewOutcomes(mockRequest as Request, mockResponse as Response);

      expect(mockEnhancedBatchReviewService.processBatchWithOptimization).toHaveBeenCalledWith(123, [
        { userId: 123, criterionId: 'criterion_1', isCorrect: true, reviewDate: expect.any(Date), timeSpentSeconds: 30, confidence: 0.8 },
        { userId: 123, criterionId: 'primitive_2', isCorrect: false, reviewDate: expect.any(Date), timeSpentSeconds: 30, confidence: 0.8 }
      ]);
    });
  });

  describe('getMasteryProgress', () => {
    it('should get mastery progress successfully', async () => {
      const mockProgress = {
        userId: 123,
        criterionId: 'criterion_1',
        currentStage: 'UNDERSTAND' as any, // Using string for mock, will be cast to UueStage
        masteryScore: 0.7,
        isMastered: false,
        consecutiveCorrect: 3,
        consecutiveIncorrect: 1,
        lastReviewAt: new Date('2024-01-01'),
        nextReviewAt: new Date('2024-01-02'),
        totalReviews: 10,
        masteryThreshold: 'PROFICIENT' as any, // Using string for mock
        thresholdValue: 0.8
      };

      mockRequest.params = { criterionId: 'criterion_1' };
      mockEnhancedSpacedRepetitionService.getMasteryProgress.mockResolvedValue(mockProgress);

      await controller.getMasteryProgress(mockRequest as Request, mockResponse as Response);

      expect(mockEnhancedSpacedRepetitionService.getMasteryProgress).toHaveBeenCalledWith(123, 'criterion_1');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockProgress
      });
    });

    it('should handle mastery progress not found', async () => {
      mockRequest.params = { criterionId: 'criterion_1' };
      mockMasteryTrackingService.getMasteryProgress.mockResolvedValue(null);

      await controller.getMasteryProgress(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Mastery progress not found'
      });
    });
  });

  describe('updateTrackingIntensity', () => {
    it('should update tracking intensity successfully', async () => {
      mockRequest.params = { criterionId: 'criterion_1' };
      mockRequest.body = { intensity: 'HIGH' };

      // The original code had mockEnhancedSpacedRepetitionService.updateTrackingIntensity.mockResolvedValue();
      // This line is removed as per the new_code, as the service name changed.
      // The mock implementation for EnhancedSpacedRepetitionService was removed in the new_code.
      // The mock implementation for MasteryTrackingService was added in the new_code.
      // The mock implementation for EnhancedBatchReviewService was added in the new_code.
      // The mock implementation for MasteryCriterionService was added in the new_code.

      await controller.updateTrackingIntensity(mockRequest as Request, mockResponse as Response);

      expect(mockEnhancedSpacedRepetitionService.updateTrackingIntensity).toHaveBeenCalledWith(123, 'criterion_1', 'HIGH');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          message: 'Tracking intensity updated successfully',
          criterionId: 'criterion_1',
          intensity: 'HIGH'
        }
      });
    });

    it('should handle missing intensity parameter', async () => {
      mockRequest.params = { criterionId: 'criterion_1' };
      mockRequest.body = {};

      await controller.updateTrackingIntensity(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing criterionId or intensity'
      });
    });
  });

  describe('getMasteryStats', () => {
    it('should get mastery stats successfully', async () => {
      const mockStats = {
        totalCriteria: 15,
        overdueCriteria: 2,
        dueCriteria: 3,
        masteredCriteria: 8,
        averageMasteryScore: 0.75
      };

      mockEnhancedSpacedRepetitionService.getMasteryStats.mockResolvedValue(mockStats);

      await controller.getMasteryStats(mockRequest as Request, mockResponse as Response);

      expect(mockEnhancedSpacedRepetitionService.getMasteryStats).toHaveBeenCalledWith(123);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockStats
      });
    });

    it('should handle unauthenticated user', async () => {
      mockRequest.user = undefined;

      await controller.getMasteryStats(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors consistently', async () => {
      const error = new Error('Database connection failed');
      mockEnhancedSpacedRepetitionService.getDueCriteria.mockRejectedValue(error);

      await controller.getDailyTasks(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Failed to generate daily tasks' });
    });

    it('should log errors for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Service error');
      mockEnhancedSpacedRepetitionService.getDueCriteria.mockRejectedValue(error);

      await controller.getDailyTasks(mockRequest as Request, mockResponse as Response);

      expect(consoleSpy).toHaveBeenCalledWith('Error generating daily tasks:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('Input Validation', () => {
    it('should validate user authentication on all protected endpoints', async () => {
      const endpoints = [
        () => controller.getDailyTasks(mockRequest as Request, mockResponse as Response),
        () => controller.getDailySummary(mockRequest as Request, mockResponse as Response),
        () => controller.submitReviewOutcome(mockRequest as Request, mockResponse as Response),
        () => controller.submitBatchReviewOutcomes(mockRequest as Request, mockResponse as Response),
        () => controller.getMasteryProgress(mockRequest as Request, mockResponse as Response),
        () => controller.updateTrackingIntensity(mockRequest as Request, mockResponse as Response),
        () => controller.getMasteryStats(mockRequest as Request, mockResponse as Response)
      ];

      mockRequest.user = undefined;

      for (const endpoint of endpoints) {
        await endpoint();
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
      }
    });

    it('should validate required fields on all endpoints', async () => {
      // Test submitReviewOutcome validation
      mockRequest.body = {};
      await controller.submitReviewOutcome(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);

      // Test submitBatchReviewOutcomes validation
      mockRequest.body = {};
      await controller.submitBatchReviewOutcomes(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);

      // Test getMasteryProgress validation
      mockRequest.params = {};
      await controller.getMasteryProgress(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);

      // Test updateTrackingIntensity validation
      mockRequest.params = {};
      mockRequest.body = {};
      await controller.updateTrackingIntensity(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
