import { PrismaClient, UueStage, PrimitiveRelationshipType } from '@prisma/client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface MultiPrimitiveCriteriaRequest {
  blueprintId: number;
  sectionId?: number;
  uueStage: UueStage;
  targetPrimitiveCount?: number;
  complexityPreference?: 'LOW' | 'MEDIUM' | 'HIGH';
  userId: number;
}

export interface GeneratedMultiPrimitiveCriteria {
  title: string;
  description: string;
  primitives: Array<{
    primitiveId: string;
    relationshipType: PrimitiveRelationshipType;
    weight: number;
    strength: number;
  }>;
  estimatedComplexity: number;
  uueStage: UueStage;
  validationResult: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

export interface RelationshipValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  circularDependencies: string[];
  prerequisiteChain: string[];
}

export interface UueStageComplexityResult {
  uueStage: UueStage;
  complexityScore: number;
  primitiveCount: number;
  relationshipStrength: number;
  recommendations: string[];
}

export interface PrimitiveDependencyMap {
  primitiveId: string;
  dependencies: string[];
  dependents: string[];
  depth: number;
  complexity: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export default class BlueprintCentricService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  // ============================================================================
  // AI-POWERED MULTI-PRIMITIVE CRITERIA GENERATION (STUB IMPLEMENTATION)
  // ============================================================================

  /**
   * STUB: This method will be implemented after AI functionality is available
   * Generates multi-primitive mastery criteria using AI analysis
   */
  async generateMultiPrimitiveCriteria(
    request: MultiPrimitiveCriteriaRequest
  ): Promise<GeneratedMultiPrimitiveCriteria[]> {
    // TODO: Implement AI-powered multi-primitive criteria generation
    // This will use LLM to analyze primitive relationships and generate appropriate criteria
    
    throw new Error('AI-powered multi-primitive criteria generation not yet implemented');
    
    // Future implementation will:
    // 1. Analyze blueprint content and primitive relationships
    // 2. Use LLM to suggest appropriate mastery criteria
    // 3. Validate relationships and complexity
    // 4. Return structured criteria with primitive mappings
  }

  // ============================================================================
  // RELATIONSHIP VALIDATION AND ANALYSIS
  // ============================================================================

  /**
   * Validates primitive relationships based on UUE stage
   */
  async validatePrimitiveRelationships(
    primitives: string[],
    uueStage: UueStage
  ): Promise<RelationshipValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const circularDependencies: string[] = [];
    const prerequisiteChain: string[] = [];

    // Check primitive count based on UUE stage
    const primitiveCount = primitives.length;
    switch (uueStage) {
      case 'UNDERSTAND':
        if (primitiveCount > 2) {
          warnings.push('UNDERSTAND stage typically has 1-2 primitives');
        }
        break;
      case 'USE':
        if (primitiveCount < 2 || primitiveCount > 4) {
          warnings.push('USE stage typically has 2-4 primitives');
        }
        break;
      case 'EXPLORE':
        if (primitiveCount < 4) {
          warnings.push('EXPLORE stage typically has 4+ primitives');
        }
        break;
    }

    // Check for duplicate primitives
    const uniquePrimitives = new Set(primitives);
    if (primitives.length !== uniquePrimitives.size) {
      errors.push('Duplicate primitive IDs are not allowed');
    }

    // Validate primitive existence
    for (const primitiveId of primitives) {
      const exists = await this.prisma.knowledgePrimitive.findUnique({
        where: { primitiveId }
      });
      if (!exists) {
        errors.push(`Knowledge primitive ${primitiveId} not found`);
      }
    }

    // Check for circular dependencies (basic implementation)
    // TODO: Implement more sophisticated circular dependency detection
    const dependencies = await this.buildPrimitiveDependencyMap(primitives);
    for (const dep of dependencies) {
      if (dep.dependencies.includes(dep.primitiveId)) {
        circularDependencies.push(`Circular dependency detected for ${dep.primitiveId}`);
      }
    }

    // Build prerequisite chain
    if (dependencies.length > 0) {
      const sortedDeps = dependencies.sort((a, b) => a.depth - b.depth);
      prerequisiteChain.push(...sortedDeps.map(d => d.primitiveId));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      circularDependencies,
      prerequisiteChain
    };
  }

  /**
   * Calculates UUE stage complexity based on primitive count and relationships
   */
  async calculateUueStageComplexity(
    primitives: string[]
  ): Promise<UueStageComplexityResult> {
    const primitiveCount = primitives.length;
    
    // Determine appropriate UUE stage based on primitive count
    let uueStage: UueStage;
    let complexityScore: number;
    let recommendations: string[] = [];

    if (primitiveCount <= 2) {
      uueStage = 'UNDERSTAND';
      complexityScore = Math.min(3.0, primitiveCount * 1.5);
      recommendations.push('Consider adding more primitives for USE stage');
    } else if (primitiveCount <= 4) {
      uueStage = 'USE';
      complexityScore = Math.min(7.0, 3.0 + (primitiveCount - 2) * 1.3);
      recommendations.push('Good complexity for USE stage');
    } else {
      uueStage = 'EXPLORE';
      complexityScore = Math.min(10.0, 7.0 + (primitiveCount - 4) * 0.8);
      recommendations.push('Complex criteria suitable for EXPLORE stage');
    }

    // Calculate relationship strength based on primitive relationships
    const relationships = await this.prisma.masteryCriterionPrimitive.findMany({
      where: {
        primitiveId: { in: primitives }
      }
    }) || [];

    const avgStrength = relationships.length > 0 
      ? relationships.reduce((sum, rel) => sum + rel.strength, 0) / relationships.length
      : 0.8;

    return {
      uueStage,
      complexityScore,
      primitiveCount,
      relationshipStrength: avgStrength,
      recommendations
    };
  }

  /**
   * Builds dependency map between primitives
   */
  async buildPrimitiveDependencyMap(
    primitives: string[]
  ): Promise<PrimitiveDependencyMap[]> {
    const dependencyMap: PrimitiveDependencyMap[] = [];

    for (const primitiveId of primitives) {
      // Get prerequisites for this primitive (primitives that this one depends on)
      const prerequisites = await this.prisma.knowledgePrimitive.findMany({
        where: {
          primitiveId: { in: primitives },
          prerequisiteForRelations: {
            some: {
              targetPrimitive: {
                primitiveId
              }
            }
          }
        }
      }) || [];

      // Get dependents of this primitive (primitives that depend on this one)
      const dependents = await this.prisma.knowledgePrimitive.findMany({
        where: {
          primitiveId: { in: primitives },
          requiresPrerequisites: {
            some: {
              sourcePrimitive: {
                primitiveId
              }
            }
          }
        }
      }) || [];

      // Calculate depth (how many prerequisites this primitive has)
      const depth = prerequisites.length;

      // Calculate complexity based on relationships
      const complexity = (prerequisites.length + dependents.length) / 2;

      dependencyMap.push({
        primitiveId,
        dependencies: prerequisites.map(p => p.primitiveId),
        dependents: dependents.map(d => d.primitiveId),
        depth,
        complexity
      });
    }

    return dependencyMap;
  }

  // ============================================================================
  // BLUEPRINT ANALYSIS AND OPTIMIZATION
  // ============================================================================

  /**
   * Analyzes blueprint section for optimal mastery criteria distribution
   */
  async analyzeBlueprintSection(sectionId: number): Promise<{
    sectionId: number;
    totalPrimitives: number;
    currentCriteria: number;
    recommendedCriteria: number;
    uueStageDistribution: Record<UueStage, number>;
    complexityGaps: string[];
  }> {
    const section = await this.prisma.blueprintSection.findUnique({
      where: { id: sectionId },
      include: {
        knowledgePrimitives: true,
        masteryCriteria: true
      }
    });

    if (!section) {
      throw new Error(`Blueprint section ${sectionId} not found`);
    }

    const totalPrimitives = section.knowledgePrimitives.length;
    const currentCriteria = section.masteryCriteria.length;
    
    // Calculate recommended criteria based on primitive count
    const recommendedCriteria = Math.max(1, Math.ceil(totalPrimitives / 3));

    // Analyze UUE stage distribution
    const uueStageDistribution = {
      UNDERSTAND: 0,
      USE: 0,
      EXPLORE: 0
    };

    section.masteryCriteria.forEach(criterion => {
      uueStageDistribution[criterion.uueStage]++;
    });

    // Identify complexity gaps
    const complexityGaps: string[] = [];
    if (uueStageDistribution.UNDERSTAND === 0 && totalPrimitives > 0) {
      complexityGaps.push('Missing UNDERSTAND stage criteria');
    }
    if (uueStageDistribution.USE === 0 && totalPrimitives > 2) {
      complexityGaps.push('Missing USE stage criteria');
    }
    if (uueStageDistribution.EXPLORE === 0 && totalPrimitives > 4) {
      complexityGaps.push('Missing EXPLORE stage criteria');
    }

    return {
      sectionId,
      totalPrimitives,
      currentCriteria,
      recommendedCriteria,
      uueStageDistribution,
      complexityGaps
    };
  }

  /**
   * Suggests optimal primitive groupings for mastery criteria
   */
  async suggestPrimitiveGroupings(
    sectionId: number,
    targetUueStage: UueStage
  ): Promise<Array<{
    primitives: string[];
    estimatedComplexity: number;
    reasoning: string;
  }>> {
    const section = await this.prisma.blueprintSection.findUnique({
      where: { id: sectionId },
      include: {
        knowledgePrimitives: {
          include: {
            prerequisiteForRelations: true,
            requiresPrerequisites: true
          }
        }
      }
    });

    if (!section) {
      throw new Error(`Blueprint section ${sectionId} not found`);
    }

    const suggestions: Array<{
      primitives: string[];
      estimatedComplexity: number;
      reasoning: string;
    }> = [];

    const primitives = section.knowledgePrimitives;
    
    // Simple grouping strategy based on UUE stage
    switch (targetUueStage) {
      case 'UNDERSTAND':
        // Group 1-2 related primitives
        for (let i = 0; i < primitives.length; i++) {
          suggestions.push({
            primitives: [primitives[i].primitiveId],
            estimatedComplexity: 1.0,
            reasoning: 'Single primitive for basic understanding'
          });
          
          if (i < primitives.length - 1) {
            suggestions.push({
              primitives: [primitives[i].primitiveId, primitives[i + 1].primitiveId],
              estimatedComplexity: 2.0,
              reasoning: 'Two related primitives for foundational concepts'
            });
          }
        }
        break;

      case 'USE':
        // Group 2-4 related primitives
        for (let i = 0; i < primitives.length - 2; i++) {
          const group = primitives.slice(i, i + 3).map(p => p.primitiveId);
          suggestions.push({
            primitives: group,
            estimatedComplexity: 3.0 + group.length * 0.5,
            reasoning: `${group.length} primitives for practical application`
          });
        }
        break;

      case 'EXPLORE':
        // Group 4+ related primitives
        if (primitives.length >= 4) {
          suggestions.push({
            primitives: primitives.map(p => p.primitiveId),
            estimatedComplexity: 7.0 + primitives.length * 0.3,
            reasoning: `${primitives.length} primitives for comprehensive exploration`
          });
        }
        break;
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }
}
