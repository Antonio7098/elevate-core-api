// Mock Prisma client before importing the service
const mockPrisma = {
  masteryCriterion: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userCriterionMastery: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
} as any;

// Mock the Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

// Now import the service after mocking
import MasteryCriterionService from '../../services/blueprint-centric/masteryCriterion.service';
import { CreateCriterionData, UpdateCriterionData } from '../../services/blueprint-centric/masteryCriterion.service';

describe('MasteryCriterionService', () => {
  let service: MasteryCriterionService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = new MasteryCriterionService();
    // Inject mocked Prisma
    (service as any).prisma = mockPrisma;
  });

  describe('createCriterion', () => {
    it('should create a new mastery criterion successfully', async () => {
      const createData: CreateCriterionData = {
        title: 'What is a derivative?',
        description: 'Understand the basic concept of derivatives',
        questionTypes: ['multiple-choice'],
        weight: 1.5,
        uueStage: 'UNDERSTAND',
        masteryThreshold: 0.8,
        knowledgePrimitiveId: 'primitive-1',
        blueprintSectionId: 1,
        userId: 1
      };

      const expectedCriterion = {
        id: 1,
        title: createData.title,
        description: createData.description,
        questionTypes: createData.questionTypes,
        weight: createData.weight,
        uueStage: createData.uueStage,
        masteryThreshold: createData.masteryThreshold,
        knowledgePrimitiveId: createData.knowledgePrimitiveId,
        blueprintSectionId: createData.blueprintSectionId,
        userId: createData.userId,
        complexityScore: null,
        assessmentType: 'QUESTION_BASED',
        timeLimit: null,
        attemptsAllowed: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.masteryCriterion.create.mockResolvedValue(expectedCriterion);

      const result = await service.createCriterion(createData);

      expect(result).toEqual(expectedCriterion);
      expect(mockPrisma.masteryCriterion.create).toHaveBeenCalledWith({
        data: {
          blueprintSectionId: createData.blueprintSectionId,
          uueStage: createData.uueStage,
          weight: createData.weight,
          masteryThreshold: createData.masteryThreshold,
          description: createData.description,
          title: createData.title,
          knowledgePrimitiveId: createData.knowledgePrimitiveId,
          userId: createData.userId,
        },
      });
    });

    it('should throw error if criterion not found when getting', async () => {
      mockPrisma.masteryCriterion.findUnique.mockResolvedValue(null);

      await expect(service.getCriterion(999)).resolves.toBeNull();
    });
  });

  describe('getCriterion', () => {
    it('should get a criterion by ID successfully', async () => {
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

      const result = await service.getCriterion(1);

      expect(result).toEqual(expectedCriterion);
      expect(mockPrisma.masteryCriterion.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('updateCriterion', () => {
    it('should update a criterion successfully', async () => {
      const updateData: UpdateCriterionData = {
        weight: 2.0,
        description: 'Updated description',
        title: 'Updated Title'
      };

      const expectedCriterion = {
        id: 1,
        title: 'Updated Title',
        description: 'Updated description',
        questionTypes: ['multiple-choice'],
        weight: 2.0,
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

      mockPrisma.masteryCriterion.update.mockResolvedValue(expectedCriterion);

      const result = await service.updateCriterion(1, updateData);

      expect(result).toEqual(expectedCriterion);
      expect(mockPrisma.masteryCriterion.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
      });
    });
  });

  describe('deleteCriterion', () => {
    it('should delete a criterion successfully', async () => {
      mockPrisma.masteryCriterion.delete.mockResolvedValue({} as any);

      await service.deleteCriterion(1);

      expect(mockPrisma.masteryCriterion.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('processCriterionReview', () => {
    it('should process a criterion review successfully', async () => {
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
        criterionId: 1,
        isMastered: false,
        masteryScore: 0.5,
        attempts: 2,
        lastAttempt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.masteryCriterion.findUnique.mockResolvedValue(criterion);
      mockPrisma.userCriterionMastery.findUnique.mockResolvedValue(userMastery);
      mockPrisma.userCriterionMastery.update.mockResolvedValue({
        ...userMastery,
        masteryScore: 0.7,
        attempts: 3,
        isMastered: false
      });

      const result = await service.processCriterionReview(1, 1, true, 0.9);

      expect(result.success).toBe(true);
      expect(result.newMasteryScore).toBeGreaterThan(0.5);
      expect(result.attempts).toBe(3);
      expect(result.message).toBe('Progress recorded');
    });

    it('should throw error if criterion not found', async () => {
      mockPrisma.masteryCriterion.findUnique.mockResolvedValue(null);

      await expect(service.processCriterionReview(1, 999, true, 0.9))
        .rejects.toThrow('Criterion 999 not found');
    });
  });

  describe('calculateCriterionMastery', () => {
    it('should calculate criterion mastery successfully', async () => {
      const userMastery = {
        id: 1,
        userId: 1,
        criterionId: 1,
        isMastered: true,
        masteryScore: 0.9,
        attempts: 5,
        lastAttempt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.userCriterionMastery.findUnique.mockResolvedValue(userMastery);

      const result = await service.calculateCriterionMastery(1, 1);

      expect(result.criterionId).toBe(1);
      expect(result.masteryScore).toBe(0.9);
      expect(result.isMastered).toBe(true);
      expect(result.attempts).toBe(5);
      expect(result.lastAttempt).toEqual(userMastery.lastAttempt);
    });

    it('should throw error if user mastery not found', async () => {
      mockPrisma.userCriterionMastery.findUnique.mockResolvedValue(null);

      await expect(service.calculateCriterionMastery(1, 1))
        .rejects.toThrow('User mastery not found for criterion 1');
    });
  });

  describe('getCriteriaByUueStage', () => {
    it('should get criteria by UUE stage successfully', async () => {
      const expectedCriteria = [
        {
          id: 1,
          title: 'Criterion 1',
          description: 'Description 1',
          questionTypes: ['multiple-choice'],
          weight: 1.5,
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

      mockPrisma.masteryCriterion.findMany.mockResolvedValue(expectedCriteria);

      const result = await service.getCriteriaByUueStage(1, 'UNDERSTAND');

      expect(result).toEqual(expectedCriteria);
      expect(mockPrisma.masteryCriterion.findMany).toHaveBeenCalledWith({
        where: {
          blueprintSectionId: 1,
          uueStage: 'UNDERSTAND',
        },
        orderBy: { weight: 'desc' },
      });
    });
  });

  describe('canProgressToNextUueStage', () => {
    it('should return true when all criteria are mastered', async () => {
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
          criterionId: 1,
          isMastered: true,
          masteryScore: 0.9,
          attempts: 3,
          lastAttempt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.masteryCriterion.findMany.mockResolvedValue(criteria);
      mockPrisma.userCriterionMastery.findMany.mockResolvedValue(userMasteries);

      const result = await service.canProgressToNextUueStage(1, 1, 'UNDERSTAND');

      expect(result).toBe(true);
    });

    it('should return false when not all criteria are mastered', async () => {
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
          criterionId: 1,
          isMastered: false,
          masteryScore: 0.5,
          attempts: 2,
          lastAttempt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockPrisma.masteryCriterion.findMany.mockResolvedValue(criteria);
      mockPrisma.userCriterionMastery.findMany.mockResolvedValue(userMasteries);

      const result = await service.canProgressToNextUueStage(1, 1, 'UNDERSTAND');

      expect(result).toBe(false);
    });
  });
});
