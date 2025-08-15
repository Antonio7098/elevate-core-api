import { PrismaClient, BlueprintSection } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// INTERFACES
// ============================================================================

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
    estimatedTimeMinutes: number;
  };
}

export interface HierarchyValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  circularReferences: number[];
  orphanedSections: number[];
}

export interface SectionMoveResult {
  success: boolean;
  section: BlueprintSectionTree;
  depthChanges: number;
  affectedSections: number[];
}

// ============================================================================
// SECTION HIERARCHY MANAGER SERVICE
// ============================================================================

export class SectionHierarchyManager {
  
  /**
   * Builds a complete section tree from flat section array
   * Time Complexity: O(n) where n = number of sections
   * Space Complexity: O(n) for the tree structure
   */
  buildSectionTree(sections: BlueprintSection[]): BlueprintSectionTree[] {
    const sectionMap = new Map<number, BlueprintSection & { children: BlueprintSection[] }>();
    const rootSections: (BlueprintSection & { children: BlueprintSection[] })[] = [];
    
    // First pass: create lookup map with children array
    sections.forEach(section => {
      sectionMap.set(section.id, { ...section, children: [] });
    });
    
    // Second pass: build hierarchy
    sections.forEach(section => {
      if (section.parentSectionId) {
        const parent = sectionMap.get(section.parentSectionId);
        if (parent) {
          parent.children.push(sectionMap.get(section.id)!);
        }
      } else {
        rootSections.push(sectionMap.get(section.id)!);
      }
    });
    
    // Sort by orderIndex at each level and convert to BlueprintSectionTree
    const sortAndConvertSections = (sections: (BlueprintSection & { children: BlueprintSection[] })[]): BlueprintSectionTree[] => {
      return sections.sort((a, b) => a.orderIndex - b.orderIndex)
        .map(section => ({
          id: section.id,
          title: section.title,
          description: section.description,
          depth: section.depth,
          orderIndex: section.orderIndex,
          difficulty: section.difficulty,
          estimatedTimeMinutes: section.estimatedTimeMinutes,
          children: sortAndConvertSections(section.children as (BlueprintSection & { children: BlueprintSection[] })[]),
          stats: {
            noteCount: 0, // Will be calculated when needed
            questionCount: 0,
            masteryProgress: 0,
            estimatedTimeMinutes: section.estimatedTimeMinutes || 0
          }
        }));
    };
    
    return sortAndConvertSections(rootSections);
  }
  
  /**
   * Calculates optimal section depth and prevents circular references
   * Time Complexity: O(n) where n = number of sections
   */
  async calculateSectionDepth(sections: BlueprintSection[]): Promise<Map<number, number>> {
    const depthMap = new Map<number, number>();
    const visited = new Set<number>();
    
    const calculateDepth = (sectionId: number, currentDepth: number = 0): number => {
      if (visited.has(sectionId)) {
        throw new Error(`Circular reference detected in section ${sectionId}`);
      }
      
      if (depthMap.has(sectionId)) {
        return depthMap.get(sectionId)!;
      }
      
      visited.add(sectionId);
      const section = sections.find(s => s.id === sectionId);
      
      if (!section) {
        visited.delete(sectionId);
        return 0;
      }
      
      let maxChildDepth = 0;
      if (section.parentSectionId) {
        maxChildDepth = calculateDepth(section.parentSectionId, currentDepth + 1);
      }
      
      const depth = Math.max(currentDepth, maxChildDepth);
      depthMap.set(sectionId, depth);
      visited.delete(sectionId);
      
      return depth;
    };
    
    sections.forEach(section => {
      if (!depthMap.has(section.id)) {
        calculateDepth(section.id);
      }
    });
    
    return depthMap;
  }
  
  /**
   * Validates the entire section hierarchy
   */
  async validateHierarchy(blueprintId: number): Promise<HierarchyValidationResult> {
    const sections = await prisma.blueprintSection.findMany({
      where: { blueprintId },
      orderBy: [{ depth: 'asc' }, { orderIndex: 'asc' }]
    });
    
    const result: HierarchyValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      circularReferences: [],
      orphanedSections: []
    };
    
    // Check for circular references
    try {
      await this.calculateSectionDepth(sections);
    } catch (error) {
      result.isValid = false;
      result.errors.push(error.message);
      result.circularReferences.push(error.message);
    }
    
    // Check for orphaned sections (sections with invalid parent references)
    const validSectionIds = new Set(sections.map(s => s.id));
    sections.forEach(section => {
      if (section.parentSectionId && !validSectionIds.has(section.parentSectionId)) {
        result.isValid = false;
        result.errors.push(`Section ${section.id} references invalid parent ${section.parentSectionId}`);
        result.orphanedSections.push(section.id);
      }
    });
    
    // Check for depth inconsistencies
    const depthMap = new Map<number, number>();
    sections.forEach(section => {
      if (section.parentSectionId) {
        const parent = sections.find(s => s.id === section.parentSectionId);
        if (parent) {
          const expectedDepth = parent.depth + 1;
          if (section.depth !== expectedDepth) {
            result.warnings.push(`Section ${section.id} has depth ${section.depth}, expected ${expectedDepth}`);
          }
        }
      }
    });
    
    // Check for order index conflicts
    const orderMap = new Map<number | 'root', Set<number>>();
    sections.forEach(section => {
      const key = section.parentSectionId || 'root';
      if (!orderMap.has(key)) {
        orderMap.set(key, new Set());
      }
      if (orderMap.get(key)!.has(section.orderIndex)) {
        result.warnings.push(`Duplicate order index ${section.orderIndex} in ${key === 'root' ? 'root' : `parent ${key}`}`);
      }
      orderMap.get(key)!.add(section.orderIndex);
    });
    
    // Check for maximum depth limit
    const maxDepth = Math.max(...sections.map(s => s.depth));
    if (maxDepth > 10) {
      result.warnings.push(`Maximum depth of ${maxDepth} exceeds recommended limit of 10`);
    }
    
    return result;
  }
  
  /**
   * Prevents circular references when building hierarchy
   */
  private preventCircularReferences(sections: BlueprintSection[]): boolean {
    const visited = new Set<number>();
    const recursionStack = new Set<number>();
    
    const hasCycle = (sectionId: number): boolean => {
      if (recursionStack.has(sectionId)) {
        return true; // Cycle detected
      }
      
      if (visited.has(sectionId)) {
        return false; // Already processed
      }
      
      visited.add(sectionId);
      recursionStack.add(sectionId);
      
      const section = sections.find(s => s.id === sectionId);
      if (section?.parentSectionId) {
        if (hasCycle(section.parentSectionId)) {
          return true;
        }
      }
      
      recursionStack.delete(sectionId);
      return false;
    };
    
    for (const section of sections) {
      if (hasCycle(section.id)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Optimizes section hierarchy for better performance
   */
  async optimizeHierarchy(blueprintId: number): Promise<{
    optimized: boolean;
    changes: string[];
    performance: {
      maxDepth: number;
      averageDepth: number;
      totalSections: number;
    };
  }> {
    const sections = await prisma.blueprintSection.findMany({
      where: { blueprintId }
    });
    
    const changes: string[] = [];
    let optimized = false;
    
    // Recalculate depths if needed
    const depthMap = await this.calculateSectionDepth(sections);
    for (const section of sections) {
      const expectedDepth = depthMap.get(section.id) || 0;
      if (section.depth !== expectedDepth) {
        await prisma.blueprintSection.update({
          where: { id: section.id },
          data: { depth: expectedDepth }
        });
        changes.push(`Updated section ${section.id} depth from ${section.depth} to ${expectedDepth}`);
        optimized = true;
      }
    }
    
    // Optimize order indices if needed
    const sectionsByParent = this.groupSectionsByParent(sections);
    for (const [parentId, parentSections] of Object.entries(sectionsByParent)) {
      const sortedSections = parentSections.sort((a, b) => a.orderIndex - b.orderIndex);
      
      for (let i = 0; i < sortedSections.length; i++) {
        const expectedOrder = i + 1;
        if (sortedSections[i].orderIndex !== expectedOrder) {
          await prisma.blueprintSection.update({
            where: { id: sortedSections[i].id },
            data: { orderIndex: expectedOrder }
          });
          changes.push(`Updated section ${sortedSections[i].id} order from ${sortedSections[i].orderIndex} to ${expectedOrder}`);
          optimized = true;
        }
      }
    }
    
    // Calculate performance metrics
    const depths = Array.from(depthMap.values());
    const performance = {
      maxDepth: Math.max(...depths),
      averageDepth: depths.reduce((sum, depth) => sum + depth, 0) / depths.length,
      totalSections: sections.length
    };
    
    return { optimized, changes, performance };
  }
  
  /**
   * Groups sections by their parent for optimization
   */
  private groupSectionsByParent(sections: BlueprintSection[]): Record<string, BlueprintSection[]> {
    const grouped: Record<string, BlueprintSection[]> = {};
    
    sections.forEach(section => {
      const parentId = section.parentSectionId || 'root';
      if (!grouped[parentId]) {
        grouped[parentId] = [];
      }
      grouped[parentId].push(section);
    });
    
    return grouped;
  }
  
  /**
   * Moves a section to a new parent with validation
   */
  async moveSection(
    sectionId: number, 
    newParentId: number | null, 
    newOrderIndex?: number
  ): Promise<SectionMoveResult> {
    const section = await prisma.blueprintSection.findUnique({
      where: { id: sectionId }
    });
    
    if (!section) {
      throw new Error(`Section ${sectionId} not found`);
    }
    
    // Validate new parent
    let newParent: BlueprintSection | null = null;
    if (newParentId) {
      newParent = await prisma.blueprintSection.findUnique({
        where: { id: newParentId }
      });
      
      if (!newParent) {
        throw new Error(`New parent section ${newParentId} not found`);
      }
      
      // Check if moving would create a cycle
      if (await this.wouldCreateCycle(sectionId, newParentId)) {
        throw new Error(`Moving section ${sectionId} to ${newParentId} would create a circular reference`);
      }
    }
    
    // Calculate new depth
    const newDepth = newParent ? newParent.depth + 1 : 0;
    
    // Get new order index if not specified
    let finalOrderIndex = newOrderIndex;
    if (finalOrderIndex === undefined) {
      finalOrderIndex = await this.getNextOrderIndex(section.blueprintId, newParentId);
    }
    
    // Update the section
    await prisma.blueprintSection.update({
      where: { id: sectionId },
      data: {
        parentSectionId: newParentId,
        depth: newDepth,
        orderIndex: finalOrderIndex
      }
    });
    
    // Update all descendants
    const affectedSections = await this.updateDescendantDepths(sectionId, newDepth + 1);
    
    // Reorder siblings if needed
    if (newParentId) {
      await this.reorderSiblings(newParentId);
    }
    
    return {
      success: true,
      section: await this.buildSectionTree([await prisma.blueprintSection.findUnique({ where: { id: sectionId } })!])[0],
      depthChanges: Math.abs(newDepth - section.depth),
      affectedSections
    };
  }
  
  /**
   * Checks if moving a section would create a cycle
   */
  private async wouldCreateCycle(sectionId: number, newParentId: number): Promise<boolean> {
    const visited = new Set<number>();
    
    const checkCycle = async (currentId: number): Promise<boolean> => {
      if (currentId === sectionId) {
        return true; // Cycle detected
      }
      
      if (visited.has(currentId)) {
        return false; // Already checked
      }
      
      visited.add(currentId);
      
      const section = await prisma.blueprintSection.findUnique({
        where: { id: currentId }
      });
      
      if (section?.parentSectionId) {
        return await checkCycle(section.parentSectionId);
      }
      
      return false;
    };
    
    return await checkCycle(newParentId);
  }
  
  /**
   * Updates depths for all descendants of a section
   */
  private async updateDescendantDepths(sectionId: number, newDepth: number): Promise<number[]> {
    const affectedSections: number[] = [];
    
    const updateDescendants = async (currentId: number, currentDepth: number): Promise<void> => {
      const children = await prisma.blueprintSection.findMany({
        where: { parentSectionId: currentId }
      });
      
      for (const child of children) {
        await prisma.blueprintSection.update({
          where: { id: child.id },
          data: { depth: currentDepth }
        });
        
        affectedSections.push(child.id);
        await updateDescendants(child.id, currentDepth + 1);
      }
    };
    
    await updateDescendants(sectionId, newDepth);
    return affectedSections;
  }
  
  /**
   * Reorders siblings to maintain consistent ordering
   */
  private async reorderSiblings(parentId: number): Promise<void> {
    const siblings = await prisma.blueprintSection.findMany({
      where: { parentSectionId: parentId },
      orderBy: { orderIndex: 'asc' }
    });
    
    for (let i = 0; i < siblings.length; i++) {
      const expectedOrder = i + 1;
      if (siblings[i].orderIndex !== expectedOrder) {
        await prisma.blueprintSection.update({
          where: { id: siblings[i].id },
          data: { orderIndex: expectedOrder }
        });
      }
    }
  }
  
  /**
   * Gets the next available order index for a parent
   */
  private async getNextOrderIndex(blueprintId: number, parentSectionId?: number): Promise<number> {
    const maxOrder = await prisma.blueprintSection.aggregate({
      where: {
        blueprintId,
        parentSectionId
      },
      _max: {
        orderIndex: true
      }
    });
    
    return (maxOrder._max.orderIndex || 0) + 1;
  }
  
  /**
   * Flattens a section tree for easier processing
   */
  flattenSectionTree(tree: BlueprintSectionTree[]): BlueprintSectionTree[] {
    const flattened: BlueprintSectionTree[] = [];
    
    const flatten = (sections: BlueprintSectionTree[]) => {
      sections.forEach(section => {
        flattened.push(section);
        if (section.children.length > 0) {
          flatten(section.children);
        }
      });
    };
    
    flatten(tree);
    return flattened;
  }
  
  /**
   * Finds the path from root to a specific section
   */
  async findSectionPath(sectionId: number): Promise<BlueprintSectionTree[]> {
    const path: BlueprintSectionTree[] = [];
    
    const buildPath = async (currentId: number): Promise<void> => {
      const section = await prisma.blueprintSection.findUnique({
        where: { id: currentId }
      });
      
      if (!section) return;
      
      if (section.parentSectionId) {
        await buildPath(section.parentSectionId);
      }
      
      path.push({
        id: section.id,
        title: section.title,
        description: section.description,
        depth: section.depth,
        orderIndex: section.orderIndex,
        difficulty: section.difficulty,
        estimatedTimeMinutes: section.estimatedTimeMinutes,
        children: [],
        stats: {
          noteCount: 0,
          questionCount: 0,
          masteryProgress: 0,
          estimatedTimeMinutes: 0
        }
      });
    };
    
    await buildPath(sectionId);
    return path;
  }
}

export default SectionHierarchyManager;
