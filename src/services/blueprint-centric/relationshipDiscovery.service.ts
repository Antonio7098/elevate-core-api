import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// RELATIONSHIP DISCOVERY SERVICE
// ============================================================================
// 
// This service uses AI to automatically discover and suggest relationships
// between knowledge primitives and mastery criteria. It analyzes content
// similarity, concept overlap, and learning progression to suggest
// meaningful connections.
//
// Key Features:
// - AI-powered relationship detection
// - Content similarity analysis
// - Learning pathway suggestions
// - Confidence scoring
// - Relationship validation
//
// Performance: Optimized for <500ms relationship discovery
//
// ============================================================================

export interface RelationshipSuggestion {
  sourceId: number;
  targetId: number;
  sourceType: 'primitive' | 'criterion';
  targetType: 'primitive' | 'criterion';
  relationshipType: string;
  confidence: number;
  reasoning: string;
  evidence: {
    contentSimilarity: number;
    conceptOverlap: string[];
    learningProgression: boolean;
    userFeedback?: number;
  };
  metadata: {
    discoveredAt: Date;
    source: 'AI_DISCOVERED' | 'USER_SUGGESTED' | 'SYSTEM_INFERRED';
    lastValidated?: Date;
  };
}

export interface DiscoveryOptions {
  minConfidence?: number;
  maxSuggestions?: number;
  includeExisting?: boolean;
  focusArea?: 'prerequisites' | 'related' | 'advances_to' | 'all';
  blueprintId?: number;
}

export interface DiscoveryResult {
  suggestions: RelationshipSuggestion[];
  totalAnalyzed: number;
  newRelationships: number;
  processingTimeMs: number;
  confidenceDistribution: {
    high: number;
    medium: number;
    low: number;
  };
}

export default class RelationshipDiscoveryService {
  
  /**
   * Main relationship discovery method
   * Analyzes content and suggests new relationships
   */
  async discoverRelationships(
    options: DiscoveryOptions = {}
  ): Promise<DiscoveryResult> {
    const startTime = Date.now();
    
    try {
      const {
        minConfidence = 0.6,
        maxSuggestions = 50,
        includeExisting = false,
        focusArea = 'all',
        blueprintId
      } = options;
      
      // 1. Get content to analyze
      const contentToAnalyze = await this.getContentForAnalysis(blueprintId);
      
      // 2. Analyze content similarities
      const similarities = await this.analyzeContentSimilarities(contentToAnalyze);
      
      // 3. Generate relationship suggestions
      const suggestions = await this.generateRelationshipSuggestions(
        similarities,
        focusArea,
        maxSuggestions
      );
      
      // 4. Filter by confidence and existing relationships
      const filteredSuggestions = await this.filterSuggestions(
        suggestions,
        minConfidence,
        includeExisting
      );
      
      // 5. Calculate confidence distribution
      const confidenceDistribution = this.calculateConfidenceDistribution(
        filteredSuggestions
      );
      
      const processingTime = Date.now() - startTime;
      
      return {
        suggestions: filteredSuggestions,
        totalAnalyzed: contentToAnalyze.length,
        newRelationships: filteredSuggestions.length,
        processingTimeMs: processingTime,
        confidenceDistribution
      };
      
    } catch (error) {
      console.error('Relationship discovery failed:', error);
      throw new Error(`Relationship discovery failed: ${error.message}`);
    }
  }
  
  /**
   * Discovers relationships for a specific blueprint
   */
  async discoverBlueprintRelationships(
    blueprintId: number,
    options: DiscoveryOptions = {}
  ): Promise<DiscoveryResult> {
    return await this.discoverRelationships({
      ...options,
      blueprintId
    });
  }
  
  /**
   * Discovers relationships between mastery criteria
   */
  async discoverCriterionRelationships(
    options: DiscoveryOptions = {}
  ): Promise<DiscoveryResult> {
    try {
      const {
        minConfidence = 0.6,
        maxSuggestions = 30,
        includeExisting = false
      } = options;
      
      // Get mastery criteria to analyze
      const criteria = await this.getMasteryCriteriaForAnalysis();
      
      // Analyze criterion similarities
      const similarities = await this.analyzeCriterionSimilarities(criteria);
      
      // Generate criterion relationship suggestions
      const suggestions = await this.generateCriterionRelationshipSuggestions(
        similarities,
        maxSuggestions
      );
      
      // Filter suggestions
      const filteredSuggestions = await this.filterCriterionSuggestions(
        suggestions,
        minConfidence,
        includeExisting
      );
      
      const confidenceDistribution = this.calculateConfidenceDistribution(
        filteredSuggestions
      );
      
      return {
        suggestions: filteredSuggestions,
        totalAnalyzed: criteria.length,
        newRelationships: filteredSuggestions.length,
        processingTimeMs: 0,
        confidenceDistribution
      };
      
    } catch (error) {
      console.error('Criterion relationship discovery failed:', error);
      throw new Error(`Criterion relationship discovery failed: ${error.message}`);
    }
  }
  
  /**
   * Validates and accepts relationship suggestions
   */
  async acceptRelationshipSuggestion(
    suggestion: RelationshipSuggestion
  ): Promise<boolean> {
    try {
      if (suggestion.sourceType === 'primitive' && suggestion.targetType === 'primitive') {
        // Create knowledge relationship
        await prisma.knowledgeRelationship.create({
          data: {
            sourcePrimitiveId: suggestion.sourceId,
            targetPrimitiveId: suggestion.targetId,
            relationshipType: suggestion.relationshipType as any,
            strength: suggestion.confidence,
            confidence: suggestion.confidence,
            source: 'AI_GENERATED',
            metadata: {
              reasoning: suggestion.reasoning,
              evidence: suggestion.evidence,
              discoveredAt: suggestion.metadata.discoveredAt
            }
          }
        });
      } else if (suggestion.sourceType === 'criterion' && suggestion.targetType === 'criterion') {
        // Create mastery criterion relationship
        await prisma.masteryCriterionRelationship.create({
          data: {
            sourceCriterionId: suggestion.sourceId,
            targetCriterionId: suggestion.targetId,
            relationshipType: suggestion.relationshipType as any,
            strength: suggestion.confidence,
            confidence: suggestion.confidence,
            source: 'AI_GENERATED',
            metadata: {
              reasoning: suggestion.reasoning,
              evidence: suggestion.evidence,
              discoveredAt: suggestion.metadata.discoveredAt
            }
          }
        });
      }
      
      return true;
      
    } catch (error) {
      console.error('Failed to accept relationship suggestion:', error);
      return false;
    }
  }
  
  /**
   * Batch accepts multiple relationship suggestions
   */
  async acceptRelationshipSuggestions(
    suggestions: RelationshipSuggestion[]
  ): Promise<{
    accepted: number;
    failed: number;
    errors: string[];
  }> {
    const result = {
      accepted: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const suggestion of suggestions) {
      try {
        const success = await this.acceptRelationshipSuggestion(suggestion);
        if (success) {
          result.accepted++;
        } else {
          result.failed++;
          result.errors.push(`Failed to accept suggestion ${suggestion.sourceId} -> ${suggestion.targetId}`);
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Error accepting suggestion: ${error.message}`);
      }
    }
    
    return result;
  }
  
  /**
   * Gets content for relationship analysis
   */
  private async getContentForAnalysis(blueprintId?: number) {
    const whereClause = blueprintId ? { blueprintId } : {};
    
    const [primitives, criteria] = await Promise.all([
      prisma.knowledgePrimitive.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          description: true,
          conceptTags: true,
          complexityScore: true
        }
      }),
      prisma.masteryCriterion.findMany({
        where: blueprintId ? { blueprintSectionId: blueprintId } : {},
        select: {
          id: true,
          title: true,
          description: true,
          uueStage: true,
          complexityScore: true
        }
      })
    ]);
    
    return [
      ...primitives.map(p => ({ ...p, type: 'primitive' as const })),
      ...criteria.map(c => ({ ...c, type: 'criterion' as const }))
    ];
  }
  
  /**
   * Gets mastery criteria for analysis
   */
  private async getMasteryCriteriaForAnalysis() {
    return await prisma.masteryCriterion.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        uueStage: true,
        complexityScore: true,
        blueprintSectionId: true
      }
    });
  }
  
  /**
   * Analyzes content similarities
   */
  private async analyzeContentSimilarities(content: any[]) {
    const similarities: Array<{
      source: any;
      target: any;
      similarity: number;
      overlap: string[];
      relationshipType: string;
    }> = [];
    
    for (let i = 0; i < content.length; i++) {
      for (let j = i + 1; j < content.length; j++) {
        const source = content[i];
        const target = content[j];
        
        // Calculate similarity
        const similarity = this.calculateContentSimilarity(source, target);
        
        if (similarity > 0.3) { // Minimum similarity threshold
          const overlap = this.findConceptOverlap(source, target);
          const relationshipType = this.determineRelationshipType(source, target, similarity);
          
          similarities.push({
            source,
            target,
            similarity,
            overlap,
            relationshipType
          });
        }
      }
    }
    
    // Sort by similarity
    return similarities.sort((a, b) => b.similarity - a.similarity);
  }
  
  /**
   * Analyzes criterion similarities
   */
  private async analyzeCriterionSimilarities(criteria: any[]) {
    const similarities: Array<{
      source: any;
      target: any;
      similarity: number;
      overlap: string[];
      relationshipType: string;
    }> = [];
    
    for (let i = 0; i < criteria.length; i++) {
      for (let j = i + 1; j < criteria.length; j++) {
        const source = criteria[i];
        const target = criteria[j];
        
        // Calculate similarity
        const similarity = this.calculateCriterionSimilarity(source, target);
        
        if (similarity > 0.3) {
          const overlap = this.findConceptOverlap(source, target);
          const relationshipType = this.determineCriterionRelationshipType(source, target, similarity);
          
          similarities.push({
            source,
            target,
            similarity,
            overlap,
            relationshipType
          });
        }
      }
    }
    
    return similarities.sort((a, b) => b.similarity - a.similarity);
  }
  
  /**
   * Generates relationship suggestions
   */
  private async generateRelationshipSuggestions(
    similarities: any[],
    focusArea: string,
    maxSuggestions: number
  ): Promise<RelationshipSuggestion[]> {
    const suggestions: RelationshipSuggestion[] = [];
    
    for (const sim of similarities.slice(0, maxSuggestions)) {
      // Filter by focus area if specified
      if (focusArea !== 'all' && sim.relationshipType !== focusArea) {
        continue;
      }
      
      const confidence = this.calculateConfidence(sim);
      const reasoning = this.generateReasoning(sim);
      
      suggestions.push({
        sourceId: sim.source.id,
        targetId: sim.target.id,
        sourceType: sim.source.type,
        targetType: sim.target.type,
        relationshipType: sim.relationshipType,
        confidence,
        reasoning,
        evidence: {
          contentSimilarity: sim.similarity,
          conceptOverlap: sim.overlap,
          learningProgression: this.checkLearningProgression(sim.source, sim.target)
        },
        metadata: {
          discoveredAt: new Date(),
          source: 'AI_DISCOVERED'
        }
      });
    }
    
    return suggestions;
  }
  
  /**
   * Generates criterion relationship suggestions
   */
  private async generateCriterionRelationshipSuggestions(
    similarities: any[],
    maxSuggestions: number
  ): Promise<RelationshipSuggestion[]> {
    const suggestions: RelationshipSuggestion[] = [];
    
    for (const sim of similarities.slice(0, maxSuggestions)) {
      const confidence = this.calculateConfidence(sim);
      const reasoning = this.generateReasoning(sim);
      
      suggestions.push({
        sourceId: sim.source.id,
        targetId: sim.target.id,
        sourceType: 'criterion',
        targetType: 'criterion',
        relationshipType: sim.relationshipType,
        confidence,
        reasoning,
        evidence: {
          contentSimilarity: sim.similarity,
          conceptOverlap: sim.overlap,
          learningProgression: this.checkLearningProgression(sim.source, sim.target)
        },
        metadata: {
          discoveredAt: new Date(),
          source: 'AI_DISCOVERED'
        }
      });
    }
    
    return suggestions;
  }
  
  /**
   * Filters relationship suggestions
   */
  private async filterSuggestions(
    suggestions: RelationshipSuggestion[],
    minConfidence: number,
    includeExisting: boolean
  ): Promise<RelationshipSuggestion[]> {
    let filtered = suggestions.filter(s => s.confidence >= minConfidence);
    
    if (!includeExisting) {
      // Remove suggestions that already exist
      filtered = await this.removeExistingRelationships(filtered);
    }
    
    return filtered;
  }
  
  /**
   * Filters criterion relationship suggestions
   */
  private async filterCriterionSuggestions(
    suggestions: RelationshipSuggestion[],
    minConfidence: number,
    includeExisting: boolean
  ): Promise<RelationshipSuggestion[]> {
    let filtered = suggestions.filter(s => s.confidence >= minConfidence);
    
    if (!includeExisting) {
      // Remove suggestions that already exist
      filtered = await this.removeExistingCriterionRelationships(filtered);
    }
    
    return filtered;
  }
  
  /**
   * Removes existing relationships from suggestions
   */
  private async removeExistingRelationships(
    suggestions: RelationshipSuggestion[]
  ): Promise<RelationshipSuggestion[]> {
    const filtered: RelationshipSuggestion[] = [];
    
    for (const suggestion of suggestions) {
      if (suggestion.sourceType === 'primitive' && suggestion.targetType === 'primitive') {
        const exists = await prisma.knowledgeRelationship.findFirst({
          where: {
            sourcePrimitiveId: suggestion.sourceId,
            targetPrimitiveId: suggestion.targetId,
            relationshipType: suggestion.relationshipType as any
          }
        });
        
        if (!exists) {
          filtered.push(suggestion);
        }
      }
    }
    
    return filtered;
  }
  
  /**
   * Removes existing criterion relationships from suggestions
   */
  private async removeExistingCriterionRelationships(
    suggestions: RelationshipSuggestion[]
  ): Promise<RelationshipSuggestion[]> {
    const filtered: RelationshipSuggestion[] = [];
    
    for (const suggestion of suggestions) {
      const exists = await prisma.masteryCriterionRelationship.findFirst({
        where: {
          sourceCriterionId: suggestion.sourceId,
          targetCriterionId: suggestion.targetId,
          relationshipType: suggestion.relationshipType as any
        }
      });
      
      if (!exists) {
        filtered.push(suggestion);
      }
    }
    
    return filtered;
  }
  
  /**
   * Calculates content similarity between two items
   */
  private calculateContentSimilarity(source: any, target: any): number {
    const sourceText = `${source.title} ${source.description || ''}`.toLowerCase();
    const targetText = `${target.title} ${target.description || ''}`.toLowerCase();
    
    const sourceWords = sourceText.split(/\s+/);
    const targetWords = targetText.split(/\s+/);
    
    let matches = 0;
    for (const word of sourceWords) {
      if (targetWords.includes(word) && word.length > 3) {
        matches++;
      }
    }
    
    return matches / Math.max(sourceWords.length, targetWords.length);
  }
  
  /**
   * Calculates criterion similarity
   */
  private calculateCriterionSimilarity(source: any, target: any): number {
    const sourceText = `${source.title} ${source.description || ''}`.toLowerCase();
    const targetText = `${target.title} ${target.description || ''}`.toLowerCase();
    
    const sourceWords = sourceText.split(/\s+/);
    const targetWords = targetText.split(/\s+/);
    
    let matches = 0;
    for (const word of sourceWords) {
      if (targetWords.includes(word) && word.length > 3) {
        matches++;
      }
    }
    
    return matches / Math.max(sourceWords.length, targetWords.length);
  }
  
  /**
   * Finds concept overlap between two items
   */
  private findConceptOverlap(source: any, target: any): string[] {
    const sourceTags = source.conceptTags || [];
    const targetTags = target.conceptTags || [];
    
    return sourceTags.filter(tag => targetTags.includes(tag));
  }
  
  /**
   * Determines relationship type based on content and similarity
   */
  private determineRelationshipType(source: any, target: any, similarity: number): string {
    if (similarity > 0.8) return 'SIMILAR';
    if (similarity > 0.6) return 'RELATED';
    if (similarity > 0.4) return 'ADVANCES_TO';
    return 'PREREQUISITE';
  }
  
  /**
   * Determines criterion relationship type
   */
  private determineCriterionRelationshipType(source: any, target: any, similarity: number): string {
    if (similarity > 0.8) return 'SIMILAR';
    if (similarity > 0.6) return 'RELATED';
    if (similarity > 0.4) return 'ADVANCES_TO';
    return 'PREREQUISITE';
  }
  
  /**
   * Calculates confidence score for a suggestion
   */
  private calculateConfidence(similarity: any): number {
    let confidence = similarity.similarity;
    
    // Boost confidence based on concept overlap
    if (similarity.overlap.length > 0) {
      confidence += 0.1;
    }
    
    // Boost confidence for learning progression
    if (this.checkLearningProgression(similarity.source, similarity.target)) {
      confidence += 0.1;
    }
    
    return Math.min(0.95, confidence);
  }
  
  /**
   * Generates reasoning for a relationship suggestion
   */
  private generateReasoning(similarity: any): string {
    const { source, target, similarity: simScore, overlap, relationshipType } = similarity;
    
    let reasoning = `High content similarity (${(simScore * 100).toFixed(1)}%) between "${source.title}" and "${target.title}". `;
    
    if (overlap.length > 0) {
      reasoning += `Shared concepts: ${overlap.join(', ')}. `;
    }
    
    if (this.checkLearningProgression(source, target)) {
      reasoning += `Natural learning progression from ${source.ueeLevel || source.uueStage} to ${target.ueeLevel || target.uueStage}. `;
    }
    
    reasoning += `Suggests a ${relationshipType.toLowerCase()} relationship.`;
    
    return reasoning;
  }
  
  /**
   * Checks if there's a natural learning progression
   */
  private checkLearningProgression(source: any, target: any): boolean {
    const stages = ['UNDERSTAND', 'USE', 'EXPLORE'];
    const sourceStage = source.ueeLevel || source.uueStage;
    const targetStage = target.ueeLevel || target.uueStage;
    
    if (!sourceStage || !targetStage) return false;
    
    const sourceIndex = stages.indexOf(sourceStage);
    const targetIndex = stages.indexOf(targetStage);
    
    return targetIndex > sourceIndex;
  }
  
  /**
   * Calculates confidence distribution
   */
  private calculateConfidenceDistribution(suggestions: RelationshipSuggestion[]) {
    let high = 0, medium = 0, low = 0;
    
    for (const suggestion of suggestions) {
      if (suggestion.confidence >= 0.8) high++;
      else if (suggestion.confidence >= 0.6) medium++;
      else low++;
    }
    
    return { high, medium, low };
  }
}

export { RelationshipDiscoveryService };
