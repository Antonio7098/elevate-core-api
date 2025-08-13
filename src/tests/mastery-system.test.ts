import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { masteryCriterionService } from '../services/masteryCriterion.service';
import { enhancedSpacedRepetitionService } from '../services/enhancedSpacedRepetition.service';
import { masteryCalculationService } from '../services/masteryCalculation.service';
import { enhancedTodaysTasksService } from '../services/enhancedTodaysTasks.service';

// Mock Prisma client for testing
const mockPrisma = {
  masteryCriterion: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userCriterionMastery: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  blueprintSection: {
    findMany: jest.fn(),
  },
  sectionMasteryThreshold: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

// Mock the services to use mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

describe('Mastery System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('MasteryCriterionService', () => {
    it('should create a new mastery criterion', async () => {
      const criterionData = {
        id: 'test-criterion-1',
        blueprintSectionId: 'section-1',
        uueStage: 'UNDERSTAND' as const,
        weight: 1.0,
        masteryThreshold: 0.8,
        description: 'Test criterion for understanding',
        questionTypes: ['multiple-choice', 'true-false'],
      };

      mockPrisma.masteryCriterion.create.mockResolvedValue(criterionData);

      const result = await masteryCriterionService.createCriterion(criterionData);
      
      expect(result).toEqual(criterionData);
      expect(mockPrisma.masteryCriterion.create).toHaveBeenCalledWith({
        data: criterionData,
      });
    });

    it('should process criterion review and update mastery', async () => {
      const mockCriterion = {
        id: 'test-criterion-1',
        masteryThreshold: 0.8,
      };

      const mockUserMastery = {
        id: 'user-mastery-1',
        userId: 1,
        masteryCriterionId: 'test-criterion-1',
        blueprintSectionId: 'section-1',
        masteryScore: 0.6,
        consecutiveIntervals: 1,
        attemptHistory: [0.6, 0.7],
        currentIntervalStep: 2,
        trackingIntensity: 'NORMAL' as const,
        lastAttemptDate: new Date('2024-01-01'),
        nextReviewAt: new Date('2024-01-05'),
      };

      mockPrisma.masteryCriterion.findUnique.mockResolvedValue(mockCriterion);
      mockPrisma.userCriterionMastery.findUnique.mockResolvedValue(mockUserMastery);
      mockPrisma.userCriterionMastery.update.mockResolvedValue(mockUserMastery);

      const result = await masteryCriterionService.processCriterionReview(
        1,
        'test-criterion-1',
        true,
        0.9
      );

      expect(result.success).toBe(true);
      expect(result.newMasteryScore).toBeGreaterThan(0);
      expect(result.consecutiveIntervals).toBe(2);
      expect(result.message).toBe('Criterion mastered!');
    });

    it('should check consecutive interval mastery correctly', async () => {
      const mockCriterion = {
        id: 'test-criterion-1',
        masteryThreshold: 0.8,
      };

      const mockUserMastery = {
        id: 'user-mastery-1',
        attemptHistory: [0.85, 0.9],
        lastAttemptDate: new Date('2024-01-01'),
      };

      mockPrisma.masteryCriterion.findUnique.mockResolvedValue(mockCriterion);
      mockPrisma.userCriterionMastery.findUnique.mockResolvedValue(mockUserMastery);

      const result = await masteryCriterionService.checkConsecutiveIntervalMastery(
        1,
        'test-criterion-1'
      );

      expect(result).toBe(true);
    });
  });

  describe('EnhancedSpacedRepetitionService', () => {
    it('should calculate next review interval with progressive failure handling', () => {
      // Test success case
      let schedule = enhancedSpacedRepetitionService.calculateNextReviewInterval(
        2, // current step
        true, // isCorrect
        'NORMAL' as const,
        0 // consecutive failures
      );

      expect(schedule.intervalStep).toBe(3); // Should move up one step
      expect(schedule.confidence).toBeGreaterThan(0.5);

      // Test first failure case
      schedule = enhancedSpacedRepetitionService.calculateNextReviewInterval(
        2, // current step
        false, // isCorrect
        'NORMAL' as const,
        0 // consecutive failures
      );

      expect(schedule.intervalStep).toBe(1); // Should go back one step

      // Test second consecutive failure case
      schedule = enhancedSpacedRepetitionService.calculateNextReviewInterval(
        2, // current step
        false, // isCorrect
        'NORMAL' as const,
        1 // consecutive failures
      );

      expect(schedule.intervalStep).toBe(0); // Should go back to start
    });

    it('should apply tracking intensity multipliers correctly', () => {
      const baseSchedule = enhancedSpacedRepetitionService.calculateNextReviewInterval(
        1, // current step
        true, // isCorrect
        'NORMAL' as const
      );

      const denseSchedule = enhancedSpacedRepetitionService.calculateNextReviewInterval(
        1, // current step
        true, // isCorrect
        'DENSE' as const
      );

      const sparseSchedule = enhancedSpacedRepetitionService.calculateNextReviewInterval(
        1, // current step
        true, // isCorrect
        'SPARSE' as const
      );

      // DENSE should have shorter intervals (0.7x)
      expect(denseSchedule.nextReviewAt.getTime()).toBeLessThan(baseSchedule.nextReviewAt.getTime());
      
      // SPARSE should have longer intervals (1.5x)
      expect(sparseSchedule.nextReviewAt.getTime()).toBeGreaterThan(baseSchedule.nextReviewAt.getTime());
    });

    it('should recommend appropriate tracking intensity', async () => {
      const mockUserMastery = {
        id: 'user-mastery-1',
        currentIntervalStep: 0,
        consecutiveFailures: 2,
        trackingIntensity: 'NORMAL' as const,
        masteryScore: 0.3,
        reviewCount: 5,
        successfulReviews: 2,
      };

      mockPrisma.userCriterionMastery.findUnique.mockResolvedValue(mockUserMastery);
      mockPrisma.userCriterionMastery.update.mockResolvedValue(mockUserMastery);

      const result = await enhancedSpacedRepetitionService.processReviewOutcome(
        1,
        'test-criterion-1',
        false,
        0.3
      );

      expect(result.success).toBe(true);
      // Should recommend DENSE tracking for high failures
      expect(result.message).toBeDefined();
    });
  });

  describe('MasteryCalculationService', () => {
    it('should calculate UUE stage mastery from weighted criteria', async () => {
      const mockCriteria = [
        { id: 'criterion-1', weight: 2.0, description: 'Important concept' },
        { id: 'criterion-2', weight: 1.0, description: 'Basic concept' },
      ];

      const mockUserMasteries = [
        { masteryCriterionId: 'criterion-1', masteryScore: 0.9, isMastered: true, consecutiveIntervals: 2 },
        { masteryCriterionId: 'criterion-2', masteryScore: 0.7, isMastered: false, consecutiveIntervals: 1 },
      ];

      // Mock the service calls
      jest.spyOn(masteryCriterionService, 'getCriteriaByUueStage').mockResolvedValue(mockCriteria as any);
      mockPrisma.userCriterionMastery.findMany.mockResolvedValue(mockUserMasteries as any);
      mockPrisma.sectionMasteryThreshold.findUnique.mockResolvedValue({
        threshold: 'PROFICIENT',
        thresholdValue: 0.8,
      });

      const result = await masteryCalculationService.calculateUueStageMastery(
        'section-1',
        'UNDERSTAND' as const,
        1
      );

      expect(result.stage).toBe('UNDERSTAND');
      expect(result.masteryScore).toBeGreaterThan(0);
      expect(result.totalCriteria).toBe(2);
      expect(result.masteredCriteria).toBe(1);
      expect(result.totalWeight).toBe(3.0);
    });

    it('should calculate primitive mastery correctly', async () => {
      // Mock UUE stage mastery calculations
      jest.spyOn(masteryCalculationService, 'calculateUueStageMastery')
        .mockResolvedValueOnce({
          stage: 'UNDERSTAND' as const,
          masteryScore: 0.8,
          isMastered: true,
          totalCriteria: 3,
          masteredCriteria: 3,
          totalWeight: 3.0,
          criteriaBreakdown: [],
        })
        .mockResolvedValueOnce({
          stage: 'USE' as const,
          masteryScore: 0.7,
          isMastered: false,
          totalCriteria: 2,
          masteredCriteria: 1,
          totalWeight: 2.0,
          criteriaBreakdown: [],
        })
        .mockResolvedValueOnce({
          stage: 'EXPLORE' as const,
          masteryScore: 0.6,
          isMastered: false,
          totalCriteria: 1,
          masteredCriteria: 0,
          totalWeight: 1.0,
          criteriaBreakdown: [],
        });

      const result = await masteryCalculationService.calculatePrimitiveMastery('section-1', 1);

      expect(result.sectionId).toBe('section-1');
      expect(result.totalStages).toBe(3);
      expect(result.masteredStages).toBe(1);
      expect(result.isMastered).toBe(false);
      expect(result.overallProgress).toBe(33.33); // 1/3 stages mastered
    });

    it('should calculate weighted mastery correctly', () => {
      const criteria = [
        { id: 'criterion-1', weight: 2.0, description: 'Important' },
        { id: 'criterion-2', weight: 1.0, description: 'Basic' },
      ];

      const userMasteries = [
        { masteryCriterionId: 'criterion-1', masteryScore: 0.9, isMastered: true, consecutiveIntervals: 2 },
        { masteryCriterionId: 'criterion-2', masteryScore: 0.7, isMastered: false, consecutiveIntervals: 1 },
      ];

      const result = masteryCalculationService.calculateWeightedMastery(criteria as any, userMasteries as any);

      // Weighted calculation: (0.9 * 2 + 0.7 * 1) / (2 + 1) = 2.5 / 3 = 0.833
      expect(result.weightedMastery).toBeCloseTo(0.833, 3);
      expect(result.totalWeight).toBe(3.0);
      expect(result.masteredCriteria).toBe(1);
      expect(result.breakdown).toHaveLength(2);
    });
  });

  describe('EnhancedTodaysTasksService', () => {
    it('should categorize tasks by priority correctly', async () => {
      const mockDueCriteria = [
        {
          id: 'mastery-1',
          masteryCriterionId: 'criterion-1',
          blueprintSectionId: 'section-1',
          consecutiveFailures: 2,
          nextReviewAt: new Date('2024-01-01'), // Overdue
          masteryScore: 0.3,
          uueStage: 'UNDERSTAND' as const,
        },
        {
          id: 'mastery-2',
          masteryCriterionId: 'criterion-2',
          blueprintSectionId: 'section-1',
          consecutiveFailures: 0,
          nextReviewAt: new Date('2024-01-03'), // Due soon
          masteryScore: 0.6,
          uueStage: 'USE' as const,
        },
      ];

      const mockSections = [
        { id: 'section-1', name: 'Test Section' },
      ];

      // Mock the service calls
      jest.spyOn(enhancedTodaysTasksService, 'getDueCriteriaForUser').mockResolvedValue(mockDueCriteria as any);
      jest.spyOn(enhancedTodaysTasksService, 'getDueSectionsForUser').mockResolvedValue(mockSections as any);

      const result = await enhancedTodaysTasksService.generateTodaysTasksForUser(1);

      expect(result.critical.count).toBeGreaterThan(0);
      expect(result.core.count).toBeGreaterThan(0);
      expect(result.totalTasks).toBeGreaterThan(0);
      expect(result.capacityAnalysis).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
    });

    it('should balance UUE stages in daily tasks', async () => {
      const taskBuckets = {
        critical: [],
        core: [],
        plus: [],
      };

      const userPrefs = {
        dailyStudyTime: 60,
        preferredUueStages: ['UNDERSTAND', 'USE', 'EXPLORE'],
        trackingIntensity: 'NORMAL' as const,
        masteryThreshold: 'PROFICIENT' as const,
      };

      const result = await enhancedTodaysTasksService.balanceUueStages(
        taskBuckets,
        userPrefs,
        60
      );

      expect(result.critical).toBeDefined();
      expect(result.core).toBeDefined();
      expect(result.plus).toBeDefined();
      expect(result.overflow).toBeDefined();
    });
  });

  describe('System Integration', () => {
    it('should handle complete mastery tracking flow', async () => {
      // Test the complete flow from review to mastery calculation
      const userId = 1;
      const criterionId = 'test-criterion-1';

      // 1. Process a review
      const reviewResult = await enhancedSpacedRepetitionService.processReviewOutcome(
        userId,
        criterionId,
        true,
        0.9
      );

      expect(reviewResult.success).toBe(true);

      // 2. Check mastery calculation
      const masteryResult = await masteryCalculationService.calculateCriterionMasteryScore(
        criterionId,
        userId
      );

      expect(masteryResult).toBeGreaterThanOrEqual(0);

      // 3. Generate daily tasks
      const dailyTasks = await enhancedTodaysTasksService.generateTodaysTasksForUser(userId);

      expect(dailyTasks).toBeDefined();
      expect(dailyTasks.totalTasks).toBeGreaterThanOrEqual(0);
    });

    it('should handle consecutive interval mastery correctly', async () => {
      const userId = 1;
      const criterionId = 'test-criterion-1';

      // First successful attempt
      await enhancedSpacedRepetitionService.processReviewOutcome(
        userId,
        criterionId,
        true,
        0.85
      );

      // Second successful attempt (different day)
      const result = await enhancedSpacedRepetitionService.processReviewOutcome(
        userId,
        criterionId,
        true,
        0.9
      );

      expect(result.success).toBe(true);
      expect(result.masteryProgress).toBeGreaterThan(0);
    });
  });
});
