import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../../middleware/auth.middleware';

// Mock the service
jest.mock('../../../services/enhancedTodaysTasks.service', () => ({
  EnhancedTodaysTasksService: jest.fn().mockImplementation(() => ({
    generateTodaysTasksForUser: jest.fn(),
    getUserCapacityAnalysis: jest.fn(),
    completeTask: jest.fn(),
    getTodaysTaskProgress: jest.fn(),
    reprioritizeTasks: jest.fn(),
    getPersonalizedRecommendations: jest.fn(),
    getTaskAnalytics: jest.fn(),
    skipTask: jest.fn(),
    getUpcomingTasks: jest.fn(),
    batchCompleteTasks: jest.fn(),
    getCompletionStreak: jest.fn()
  }))
}));

// Import after mocking
let EnhancedTodaysTasksController: any;

describe('EnhancedTodaysTasksController', () => {
  let controller: any;
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let mockEnhancedTodaysTasksService: any;

  beforeEach(async () => {
    // Reset mocks and modules
    jest.clearAllMocks();
    jest.resetModules();
    
    // Create mock service
    mockEnhancedTodaysTasksService = {
      generateTodaysTasksForUser: jest.fn(),
      getUserCapacityAnalysis: jest.fn(),
      completeTask: jest.fn(),
      getTodaysTaskProgress: jest.fn(),
      reprioritizeTasks: jest.fn(),
      getPersonalizedRecommendations: jest.fn(),
      getTaskAnalytics: jest.fn(),
      skipTask: jest.fn(),
      getUpcomingTasks: jest.fn(),
      batchCompleteTasks: jest.fn(),
      getCompletionStreak: jest.fn(),
      prioritizeTasks: jest.fn(),
      getTaskProgress: jest.fn(),
      getTaskRecommendations: jest.fn()
    } as any;

    // Replace the mocked service methods with our mock implementations
    const { EnhancedTodaysTasksService } = require('../../../services/enhancedTodaysTasks.service');
    EnhancedTodaysTasksService.mockImplementation(() => mockEnhancedTodaysTasksService);

    // Import the controller after mocking
    const { EnhancedTodaysTasksController: ControllerClass } = await import('../enhancedTodaysTasks.controller');
    EnhancedTodaysTasksController = ControllerClass;
    
    // Create controller instance
    controller = new EnhancedTodaysTasksController();

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

    // Setup mock next function
    mockNext = jest.fn();
  });

  describe('getTodaysTasks', () => {
    it('should generate today\'s tasks successfully', async () => {
      const mockTodaysTasks = {
        critical: { tasks: [{ id: 'task1', title: 'Critical Task 1' }], count: 1 },
        core: { tasks: [{ id: 'task2', title: 'Core Task 1' }], count: 1 },
        plus: { tasks: [{ id: 'task3', title: 'Plus Task 1' }], count: 1 },
        totalTasks: 3,
        capacityAnalysis: { totalCapacity: 120, usedCapacity: 60, remainingCapacity: 60 },
        recommendations: ['Focus on critical tasks first'],
        estimatedTime: 60
      };

      mockEnhancedTodaysTasksService.generateTodaysTasksForUser.mockResolvedValue(mockTodaysTasks);

      await controller.getTodaysTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockEnhancedTodaysTasksService.generateTodaysTasksForUser).toHaveBeenCalledWith(123);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          tasks: [
            { id: 'task1', title: 'Critical Task 1', bucket: 'critical' },
            { id: 'task2', title: 'Core Task 1', bucket: 'core' },
            { id: 'task3', title: 'Plus Task 1', bucket: 'plus' }
          ],
          totalTasks: 3,
          bucketDistribution: { critical: 1, core: 1, plus: 1 },
          capacityAnalysis: mockTodaysTasks.capacityAnalysis,
          recommendations: mockTodaysTasks.recommendations,
          estimatedTime: 60,
          generatedAt: expect.any(String)
        }
      });
    });

    it('should handle unauthenticated user', async () => {
      mockRequest.user = undefined;

      await controller.getTodaysTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated or user ID is missing/invalid.' });
    });

    it('should handle invalid user ID', async () => {
      mockRequest.user = { userId: 'invalid' as any };

      await controller.getTodaysTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated or user ID is missing/invalid.' });
    });

    it('should handle mock today date parameter', async () => {
      const mockDate = '2024-01-01';
      mockRequest.query = { mockToday: mockDate };

      const mockTodaysTasks = {
        critical: { tasks: [], count: 0 },
        core: { tasks: [], count: 0 },
        plus: { tasks: [], count: 0 },
        totalTasks: 0,
        capacityAnalysis: { totalCapacity: 120, usedCapacity: 0, remainingCapacity: 120 },
        recommendations: [],
        estimatedTime: 0
      };

      mockEnhancedTodaysTasksService.generateTodaysTasksForUser.mockResolvedValue(mockTodaysTasks);

      await controller.getTodaysTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockEnhancedTodaysTasksService.generateTodaysTasksForUser).toHaveBeenCalledWith(123);
    });

    it('should handle invalid mock today date parameter', async () => {
      mockRequest.query = { mockToday: 'invalid-date' };

      const mockTodaysTasks = {
        critical: { tasks: [], count: 0 },
        core: { tasks: [], count: 0 },
        plus: { tasks: [], count: 0 },
        totalTasks: 0,
        capacityAnalysis: { totalCapacity: 120, usedCapacity: 0, remainingCapacity: 120 },
        recommendations: [],
        estimatedTime: 0
      };

      mockEnhancedTodaysTasksService.generateTodaysTasksForUser.mockResolvedValue(mockTodaysTasks);

      await controller.getTodaysTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockEnhancedTodaysTasksService.generateTodaysTasksForUser).toHaveBeenCalledWith(123);
    });

    it('should handle service errors gracefully', async () => {
      mockEnhancedTodaysTasksService.generateTodaysTasksForUser.mockRejectedValue(new Error('Service error'));

      await controller.getTodaysTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        success: false, 
        error: 'Failed to retrieve daily tasks', 
        details: 'Service error' 
      });
    });
  });

  describe('getCapacityAnalysis', () => {
    it('should return capacity analysis successfully', async () => {
      const mockCapacityAnalysis = {
        userCapacity: 120,
        usedCapacity: 60,
        remainingCapacity: 60,
        capacityUtilization: 50,
        criticalOverflow: 0,
        coreOverflow: 0,
        plusOverflow: 0
      };

      mockEnhancedTodaysTasksService.getUserCapacityAnalysis.mockResolvedValue(mockCapacityAnalysis);

      await controller.getCapacityAnalysis(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockEnhancedTodaysTasksService.getUserCapacityAnalysis).toHaveBeenCalledWith(123);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: 123,
          capacityAnalysis: mockCapacityAnalysis,
          generatedAt: expect.any(String)
        }
      });
    });

    it('should handle unauthenticated user', async () => {
      mockRequest.user = undefined;

      await controller.getCapacityAnalysis(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated or user ID is missing/invalid.' });
    });
  });

  describe('prioritizeTasks', () => {
    it('should prioritize tasks successfully', async () => {
      const mockPrioritizedTasks = [
        { id: 'task_1', title: 'High Priority Task', priority: 1 },
        { id: 'task_2', title: 'Medium Priority Task', priority: 2 }
      ];

      mockRequest.body = { 
        priorityOrder: ['task_1', 'task_2'],
        focusAreas: ['core'],
        timeConstraints: { maxTime: 120 }
      };

      mockEnhancedTodaysTasksService.reprioritizeTasks.mockResolvedValue(mockPrioritizedTasks);

      await controller.prioritizeTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: 123,
          reprioritizedTasks: mockPrioritizedTasks,
          prioritizedAt: expect.any(String)
        }
      });
    });

    it('should handle missing priorityOrder parameter', async () => {
      mockRequest.body = { focusAreas: ['core'] };

      await controller.prioritizeTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Priority order array is required.' 
      });
    });

    it('should handle invalid priorityOrder parameter', async () => {
      mockRequest.body = { priorityOrder: 'invalid' };

      await controller.prioritizeTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'Priority order array is required.' 
      });
    });

    it('should use default values for optional parameters', async () => {
      mockRequest.body = { priorityOrder: ['task_1'] };

      const mockDefaultTasks = [
        { id: 'task_1', title: 'Default Task', priority: 1 }
      ];

      mockEnhancedTodaysTasksService.reprioritizeTasks.mockResolvedValue(mockDefaultTasks);

      await controller.prioritizeTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: 123,
          reprioritizedTasks: mockDefaultTasks,
          prioritizedAt: expect.any(String)
        }
      });
    });
  });

  describe('getTaskProgress', () => {
    it('should return task progress successfully', async () => {
      const mockProgress = {
        completed: 5,
        total: 10,
        progress: 0.5,
        remaining: 5
      };

      mockEnhancedTodaysTasksService.getTodaysTaskProgress.mockResolvedValue(mockProgress);

      await controller.getTaskProgress(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: 123,
          progress: mockProgress,
          generatedAt: expect.any(String)
        }
      });
    });

    it('should handle unauthenticated user', async () => {
      mockRequest.user = undefined;

      await controller.getTaskProgress(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'User not authenticated or user ID is missing/invalid.' 
      });
    });
  });

  describe('getTaskRecommendations', () => {
    it('should return task recommendations successfully', async () => {
      const mockRecommendations = [
        { id: 'task_1', title: 'Recommended Task 1', priority: 'HIGH' },
        { id: 'task_2', title: 'Recommended Task 2', priority: 'MEDIUM' }
      ];

      mockRequest.query = { 
        focus: 'weakest',
        difficulty: 'MEDIUM',
        timeAvailable: '60'
      };

      mockEnhancedTodaysTasksService.getPersonalizedRecommendations.mockResolvedValue(mockRecommendations);

      await controller.getTaskRecommendations(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: 123,
          recommendations: mockRecommendations,
          filters: {
            focus: 'weakest',
            difficulty: 'MEDIUM',
            timeAvailable: 60
          },
          generatedAt: expect.any(String)
        }
      });
    });

    it('should handle unauthenticated user', async () => {
      mockRequest.user = undefined;

      await controller.getTaskRecommendations(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        message: 'User not authenticated or user ID is missing/invalid.' 
      });
    });

    it('should use default values for optional parameters', async () => {
      mockRequest.query = {};

      const mockDefaultRecommendations = [
        { id: 'task_1', title: 'Default Task', priority: 'MEDIUM' }
      ];

      mockEnhancedTodaysTasksService.getPersonalizedRecommendations.mockResolvedValue(mockDefaultRecommendations);

      await controller.getTaskRecommendations(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: 123,
          recommendations: mockDefaultRecommendations,
          filters: {
            focus: 'all',
            difficulty: 'all',
            timeAvailable: 'unlimited'
          },
          generatedAt: expect.any(String)
        }
      });
    });
  });

  describe('completeTask', () => {
    it('should complete a task successfully', async () => {
      mockRequest.params = { taskId: 'task_123' };
      mockRequest.body = {
        completionTime: new Date('2024-01-01T10:00:00.000Z'),
        performance: 0.9,
        notes: 'Completed successfully'
      };

      const mockCompletionResult = {
        taskId: 'task_123',
        completed: true,
        performance: 0.9,
        nextReviewDate: new Date('2024-01-02T10:00:00.000Z'),
        masteryGain: 0.135
      };

      mockEnhancedTodaysTasksService.completeTask.mockResolvedValue(mockCompletionResult);

      await controller.completeTask(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockEnhancedTodaysTasksService.completeTask).toHaveBeenCalledWith(123, 'task_123', {
        completionTime: new Date('2024-01-01T10:00:00.000Z'),
        performance: 0.9,
        notes: 'Completed successfully'
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          taskId: 'task_123',
          completedAt: expect.any(String),
          completionResult: mockCompletionResult
        }
      });
    });

    it('should use current time when completionTime not provided', async () => {
      mockRequest.params = { taskId: 'task_123' };
      mockRequest.body = {};

      const mockCompletedTask = {
        id: 'task_123',
        completedAt: new Date(),
        status: 'COMPLETED'
      };

      mockEnhancedTodaysTasksService.completeTask.mockResolvedValue(mockCompletedTask);

      await controller.completeTask(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          taskId: 'task_123',
          completionResult: mockCompletedTask,
          completedAt: expect.any(String)
        }
      });
    });

    it('should handle missing taskId parameter', async () => {
      mockRequest.body = {};

      await controller.completeTask(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Task ID is required.' });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors consistently', async () => {
      const error = new Error('Database connection failed');
      mockEnhancedTodaysTasksService.generateTodaysTasksForUser.mockRejectedValue(error);

      await controller.getTodaysTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ 
        success: false, 
        error: 'Failed to retrieve daily tasks', 
        details: 'Database connection failed' 
      });
    });

    it('should log errors for debugging', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Service error');
      mockEnhancedTodaysTasksService.generateTodaysTasksForUser.mockRejectedValue(error);

      await controller.getTodaysTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      expect(consoleSpy).toHaveBeenCalledWith('Error in getTodaysTasks:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('Input Validation', () => {
    it('should validate user authentication on all protected endpoints', async () => {
      const endpoints = [
        () => controller.getTodaysTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext),
        () => controller.getCapacityAnalysis(mockRequest as AuthRequest, mockResponse as Response, mockNext),
        () => controller.prioritizeTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext),
        () => controller.getTaskProgress(mockRequest as AuthRequest, mockResponse as Response, mockNext),
        () => controller.getTaskRecommendations(mockRequest as AuthRequest, mockResponse as Response, mockNext),
        () => controller.completeTask(mockRequest as AuthRequest, mockResponse as Response, mockNext)
      ];

      mockRequest.user = undefined;

      for (const endpoint of endpoints) {
        await endpoint();
        expect(mockResponse.status).toHaveBeenCalledWith(401);
        expect(mockResponse.json).toHaveBeenCalledWith({ message: 'User not authenticated or user ID is missing/invalid.' });
      }
    });

    it('should validate required fields on all endpoints', async () => {
      // Test prioritizeTasks validation - missing priorityOrder
      mockRequest.body = {};
      await controller.prioritizeTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(400);

      // Test completeTask validation - missing taskId in params
      mockRequest.params = {};
      mockRequest.body = {};
      await controller.completeTask(mockRequest as AuthRequest, mockResponse as Response, mockNext);
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Response Format Consistency', () => {
    it('should maintain consistent success response format', async () => {
      const mockTodaysTasks = {
        critical: { tasks: [], count: 0 },
        core: { tasks: [], count: 0 },
        plus: { tasks: [], count: 0 },
        totalTasks: 0,
        capacityAnalysis: { totalCapacity: 120, usedCapacity: 0, remainingCapacity: 120 },
        recommendations: [],
        estimatedTime: 0
      };

      mockEnhancedTodaysTasksService.generateTodaysTasksForUser.mockResolvedValue(mockTodaysTasks);

      await controller.getTodaysTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('data');
      expect(response.data).toHaveProperty('tasks');
      expect(response.data).toHaveProperty('totalTasks');
      expect(response.data).toHaveProperty('bucketDistribution');
      expect(response.data).toHaveProperty('capacityAnalysis');
      expect(response.data).toHaveProperty('recommendations');
      expect(response.data).toHaveProperty('estimatedTime');
      expect(response.data).toHaveProperty('generatedAt');
    });

    it('should maintain consistent error response format', async () => {
      mockRequest.user = undefined;

      await controller.getTodaysTasks(mockRequest as AuthRequest, mockResponse as Response, mockNext);

      const response = (mockResponse.json as jest.Mock).mock.calls[0][0];
      expect(response).toHaveProperty('message');
      expect(typeof response.message).toBe('string');
    });
  });
});
