import { PrismaClient, PrimitiveRelationshipType } from '@prisma/client';
import MasteryCriterionService from '../services/blueprint-centric/masteryCriterion.service';
import BlueprintCentricService from '../services/blueprint-centric/blueprintCentric.service';

// Mock Prisma client
const mockPrisma = {
  masteryCriterion: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn()
  },
  masteryCriterionPrimitive: {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn()
  },
  knowledgePrimitive: {
    findUnique: jest.fn(),
    findMany: jest.fn()
  },
  blueprintSection: {
    findUnique: jest.fn()
  }
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

describe('Multi-Primitive Mastery Criteria System', () => {
  let masteryCriterionService: MasteryCriterionService;
  let blueprintCentricService: BlueprintCentricService;

  beforeEach(() => {
    jest.clearAllMocks();
    masteryCriterionService = new MasteryCriterionService(mockPrisma as any);
    blueprintCentricService = new BlueprintCentricService(mockPrisma as any);
  });

  describe('MasteryCriterionService', () => {
    describe('createMultiPrimitiveCriterion', () => {
      it('should create a multi-primitive criterion successfully', async () => {
        const mockCriterion = {
          id: 1,
          title: 'Test Multi-Primitive Criterion',
          description: 'Test description',
          weight: 2.0,
          uueStage: 'USE' as const,
          assessmentType: 'QUESTION_BASED' as const,
          masteryThreshold: 0.8,
          knowledgePrimitiveId: 'primitive_1',
          blueprintSectionId: 1,
          userId: 1,
          estimatedPrimitiveCount: 3,
          maxPrimitives: 10,
          relationshipComplexity: 2.5,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const mockPrimitive = {
          primitiveId: 'primitive_1',
          title: 'Test Primitive',
          description: 'Test primitive description'
        };

        const mockSection = {
          id: 1,
          title: 'Test Section'
        };

        mockPrisma.knowledgePrimitive.findUnique.mockResolvedValue(mockPrimitive);
        mockPrisma.blueprintSection.findUnique.mockResolvedValue(mockSection);
        mockPrisma.masteryCriterion.create.mockResolvedValue(mockCriterion);
        mockPrisma.masteryCriterionPrimitive.create.mockResolvedValue({
          id: 1,
          criterionId: 1,
          primitiveId: 'primitive_1',
          relationshipType: 'PRIMARY',
          weight: 1.0,
          strength: 0.8
        });

        const result = await masteryCriterionService.createMultiPrimitiveCriterion({
          title: 'Test Multi-Primitive Criterion',
          description: 'Test description',
          weight: 2.0,
          uueStage: 'USE',
          assessmentType: 'QUESTION_BASED',
          masteryThreshold: 0.8,
          blueprintSectionId: '1',
          userId: 1,
          primitives: [
            {
              primitiveId: 'primitive_1',
              relationshipType: 'PRIMARY',
              weight: 1.0,
              strength: 0.8
            }
          ]
        });

        expect(result).toBeDefined();
        expect(mockPrisma.masteryCriterion.create).toHaveBeenCalled();
        expect(mockPrisma.masteryCriterionPrimitive.create).toHaveBeenCalled();
      });

      it('should validate primitive count limits', async () => {
        const mockSection = {
          id: 1,
          title: 'Test Section'
        };

        mockPrisma.blueprintSection.findUnique.mockResolvedValue(mockSection);

        await expect(
          masteryCriterionService.createMultiPrimitiveCriterion({
            title: 'Test Criterion',
            description: 'Test description',
            weight: 1.0,
            uueStage: 'UNDERSTAND',
            assessmentType: 'QUESTION_BASED',
            masteryThreshold: 0.8,
            blueprintSectionId: '1',
            userId: 1,
            maxPrimitives: 2,
            primitives: [
              { primitiveId: 'primitive_1' },
              { primitiveId: 'primitive_2' },
              { primitiveId: 'primitive_3' }
            ]
          })
        ).rejects.toThrow('Maximum 2 primitives allowed');
      });
    });

    describe('linkPrimitiveToCriterion', () => {
      it('should link a primitive to a criterion successfully', async () => {
        const mockCriterion = {
          id: 1,
          title: 'Test Criterion',
          maxPrimitives: 10
        };

        const mockPrimitive = {
          primitiveId: 'primitive_1',
          title: 'Test Primitive'
        };

        const mockRelationship = {
          id: 1,
          criterionId: 1,
          primitiveId: 'primitive_1',
          relationshipType: 'SECONDARY',
          weight: 0.8,
          strength: 0.6
        };

        mockPrisma.masteryCriterion.findUnique.mockResolvedValue(mockCriterion);
        mockPrisma.knowledgePrimitive.findUnique.mockResolvedValue(mockPrimitive);
        mockPrisma.masteryCriterionPrimitive.findUnique.mockResolvedValue(null);
        mockPrisma.masteryCriterionPrimitive.count.mockResolvedValue(1);
        mockPrisma.masteryCriterionPrimitive.create.mockResolvedValue(mockRelationship);

        const result = await masteryCriterionService.linkPrimitiveToCriterion(
          1,
          'primitive_1',
          'SECONDARY',
          0.8,
          0.6
        );

        expect(result).toEqual(mockRelationship);
        expect(mockPrisma.masteryCriterionPrimitive.create).toHaveBeenCalledWith({
          data: {
            criterionId: 1,
            primitiveId: 'primitive_1',
            relationshipType: 'SECONDARY',
            weight: 0.8,
            strength: 0.6
          }
        });
      });
    });
  });

  describe('BlueprintCentricService', () => {
    describe('validatePrimitiveRelationships', () => {
      it('should validate UUE stage complexity rules correctly', async () => {
        const result = await blueprintCentricService.validatePrimitiveRelationships(
          ['primitive_1', 'primitive_2', 'primitive_3'],
          'UNDERSTAND'
        );

        expect(result.warnings).toContain('UNDERSTAND stage typically has 1-2 primitives');
        expect(result.isValid).toBe(true);
      });

      it('should detect duplicate primitive IDs', async () => {
        const result = await blueprintCentricService.validatePrimitiveRelationships(
          ['primitive_1', 'primitive_1'],
          'USE'
        );

        expect(result.errors).toContain('Duplicate primitive IDs are not allowed');
        expect(result.isValid).toBe(false);
      });
    });

    describe('calculateUueStageComplexity', () => {
      it('should recommend appropriate UUE stage based on primitive count', async () => {
        const result = await blueprintCentricService.calculateUueStageComplexity(['primitive_1', 'primitive_2']);

        expect(result.uueStage).toBe('UNDERSTAND');
        expect(result.recommendations).toContain('Consider adding more primitives for USE stage');
      });

      it('should suggest USE stage for 3-4 primitives', async () => {
        const result = await blueprintCentricService.calculateUueStageComplexity([
          'primitive_1', 'primitive_2', 'primitive_3'
        ]);

        expect(result.uueStage).toBe('USE');
        expect(result.recommendations).toContain('Good complexity for USE stage');
      });

      it('should suggest EXPLORE stage for 5+ primitives', async () => {
        const result = await blueprintCentricService.calculateUueStageComplexity([
          'primitive_1', 'primitive_2', 'primitive_3', 'primitive_4', 'primitive_5'
        ]);

        expect(result.uueStage).toBe('EXPLORE');
        expect(result.recommendations).toContain('Complex criteria suitable for EXPLORE stage');
      });
    });

    describe('generateMultiPrimitiveCriteria', () => {
      it('should throw error for stub implementation', async () => {
        await expect(
          blueprintCentricService.generateMultiPrimitiveCriteria({
            blueprintId: 1,
            uueStage: 'USE',
            userId: 1
          })
        ).rejects.toThrow('AI-powered multi-primitive criteria generation not yet implemented');
      });
    });
  });
});
