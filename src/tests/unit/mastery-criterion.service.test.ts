import { PrismaClient } from '@prisma/client';
import MasteryCriterionService from '../../services/blueprint-centric/masteryCriterion.service';
import { CreateCriterionData, UpdateCriterionData, CreateInstanceData } from '../../services/blueprint-centric/masteryCriterion.service';

// Mock Prisma client
const mockPrisma = {
  masteryCriterion: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  questionInstance: {
    create: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  userCriterionMastery: {
    findMany: jest.fn(),
    upsert: jest.fn(),
  },
  knowledgePrimitive: {
    findUnique: jest.fn(),
  },
  blueprintSection: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn(),
} as unknown as PrismaClient;

// Mock the service with mocked Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

describe('MasteryCriterionService', () => {
  let service: MasteryCriterionService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = new MasteryCriterionService(mockPrisma);
  });

  describe('createCriterion', () => {
    it('should create a new mastery criterion successfully', async () => {
      const createData: CreateCriterionData = {
        title: 'What is a derivative?',
        description: 'Understand the basic concept of derivatives',
        weight: 1.5,
        uueStage: 'UNDERSTAND',
        assessmentType: 'QUESTION_BASED',
        masteryThreshold: 0.8,
        knowledgePrimitiveId: 'primitive-1',
        blueprintSectionId: 'section-1',
        userId: 1
      };

      const expectedCriterion = {
        id: 1,
        ...createData,
        blueprintSectionId: 1,
        timeLimit: null,
        attemptsAllowed: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the prerequisite checks
      mockPrisma.knowledgePrimitive.findUnique.mockResolvedValue({ id: 1, primitiveId: 'primitive-1' });
      mockPrisma.blueprintSection.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.masteryCriterion.create.mockResolvedValue(expectedCriterion);

      const result = await service.createCriterion(createData);

      expect(result).toEqual(expectedCriterion);
      expect(mockPrisma.masteryCriterion.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          blueprintSectionId: 1
        }
      });
    });

    it('should validate required fields', async () => {
      const createData: CreateCriterionData = {
        title: '',
        description: 'Test description',
        weight: 1.0,
        uueStage: 'UNDERSTAND',
        assessmentType: 'QUESTION_BASED',
        masteryThreshold: 0.8,
        knowledgePrimitiveId: 'primitive-1',
        blueprintSectionId: 'section-1',
        userId: 1
      };

      await expect(service.createCriterion(createData)).rejects.toThrow('Criterion title is required');
    });

    it('should validate mastery threshold range', async () => {
      const createData: CreateCriterionData = {
        title: 'Test Criterion',
        description: 'Test description',
        weight: 1.0,
        uueStage: 'UNDERSTAND',
        assessmentType: 'QUESTION_BASED',
        masteryThreshold: 1.5, // Invalid: > 1.0
        knowledgePrimitiveId: 'primitive-1',
        blueprintSectionId: 'section-1',
        userId: 1
      };

      await expect(service.createCriterion(createData)).rejects.toThrow('Mastery threshold must be between 0 and 1');
    });
  });

  describe('getCriterion', () => {
    it('should retrieve a criterion with question instances successfully', async () => {
      const criterionId = 'criterion-1';
      const expectedCriterion = {
        id: 1,
        title: 'What is a derivative?',
        questionInstances: [
          { id: 1, questionText: 'What is a derivative?' },
          { id: 2, questionText: 'Define derivative mathematically' }
        ]
      };

      mockPrisma.masteryCriterion.findUnique.mockResolvedValue(expectedCriterion);

      const result = await service.getCriterion(criterionId);

      expect(result).toEqual(expectedCriterion);
      expect(mockPrisma.masteryCriterion.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { questionInstances: true }
      });
    });

    it('should return null for non-existent criterion', async () => {
      const criterionId = 'non-existent';
      mockPrisma.masteryCriterion.findUnique.mockResolvedValue(null);

      const result = await service.getCriterion(criterionId);

      expect(result).toBeNull();
    });
  });

  describe('updateCriterion', () => {
    it('should update a criterion successfully', async () => {
      const criterionId = 'criterion-1';
      const updateData: UpdateCriterionData = {
        title: 'Updated Criterion Title',
        description: 'Updated description'
      };

      const expectedCriterion = {
        id: 1,
        ...updateData,
        updatedAt: new Date()
      };

      mockPrisma.masteryCriterion.update.mockResolvedValue(expectedCriterion);

      const result = await service.updateCriterion(criterionId, updateData);

      expect(result).toEqual(expectedCriterion);
      expect(mockPrisma.masteryCriterion.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData
      });
    });
  });

  describe('deleteCriterion', () => {
    it('should delete a criterion successfully', async () => {
      const criterionId = 'criterion-1';
      mockPrisma.masteryCriterion.delete.mockResolvedValue({ id: 1 });

      await service.deleteCriterion(criterionId);

      expect(mockPrisma.masteryCriterion.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });
  });

  describe('question instance management', () => {
    it('should add a question instance to a criterion', async () => {
      const criterionId = 'criterion-1';
      const createData: CreateInstanceData = {
        questionText: 'What is a derivative?',
        answer: 'A derivative is the rate of change of a function',
        explanation: 'The derivative measures how a function changes as its input changes',
        difficulty: 'MEDIUM',
        userId: 1
      };

      const expectedInstance = {
        id: 1,
        ...createData,
        masteryCriterionId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.questionInstance.create.mockResolvedValue(expectedInstance);

      const result = await service.addQuestionInstance(criterionId, createData);

      expect(result).toEqual(expectedInstance);
      expect(mockPrisma.questionInstance.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          masteryCriterionId: 1
        }
      });
    });

    it('should update a question instance', async () => {
      const instanceId = 'instance-1';
      const updateData = {
        questionText: 'Updated question text',
        answer: 'Updated answer'
      };

      const expectedInstance = {
        id: 1,
        ...updateData,
        updatedAt: new Date()
      };

      mockPrisma.questionInstance.update.mockResolvedValue(expectedInstance);

      const result = await service.updateQuestionInstance(instanceId, updateData);

      expect(result).toEqual(expectedInstance);
      expect(mockPrisma.questionInstance.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData
      });
    });

    it('should delete a question instance', async () => {
      const instanceId = 'instance-1';
      mockPrisma.questionInstance.delete.mockResolvedValue({ id: 1 });

      await service.deleteQuestionInstance(instanceId);

      expect(mockPrisma.questionInstance.delete).toHaveBeenCalledWith({
        where: { id: 1 }
      });
    });
  });

  describe('section-based operations', () => {
    it('should get criteria by section', async () => {
      const sectionId = 'section-1';
      const expectedCriteria = [
        { id: 1, title: 'Criterion 1' },
        { id: 2, title: 'Criterion 2' }
      ];

      mockPrisma.masteryCriterion.findMany.mockResolvedValue(expectedCriteria);

      const result = await service.getCriteriaBySection(sectionId);

      expect(result).toEqual(expectedCriteria);
      expect(mockPrisma.masteryCriterion.findMany).toHaveBeenCalledWith({
        where: { blueprintSectionId: 1 },
        orderBy: { weight: 'desc' }
      });
    });

    it('should get criteria by UUE stage', async () => {
      const sectionId = 'section-1';
      const uueStage = 'UNDERSTAND';
      const expectedCriteria = [
        { id: 1, title: 'Understand Criterion 1' },
        { id: 2, title: 'Understand Criterion 2' }
      ];

      mockPrisma.masteryCriterion.findMany.mockResolvedValue(expectedCriteria);

      const result = await service.getCriteriaByUueStage(sectionId, uueStage);

      expect(result).toEqual(expectedCriteria);
      expect(mockPrisma.masteryCriterion.findMany).toHaveBeenCalledWith({
        where: { 
          blueprintSectionId: 1,
          uueStage: uueStage
        },
        orderBy: { weight: 'desc' }
      });
    });
  });

  describe('UUE stage progression', () => {
    it('should calculate UUE stage progression correctly', async () => {
      const userId = 1;
      const sectionId = 'section-1';
      
      const criteria = [
        { id: 1, uueStage: 'UNDERSTAND', weight: 1.0 },
        { id: 2, uueStage: 'UNDERSTAND', weight: 1.0 },
        { id: 3, uueStage: 'USE', weight: 1.5 },
        { id: 4, uueStage: 'EXPLORE', weight: 2.0 }
      ];

      const userMasteries = [
        { criterionId: 1, isMastered: true },
        { criterionId: 2, isMastered: true },
        { criterionId: 3, isMastered: false },
        { criterionId: 4, isMastered: false }
      ];

      mockPrisma.masteryCriterion.findMany.mockResolvedValue(criteria);
      mockPrisma.userCriterionMastery.findMany.mockResolvedValue(userMasteries);

      const result = await service.getUueStageProgression(userId, sectionId);

      expect(result.understand.total).toBe(2);
      expect(result.understand.mastered).toBe(2);
      expect(result.understand.progress).toBe(1.0);
      expect(result.use.total).toBe(1);
      expect(result.use.mastered).toBe(0);
      expect(result.use.progress).toBe(0.0);
      expect(result.currentStage).toBe('UNDERSTAND');
      expect(result.canProgress).toBe(true);
    });

    it('should determine progression requirements correctly', async () => {
      const userId = 1;
      const sectionId = 'section-1';
      
      const criteria = [
        { id: 1, uueStage: 'UNDERSTAND', weight: 1.0 },
        { id: 2, uueStage: 'UNDERSTAND', weight: 1.0 }
      ];

      const userMasteries = [
        { criterionId: 1, isMastered: true },
        { criterionId: 2, isMastered: false }
      ];

      mockPrisma.masteryCriterion.findMany.mockResolvedValue(criteria);
      mockPrisma.userCriterionMastery.findMany.mockResolvedValue(userMasteries);

      const result = await service.getUueStageProgression(userId, sectionId);

      expect(result.canProgress).toBe(false);
      expect(result.nextStageRequirements).toContain('Master all UNDERSTAND criteria');
    });
  });

  describe('mastery tracking', () => {
    it('should calculate criterion mastery correctly', async () => {
      const criterionId = 'criterion-1';
      const userId = 1;

      const criterion = {
        id: 1,
        title: 'Test Criterion',
        masteryThreshold: 0.8
      };

      const questionInstances = [
        { id: 1, questionText: 'Question 1' },
        { id: 2, questionText: 'Question 2' }
      ];

      mockPrisma.masteryCriterion.findUnique.mockResolvedValue(criterion);
      mockPrisma.questionInstance.findMany.mockResolvedValue(questionInstances);

      const result = await service.calculateCriterionMastery(criterionId, userId);

      expect(result.criterionId).toBe(criterionId);
      expect(result.userId).toBe(userId);
      expect(result.masteryScore).toBe(0.0); // Default value for now
      expect(result.isMastered).toBe(false); // 0.0 < 0.8
    });

    it('should update mastery progress correctly', async () => {
      const criterionId = 'criterion-1';
      const userId = 1;
      const performance = {
        score: 0.85,
        isCorrect: true,
        timeSpent: 120,
        questionInstanceId: 'instance-1'
      };

      mockPrisma.userCriterionMastery.upsert.mockResolvedValue({
        id: 1,
        criterionId: 1,
        userId: userId,
        isMastered: false,
        masteryScore: 0.85
      });

      await service.updateMasteryProgress(criterionId, userId, performance);

      expect(mockPrisma.userCriterionMastery.upsert).toHaveBeenCalledWith({
        where: {
          userId_criterionId: {
            userId: userId,
            criterionId: 1
          }
        },
        update: {
          masteryScore: 0.85,
          lastAttempt: expect.any(Date),
          attempts: { increment: 1 }
        },
        create: {
          userId: userId,
          criterionId: 1,
          masteryScore: 0.85,
          lastAttempt: expect.any(Date),
          attempts: 1
        }
      });
    });
  });

  describe('AI integration', () => {
    it('should generate question variations successfully', async () => {
      const criterionId = 'criterion-1';
      const count = 3;
      const instructions = {
        difficulty: 'MEDIUM',
        focus: 'mathematical understanding',
        style: 'problem-solving'
      };

      const generatedInstances = [
        { id: 'gen-1', questionText: 'Generated Question 1' },
        { id: 'gen-2', questionText: 'Generated Question 2' },
        { id: 'gen-3', questionText: 'Generated Question 3' }
      ];

      const result = await service.generateQuestionVariations(criterionId, count, instructions);

      expect(result).toEqual(generatedInstances);
    });
  });

  describe('validation and error handling', () => {
    it('should validate criterion weight is positive', async () => {
      const createData: CreateCriterionData = {
        title: 'Test Criterion',
        description: 'Test description',
        weight: -1.0, // Invalid: negative weight
        uueStage: 'UNDERSTAND',
        assessmentType: 'QUESTION_BASED',
        masteryThreshold: 0.8,
        knowledgePrimitiveId: 'primitive-1',
        blueprintSectionId: 'section-1',
        userId: 1
      };

      await expect(service.createCriterion(createData)).rejects.toThrow('Weight must be positive');
    });

    it('should validate UUE stage is valid', async () => {
      const createData: CreateCriterionData = {
        title: 'Test Criterion',
        description: 'Test description',
        weight: 1.0,
        uueStage: 'INVALID_STAGE' as any, // Invalid UUE stage
        assessmentType: 'QUESTION_BASED',
        masteryThreshold: 0.8,
        knowledgePrimitiveId: 'primitive-1',
        blueprintSectionId: 'section-1',
        userId: 1
      };

      await expect(service.createCriterion(createData)).rejects.toThrow('Invalid UUE stage');
    });
  });

  describe('performance considerations', () => {
    it('should handle large numbers of criteria efficiently', async () => {
      const sectionId = 'section-1';
      const largeCriteria = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        title: `Criterion ${i}`,
        weight: 1.0 + (i % 3) * 0.5
      }));

      mockPrisma.masteryCriterion.findMany.mockResolvedValue(largeCriteria);

      const startTime = Date.now();
      const result = await service.getCriteriaBySection(sectionId);
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
