import { Request, Response } from 'express';
import { QuestionInstanceController } from '../questionInstance.controller';

// Mock the services
jest.mock('../../../services/questionInstance.service', () => ({
  questionInstanceService: {
    createQuestionInstance: jest.fn(),
    getQuestionInstance: jest.fn(),
    updateQuestionInstance: jest.fn(),
    deleteQuestionInstance: jest.fn(),
    getQuestionsByCriterion: jest.fn(),
    getUserQuestionStats: jest.fn(),
    recordQuestionAttempt: jest.fn(),
    searchQuestionInstances: jest.fn(),
    getQuestionRecommendations: jest.fn(),
    recordBatchAttempts: jest.fn()
  }
}));

// Mock the mastery tracking service
jest.mock('../../../services/masteryTracking.service', () => ({
  MasteryTrackingService: jest.fn().mockImplementation(() => ({
    updateMasteryScore: jest.fn(),
    getMasteryProgress: jest.fn()
  }))
}));

describe('QuestionInstanceController', () => {
  let controller: QuestionInstanceController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockQuestionInstanceService: any;
  let mockMasteryTrackingService: any;

  beforeEach(async () => {
    // Reset mocks and modules
    jest.clearAllMocks();
    jest.resetModules();
    
    // Create mock services
    mockQuestionInstanceService = {
      createQuestionInstance: jest.fn(),
      getQuestionInstance: jest.fn(),
      updateQuestionInstance: jest.fn(),
      deleteQuestionInstance: jest.fn(),
      getQuestionsByCriterion: jest.fn(),
      getUserQuestionStats: jest.fn(),
      recordQuestionAttempt: jest.fn(),
      searchQuestionInstances: jest.fn(),
      getQuestionRecommendations: jest.fn(),
      recordBatchAttempts: jest.fn()
    } as any;

    mockMasteryTrackingService = {
      updateMasteryScore: jest.fn(),
      getMasteryProgress: jest.fn()
    } as any;

    // Replace the mocked service methods with our mock implementations
    const { questionInstanceService } = require('../../../services/questionInstance.service');
    Object.assign(questionInstanceService, mockQuestionInstanceService);

    const { MasteryTrackingService } = require('../../../services/masteryTracking.service');
    MasteryTrackingService.mockImplementation(() => mockMasteryTrackingService);

    // Import the controller after mocking
    const { QuestionInstanceController: ControllerClass } = await import('../questionInstance.controller');
    
    // Create controller instance
    controller = new ControllerClass();

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

  describe('createQuestionInstance', () => {
    it('should create a question instance successfully', async () => {
      const mockQuestionData = {
        questionText: 'What is the derivative of x²?',
        answer: '2x',
        explanation: 'Using the power rule',
        masteryCriterionId: '123',
        difficulty: 'MEDIUM',
        context: 'Calculus basics'
      };

      const mockCreatedQuestion = {
        id: 123,
        questionText: 'What is the derivative of x²?',
        answer: '2x',
        explanation: 'Using the power rule',
        context: 'Calculus basics',
        difficulty: 'MEDIUM',
        masteryCriterionId: 123,
        userId: 123,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = mockQuestionData;
      mockQuestionInstanceService.createQuestionInstance.mockResolvedValue(mockCreatedQuestion);

      await controller.createQuestionInstance(mockRequest as Request, mockResponse as Response);

      expect(mockQuestionInstanceService.createQuestionInstance).toHaveBeenCalledWith({
        questionText: 'What is the derivative of x²?',
        answer: '2x',
        explanation: 'Using the power rule',
        masteryCriterionId: 123,
        difficulty: 'MEDIUM',
        context: 'Calculus basics',
        userId: 123
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedQuestion
      });
    });

    it('should handle missing required fields', async () => {
      mockRequest.body = { questionText: 'Test Question' };

      await controller.createQuestionInstance(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields: questionText, answer, masteryCriterionId'
      });
    });

    it('should validate difficulty', async () => {
      mockRequest.body = {
        questionText: 'Test Question',
        answer: 'Test Answer',
        masteryCriterionId: 'criterion_123',
        difficulty: 'INVALID_DIFFICULTY'
      };

      await controller.createQuestionInstance(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid difficulty. Must be one of: EASY, MEDIUM, HARD'
      });
    });
  });

  describe('getQuestionInstance', () => {
    it('should return a question instance successfully', async () => {
      const mockQuestion = {
        id: 123,
        questionText: 'What is the derivative of x²?',
        answer: '2x',
        explanation: 'Using the power rule',
        difficulty: 'MEDIUM',
        masteryCriterionId: 123,
        userId: 123,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.params = { id: '123' };
      mockQuestionInstanceService.getQuestionInstance.mockResolvedValue(mockQuestion);

      await controller.getQuestionInstance(mockRequest as Request, mockResponse as Response);

      expect(mockQuestionInstanceService.getQuestionInstance).toHaveBeenCalledWith(123);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockQuestion
      });
    });

    it('should handle missing question ID', async () => {
      mockRequest.params = {};

      await controller.getQuestionInstance(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing question ID'
      });
    });
  });

  describe('recordQuestionAttempt', () => {
    it('should record a question attempt successfully', async () => {
      const mockAttemptData = {
        userAnswer: 'A',
        timeSpent: 45,
        confidence: 0.9,
        isCorrect: true,
        score: 1,
        feedback: 'Great answer!'
      };

      const mockAttemptResult = {
        id: 123,
        userId: 123,
        questionId: 123,
        isCorrect: true,
        answerText: 'A',
        timeSpentSeconds: 45,
        createdAt: new Date()
      };

      mockRequest.params = { id: '123' };
      mockRequest.body = mockAttemptData;
      mockQuestionInstanceService.recordQuestionAttempt.mockResolvedValue(mockAttemptResult);

      await controller.recordQuestionAttempt(mockRequest as Request, mockResponse as Response);

      expect(mockQuestionInstanceService.recordQuestionAttempt).toHaveBeenCalledWith({
        questionInstanceId: 123,
        userId: 123,
        userAnswer: 'A',
        timeSpent: 45,
        confidence: 0.9,
        isCorrect: true,
        score: 1,
        feedback: 'Great answer!'
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          attemptId: 123,
          questionId: '123',
          isCorrect: true,
          timeSpent: 45,
          recordedAt: expect.any(Date)
        }
      });
    });

    it('should handle missing required fields', async () => {
      mockRequest.params = { id: '123' };
      mockRequest.body = { timeSpent: 45 };

      await controller.recordQuestionAttempt(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields: question ID, userAnswer, isCorrect'
      });
    });
  });

  describe('getQuestionsByCriterion', () => {
    it('should return questions for a criterion successfully', async () => {
      const mockQuestions = [
        {
          id: 'question_1',
          title: 'Question 1',
          questionType: 'MULTIPLE_CHOICE',
          difficulty: 'MEDIUM'
        },
        {
          id: 'question_2',
          title: 'Question 2',
          questionType: 'TRUE_FALSE',
          difficulty: 'EASY'
        }
      ];

      mockRequest.params = { criterionId: '123' };
      mockRequest.query = { difficulty: 'MEDIUM', questionType: 'MULTIPLE_CHOICE', page: '1', limit: '10' };
      mockQuestionInstanceService.getQuestionsByCriterion.mockResolvedValue({
        questions: mockQuestions,
        total: 2,
        page: 1,
        limit: 10
      });

      await controller.getQuestionsByCriterion(mockRequest as Request, mockResponse as Response);

      expect(mockQuestionInstanceService.getQuestionsByCriterion).toHaveBeenCalledWith(123, {
        difficulty: 'MEDIUM',
        limit: 10,
        offset: undefined
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          criterionId: 123,
          questions: {
            limit: 10,
            page: 1,
            questions: mockQuestions,
            total: 2
          },
          totalQuestions: undefined,
          filters: {
            difficulty: 'MEDIUM',
            limit: '10',
            offset: undefined
          }
        }
      });
    });
  });

  describe('searchQuestionInstances', () => {
    it('should search questions successfully', async () => {
      const mockSearchResults = {
        questions: [
          {
            id: 'question_1',
            title: 'Math Question',
            questionType: 'MULTIPLE_CHOICE',
            difficulty: 'MEDIUM'
          }
        ],
        total: 1,
        page: 1,
        limit: 10
      };

      mockRequest.query = {
        q: 'math',
        difficulty: 'MEDIUM',
        limit: '10'
      };

      mockQuestionInstanceService.searchQuestionInstances.mockResolvedValue(mockSearchResults.questions);

      await controller.searchQuestionInstances(mockRequest as Request, mockResponse as Response);

      expect(mockQuestionInstanceService.searchQuestionInstances).toHaveBeenCalledWith('math', {
        difficulty: 'MEDIUM',
        masteryCriterionId: undefined,
        userId: undefined,
        limit: 10,
        offset: undefined
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          query: 'math',
          questions: mockSearchResults.questions,
          totalResults: expect.any(Number),
          filters: {
            difficulty: 'MEDIUM',
            masteryCriterionId: undefined,
            userId: undefined,
            limit: '10',
            offset: undefined
          }
        }
      });
    });
  });

  describe('getQuestionRecommendations', () => {
    it('should return personalized recommendations successfully', async () => {
      const mockRecommendations = [
        {
          id: 'question_1',
          title: 'Recommended Question 1',
          reason: 'Based on your weak areas',
          priority: 'HIGH'
        }
      ];

      mockRequest.query = {
        userId: '123',
        focus: 'weakest',
        difficulty: 'MEDIUM',
        limit: '5'
      };

      mockQuestionInstanceService.getQuestionRecommendations.mockResolvedValue(mockRecommendations);

      await controller.getQuestionRecommendations(mockRequest as Request, mockResponse as Response);

      expect(mockQuestionInstanceService.getQuestionRecommendations).toHaveBeenCalledWith(123, {
        difficulty: 'MEDIUM',
        excludeAnswered: false,
        limit: 5,
        masteryCriterionId: undefined
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: 123,
          recommendations: mockRecommendations,
          totalRecommendations: expect.any(Number),
          filters: {
            difficulty: 'MEDIUM',
            excludeAnswered: undefined,
            limit: '5',
            masteryCriterionId: undefined
          }
        }
      });
    });
  });

  describe('getUserQuestionStats', () => {
    it('should return user question statistics successfully', async () => {
      const mockStats = {
        totalQuestions: 100,
        correctAnswers: 75,
        successRate: 0.75,
        averageTimeSpent: 45,
        difficultyBreakdown: {
          EASY: { total: 30, correct: 25, successRate: 0.83 },
          MEDIUM: { total: 50, correct: 35, successRate: 0.70 },
          HARD: { total: 20, correct: 15, successRate: 0.75 }
        },
        typeBreakdown: {
          MULTIPLE_CHOICE: { total: 60, correct: 45, successRate: 0.75 },
          TRUE_FALSE: { total: 40, correct: 30, successRate: 0.75 }
        },
        recentPerformance: {
          last7Days: { total: 20, correct: 15, successRate: 0.75 },
          last30Days: { total: 80, correct: 60, successRate: 0.75 }
        }
      };

      mockRequest.params = { userId: '123' };
      mockQuestionInstanceService.getUserQuestionStats.mockResolvedValue(mockStats);

      await controller.getUserQuestionStats(mockRequest as Request, mockResponse as Response);

      expect(mockQuestionInstanceService.getUserQuestionStats).toHaveBeenCalledWith(123);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: 123,
          stats: mockStats,
          generatedAt: expect.any(String)
        }
      });
    });
  });

  describe('recordBatchAttempts', () => {
    it('should record multiple attempts successfully', async () => {
      const mockBatchData = {
        attempts: [
          {
            questionId: 'question_1',
            isCorrect: true,
            timeSpent: 45,
            selectedAnswer: 'A'
          },
          {
            questionId: 'question_2',
            isCorrect: false,
            timeSpent: 60,
            selectedAnswer: 'B'
          }
        ]
      };

      const mockBatchResult = {
        processed: 2,
        successful: 2,
        results: [
          { questionId: 'question_1', success: true, masteryGain: 0.1 },
          { questionId: 'question_2', success: true, masteryGain: 0.05 }
        ]
      };

      mockRequest.body = mockBatchData;
      mockQuestionInstanceService.recordBatchAttempts.mockResolvedValue(mockBatchResult);

      await controller.recordBatchAttempts(mockRequest as Request, mockResponse as Response);

      expect(mockQuestionInstanceService.recordBatchAttempts).toHaveBeenCalledWith(123, mockBatchData.attempts);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: 123,
          ...mockBatchResult,
          timestamp: expect.any(String)
        }
      });
    });
  });
});
