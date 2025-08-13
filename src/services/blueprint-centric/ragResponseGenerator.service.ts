import { PrismaClient } from '@prisma/client';
import ContextAssemblyService, { ContextAssembly, ContextOptions } from './contextAssembly.service';
import IntelligentContextBuilder, { ContextBuildingResult } from './intelligentContextBuilder.service';

const prisma = new PrismaClient();

// ============================================================================
// RAG RESPONSE GENERATOR SERVICE
// ============================================================================
// 
// This service generates enhanced AI responses using the combined context
// from vector search and knowledge graph traversal. It provides intelligent
// response generation with learning pathway suggestions and user guidance.
//
// Key Features:
// - Enhanced RAG with knowledge graph context
// - Learning pathway suggestions
// - User progress integration
// - Response personalization
// - Learning recommendations
//
// Performance: Optimized for <1s total RAG response generation
//
// ============================================================================

export interface RAGResponse {
  answer: string;
  context: {
    sources: Array<{
      type: 'section' | 'primitive' | 'note' | 'relationship';
      id: string;
      title: string;
      relevance: number;
      content: string;
    }>;
    learningPaths: Array<{
      id: string;
      title: string;
      description: string;
      estimatedTime: number;
      difficulty: number;
      ueeProgression: string[];
    }>;
    relatedConcepts: Array<{
      id: string;
      title: string;
      relationship: string;
      strength: number;
    }>;
  };
  recommendations: Array<{
    type: 'learning_path' | 'content_gap' | 'difficulty_adjustment' | 'review_suggestion';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action: string;
    confidence: number;
  }>;
  metadata: {
    processingTimeMs: number;
    contextQuality: number;
    responseConfidence: number;
    sourcesUsed: string[];
  };
}

export interface ResponseGenerationOptions {
  includeLearningPaths?: boolean;
  includeRecommendations?: boolean;
  maxContextItems?: number;
  responseStyle?: 'concise' | 'detailed' | 'educational';
  focusArea?: 'concepts' | 'applications' | 'connections' | 'all';
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
}

export interface LearningRecommendation {
  type: 'next_step' | 'review' | 'practice' | 'explore';
  title: string;
  description: string;
  estimatedTime: number;
  difficulty: number;
  ueeStage: string;
  confidence: number;
  action: string;
}

export default class RAGResponseGenerator {
  
  private contextAssembly: ContextAssemblyService;
  private contextBuilder: IntelligentContextBuilder;
  
  constructor() {
    this.contextAssembly = new ContextAssemblyService();
    this.contextBuilder = new IntelligentContextBuilder();
  }
  
  /**
   * Main RAG response generation method
   * Combines vector search, graph traversal, and AI generation
   */
  async generateRAGResponse(
    query: string,
    userId: number,
    options: ResponseGenerationOptions = {}
  ): Promise<RAGResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Assemble comprehensive context
      const context = await this.contextAssembly.assembleContext(
        query,
        userId,
        this.buildContextOptions(options)
      );
      
      // 2. Build intelligent context with optimization
      const intelligentContext = await this.contextBuilder.buildContext(
        query,
        userId,
        this.buildContextOptions(options)
      );
      
      // 3. Generate AI response using context
      const aiResponse = await this.generateAIResponse(
        query,
        context,
        intelligentContext,
        options
      );
      
      // 4. Generate learning recommendations
      const recommendations = await this.generateLearningRecommendations(
        context,
        intelligentContext,
        userId,
        options
      );
      
      // 5. Assemble final response
      const response = await this.assembleRAGResponse(
        aiResponse,
        context,
        intelligentContext,
        recommendations,
        options
      );
      
      const processingTime = Date.now() - startTime;
      
      return {
        ...response,
        metadata: {
          ...response.metadata,
          processingTimeMs: processingTime
        }
      };
      
    } catch (error) {
      console.error('RAG response generation failed:', error);
      return this.generateFallbackResponse(query, error.message);
    }
  }
  
  /**
   * Generates AI response using assembled context
   */
  private async generateAIResponse(
    query: string,
    context: ContextAssembly,
    intelligentContext: any,
    options: ResponseGenerationOptions
  ): Promise<{
    answer: string;
    confidence: number;
    reasoning: string;
  }> {
    try {
      // This would integrate with OpenAI's GPT API or similar
      // For now, we'll generate a structured response based on context
      
      const response = await this.generateStructuredResponse(
        query,
        context,
        intelligentContext,
        options
      );
      
      return {
        answer: response.answer,
        confidence: response.confidence,
        reasoning: response.reasoning
      };
      
    } catch (error) {
      console.error('AI response generation failed:', error);
      throw new Error(`AI response generation failed: ${error.message}`);
    }
  }
  
  /**
   * Generates learning recommendations based on context
   */
  private async generateLearningRecommendations(
    context: ContextAssembly,
    intelligentContext: any,
    userId: number,
    options: ResponseGenerationOptions
  ): Promise<LearningRecommendation[]> {
    if (!options.includeRecommendations) {
      return [];
    }
    
    const recommendations: LearningRecommendation[] = [];
    
    try {
      // 1. Next step recommendations
      const nextSteps = await this.generateNextStepRecommendations(
        context,
        intelligentContext,
        userId
      );
      recommendations.push(...nextSteps);
      
      // 2. Review recommendations
      const reviewItems = await this.generateReviewRecommendations(
        context,
        intelligentContext,
        userId
      );
      recommendations.push(...reviewItems);
      
      // 3. Practice recommendations
      const practiceItems = await this.generatePracticeRecommendations(
        context,
        intelligentContext,
        userId
      );
      recommendations.push(...practiceItems);
      
      // 4. Explore recommendations
      const exploreItems = await this.generateExploreRecommendations(
        context,
        intelligentContext,
        userId
      );
      recommendations.push(...exploreItems);
      
      // Sort by confidence and priority
      return recommendations
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5); // Limit to top 5 recommendations
      
    } catch (error) {
      console.error('Learning recommendations generation failed:', error);
      return [];
    }
  }
  
  /**
   * Assembles the final RAG response
   */
  private async assembleRAGResponse(
    aiResponse: any,
    context: ContextAssembly,
    intelligentContext: any,
    recommendations: LearningRecommendation[],
    options: ResponseGenerationOptions
  ): Promise<RAGResponse> {
    // Prepare context sources
    const sources = await this.prepareContextSources(context, options);
    
    // Prepare learning paths
    const learningPaths = await this.prepareLearningPaths(
      context.criterionLearningPaths || [],
      options
    );
    
    // Prepare related concepts
    const relatedConcepts = await this.prepareRelatedConcepts(
      context.learningPath || [],
      options
    );
    
    // Prepare recommendations
    const formattedRecommendations = this.formatRecommendations(recommendations);
    
    // Calculate context quality
    const contextQuality = this.calculateContextQuality(
      sources,
      learningPaths,
      relatedConcepts
    );
    
    return {
      answer: aiResponse.answer,
      context: {
        sources,
        learningPaths,
        relatedConcepts
      },
      recommendations: formattedRecommendations,
      metadata: {
        processingTimeMs: 0, // Will be set by caller
        contextQuality,
        responseConfidence: aiResponse.confidence,
        sourcesUsed: this.extractSourcesUsed(context)
      }
    };
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  private buildContextOptions(options: ResponseGenerationOptions): ContextOptions {
    return {
      maxResults: options.maxContextItems || 20,
      includeLearningPaths: options.includeLearningPaths !== false,
      maxPathDepth: 5,
      includePrerequisites: true,
      includeRelated: true
    };
  }
  
  private async generateStructuredResponse(
    query: string,
    context: ContextAssembly,
    intelligentContext: any,
    options: ResponseGenerationOptions
  ): Promise<{
    answer: string;
    confidence: number;
    reasoning: string;
  }> {
    // Generate a structured response based on available context
    let answer = '';
    let confidence = 0.8;
    let reasoning = '';
    
    // Build answer from context
    if (context.relevantSections?.length) {
      answer += `Based on the blueprint sections, `;
      answer += context.relevantSections.map(s => s.title).join(', ');
      answer += ` are relevant to your question.\n\n`;
    }
    
    if (context.relevantPrimitives?.length) {
      answer += `The key concepts involved are: `;
      answer += context.relevantPrimitives.map(p => p.title).join(', ');
      answer += `.\n\n`;
    }
    
    if (context.relevantNotes?.length) {
      answer += `Additional context from notes: `;
      answer += context.relevantNotes.map(n => n.title).join(', ');
      answer += `.\n\n`;
    }
    
    // Add learning pathway information
    if (context.criterionLearningPaths?.length) {
      answer += `Learning pathways available: `;
      answer += context.criterionLearningPaths.map(p => 
        `${p.path.length} steps from ${p.estimatedTime} minutes`
      ).join(', ');
      answer += `.\n\n`;
    }
    
    // Add UEE progression guidance
    if (context.userProgress) {
      answer += `Based on your current progress (${context.userProgress.currentUeeStage} stage), `;
      answer += `I recommend focusing on the next logical steps in your learning journey.\n\n`;
    }
    
    // Add specific answer based on query
    answer += `To answer your question "${query}": `;
    answer += `The information is organized in the blueprint structure, `;
    answer += `and you can follow the suggested learning paths to build comprehensive understanding. `;
    answer += `Consider starting with the foundational concepts and progressing through the UEE stages.`;
    
    // Adjust confidence based on context quality
    const contextQuality = this.calculateContextQuality(
      context.relevantSections || [],
      context.criterionLearningPaths || [],
      context.learningPath || []
    );
    
    confidence = Math.min(0.95, 0.7 + contextQuality * 0.25);
    
    reasoning = `Response generated using ${context.relevantSections?.length || 0} sections, `;
    reasoning += `${context.relevantPrimitives?.length || 0} primitives, `;
    reasoning += `${context.relevantNotes?.length || 0} notes, and `;
    reasoning += `${context.criterionLearningPaths?.length || 0} learning pathways.`;
    
    return { answer, confidence, reasoning };
  }
  
  private async generateNextStepRecommendations(
    context: ContextAssembly,
    intelligentContext: any,
    userId: number
  ): Promise<LearningRecommendation[]> {
    const recommendations: LearningRecommendation[] = [];
    
    try {
      // Find next logical steps based on current progress
      const currentStage = context.userProgress?.currentUeeStage || 'UNDERSTAND';
      const nextStage = this.getNextUeeStage(currentStage);
      
      // Find criteria that match the next stage
      const nextStageCriteria = await this.findCriteriaByUeeStage(
        nextStage,
        userId
      );
      
      for (const criterion of nextStageCriteria.slice(0, 3)) {
        recommendations.push({
          type: 'next_step',
          title: `Progress to ${nextStage} stage`,
          description: `Master "${criterion.title}" to advance your learning`,
          estimatedTime: 20, // Placeholder
          difficulty: criterion.complexityScore || 5,
          ueeStage: nextStage,
          confidence: 0.8,
          action: `Study ${criterion.title}`
        });
      }
      
    } catch (error) {
      console.error('Next step recommendations failed:', error);
    }
    
    return recommendations;
  }
  
  private async generateReviewRecommendations(
    context: ContextAssembly,
    intelligentContext: any,
    userId: number
  ): Promise<LearningRecommendation[]> {
    const recommendations: LearningRecommendation[] = [];
    
    try {
      // Find items that need review based on spaced repetition
      const reviewItems = await this.findItemsNeedingReview(userId);
      
      for (const item of reviewItems.slice(0, 2)) {
        recommendations.push({
          type: 'review',
          title: `Review ${item.title}`,
          description: `This concept is due for review to maintain mastery`,
          estimatedTime: 10,
          difficulty: item.complexityScore || 3,
          ueeStage: item.ueeStage || 'UNDERSTAND',
          confidence: 0.9,
          action: `Review ${item.title}`
        });
      }
      
    } catch (error) {
      console.error('Review recommendations failed:', error);
    }
    
    return recommendations;
  }
  
  private async generatePracticeRecommendations(
    context: ContextAssembly,
    intelligentContext: any,
    userId: number
  ): Promise<LearningRecommendation[]> {
    const recommendations: LearningRecommendation[] = [];
    
    try {
      // Find practice opportunities based on current stage
      const currentStage = context.userProgress?.currentUeeStage || 'UNDERSTAND';
      
      if (currentStage === 'USE' || currentStage === 'EXPLORE') {
        const practiceCriteria = await this.findPracticeCriteria(userId, currentStage);
        
        for (const criterion of practiceCriteria.slice(0, 2)) {
          recommendations.push({
            type: 'practice',
            title: `Practice ${criterion.title}`,
            description: `Apply your knowledge through practical exercises`,
            estimatedTime: 30,
            difficulty: criterion.complexityScore || 6,
            ueeStage: currentStage,
            confidence: 0.7,
            action: `Practice ${criterion.title}`
          });
        }
      }
      
    } catch (error) {
      console.error('Practice recommendations failed:', error);
    }
    
    return recommendations;
  }
  
  private async generateExploreRecommendations(
    context: ContextAssembly,
    intelligentContext: any,
    userId: number
  ): Promise<LearningRecommendation[]> {
    const recommendations: LearningRecommendation[] = [];
    
    try {
      // Find exploration opportunities based on related concepts
      if (context.learningPath?.length) {
        const exploreConcepts = context.learningPath.slice(0, 2);
        
        for (const concept of exploreConcepts) {
          recommendations.push({
            type: 'explore',
            title: `Explore ${concept.title || 'related concept'}`,
            description: `Discover connections and deepen your understanding`,
            estimatedTime: 45,
            difficulty: concept.complexityScore || 7,
            ueeStage: 'EXPLORE',
            confidence: 0.6,
            action: `Explore related concepts`
          });
        }
      }
      
    } catch (error) {
      console.error('Explore recommendations failed:', error);
    }
    
    return recommendations;
  }
  
  private async prepareContextSources(
    context: ContextAssembly,
    options: ResponseGenerationOptions
  ): Promise<Array<{
    type: 'section' | 'primitive' | 'note' | 'relationship';
    id: string;
    title: string;
    relevance: number;
    content: string;
  }>> {
    const sources: any[] = [];
    
    // Add sections
    if (context.relevantSections) {
      sources.push(...context.relevantSections.map(s => ({
        type: 'section' as const,
        id: s.id.toString(),
        title: s.title,
        relevance: s.relevanceScore || 0.8,
        content: s.description || s.title
      })));
    }
    
    // Add primitives
    if (context.relevantPrimitives) {
      sources.push(...context.relevantPrimitives.map(p => ({
        type: 'primitive' as const,
        id: p.id.toString(),
        title: p.title,
        relevance: p.relevanceScore || 0.8,
        content: p.description || p.title
      })));
    }
    
    // Add notes
    if (context.relevantNotes) {
      sources.push(...context.relevantNotes.map(n => ({
        type: 'note' as const,
        id: n.id.toString(),
        title: n.title,
        relevance: n.relevanceScore || 0.8,
        content: n.content.substring(0, 200) + '...'
      })));
    }
    
    // Sort by relevance and limit
    return sources
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, options.maxContextItems || 10);
  }
  
  private async prepareLearningPaths(
    learningPaths: any[],
    options: ResponseGenerationOptions
  ): Promise<Array<{
    id: string;
    title: string;
    description: string;
    estimatedTime: number;
    difficulty: number;
    ueeProgression: string[];
  }>> {
    if (!options.includeLearningPaths) return [];
    
    return learningPaths.map(path => ({
      id: path.path.map((p: any) => p.id).join('-'),
      title: `Learning Path (${path.path.length} steps)`,
      description: `Progressive learning sequence with ${path.estimatedTime} minutes estimated`,
      estimatedTime: path.estimatedTime,
      difficulty: path.difficulty,
      ueeProgression: path.ueeProgression?.progressionOrder || ['UNDERSTAND', 'USE', 'EXPLORE']
    }));
  }
  
  private async prepareRelatedConcepts(
    relationships: any[],
    options: ResponseGenerationOptions
  ): Promise<Array<{
    id: string;
    title: string;
    relationship: string;
    strength: number;
  }>> {
    return relationships.map(rel => ({
      id: rel.id.toString(),
      title: `Concept ${rel.id}`,
      relationship: rel.relationshipType,
      strength: rel.strength
    }));
  }
  
  private formatRecommendations(
    recommendations: LearningRecommendation[]
  ): Array<{
    type: 'learning_path' | 'content_gap' | 'difficulty_adjustment' | 'review_suggestion';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    action: string;
    confidence: number;
  }> {
    return recommendations.map(rec => ({
      type: this.mapRecommendationType(rec.type),
      priority: this.mapRecommendationPriority(rec.confidence),
      title: rec.title,
      description: rec.description,
      action: rec.action,
      confidence: rec.confidence
    }));
  }
  
  private mapRecommendationType(type: string): any {
    const typeMap: { [key: string]: any } = {
      'next_step': 'learning_path',
      'review': 'review_suggestion',
      'practice': 'learning_path',
      'explore': 'learning_path'
    };
    return typeMap[type] || 'learning_path';
  }
  
  private mapRecommendationPriority(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  }
  
  private calculateContextQuality(
    sources: any[],
    learningPaths: any[],
    relatedConcepts: any[]
  ): number {
    const totalItems = sources.length + learningPaths.length + relatedConcepts.length;
    if (totalItems === 0) return 0;
    
    let quality = 0;
    
    // Source quality
    if (sources.length > 0) {
      const avgRelevance = sources.reduce((sum, s) => sum + s.relevance, 0) / sources.length;
      quality += avgRelevance * 0.4;
    }
    
    // Learning path quality
    if (learningPaths.length > 0) {
      quality += 0.3;
    }
    
    // Related concepts quality
    if (relatedConcepts.length > 0) {
      const avgStrength = relatedConcepts.reduce((sum, c) => sum + c.strength, 0) / relatedConcepts.length;
      quality += avgStrength * 0.3;
    }
    
    return Math.min(1.0, quality);
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
  
  private getNextUeeStage(currentStage: string): string {
    const stages = ['UNDERSTAND', 'USE', 'EXPLORE'];
    const currentIndex = stages.indexOf(currentStage);
    const nextIndex = Math.min(currentIndex + 1, stages.length - 1);
    return stages[nextIndex];
  }
  
  private async findCriteriaByUeeStage(
    ueeStage: string,
    userId: number
  ): Promise<any[]> {
    try {
      return await prisma.masteryCriterion.findMany({
        where: {
          uueStage,
          userId
        },
        take: 5
      });
    } catch {
      return [];
    }
  }
  
  private async findItemsNeedingReview(userId: number): Promise<any[]> {
    // Placeholder implementation
    return [];
  }
  
  private async findPracticeCriteria(
    userId: number,
    ueeStage: string
  ): Promise<any[]> {
    try {
      return await prisma.masteryCriterion.findMany({
        where: {
          uueStage,
          userId
        },
        take: 3
      });
    } catch {
      return [];
    }
  }
  
  private generateFallbackResponse(
    query: string,
    errorMessage: string
  ): RAGResponse {
    return {
      answer: `I'm unable to generate a complete response at the moment due to: ${errorMessage}. Please try again or contact support if the issue persists.`,
      context: {
        sources: [],
        learningPaths: [],
        relatedConcepts: []
      },
      recommendations: [],
      metadata: {
        processingTimeMs: 0,
        contextQuality: 0,
        responseConfidence: 0.1,
        sourcesUsed: []
      }
    };
  }
}

export { RAGResponseGenerator };
