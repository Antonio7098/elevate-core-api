import { PrismaClient, DifficultyLevel } from '@prisma/client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CreateSectionData {
  title: string;
  description?: string;
  blueprintId: number;
  parentSectionId?: number;
  difficulty?: DifficultyLevel;
  estimatedTimeMinutes?: number;
  userId: number;
}

export interface UpdateSectionData {
  title?: string;
  description?: string;
  difficulty?: DifficultyLevel;
  estimatedTimeMinutes?: number;
  orderIndex?: number;
  parentSectionId?: number;
}

// Basic section interface
export interface BlueprintSection {
  id: number;
  title: string;
  description?: string;
  blueprintId: number;
  parentSectionId?: number;
  depth: number;
  orderIndex: number;
  difficulty: DifficultyLevel;
  estimatedTimeMinutes?: number;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

// Extend the basic section with additional properties
export interface BlueprintSectionWithChildren extends BlueprintSection {
  children: BlueprintSectionWithChildren[];
  _count: {
    notes: number;
    knowledgePrimitives: number;
    masteryCriteria: number;
  };
}

export interface BlueprintSectionTree {
  id: number;
  title: string;
  description?: string;
  depth: number;
  orderIndex: number;
  difficulty: string;
  estimatedTimeMinutes?: number;
  children: BlueprintSectionTree[];
  stats: {
    noteCount: number;
    questionCount: number;
    masteryProgress: number;
    estimatedTime: number;
  };
}

export interface SectionContent {
  section: BlueprintSectionWithChildren;
  notes: any[];
  questions: any[];
  masteryCriteria: any[];
  masteryProgress: number;
  estimatedTime: number;
}

export interface SectionStats {
  noteCount: number;
  questionCount: number;
  masteryProgress: number;
  estimatedTime: number;
  depth: number;
  childCount: number;
}

export interface SectionOrderData {
  id: number;
  orderIndex: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export default class BlueprintSectionService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Creates a new section
   */
  async createSection(data: CreateSectionData): Promise<BlueprintSection> {
    // Validate input
    if (!data.title?.trim()) {
      throw new Error('Section title is required');
    }
    if (!data.blueprintId) {
      throw new Error('Blueprint ID is required');
    }

    let depth = 0;
    if (data.parentSectionId) {
      const parent = await this.prisma.blueprintSection.findUnique({
        where: { id: data.parentSectionId }
      });
      if (!parent) {
        throw new Error(`Parent section ${data.parentSectionId} not found`);
      }
      depth = parent.depth + 1;
    }

    // Get next order index
    const orderIndex = await this.getNextOrderIndex(data.blueprintId, data.parentSectionId);

    // Create section
    return await this.prisma.blueprintSection.create({
      data: {
        title: data.title,
        description: data.description,
        blueprintId: data.blueprintId,
        parentSectionId: data.parentSectionId,
        depth,
        orderIndex,
        difficulty: data.difficulty || 'BEGINNER',
        estimatedTimeMinutes: data.estimatedTimeMinutes,
        userId: data.userId
      }
    });
  }

  /**
   * Gets a section by ID with its children and counts
   */
  async getSection(id: number): Promise<BlueprintSectionWithChildren> {
    const section = await this.prisma.blueprintSection.findUnique({
      where: { id },
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

    if (!section) {
      throw new Error(`Section ${id} not found`);
    }

    // Transform the result to match our interface
    return {
      ...section,
      children: section.children?.map(child => ({
        ...child,
        children: [],
        _count: { notes: 0, knowledgePrimitives: 0, masteryCriteria: 0 }
      })) || [],
      _count: section._count || { notes: 0, knowledgePrimitives: 0, masteryCriteria: 0 }
    };
  }

  /**
   * Updates a section
   */
  async updateSection(id: number, data: UpdateSectionData): Promise<BlueprintSection> {
    const updateData: any = { ...data };

    // If parent section is being updated, recalculate depth
    if (data.parentSectionId !== undefined) {
      let depth = 0;
      if (data.parentSectionId) {
        const parent = await this.prisma.blueprintSection.findUnique({
          where: { id: data.parentSectionId }
        });
        if (!parent) {
          throw new Error(`Parent section ${data.parentSectionId} not found`);
        }
        depth = parent.depth + 1;
      }
      updateData.depth = depth;
    }

    return await this.prisma.blueprintSection.update({
      where: { id },
      data: updateData
    });
  }

  /**
   * Deletes a section and its children recursively
   */
  async deleteSection(id: number): Promise<void> {
    const section = await this.getSection(id);
    await this.deleteSectionRecursively(section);
  }

  /**
   * Recursively deletes a section and its children
   */
  private async deleteSectionRecursively(section: BlueprintSectionWithChildren): Promise<void> {
    // Delete children first
    if (section.children && section.children.length > 0) {
      for (const child of section.children) {
        await this.deleteSectionRecursively(child);
      }
    }

    // Delete the section itself
    await this.prisma.blueprintSection.delete({
      where: { id: section.id }
    });
  }

  /**
   * Moves a section to a new parent
   */
  async moveSection(sectionId: number, newParentId: number | null): Promise<BlueprintSection> {
    const section = await this.getSection(sectionId);
    const newParent = newParentId ? await this.getSection(newParentId) : null;

    let depth = 0;
    if (newParent) {
      depth = newParent.depth + 1;
    }

    return await this.prisma.blueprintSection.update({
      where: { id: sectionId },
      data: {
        parentSectionId: newParentId,
        depth
      }
    });
  }

  /**
   * Reorders sections within a blueprint
   */
  async reorderSections(blueprintId: number, sectionIds: SectionOrderData[]): Promise<void> {
    // Verify all sections belong to the blueprint
    const existingSections = await this.prisma.blueprintSection.findMany({
      where: { blueprintId },
      select: { id: true }
    });

    if (existingSections.length !== sectionIds.length) {
      throw new Error('Some sections do not belong to the specified blueprint');
    }

    // Update each section
    await this.prisma.$transaction(
      sectionIds.map(({ id, orderIndex }) =>
        this.prisma.blueprintSection.update({
          where: { id },
          data: { orderIndex }
        })
      )
    );
  }

  /**
   * Gets content for a section
   */
  async getSectionContent(id: number): Promise<SectionContent> {
    const section = await this.getSection(id);
    
    // Get notes
    const notes = await (this.prisma as any).noteSection.findMany({
      where: { blueprintSectionId: id },
      orderBy: { createdAt: 'desc' }
    });
    
    // Get mastery criteria
    const masteryCriteria = await this.prisma.masteryCriterion.findMany({
      where: { blueprintSectionId: id }
    });
    
    // Calculate mastery progress
    const masteryProgress = await this.calculateMasteryProgress(id);
    
    // Calculate estimated time
    const estimatedTime = this.calculateEstimatedTime(section, notes, masteryCriteria);
    
    return {
      section,
      notes,
      questions: [], // TODO: Implement when question model is available
      masteryCriteria,
      masteryProgress,
      estimatedTime
    };
  }

  /**
   * Gets section statistics
   */
  async getSectionStats(id: number): Promise<SectionStats> {
    const section = await this.getSection(id);
    
    const noteCount = section._count.notes;
    const questionCount = section._count.masteryCriteria;
    const masteryProgress = await this.calculateMasteryProgress(id);
    
    return {
      noteCount,
      questionCount,
      masteryProgress,
      estimatedTime: section.estimatedTimeMinutes || 0,
      depth: section.depth,
      childCount: section.children.length
    };
  }

  /**
   * Builds a complete section tree from flat sections
   */
  async getSectionTree(blueprintId: number): Promise<BlueprintSectionTree[]> {
    const sections = await this.prisma.blueprintSection.findMany({
      where: { blueprintId },
      orderBy: { orderIndex: 'asc' }
    });

    return this.buildSectionTree(sections);
  }

  /**
   * Builds section tree from flat array
   */
  private buildSectionTree(sections: BlueprintSection[]): BlueprintSectionTree[] {
    const sectionMap = new Map<number, BlueprintSectionTree>();
    const rootSections: BlueprintSectionTree[] = [];

    // Create section map
    for (const section of sections) {
      sectionMap.set(section.id, {
        id: section.id,
        title: section.title,
        description: section.description || undefined,
        depth: section.depth,
        orderIndex: section.orderIndex,
        difficulty: section.difficulty,
        estimatedTimeMinutes: section.estimatedTimeMinutes || undefined,
        children: [],
        stats: {
          noteCount: 0,
          questionCount: 0,
          masteryProgress: 0,
          estimatedTime: section.estimatedTimeMinutes || 0
        }
      });
    }

    // Build hierarchy
    for (const section of sections) {
      if (section.parentSectionId) {
        const parent = sectionMap.get(section.parentSectionId);
        if (parent) {
          parent.children.push(sectionMap.get(section.id)!);
        }
      } else {
        rootSections.push(sectionMap.get(section.id)!);
      }
    }

    // Sort sections recursively
    const sortSections = (sections: BlueprintSectionTree[]): BlueprintSectionTree[] => {
      return sections.sort((a, b) => a.orderIndex - b.orderIndex).map(section => ({
        ...section,
        children: sortSections(section.children)
      }));
    };

    return sortSections(rootSections);
  }

  /**
   * Gets the next order index for a section
   */
  private async getNextOrderIndex(blueprintId: number, parentSectionId?: number): Promise<number> {
    // Get all existing sections with their order indices
    const existingSections = await this.prisma.blueprintSection.findMany({
      where: {
        blueprintId,
        parentSectionId
      },
      select: {
        orderIndex: true
      },
      orderBy: {
        orderIndex: 'asc'
      }
    });

    // Find the first available gap
    let expectedIndex = 0;
    for (const section of existingSections) {
      if (section.orderIndex !== expectedIndex) {
        return expectedIndex;
      }
      expectedIndex++;
    }
    
    // If no gaps found, return the next index after the last one
    return expectedIndex;
  }

  /**
   * Calculates mastery progress for a section
   */
  private async calculateMasteryProgress(sectionId: number): Promise<number> {
    // TODO: Implement mastery progress calculation
    return 0;
  }

  /**
   * Calculates estimated time for a section
   */
  private calculateEstimatedTime(section: BlueprintSectionWithChildren, notes: any[], masteryCriteria: any[]): number {
    let totalTime = section.estimatedTimeMinutes || 0;
    
    // Add time for notes
    totalTime += notes.length * 5; // 5 minutes per note
    
    // Add time for mastery criteria
    totalTime += masteryCriteria.length * 10; // 10 minutes per criterion
    
    return totalTime;
  }
}
