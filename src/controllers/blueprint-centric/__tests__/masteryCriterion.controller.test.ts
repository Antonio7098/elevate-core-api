import { Request, Response } from 'express';

// Mock the services
jest.mock('../../../services/masteryCriterion.service', () => ({
  masteryCriterionService: {
    createCriterion: jest.fn(),
    getCriterion: jest.fn(),
    updateCriterion: jest.fn(),
    deleteCriterion: jest.fn(),
    getCriteriaByUueStage: jest.fn(),
    processCriterionReview: jest.fn(),
    calculateCriterionMastery: jest.fn()
  }
}));

jest.mock('../../../services/masteryTracking.service', () => ({
  MasteryTrackingService: jest.fn().mockImplementation(() => ({
    updateMasteryScore: jest.fn(),
    getMasteryProgress: jest.fn(),
    updateMasteryThreshold: jest.fn(),
    getUueStageProgress: jest.fn(),
    getMasteryStats: jest.fn()
  }))
}));

jest.mock('../../../services/masteryCalculation.service', () => ({
  MasteryCalculationService: jest.fn().mockImplementation(() => ({
    calculateCriterionMasteryScore: jest.fn(),
    calculateUueStageMastery: jest.fn()
  }))
}));

// Import after mocking
let MasteryCriterionController: any;

describe('MasteryCriterionController', () => {
  let controller: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockMasteryCriterionService: any;
  let mockMasteryCalculationService: any;
  let mockMasteryTrackingService: any;

  beforeEach(async () => {
    // Reset mocks and modules
    jest.clearAllMocks();
    jest.resetModules();
    
    // Create mock services
    mockMasteryCriterionService = {
      createCriterion: jest.fn(),
      getCriterion: jest.fn(),
      updateCriterion: jest.fn(),
      deleteCriterion: jest.fn(),
      getCriteriaBySection: jest.fn(),
      getCriteriaByStage: jest.fn(),
      updateMasteryProgress: jest.fn(),
      calculateMasteryProgress: jest.fn(),
      getSectionUueProgress: jest.fn(),
      getUserMasteryStats: jest.fn(),
      getCriteriaByUueStage: jest.fn(),
      processCriterionReview: jest.fn(),
      calculateCriterionMastery: jest.fn()
    };

    mockMasteryTrackingService = {
      updateMasteryScore: jest.fn(),
      getMasteryProgress: jest.fn(),
      updateMasteryThreshold: jest.fn(),
      getUueStageProgress: jest.fn(),
      getMasteryStats: jest.fn()
    };

    mockMasteryCalculationService = {
      calculateCriterionMasteryScore: jest.fn(),
      calculateUueStageMastery: jest.fn()
    };

    // Apply mocks to the service modules
    const { masteryCriterionService } = require('../../../services/masteryCriterion.service');
    Object.assign(masteryCriterionService, mockMasteryCriterionService);

    const { getMasteryStats, updateMasteryScore } = require('../../../services/masteryTracking.service');
    jest.mock('../../../services/masteryTracking.service', () => ({
      getMasteryStats: jest.fn(),
      updateMasteryScore: jest.fn()
    }));

    const { MasteryCalculationService } = require('../../../services/masteryCalculation.service');
    const mockCalculationInstance = new MasteryCalculationService();
    Object.assign(mockCalculationInstance, mockMasteryCalculationService);
    MasteryCalculationService.mockImplementation(() => mockCalculationInstance);

    // Import the controller after mocking
    const { MasteryCriterionController: ControllerClass } = await import('../masteryCriterion.controller');
    controller = new ControllerClass();

    // Set up mock request and response
    mockRequest = {
      user: { userId: 123 },
      body: {},
      params: {},
      query: {}
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };
  });

  describe('createCriterion', () => {
    it('should create a mastery criterion successfully', async () => {
      const criterionData = {
        blueprintSectionId: '123', // Use numeric string
        uueStage: 'UNDERSTAND',
        weight: 1.0,
        masteryThreshold: 0.8,
        description: 'Test criterion',
        questionTypes: ['MULTIPLE_CHOICE']
      };

      mockRequest.body = criterionData;

      const mockCriterion = {
        id: 'criterion_123',
        ...criterionData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockMasteryCriterionService.createCriterion.mockResolvedValue(mockCriterion);

      await controller.createCriterion(mockRequest as Request, mockResponse as Response);

      expect(mockMasteryCriterionService.createCriterion).toHaveBeenCalledWith({
        title: 'Test criterion',
        description: 'Test criterion',
        weight: 1,
        uueStage: 'UNDERSTAND',
        masteryThreshold: 0.8,
        knowledgePrimitiveId: expect.stringMatching(/primitive_\d+/),
        blueprintSectionId: 123, // Expect parsed number
        userId: 123,
        questionTypes: ['MULTIPLE_CHOICE']
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCriterion
      });
    });

    it('should handle missing required fields', async () => {
      mockRequest.body = { uueStage: 'UNDERSTAND' };

      await controller.createCriterion(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields: blueprintSectionId, uueStage, description'
      });
    });

    it('should use default values for optional fields', async () => {
      const criterionData = {
        blueprintSectionId: '123', // Use numeric string
        uueStage: 'UNDERSTAND',
        description: 'Test criterion'
      };

      mockRequest.body = criterionData;

      const mockCriterion = {
        id: 'criterion_123',
        ...criterionData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockMasteryCriterionService.createCriterion.mockResolvedValue(mockCriterion);

      await controller.createCriterion(mockRequest as Request, mockResponse as Response);

      expect(mockMasteryCriterionService.createCriterion).toHaveBeenCalledWith({
        title: 'Test criterion',
        description: 'Test criterion',
        weight: 1.0,
        uueStage: 'UNDERSTAND',
        masteryThreshold: 0.8,
        knowledgePrimitiveId: expect.stringMatching(/primitive_\d+/),
        blueprintSectionId: 123, // Expect parsed number
        userId: 123,
        questionTypes: ['multiple-choice'] // Default value
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCriterion
      });
    });
  });

  describe('getCriterion', () => {
    it('should return a mastery criterion successfully', async () => {
      const mockCriterion = {
        id: 'criterion_123',
        title: 'Test Criterion',
        description: 'Test description',
        weight: 1.0,
        uueStage: 'UNDERSTAND',
        masteryThreshold: 0.8,
        knowledgePrimitiveId: 'primitive-1',
        blueprintSectionId: 1,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.params = { id: '123' }; // Use numeric string
      mockMasteryCriterionService.getCriterion.mockResolvedValue(mockCriterion);

      await controller.getCriterion(mockRequest as Request, mockResponse as Response);

      expect(mockMasteryCriterionService.getCriterion).toHaveBeenCalledWith(123); // Controller parses string to number
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCriterion
      });
    });

    it('should handle missing criterion ID', async () => {
      mockRequest.params = {};

      await controller.getCriterion(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Criterion ID is required'
      });
    });

    it('should handle criterion not found', async () => {
      mockRequest.params = { id: 'criterion_123' };
      mockMasteryCriterionService.getCriterion.mockResolvedValue(null);

      await controller.getCriterion(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Criterion not found'
      });
    });
  });

  describe('updateCriterion', () => {
    it('should update a mastery criterion successfully', async () => {
      const updateData = { title: 'Updated Criterion', weight: 2 };
      const updatedCriterion = {
        id: 'criterion_123',
        title: 'Updated Criterion',
        weight: 2,
        uueStage: 'UNDERSTAND',
        masteryThreshold: 0.8,
        knowledgePrimitiveId: 'primitive-1',
        blueprintSectionId: 1,
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.params = { id: '123' }; // Use numeric string
      mockRequest.body = updateData;
      mockMasteryCriterionService.updateCriterion.mockResolvedValue(updatedCriterion);

      await controller.updateCriterion(mockRequest as Request, mockResponse as Response);

      expect(mockMasteryCriterionService.updateCriterion).toHaveBeenCalledWith(123, updateData); // Controller parses string to number
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: updatedCriterion
      });
    });

    it('should handle missing criterion ID', async () => {
      mockRequest.params = {};

      await controller.updateCriterion(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Criterion ID is required'
      });
    });
  });

  describe('deleteCriterion', () => {
    it('should delete a mastery criterion successfully', async () => {
      mockRequest.params = { id: '123' }; // Use numeric string
      mockMasteryCriterionService.deleteCriterion.mockResolvedValue(undefined);

      await controller.deleteCriterion(mockRequest as Request, mockResponse as Response);

      expect(mockMasteryCriterionService.deleteCriterion).toHaveBeenCalledWith(123); // Controller parses string to number
      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it('should handle missing criterion ID', async () => {
      mockRequest.params = {};

      await controller.deleteCriterion(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Criterion ID is required'
      });
    });
  });

  describe('getCriteriaBySection', () => {
    it('should return criteria for a section successfully', async () => {
      const mockCriteria = [
        { id: 1, title: 'Criterion 1', uueStage: 'UNDERSTAND' },
        { id: 2, title: 'Criterion 2', uueStage: 'USE' }
      ];

      mockRequest.params = { sectionId: '123' };
      mockMasteryCriterionService.getCriteriaByUueStage.mockResolvedValue(mockCriteria);

      await controller.getCriteriaBySection(mockRequest as Request, mockResponse as Response);

      expect(mockMasteryCriterionService.getCriteriaByUueStage).toHaveBeenCalledWith(123, 'UNDERSTAND');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCriteria
      });
    });

    it('should handle missing section ID', async () => {
      mockRequest.params = {};

      await controller.getCriteriaBySection(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Section ID is required'
      });
    });
  });

  describe('getCriteriaByUueStage', () => {
    it('should return criteria for UNDERSTAND stage', async () => {
      const mockCriteria = [
        { id: 1, title: 'Criterion 1', uueStage: 'UNDERSTAND' },
        { id: 2, title: 'Criterion 2', uueStage: 'UNDERSTAND' }
      ];

      mockRequest.params = { stage: 'UNDERSTAND' };
      mockMasteryCriterionService.getCriteriaByUueStage.mockResolvedValue(mockCriteria);

      await controller.getCriteriaByUueStage(mockRequest as Request, mockResponse as Response);

      expect(mockMasteryCriterionService.getCriteriaByUueStage).toHaveBeenCalledWith(1, 'UNDERSTAND');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCriteria
      });
    });

    it('should return criteria for USE stage', async () => {
      const mockCriteria = [
        { id: 3, title: 'Criterion 3', uueStage: 'USE' }
      ];

      mockRequest.params = { stage: 'USE' };
      mockMasteryCriterionService.getCriteriaByUueStage.mockResolvedValue(mockCriteria);

      await controller.getCriteriaByUueStage(mockRequest as Request, mockResponse as Response);

      expect(mockMasteryCriterionService.getCriteriaByUueStage).toHaveBeenCalledWith(1, 'USE');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCriteria
      });
    });

    it('should return criteria for EXPLORE stage', async () => {
      const mockCriteria = [
        { id: 4, title: 'Criterion 4', uueStage: 'EXPLORE' }
      ];

      mockRequest.params = { stage: 'EXPLORE' };
      mockMasteryCriterionService.getCriteriaByUueStage.mockResolvedValue(mockCriteria);

      await controller.getCriteriaByUueStage(mockRequest as Request, mockResponse as Response);

      expect(mockMasteryCriterionService.getCriteriaByUueStage).toHaveBeenCalledWith(1, 'EXPLORE');
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCriteria
      });
    });

    it('should handle missing stage parameter', async () => {
      mockRequest.params = {};

      await controller.getCriteriaByUueStage(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'UUE stage is required'
      });
    });

    it('should handle invalid stage value', async () => {
      mockRequest.params = { stage: 'INVALID' };

      await controller.getCriteriaByUueStage(mockRequest as Request, mockResponse as Response);

      // Controller doesn't validate stage values, it just passes them through
      expect(mockMasteryCriterionService.getCriteriaByUueStage).toHaveBeenCalledWith(1, 'INVALID');
    });
  });

  describe('processCriterionReview', () => {
    it('should process a criterion review successfully', async () => {
      const mockResult = {
        success: true,
        newMasteryScore: 0.9,
        isMastered: false,
        attempts: 1,
        message: 'Progress recorded'
      };

      mockRequest.body = {
        criterionId: '123', // Use numeric string
        isCorrect: true,
        confidence: 0.9
      };
      mockMasteryCriterionService.processCriterionReview.mockResolvedValue(mockResult);

      await controller.processCriterionReview(mockRequest as Request, mockResponse as Response);

      expect(mockMasteryCriterionService.processCriterionReview).toHaveBeenCalledWith(
        123, // userId
        123, // criterionId (controller parses string to number)
        true, // isCorrect
        1, // performance (controller converts confidence to 1 for correct answers)
        { allowRetrySameDay: true } // options
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should handle missing required fields', async () => {
      mockRequest.body = { isCorrect: true };

      await controller.processCriterionReview(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields: criterionId, isCorrect'
      });
    });
  });

  describe('getCriterionMasteryProgress', () => {
    it('should return mastery progress successfully', async () => {
      const mockProgress = {
        masteryScore: 0.8,
        isMastered: false,
        attempts: 3
      };

      mockRequest.params = { criterionId: '123' }; // Use numeric string
      mockMasteryCriterionService.calculateCriterionMastery.mockResolvedValue(mockProgress);

      await controller.getCriterionMasteryProgress(mockRequest as Request, mockResponse as Response);

      expect(mockMasteryCriterionService.calculateCriterionMastery).toHaveBeenCalledWith(123, 123); // criterionId, userId
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockProgress // Controller returns the progress object directly
      });
    });

    it('should handle mastery progress not found', async () => {
      mockRequest.params = { criterionId: '123' }; // Use numeric string
      mockMasteryCriterionService.calculateCriterionMastery.mockResolvedValue(null);

      await controller.getCriterionMasteryProgress(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Mastery progress not found'
      });
    });
  });

  describe('updateMasteryThreshold', () => {
    it('should update mastery threshold successfully', async () => {
      const mockResult = {
        success: true,
        newThreshold: 'EXPERT'
      };

      mockRequest.params = { criterionId: '123' }; // Use numeric string
      mockRequest.body = { newThreshold: 'EXPERT' };
      mockMasteryCriterionService.processCriterionReview.mockResolvedValue(mockResult);

      await controller.updateMasteryThreshold(mockRequest as Request, mockResponse as Response);

      expect(mockMasteryCriterionService.processCriterionReview).toHaveBeenCalledWith(
        123, // userId
        123, // criterionId (controller parses string to number)
        false, // isCorrect
        0.0, // performance
        { customThreshold: 'EXPERT' } // options
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockResult
      });
    });

    it('should handle missing parameters', async () => {
      mockRequest.params = { criterionId: '123' }; // Use numeric string

      await controller.updateMasteryThreshold(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields: criterionId, newThreshold'
      });
    });

    it('should handle invalid threshold value', async () => {
      mockRequest.params = { criterionId: '123' }; // Use numeric string
      mockRequest.body = { newThreshold: 'INVALID' };

      // Mock the service to throw an error for invalid threshold
      mockMasteryCriterionService.processCriterionReview.mockRejectedValue(new Error('Invalid threshold value'));

      await controller.updateMasteryThreshold(mockRequest as Request, mockResponse as Response);

      // Controller should call the service and then handle the error
      expect(mockMasteryCriterionService.processCriterionReview).toHaveBeenCalledWith(
        123, // userId
        123, // criterionId (controller parses string to number)
        false, // isCorrect
        0.0, // performance
        { customThreshold: 'INVALID' } // options
      );
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to update mastery threshold'
      });
    });
  });

  describe('getSectionUueProgress', () => {
    it('should return UUE stage progress successfully', async () => {
      const mockCriteria = [
        { id: 1, title: 'Criterion 1', uueStage: 'UNDERSTAND' },
        { id: 2, title: 'Criterion 2', uueStage: 'UNDERSTAND' },
        { id: 3, title: 'Criterion 3', uueStage: 'USE' },
        { id: 4, title: 'Criterion 4', uueStage: 'EXPLORE' }
      ];

      // Ensure the mock is properly set up
      mockMasteryCriterionService.getCriteriaByUueStage.mockClear();
      
      // Mock the service method that the controller actually calls
      mockMasteryCriterionService.getCriteriaByUueStage
        .mockResolvedValueOnce([mockCriteria[0], mockCriteria[1]]) // UNDERSTAND
        .mockResolvedValueOnce([mockCriteria[2]]) // USE
        .mockResolvedValueOnce([mockCriteria[3]]); // EXPLORE

      // Set up the request with the correct parameters
      mockRequest.params = { sectionId: '123' };
      mockRequest.user = { userId: 123 };

      await controller.getSectionUueProgress(mockRequest as Request, mockResponse as Response);

      // Verify the controller calls the service method correctly
      expect(mockMasteryCriterionService.getCriteriaByUueStage).toHaveBeenCalledWith(123, 'UNDERSTAND');
      expect(mockMasteryCriterionService.getCriteriaByUueStage).toHaveBeenCalledWith(123, 'USE');
      expect(mockMasteryCriterionService.getCriteriaByUueStage).toHaveBeenCalledWith(123, 'EXPLORE');
      
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          understand: { total: 2, mastered: 0, progress: 0 },
          use: { total: 1, mastered: 0, progress: 0 },
          explore: { total: 1, mastered: 0, progress: 0 }
        }
      });
    });

    it('should handle unauthenticated user', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { sectionId: 'section_123' };

      await controller.getSectionUueProgress(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not authenticated'
      });
    });
  });

  describe('getUserMasteryStats', () => {
    it('should return user mastery stats successfully', async () => {
      const mockCriteria = [
        { id: 1, title: 'Criterion 1', uueStage: 'UNDERSTAND' },
        { id: 2, title: 'Criterion 2', uueStage: 'UNDERSTAND' },
        { id: 3, title: 'Criterion 3', uueStage: 'USE' },
        { id: 4, title: 'Criterion 4', uueStage: 'EXPLORE' }
      ];

      // Mock the service method that the controller actually calls
      mockMasteryCriterionService.getCriteriaByUueStage
        .mockResolvedValueOnce([mockCriteria[0], mockCriteria[1]]) // UNDERSTAND
        .mockResolvedValueOnce([mockCriteria[2]]) // USE
        .mockResolvedValueOnce([mockCriteria[3]]); // EXPLORE

      await controller.getUserMasteryStats(mockRequest as Request, mockResponse as Response);

      // Verify the controller calls the service method correctly
      expect(mockMasteryCriterionService.getCriteriaByUueStage).toHaveBeenCalledWith(1, 'UNDERSTAND');
      expect(mockMasteryCriterionService.getCriteriaByUueStage).toHaveBeenCalledWith(1, 'USE');
      expect(mockMasteryCriterionService.getCriteriaByUueStage).toHaveBeenCalledWith(1, 'EXPLORE');
      
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalCriteria: 4,
          masteredCriteria: 0,
          averageMasteryScore: 0,
          stageBreakdown: {
            understand: 2,
            use: 1,
            explore: 1
          }
        }
      });
    });

    it('should handle unauthenticated user', async () => {
      mockRequest.user = undefined;

      await controller.getUserMasteryStats(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'User not authenticated'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors consistently', async () => {
      const error = new Error('Database connection failed');
      mockMasteryCriterionService.createCriterion.mockRejectedValue(error);

      mockRequest.body = {
        blueprintSectionId: 'section_123',
        uueStage: 'UNDERSTAND',
        description: 'Test criterion'
      };

      await controller.createCriterion(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to create mastery criterion'
      });
    });

    it('should log errors for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Service error');
      mockMasteryCriterionService.createCriterion.mockRejectedValue(error);

      mockRequest.body = {
        blueprintSectionId: 'section_123',
        uueStage: 'UNDERSTAND',
        description: 'Test criterion'
      };

      await controller.createCriterion(mockRequest as Request, mockResponse as Response);

      expect(consoleSpy).toHaveBeenCalledWith('Error creating mastery criterion:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('Input Validation', () => {
    it('should validate user authentication on all protected endpoints', async () => {
      const endpoints = [
        () => controller.processCriterionReview(mockRequest as Request, mockResponse as Response),
        () => controller.getCriterionMasteryProgress(mockRequest as Request, mockResponse as Response),
        () => controller.updateMasteryThreshold(mockRequest as Request, mockResponse as Response),
        () => controller.getSectionUueProgress(mockRequest as Request, mockResponse as Response),
        () => controller.getUserMasteryStats(mockRequest as Request, mockResponse as Response)
      ];

      mockRequest.user = undefined;

      for (const endpoint of endpoints) {
        await endpoint();
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ error: 'User not authenticated' });
      }
    });

    it('should validate required fields on all endpoints', async () => {
      // Test createCriterion validation
      mockRequest.body = {};
      await controller.createCriterion(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);

      // Test processCriterionReview validation
      mockRequest.params = { id: 'criterion_123' };
      mockRequest.body = {};
      await controller.processCriterionReview(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);

      // Test updateMasteryThreshold validation
      mockRequest.params = {};
      mockRequest.body = {};
      await controller.updateMasteryThreshold(mockRequest as Request, mockResponse as Response);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });
});
