import { PrismaClient } from '@prisma/client';
import ContextAssemblyService, { 
  ContextAssembly, 
  VectorSearchResult, 
  GraphTraversalResult,
  ContextOptions,
  UnifiedContext,
  UserContext
} from './contextAssembly.service';

const prisma = new PrismaClient();

// ============================================================================
// INTELLIGENT CONTEXT BUILDER SERVICE
// ============================================================================
// 
// This service builds comprehensive context for RAG responses by intelligently
// combining vector search results, graph traversal, and user context. It
// implements sophisticated ranking algorithms and content diversity optimization.
//
// Key Features:
// - Multi-source context assembly
// - Intelligent content ranking and filtering
// - Diversity-aware content selection
// - Context freshness and relevance optimization
// - Learning pathway integration
//
// Performance: Optimized for <300ms context building
//
// ============================================================================

export interface ContextBuildingResult {
  context: UnifiedContext;
  metadata: {
    processingTimeMs: number;
    sourcesUsed: string[];
    contentQuality: ContentQualityMetrics;
    diversityScore: number;
    relevanceScore: number;
  };
  recommendations: ContextRecommendation[];
}

export interface ContentQualityMetrics {
  averageRelevance: number;
  contentFreshness: number;
  sourceDiversity: number;
  complexityBalance: number;
  ueeProgression: number;
}

export interface ContextRecommendation {
  type: 'content' | 'learning_path' | 'user_goal' | 'difficulty_adjustment';
  priority: 'high' | 'medium' | 'low';
  description: string;
  action: string;
  confidence: number;
}

export interface DiversityOptimizationConfig {
  minDiversityScore: number;
  contentTypeWeights: {
    sections: number;
    primitives: number;
    notes: number;
    relationships: number;
  };
  complexitySpread: number;
  ueeStageBalance: boolean;
  sourceVariety: boolean;
}

export default class IntelligentContextBuilder {
  
  private contextAssemblyService: ContextAssemblyService;
  
  constructor() {
    this.contextAssemblyService = new ContextAssemblyService();
  }
  
  /**
   * Main context building method
   * Builds comprehensive context with intelligent optimization
   */
  async buildContext(
    query: string, 
    userId: number, 
    options: ContextOptions = {},
    diversityConfig?: DiversityOptimizationConfig
  ): Promise<ContextBuildingResult> {
    const startTime = Date.now();
    
    try {
      // 1. Build base context using assembly service
      const baseContext = await this.contextAssemblyService.assembleContext(
        query, 
        userId, 
        options
      );
      
      // 2. Apply intelligent content optimization
      const optimizedContext = await this.optimizeContextContent(
        baseContext, 
        options, 
        diversityConfig
      );
      
      // 3. Generate context recommendations
      const recommendations = await this.generateContextRecommendations(
        optimizedContext, 
        userId, 
        options
      );
      
      // 4. Calculate quality metrics
      const qualityMetrics = await this.calculateContentQualityMetrics(optimizedContext);
      
      // 5. Calculate diversity score
      const diversityScore = this.calculateDiversityScore(optimizedContext);
      
      const processingTime = Date.now() - startTime;
      
      return {
        context: optimizedContext,
        metadata: {
          processingTimeMs: processingTime,
          sourcesUsed: this.extractSourcesUsed(baseContext),
          contentQuality: qualityMetrics,
          diversityScore,
          relevanceScore: qualityMetrics.averageRelevance
        },
        recommendations
      };
      
    } catch (error) {
      console.error('Intelligent context building failed:', error);
      throw new Error(`Intelligent context building failed: ${error.message}`);
    }
  }
  
  /**
   * Optimizes context content for better quality and diversity
   */
  private async optimizeContextContent(
    context: ContextAssembly,
    options: ContextOptions,
    diversityConfig?: DiversityOptimizationConfig
  ): Promise<UnifiedContext> {
    const config = diversityConfig || this.getDefaultDiversityConfig();
    
    // 1. Apply content diversity optimization
    const diversifiedContent = await this.applyDiversityOptimization(
      context, 
      config
    );
    
    // 2. Balance complexity distribution
    const complexityBalanced = await this.balanceComplexityDistribution(
      diversifiedContent
    );
    
    // 3. Optimize UEE stage progression
    const ueeOptimized = await this.optimizeUeeProgression(
      complexityBalanced
    );
    
    // 4. Apply source variety optimization
    const sourceOptimized = await this.applySourceVarietyOptimization(
      ueeOptimized, 
      config
    );
    
    return sourceOptimized;
  }
  
  /**
   * Applies diversity optimization to content selection
   */
  private async applyDiversityOptimization(
    context: ContextAssembly,
    config: DiversityOptimizationConfig
  ): Promise<UnifiedContext> {
    const optimized: UnifiedContext = {
      content: {
        sections: [],
        primitives: [],
        notes: [],
        relationships: []
      },
      relationships: context.learningPath || [],
      learningPaths: context.criterionLearningPaths || [],
      userProgress: context.userProgress || null,
      metadata: context.metadata || {
        totalContent: 0,
        contentDistribution: { sections: 0, primitives: 0, notes: 0, relationships: 0 },
        confidence: 0
      }
    };
    
    // Optimize sections
    optimized.content.sections = this.optimizeSectionDiversity(
      context.relevantSections || [],
      config.contentTypeWeights.sections
    );
    
    // Optimize primitives
    optimized.content.primitives = this.optimizePrimitiveDiversity(
      context.relatedConcepts || [],
      config.contentTypeWeights.primitives
    );
    
    // Optimize notes
    optimized.content.notes = this.optimizeNoteDiversity(
      context.relevantNotes || [],
      config.contentTypeWeights.notes
    );
    
    // Optimize relationships
    optimized.content.relationships = this.optimizeRelationshipDiversity(
      context.learningPath || [],
      config.contentTypeWeights.relationships
    );
    
    return optimized;
  }
  
  /**
   * Balances complexity distribution across content
   */
  private async balanceComplexityDistribution(
    context: UnifiedContext
  ): Promise<UnifiedContext> {
    const balanced = { ...context };
    
    // Balance primitive complexity
    if (balanced.content.primitives.length > 0) {
      balanced.content.primitives = this.balancePrimitiveComplexity(
        balanced.content.primitives
      );
    }
    
    // Balance section difficulty
    if (balanced.content.sections.length > 0) {
      balanced.content.sections = this.balanceSectionDifficulty(
        balanced.content.sections
      );
    }
    
    return balanced;
  }
  
  /**
   * Optimizes UEE stage progression
   */
  private async optimizeUeeProgression(
    context: UnifiedContext
  ): Promise<UnifiedContext> {
    const optimized = { ...context };
    
    // Ensure UEE progression follows optimal order
    if (optimized.learningPaths.length > 0) {
      optimized.learningPaths = this.optimizeLearningPathUeeProgression(
        optimized.learningPaths
      );
    }
    
    // Balance UEE stages in content
    if (optimized.content.primitives.length > 0) {
      optimized.content.primitives = this.balanceUeeStages(
        optimized.content.primitives
      );
    }
    
    return optimized;
  }
  
  /**
   * Applies source variety optimization
   */
  private async applySourceVarietyOptimization(
    context: UnifiedContext,
    config: DiversityOptimizationConfig
  ): Promise<UnifiedContext> {
    if (!config.sourceVariety) return context;
    
    const optimized = { ...context };
    
    // Ensure content comes from diverse sources
    optimized.content.sections = this.ensureSourceVariety(
      optimized.content.sections,
      'blueprintSectionId'
    );
    
    optimized.content.primitives = this.ensureSourceVariety(
      optimized.content.primitives,
      'blueprintSectionId'
    );
    
    return optimized;
  }
  
  /**
   * Generates context recommendations
   */
  private async generateContextRecommendations(
    context: UnifiedContext,
    userId: number,
    options: ContextOptions
  ): Promise<ContextRecommendation[]> {
    const recommendations: ContextRecommendation[] = [];
    
    // Analyze content gaps
    const contentGaps = await this.analyzeContentGaps(context, userId);
    if (contentGaps.length > 0) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        description: `Content gaps detected in ${contentGaps.length} areas`,
        action: 'Consider adding more content in identified areas',
        confidence: 0.8
      });
    }
    
    // Analyze learning path opportunities
    const learningOpportunities = await this.analyzeLearningOpportunities(context, userId);
    if (learningOpportunities.length > 0) {
      recommendations.push({
        type: 'learning_path',
        priority: 'medium',
        description: `${learningOpportunities.length} learning path opportunities identified`,
        action: 'Explore suggested learning pathways',
        confidence: 0.7
      });
    }
    
    // Analyze user goal alignment
    const goalAlignment = await this.analyzeUserGoalAlignment(context, userId);
    if (goalAlignment.score < 0.7) {
      recommendations.push({
        type: 'user_goal',
        priority: 'medium',
        description: 'Content may not align with current learning goals',
        action: 'Review and adjust learning objectives',
        confidence: 0.6
      });
    }
    
    // Analyze difficulty balance
    const difficultyBalance = await this.analyzeDifficultyBalance(context);
    if (difficultyBalance.needsAdjustment) {
      recommendations.push({
        type: 'difficulty_adjustment',
        priority: 'low',
        description: 'Difficulty progression could be optimized',
        action: 'Consider adjusting content complexity sequence',
        confidence: 0.5
      });
    }
    
    return recommendations;
  }
  
  /**
   * Calculates content quality metrics
   */
  private async calculateContentQualityMetrics(
    context: UnifiedContext
  ): Promise<ContentQualityMetrics> {
    const sections = context.content.sections;
    const primitives = context.content.primitives;
    const notes = context.content.notes;
    
    // Calculate average relevance
    const allContent = [...sections, ...primitives, ...notes];
    const averageRelevance = allContent.length > 0 
      ? allContent.reduce((sum, item) => sum + (item.relevanceScore || 0), 0) / allContent.length
      : 0;
    
    // Calculate content freshness
    const contentFreshness = this.calculateContentFreshness(allContent);
    
    // Calculate source diversity
    const sourceDiversity = this.calculateSourceDiversity(context);
    
    // Calculate complexity balance
    const complexityBalance = this.calculateComplexityBalance(primitives);
    
    // Calculate UEE progression
    const ueeProgression = this.calculateUeeProgression(context);
    
    return {
      averageRelevance,
      contentFreshness,
      sourceDiversity,
      complexityBalance,
      ueeProgression
    };
  }
  
  /**
   * Calculates diversity score
   */
  private calculateDiversityScore(context: UnifiedContext): number {
    const sections = context.content.sections.length;
    const primitives = context.content.primitives.length;
    const notes = context.content.notes.length;
    const relationships = context.content.relationships.length;
    
    const total = sections + primitives + notes + relationships;
    if (total === 0) return 0;
    
    // Calculate diversity using Shannon entropy
    const proportions = [sections, primitives, notes, relationships].map(count => count / total);
    const entropy = proportions.reduce((sum, p) => {
      if (p > 0) return sum - p * Math.log2(p);
      return sum;
    }, 0);
    
    // Normalize to 0-1 range
    return entropy / Math.log2(4); // 4 content types
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  private getDefaultDiversityConfig(): DiversityOptimizationConfig {
    return {
      minDiversityScore: 0.6,
      contentTypeWeights: {
        sections: 0.3,
        primitives: 0.4,
        notes: 0.2,
        relationships: 0.1
      },
      complexitySpread: 0.5,
      ueeStageBalance: true,
      sourceVariety: true
    };
  }
  
  private optimizeSectionDiversity(sections: any[], targetCount: number): any[] {
    if (sections.length <= targetCount) return sections;
    
    // Sort by relevance and diversity
    return sections
      .sort((a, b) => {
        const relevanceDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
        if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;
        
        // Prefer sections from different depths for diversity
        return Math.abs(a.depth - b.depth);
      })
      .slice(0, targetCount);
  }
  
  private optimizePrimitiveDiversity(primitives: any[], targetCount: number): any[] {
    if (primitives.length <= targetCount) return primitives;
    
    // Sort by relevance and type diversity
    return primitives
      .sort((a, b) => {
        const relevanceDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
        if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;
        
        // Prefer different primitive types for diversity
        return a.primitiveType.localeCompare(b.primitiveType);
      })
      .slice(0, targetCount);
  }
  
  private optimizeNoteDiversity(notes: any[], targetCount: number): any[] {
    if (notes.length <= targetCount) return notes;
    
    // Sort by relevance and content diversity
    return notes
      .sort((a, b) => {
        const relevanceDiff = (b.relevanceScore || 0) - (a.relevanceScore || 0);
        if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;
        
        // Prefer notes from different sections for diversity
        return a.blueprintSectionId - b.blueprintSectionId;
      })
      .slice(0, targetCount);
  }
  
  private optimizeRelationshipDiversity(relationships: any[], targetCount: number): any[] {
    if (relationships.length <= targetCount) return relationships;
    
    // Sort by strength and type diversity
    return relationships
      .sort((a, b) => {
        const strengthDiff = (b.strength || 0) - (a.strength || 0);
        if (Math.abs(strengthDiff) > 0.1) return strengthDiff;
        
        // Prefer different relationship types for diversity
        return a.relationshipType.localeCompare(b.relationshipType);
      })
      .slice(0, targetCount);
  }
  
  private balancePrimitiveComplexity(primitives: any[]): any[] {
    if (primitives.length <= 1) return primitives;
    
    // Sort by complexity and interleave for balance
    const sorted = primitives.sort((a, b) => 
      (a.complexityScore || 0) - (b.complexityScore || 0)
    );
    
    const balanced: any[] = [];
    const mid = Math.floor(sorted.length / 2);
    
    for (let i = 0; i < mid; i++) {
      balanced.push(sorted[i]);
      if (i + mid < sorted.length) {
        balanced.push(sorted[i + mid]);
      }
    }
    
    return balanced;
  }
  
  private balanceSectionDifficulty(sections: any[]): any[] {
    if (sections.length <= 1) return sections;
    
    // Group by difficulty and interleave
    const byDifficulty = {
      BEGINNER: sections.filter(s => s.difficulty === 'BEGINNER'),
      INTERMEDIATE: sections.filter(s => s.difficulty === 'INTERMEDIATE'),
      ADVANCED: sections.filter(s => s.difficulty === 'ADVANCED')
    };
    
    const balanced: any[] = [];
    const maxLength = Math.max(
      byDifficulty.BEGINNER.length,
      byDifficulty.INTERMEDIATE.length,
      byDifficulty.ADVANCED.length
    );
    
    for (let i = 0; i < maxLength; i++) {
      if (i < byDifficulty.BEGINNER.length) balanced.push(byDifficulty.BEGINNER[i]);
      if (i < byDifficulty.INTERMEDIATE.length) balanced.push(byDifficulty.INTERMEDIATE[i]);
      if (i < byDifficulty.ADVANCED.length) balanced.push(byDifficulty.ADVANCED[i]);
    }
    
    return balanced;
  }
  
  private optimizeLearningPathUeeProgression(learningPaths: any[]): any[] {
    return learningPaths.sort((a, b) => {
      // Prefer paths with optimal UEE progression
      if (a.ueeProgression?.isOptimal && !b.ueeProgression?.isOptimal) return -1;
      if (!a.ueeProgression?.isOptimal && b.ueeProgression?.isOptimal) return 1;
      
      // Then sort by cost
      return a.cost - b.cost;
    });
  }
  
  private balanceUeeStages(primitives: any[]): any[] {
    // This would balance UEE stages across primitives
    // For now, return as-is
    return primitives;
  }
  
  private ensureSourceVariety(content: any[], sourceField: string): any[] {
    const sourceCounts = new Map<number, number>();
    
    // Count content per source
    content.forEach(item => {
      const sourceId = item[sourceField];
      if (sourceId) {
        sourceCounts.set(sourceId, (sourceCounts.get(sourceId) || 0) + 1);
      }
    });
    
    // If any source has too much content, redistribute
    const maxPerSource = Math.ceil(content.length / sourceCounts.size);
    const redistributed: any[] = [];
    
    for (const [sourceId, count] of sourceCounts) {
      const sourceContent = content.filter(item => item[sourceField] === sourceId);
      redistributed.push(...sourceContent.slice(0, maxPerSource));
    }
    
    return redistributed;
  }
  
  private async analyzeContentGaps(context: UnifiedContext, userId: number): Promise<string[]> {
    // Placeholder for content gap analysis
    return [];
  }
  
  private async analyzeLearningOpportunities(context: UnifiedContext, userId: number): Promise<string[]> {
    // Placeholder for learning opportunity analysis
    return [];
  }
  
  private async analyzeUserGoalAlignment(context: UnifiedContext, userId: number): Promise<{score: number, details: string}> {
    // Placeholder for goal alignment analysis
    return { score: 0.8, details: 'Good alignment with current goals' };
  }
  
  private async analyzeDifficultyBalance(context: UnifiedContext): Promise<{needsAdjustment: boolean, details: string}> {
    // Placeholder for difficulty balance analysis
    return { needsAdjustment: false, details: 'Difficulty progression is balanced' };
  }
  
  private calculateContentFreshness(content: any[]): number {
    if (content.length === 0) return 0;
    
    const now = Date.now();
    const freshnessScores = content.map(item => {
      if (!item.updatedAt) return 0.5; // Default for items without update time
      
      const daysSinceUpdate = (now - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 1) return 1.0;
      if (daysSinceUpdate < 7) return 0.8;
      if (daysSinceUpdate < 30) return 0.6;
      if (daysSinceUpdate < 90) return 0.4;
      return 0.2;
    });
    
    return freshnessScores.reduce((sum, score) => sum + score, 0) / freshnessScores.length;
  }
  
  private calculateSourceDiversity(context: UnifiedContext): number {
    const sources = new Set<number>();
    
    context.content.sections.forEach(s => sources.add(s.id));
    context.content.primitives.forEach(p => sources.add(p.id));
    context.content.notes.forEach(n => sources.add(n.id));
    
    return sources.size / (context.content.sections.length + context.content.primitives.length + context.content.notes.length);
  }
  
  private calculateComplexityBalance(primitives: any[]): number {
    if (primitives.length <= 1) return 1.0;
    
    const complexities = primitives.map(p => p.complexityScore || 1);
    const mean = complexities.reduce((sum, c) => sum + c, 0) / complexities.length;
    const variance = complexities.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / complexities.length;
    
    // Lower variance = better balance
    return Math.max(0, 1 - Math.sqrt(variance) / 10);
  }
  
  private calculateUeeProgression(context: UnifiedContext): number {
    if (context.learningPaths.length === 0) return 0;
    
    const optimalPaths = context.learningPaths.filter(path => 
      path.ueeProgression?.isOptimal
    );
    
    return optimalPaths.length / context.learningPaths.length;
  }
  
  private extractSourcesUsed(context: ContextAssembly): string[] {
    const sources: string[] = [];
    
    if (context.relevantSections?.length) sources.push('blueprint_sections');
    if (context.relevantPrimitives?.length) sources.push('knowledge_primitives');
    if (context.relevantNotes?.length) sources.push('notes');
    if (context.learningPath?.length) sources.push('knowledge_relationships');
    if (context.criterionLearningPaths?.length) sources.push('mastery_criteria');
    if (context.userProgress) sources.push('user_context');
    
    return sources;
  }
}

export { IntelligentContextBuilder };
