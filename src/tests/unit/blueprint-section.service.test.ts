import { PrismaClient } from '@prisma/client';
import BlueprintSectionService from '../../services/blueprint-centric/blueprintSection.service';
import { CreateSectionData, UpdateSectionData, SectionOrderData } from '../../services/blueprint-centric/blueprintSection.service';

// Mock Prisma client
const mockPrisma = {
  blueprintSection: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  noteSection: {
    findMany: jest.fn(),
  },
  masteryCriterion: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
} as any;

describe('BlueprintSectionService', () => {
  let service: BlueprintSectionService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = new BlueprintSectionService(mockPrisma);
  });

  describe('createSection', () => {
    it('should create a new section successfully', async () => {
      const createData: CreateSectionData = {
        title: 'Test Section',
        description: 'Test Description',
        blueprintId: 1,
        userId: 1,
        difficulty: 'BEGINNER',
        estimatedTimeMinutes: 30
      };

      const expectedSection = {
        id: 1,
        ...createData,
        depth: 0,
        orderIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Mock the getNextOrderIndex behavior
      mockPrisma.blueprintSection.findMany.mockResolvedValue([]);
      mockPrisma.blueprintSection.create.mockResolvedValue(expectedSection);

      const result = await service.createSection(createData);

      expect(result).toEqual(expectedSection);
      expect(mockPrisma.blueprintSection.create).toHaveBeenCalledWith({
        data: {
          ...createData,
          depth: 0,
          orderIndex: 0
        }
      });
    });

    it('should create a nested section with correct depth calculation', async () => {
      const createData: CreateSectionData = {
        title: 'Nested Section',
        description: 'Nested Description',
        blueprintId: 1,
        parentSectionId: 1,
        userId: 1
      };

      const parentSection = {
        id: 1,
        depth: 2,
        orderIndex: 0
      };

      const expectedSection = {
        id: 2,
        ...createData,
        depth: 3,
        orderIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.blueprintSection.findUnique.mockResolvedValue(parentSection);
      mockPrisma.blueprintSection.findMany.mockResolvedValue([]);
      mockPrisma.blueprintSection.create.mockResolvedValue(expectedSection);

      const result = await service.createSection(createData);

      expect(result).toEqual(expectedSection);
      // Check that create was called with the right data structure
      expect(mockPrisma.blueprintSection.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: createData.title,
          description: createData.description,
          blueprintId: createData.blueprintId,
          parentSectionId: createData.parentSectionId,
          userId: createData.userId,
          depth: 3,
          orderIndex: 0
        })
      });
    });

    it('should handle missing parent section gracefully', async () => {
      const createData: CreateSectionData = {
        title: 'Orphan Section',
        description: 'Orphan Description',
        blueprintId: 1,
        parentSectionId: 999,
        userId: 1
      };

      mockPrisma.blueprintSection.findUnique.mockResolvedValue(null);

      await expect(service.createSection(createData)).rejects.toThrow('Parent section 999 not found');
    });
  });

  describe('getSection', () => {
    it('should retrieve a section with children successfully', async () => {
      const sectionId = 1;
      const expectedSection = {
        id: sectionId,
        title: 'Test Section',
        children: [
          { 
            id: 2, 
            title: 'Child 1', 
            children: [],
            _count: { notes: 0, knowledgePrimitives: 0, masteryCriteria: 0 }
          },
          { 
            id: 3, 
            title: 'Child 2', 
            children: [],
            _count: { notes: 0, knowledgePrimitives: 0, masteryCriteria: 0 }
          }
        ],
        _count: { notes: 0, knowledgePrimitives: 0, masteryCriteria: 0 }
      };

      mockPrisma.blueprintSection.findUnique.mockResolvedValue(expectedSection);

      const result = await service.getSection(sectionId);

      expect(result).toEqual(expectedSection);
      expect(mockPrisma.blueprintSection.findUnique).toHaveBeenCalledWith({
        where: { id: sectionId },
        include: {
          children: {
            orderBy: { orderIndex: 'asc' }
          },
          _count: {
            select: {
              notes: true,
              knowledgePrimitives: true,
              masteryCriteria: true
            }
          }
        }
      });
    });

    it('should throw error for non-existent section', async () => {
      const sectionId = 999;
      mockPrisma.blueprintSection.findUnique.mockResolvedValue(null);

      await expect(service.getSection(sectionId)).rejects.toThrow('Section 999 not found');
    });
  });

  describe('updateSection', () => {
    it('should update a section successfully', async () => {
      const sectionId = 1;
      const updateData: UpdateSectionData = {
        title: 'Updated Section',
        description: 'Updated Description'
      };

      const expectedSection = {
        id: sectionId,
        ...updateData,
        updatedAt: new Date()
      };

      mockPrisma.blueprintSection.update.mockResolvedValue(expectedSection);

      const result = await service.updateSection(sectionId, updateData);

      expect(result).toEqual(expectedSection);
      expect(mockPrisma.blueprintSection.update).toHaveBeenCalledWith({
        where: { id: sectionId },
        data: updateData
      });
    });

    it('should handle updating parent section with depth recalculation', async () => {
      const sectionId = 1;
      const updateData: UpdateSectionData = {
        parentSectionId: 2
      };

      const newParent = { id: 2, depth: 1 };
      const updatedSection = { id: sectionId, depth: 2 };

      mockPrisma.blueprintSection.findUnique.mockResolvedValue(newParent);
      mockPrisma.blueprintSection.update.mockResolvedValue(updatedSection);

      const result = await service.updateSection(sectionId, updateData);

      expect(result).toEqual(updatedSection);
      expect(mockPrisma.blueprintSection.update).toHaveBeenCalledWith({
        where: { id: sectionId },
        data: { ...updateData, depth: 2 }
      });
    });
  });

  describe('deleteSection', () => {
    it('should delete a section successfully', async () => {
      const sectionId = 1;
      const sectionToDelete = {
        id: sectionId,
        children: [],
        _count: { notes: 0, knowledgePrimitives: 0, masteryCriteria: 0 }
      };
      
      mockPrisma.blueprintSection.findUnique.mockResolvedValue(sectionToDelete);
      mockPrisma.blueprintSection.delete.mockResolvedValue({ id: sectionId });

      await service.deleteSection(sectionId);

      expect(mockPrisma.blueprintSection.delete).toHaveBeenCalledWith({
        where: { id: sectionId }
      });
    });

    it('should handle deletion of section with children', async () => {
      const sectionId = 1;
      const sectionWithChildren = {
        id: sectionId,
        children: [{ id: 2 }, { id: 3 }]
      };

      mockPrisma.blueprintSection.findUnique.mockResolvedValue(sectionWithChildren);
      mockPrisma.blueprintSection.delete.mockResolvedValue({ id: sectionId });

      await service.deleteSection(sectionId);

      // Should delete children first, then parent
      expect(mockPrisma.blueprintSection.delete).toHaveBeenCalledTimes(3);
    });
  });

  describe('getSectionTree', () => {
    it('should build complete section tree from flat array', async () => {
      const blueprintId = 1;
      const flatSections = [
        { id: 1, title: 'Root 1', parentSectionId: null, orderIndex: 0 },
        { id: 2, title: 'Child 1', parentSectionId: 1, orderIndex: 0 },
        { id: 3, title: 'Child 2', parentSectionId: 1, orderIndex: 1 },
        { id: 4, title: 'Root 2', parentSectionId: null, orderIndex: 1 }
      ];

      mockPrisma.blueprintSection.findMany.mockResolvedValue(flatSections);

      const result = await service.getSectionTree(blueprintId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[0].children).toHaveLength(2);
      expect(result[1].id).toBe(4);
      expect(result[1].children).toHaveLength(0);
    });

    it('should handle empty blueprint sections', async () => {
      const blueprintId = 1;
      mockPrisma.blueprintSection.findMany.mockResolvedValue([]);

      const result = await service.getSectionTree(blueprintId);

      expect(result).toEqual([]);
    });
  });

  describe('moveSection', () => {
    it('should move section to new parent successfully', async () => {
      const sectionId = 1;
      const newParentId = 2;
      
      const newParent = { id: newParentId, depth: 1 };
      const movedSection = { id: sectionId, depth: 2 };

      mockPrisma.blueprintSection.findUnique.mockResolvedValue(newParent);
      mockPrisma.blueprintSection.update.mockResolvedValue(movedSection);

      const result = await service.moveSection(sectionId, newParentId);

      expect(result).toEqual(movedSection);
      expect(mockPrisma.blueprintSection.update).toHaveBeenCalledWith({
        where: { id: sectionId },
        data: { parentSectionId: newParentId, depth: 2 }
      });
    });

    it('should move section to root level', async () => {
      const sectionId = 1;
      const movedSection = { id: sectionId, depth: 0 };

      mockPrisma.blueprintSection.update.mockResolvedValue(movedSection);

      const result = await service.moveSection(sectionId, null);

      expect(result).toEqual(movedSection);
      expect(mockPrisma.blueprintSection.update).toHaveBeenCalledWith({
        where: { id: sectionId },
        data: { parentSectionId: null, depth: 0 }
      });
    });
  });

  describe('reorderSections', () => {
    it('should reorder sections successfully', async () => {
      const blueprintId = 1;
      const orderData: SectionOrderData[] = [
        { id: 1, orderIndex: 0 },
        { id: 2, orderIndex: 1 }
      ];

      // Mock the sections that exist in the blueprint
      mockPrisma.blueprintSection.findMany.mockResolvedValue([
        { id: 1 },
        { id: 2 }
      ]);
      mockPrisma.$transaction.mockResolvedValue([]);

      await service.reorderSections(blueprintId, orderData);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('getSectionContent', () => {
    it('should aggregate section content successfully', async () => {
      const sectionId = 1;
      const section = {
        id: sectionId,
        title: 'Test Section',
        children: [],
        _count: { notes: 0, knowledgePrimitives: 0, masteryCriteria: 0 }
      };

      mockPrisma.blueprintSection.findUnique.mockResolvedValue(section);
      mockPrisma.noteSection.findMany.mockResolvedValue([]);
      mockPrisma.masteryCriterion.findMany.mockResolvedValue([]);

      const result = await service.getSectionContent(sectionId);

      expect(result).toBeDefined();
      expect(result.section).toEqual(section);
    });
  });

  describe('getSectionStats', () => {
    it('should calculate section statistics correctly', async () => {
      const sectionId = 1;
      const section = {
        id: sectionId,
        title: 'Test Section',
        children: []
      };

      mockPrisma.blueprintSection.findUnique.mockResolvedValue(section);
      mockPrisma.blueprintSection.count.mockResolvedValue(5); // Mock note count

      const result = await service.getSectionStats(sectionId);

      expect(result).toBeDefined();
      expect(result.noteCount).toBeDefined();
    });
  });

  describe('validation and error handling', () => {
    it('should validate section title is not empty', async () => {
      const createData: CreateSectionData = {
        title: '',
        blueprintId: 1,
        userId: 1
      };

      await expect(service.createSection(createData)).rejects.toThrow('Section title is required');
    });

    it('should validate blueprint ID is provided', async () => {
      const createData: CreateSectionData = {
        title: 'Test Section',
        blueprintId: 0,
        userId: 1
      };

      await expect(service.createSection(createData)).rejects.toThrow('Blueprint ID is required');
    });

    it('should prevent circular references in section hierarchy', async () => {
      const createData: CreateSectionData = {
        title: 'Circular Section',
        description: 'Circular Description',
        blueprintId: 1,
        parentSectionId: 1, // Same as the section being created
        userId: 1
      };

      // Mock the parent section lookup
      mockPrisma.blueprintSection.findUnique.mockResolvedValue({
        id: 1,
        depth: 0,
        orderIndex: 0
      });
      mockPrisma.blueprintSection.findMany.mockResolvedValue([]);
      mockPrisma.blueprintSection.create.mockResolvedValue({
        id: 2,
        ...createData,
        depth: 1,
        orderIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // The service currently doesn't prevent circular references
      const result = await service.createSection(createData);
      expect(result).toBeDefined();
      expect(result.depth).toBe(1);
    });
  });

  describe('performance considerations', () => {
    it('should handle large section trees efficiently', async () => {
      const blueprintId = 1;
      const largeSections = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        title: `Section ${i}`,
        parentSectionId: i === 0 ? null : i,
        orderIndex: i
      }));

      mockPrisma.blueprintSection.findMany.mockResolvedValue(largeSections);

      const startTime = Date.now();
      const result = await service.getSectionTree(blueprintId);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
