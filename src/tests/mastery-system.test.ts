import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

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
    findFirst: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  blueprintSection: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
  sectionMasteryThreshold: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  knowledgePrimitive: {
    findUnique: jest.fn(),
  },
  questionInstance: {
    findMany: jest.fn(),
  },
};

// Mock the services to use mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Now import the services after mocking
import MasteryCriterionService from '../services/blueprint-centric/masteryCriterion.service';
import { enhancedSpacedRepetitionService } from '../services/mastery/enhancedSpacedRepetition.service';
import { masteryCalculationService } from '../services/mastery/masteryCalculation.service';
import { enhancedTodaysTasksService } from '../services/mastery/enhancedTodaysTasks.service';

// Create service instance
const masteryCriterionService = new MasteryCriterionService();

describe('Mastery System Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('MasteryCriterionService', () => {
    it('should create a new mastery criterion', async () => {
      const createData = {
        title: 'Test Criterion',
        description: 'Test description',
        questionTypes: ['multiple-choice'],
        weight: 1.0,
        uueStage: 'UNDERSTAND' as const,
        masteryThreshold: 0.8,
        knowledgePrimitiveId: 'primitive-1',
        blueprintSectionId: '1',
        userId: 1,
        assessmentType: 'QUESTION_BASED' as const
      };

      const expectedCriterion = {
        id: 1,
        ...createData,
        complexityScore: null,
        assessmentType: 'QUESTION_BASED',
        timeLimit: null,
        attemptsAllowed: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.masteryCriterion.create.mockResolvedValue(expectedCriterion);
      mockPrisma.knowledgePrimitive.findUnique.mockResolvedValue({
        id: 'primitive-1',
        title: 'Test Primitive',
        content: 'Test content'
      });
      mockPrisma.blueprintSection.findUnique.mockResolvedValue({
        id: '1',
        title: 'Test Section',
        content: 'Test content'
      });

      const result = await masteryCriterionService.createCriterion(createData);

      expect(result).toEqual(expectedCriterion);
      // The service doesn't include questionTypes in the create data, so we need to exclude it
      const { questionTypes, ...createDataWithoutQuestionTypes } = createData;
      expect(mockPrisma.masteryCriterion.create).toHaveBeenCalledWith({
        data: {
          ...createDataWithoutQuestionTypes,
          blueprintSectionId: 1, // Service converts string to number
          complexityScore: undefined // Service adds this field
        },
      });
    });

    it('should get a criterion by ID', async () => {
      const expectedCriterion = {
        id: 1,
        title: 'Test Criterion',
        description: 'Test description',
        questionTypes: ['multiple-choice'],
        weight: 1.0,
        uueStage: 'UNDERSTAND',
        masteryThreshold: 0.8,
        knowledgePrimitiveId: 'primitive-1',
        blueprintSectionId: 1,
        userId: 1,
        complexityScore: null,
        assessmentType: 'QUESTION_BASED',
        timeLimit: null,
        attemptsAllowed: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.masteryCriterion.findUnique.mockResolvedValue(expectedCriterion);

      const result = await masteryCriterionService.getCriterion('1');

      expect(result).toEqual(expectedCriterion);
      expect(mockPrisma.masteryCriterion.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { questionInstances: true },
      });
    });

    it('should process a criterion review', async () => {
      const criterion = {
        id: 1,
        title: 'Test Criterion',
        description: 'Test description',
        questionTypes: ['multiple-choice'],
        weight: 1.0,
        uueStage: 'UNDERSTAND',
        masteryThreshold: 0.8,
        knowledgePrimitiveId: 'primitive-1',
        blueprintSectionId: 1,
        userId: 1,
        complexityScore: null,
        assessmentType: 'QUESTION_BASED',
        timeLimit: null,
        attemptsAllowed: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const userMastery = {
        id: 1,
        userId: 1,
        masteryCriterionId: 1,
        isMastered: false,
        masteryScore: 0.5,
        attempts: 2,
        lastReviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.masteryCriterion.findUnique.mockResolvedValue(criterion);
      mockPrisma.userCriterionMastery.findFirst.mockResolvedValue(userMastery);
      mockPrisma.userCriterionMastery.update.mockResolvedValue({
        ...userMastery,
        masteryScore: 0.7,
        attempts: 3,
        isMastered: false
      });

      const result = await masteryCriterionService.processCriterionReview(1, 1, true, 0.9, { allowRetrySameDay: true });

      expect(result.success).toBe(true);
      expect(result.newMasteryScore).toBeGreaterThan(0.5);
    });
  });

  describe('Mastery Calculation', () => {
    it('should calculate mastery scores correctly', async () => {
      const userMastery = {
        id: 1,
        userId: 1,
        masteryCriterionId: 1,
        isMastered: true,
        masteryScore: 0.9,
        attempts: 5,
        lastReviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.userCriterionMastery.findUnique.mockResolvedValue(userMastery);
      mockPrisma.masteryCriterion.findUnique.mockResolvedValue({
        id: 1,
        title: 'Test Criterion',
        description: 'Test description',
        questionTypes: ['multiple-choice'],
        weight: 1.0,
        uueStage: 'UNDERSTAND',
        masteryThreshold: 0.8,
        knowledgePrimitiveId: 'primitive-1',
        blueprintSectionId: '1',
        userId: 1,
        complexityScore: null,
        assessmentType: 'QUESTION_BASED',
        timeLimit: null,
        attemptsAllowed: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockPrisma.questionInstance.findMany.mockResolvedValue([]);

      const result = await masteryCriterionService.calculateCriterionMastery('1', 1);

      expect(result.masteryScore).toBe(0.9);
      expect(result.isMastered).toBe(true);
    });
  });

  describe('UUE Stage Progression', () => {
    it('should check if user can progress to next stage', async () => {
      const criteria = [
        {
          id: 1,
          title: 'Criterion 1',
          description: 'Description 1',
          questionTypes: ['multiple-choice'],
          weight: 1.0,
          uueStage: 'UNDERSTAND',
          masteryThreshold: 0.8,
          knowledgePrimitiveId: 'primitive-1',
          blueprintSectionId: 1,
          userId: 1,
          complexityScore: null,
          assessmentType: 'QUESTION_BASED',
          timeLimit: null,
          attemptsAllowed: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const userMasteries = [
        {
          id: 1,
          userId: 1,
          masteryCriterionId: 1,
          isMastered: true,
          masteryScore: 0.9,
          attempts: 3,
          lastReviewedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.masteryCriterion.findMany.mockResolvedValue(criteria);
      mockPrisma.userCriterionMastery.findMany.mockResolvedValue(userMasteries);

      const result = await masteryCriterionService.canProgressToNextUueStage(1, 1, 'UNDERSTAND');

      expect(result).toBe(true);
    });
  });
});

