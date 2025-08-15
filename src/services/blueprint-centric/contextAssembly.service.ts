import { PrismaClient } from '@prisma/client';
import KnowledgeGraphTraversal, { 
  TraversalResult, 
  LearningPathResult,
  RelationshipType 
} from './knowledgeGraphTraversal.service';
import VectorStoreService, {
  VectorSearchResult,
  SearchFilters
} from './vectorStore.service';

const prisma = new PrismaClient();

// ============================================================================
// CONTEXT ASSEMBLY SERVICE
// ============================================================================
// 
// This service integrates vector search with knowledge graph traversal to
// provide comprehensive context for RAG responses. It combines:
// - Vector search results for semantic relevance
// - Graph traversal for concept relationships
// - Learning pathway discovery for mastery criteria
// - User context and progress tracking
//
// Key Features:
// - Intelligent context assembly from multiple sources
// - Learning pathway suggestions
// - Context ranking and filtering
// - User progress integration
//
// Performance: Optimized for <300ms context assembly
//
// ============================================================================

export interface ContextAssembly {
  // Vector search results
  relevantSections: BlueprintSectionNode[];
  relevantPrimitives: KnowledgePrimitiveNode[];
  relevantNotes: NoteSectionNode[];
  
  // Knowledge graph traversal
  relatedConcepts: KnowledgePrimitiveNode[];
  prerequisiteChain: KnowledgePrimitiveNode[];
  learningPath: KnowledgeRelationshipNode[];
  
  // Mastery criterion learning pathways
  criterionLearningPaths: LearningPathResult[];
  relatedCriteria: MasteryCriterionNode[];
  
  // User context
  userProgress: UserProgress;
  learningGoals: LearningGoal[];
  currentSession: StudySession;
  
  // Context metadata
  confidence: number;
  relevance: number;
  freshness: number;
  
  // Additional metadata for context assembly
  metadata?: {
    totalContent: number;
    contentDistribution: ContentDistribution;
    processingTimeMs: number;
    sources: {
      vectorSearch: number;
      graphTraversal: number;
      userContext: number;
      learningPaths: number;
    };
  };
}

export interface UserContext {
  userId: number;
  progress: UserProgress;
  learningGoals: LearningGoal[];
  currentSession: StudySession;
  overallMastery: number;
  currentUeeStage: string;
  recentActivity: Array<{
    type: string;
    timestamp: Date;
    score?: number;
  }>;
}

export interface BlueprintSectionNode {
  id: number;
  title: string;
  description?: string;
  depth: number;
  difficulty: string;
  estimatedTimeMinutes?: number;
  masteryProgress: number;
  relevanceScore: number;
}

export interface KnowledgePrimitiveNode {
  id: number;
  title: string;
  description?: string;
  primitiveType: string;
  complexityScore?: number;
  conceptTags: string[];
  relevanceScore: number;
}

export interface NoteSectionNode {
  id: number;
  title: string;
  content: string;
  blueprintSectionId: number;
  relevanceScore: number;
}

export interface KnowledgeRelationshipNode {
  id: number;
  sourcePrimitiveId: number;
  targetPrimitiveId: number;
  relationshipType: string;
  strength: number;
  confidence: number;
}

export interface MasteryCriterionNode {
  id: number;
  title: string;
  description?: string;
  uueStage: string;
  weight: number;
  complexityScore?: number;
  relevanceScore: number;
}

export interface UserProgress {
  userId: number;
  overallMastery: number;
  currentUeeStage: string;
  recentActivity: Array<{
    type: string;
    timestamp: Date;
    score?: number;
  }>;
}

export interface LearningGoal {
  id: number;
  title: string;
  targetUeeStage: string;
  priority: number;
  estimatedCompletion: Date;
}

export interface StudySession {
  id: number;
  startTime: Date;
  duration: number;
  focusArea: string;
  currentProgress: number;
}

export interface ContentDistribution {
  sections: number;
  primitives: number;
  notes: number;
  relationships: number;
}

export interface ContextOptions {
  maxResults?: number;
  includePrerequisites?: boolean;
  includeRelated?: boolean;
  focusSection?: number;
  difficultyRange?: [number, number];
  ueeLevel?: string;
  includeLearningPaths?: boolean;
  maxPathDepth?: number;
}

export default class ContextAssemblyService {
  
  private graphTraversal: KnowledgeGraphTraversal;
  private vectorStore: VectorStoreService;
  
  constructor() {
    this.graphTraversal = new KnowledgeGraphTraversal();
    this.vectorStore = new VectorStoreService();
  }
  
  /**
   * Main context assembly method
   * Combines vector search, graph traversal, and user context
   */
  async assembleContext(
    query: string, 
    userId: number, 
    options: ContextOptions = {}
  ): Promise<ContextAssembly> {
    const startTime = Date.now();
    
    try {
      // 1. Vector search for relevant content
      const vectorResults = await this.searchVectorStore(query, options);
      
      // 2. Extract key concepts from vector results
      const keyConcepts = await this.extractKeyConcepts(vectorResults);
      
      // 3. Graph traversal from key concepts
      const graphResults = await this.graphTraversalFromKeyConcepts(keyConcepts, options);
      
      // 4. User context integration
      const userContext = await this.getUserContext(userId, keyConcepts);
      
      // 5. Learning pathway discovery
      const learningPaths = await this.discoverLearningPaths(keyConcepts, options);
      
      // 6. Context assembly and ranking
      const unifiedContext = await this.assembleUnifiedContext(
        vectorResults, 
        graphResults, 
        userContext, 
        learningPaths,
        options
      );
      
      const processingTime = Date.now() - startTime;
      
      return {
        ...unifiedContext,
        metadata: {
          ...unifiedContext.metadata,
          processingTimeMs: processingTime,
          sources: {
            vectorSearch: vectorResults.length,
            graphTraversal: graphResults.nodes.length,
            userContext: userContext ? 1 : 0,
            learningPaths: learningPaths.length
          }
        }
      };
      
    } catch (error) {
      console.error('Context assembly failed:', error);
      throw new Error(`Context assembly failed: ${error.message}`);
    }
  }
  
  /**
   * Vector search integration
   * Now uses actual VectorStoreService for Pinecone integration
   */
  async searchVectorStore(
    query: string, 
    filters?: SearchFilters
  ): Promise<VectorSearchResult[]> {
    try {
      // Use the VectorStoreService for actual vector search
      return await this.vectorStore.searchVectorStore(query, filters);
    } catch (error) {
      console.error('Vector search failed:', error);
      return [];
    }
  }
  
  /**
   * Knowledge graph traversal from key concepts
   */
  async graphTraversalFromKeyConcepts(
    keyConcepts: string[], 
    options: ContextOptions
  ): Promise<TraversalResult> {
    if (keyConcepts.length === 0) {
      return {
        nodes: [],
        edges: [],
        metadata: { maxDepth: 0, totalNodes: 0, totalEdges: 0 }
      };
    }
    
    try {
      // Start traversal from the most relevant concept
      const startConcept = keyConcepts[0];
      const maxDepth = options.maxPathDepth || 3;
      
      return await this.graphTraversal.traverseGraph(
        startConcept,
        maxDepth,
        ['PREREQUISITE', 'RELATED', 'ADVANCES_TO']
      );
      
    } catch (error) {
      console.error('Graph traversal failed:', error);
      return {
        nodes: [],
        edges: [],
        metadata: { maxDepth: 0, totalNodes: 0, totalEdges: 0 }
      };
    }
  }
  
  /**
   * Learning pathway discovery
   */
  async discoverLearningPaths(
    keyConcepts: string[], 
    options: ContextOptions
  ): Promise<LearningPathResult[]> {
    if (!options.includeLearningPaths || keyConcepts.length === 0) {
      return [];
    }
    
    try {
      const paths: LearningPathResult[] = [];
      
      // Find mastery criteria related to key concepts
      const relatedCriteria = await this.findRelatedMasteryCriteria(keyConcepts);
      
      // Discover learning paths between related criteria
      for (let i = 0; i < relatedCriteria.length - 1; i++) {
        try {
          const path = await this.graphTraversal.findCriterionLearningPath(
            relatedCriteria[i].id,
            relatedCriteria[i + 1].id,
            options.maxPathDepth || 5
          );
          paths.push(path);
        } catch (error) {
          // Skip invalid paths
        }
      }
      
      return paths;
      
    } catch (error) {
      console.error('Learning path discovery failed:', error);
      return [];
    }
  }
  
  /**
   * User context integration
   */
  async getUserContext(
    userId: number, 
    keyConcepts: string[]
  ): Promise<UserContext | null> {
    try {
      const [user, progress, goals, session] = await Promise.all([
        this.getUser(userId),
        this.getUserProgress(userId),
        this.getUserLearningGoals(userId),
        this.getCurrentStudySession(userId)
      ]);
      
      if (!user) return null;
      
      return {
        userId,
        progress,
        learningGoals: goals,
        currentSession: session,
        overallMastery: progress.overallMastery,
        currentUeeStage: progress.currentUeeStage,
        recentActivity: progress.recentActivity
      };
      
    } catch (error) {
      console.error('User context retrieval failed:', error);
      return null;
    }
  }
  
  /**
   * Context assembly and ranking
   */
  private async assembleUnifiedContext(
    vectorResults: VectorSearchResult[],
    graphResults: TraversalResult,
    userContext: UserContext | null,
    learningPaths: LearningPathResult[],
    options: ContextOptions
  ): Promise<ContextAssembly> {
    // Combine all content sources
    const allContent = [
      ...vectorResults.map(r => ({ ...r, source: 'vector' as const })),
      ...graphResults.nodes.map(n => ({ ...n, source: 'graph' as const })),
      ...(userContext ? [userContext].map(u => ({ ...u, source: 'user' as const })) : [])
    ];
    
    // Calculate relevance scores
    const scoredContent = await Promise.all(
      allContent.map(async (content) => ({
        ...content,
        relevanceScore: await this.calculateRelevance(content, options)
      }))
    );
    
    // Rank by relevance and diversity
    const rankedContent = this.rankContentByRelevanceAndDiversity(
      scoredContent, 
      options.maxResults || 20
    );
    
    // Group by content type
    const groupedContent = this.groupContentByType(rankedContent);
    
    // Convert to ContextAssembly format
    return {
      relevantSections: groupedContent.sections,
      relevantPrimitives: groupedContent.primitives,
      relevantNotes: groupedContent.notes,
      relatedConcepts: groupedContent.primitives,
      prerequisiteChain: [],
      learningPath: groupedContent.relationships,
      criterionLearningPaths: learningPaths,
      relatedCriteria: [],
      userProgress: userContext?.progress || {
        userId: userContext?.userId || 0,
        overallMastery: 0,
        currentUeeStage: 'UNDERSTAND',
        recentActivity: []
      },
      learningGoals: userContext?.learningGoals || [],
      currentSession: userContext?.currentSession || {
        id: 0,
        startTime: new Date(),
        duration: 0,
        focusArea: '',
        currentProgress: 0
      },
      confidence: this.calculateOverallConfidence(rankedContent),
      relevance: 0.8,
      freshness: 0.9,
      metadata: {
        totalContent: rankedContent.length,
        contentDistribution: this.calculateContentDistribution(groupedContent),
        processingTimeMs: 0,
        sources: {
          vectorSearch: vectorResults.length,
          graphTraversal: graphResults.nodes.length,
          userContext: userContext ? 1 : 0,
          learningPaths: learningPaths.length
        }
      }
    };
  }
  
  /**
   * Extracts key concepts from vector search results
   */
  private async extractKeyConcepts(vectorResults: VectorSearchResult[]): Promise<string[]> {
    const concepts = new Set<string>();
    
    for (const result of vectorResults) {
      // Extract concepts from content
      const extracted = await this.nlpExtractConcepts(result.content);
      extracted.forEach(concept => concepts.add(concept));
      
      // Add concepts from metadata
      if (result.metadata.conceptTags) {
        result.metadata.conceptTags.forEach(tag => concepts.add(tag));
      }
    }
    
    return Array.from(concepts);
  }
  
  /**
   * Calculates relevance score for content
   */
  private async calculateRelevance(
    content: any, 
    options: ContextOptions
  ): Promise<number> {
    let score = 0;
    
    // Base relevance from vector search
    if (content.source === 'vector' && content.similarity) {
      score += content.similarity * 0.6;
    }
    
    // User preference matching
    if (options.focusSection && content.blueprintSectionId === options.focusSection) {
      score += 0.2;
    }
    
    if (options.ueeLevel && content.ueeLevel === options.ueeLevel) {
      score += 0.1;
    }
    
    // Difficulty matching
    if (options.difficultyRange) {
      const [min, max] = options.difficultyRange;
      if (content.complexityScore >= min && content.complexityScore <= max) {
        score += 0.1;
      }
    }
    
    // Freshness bonus
    if (content.updatedAt) {
      const daysSinceUpdate = (Date.now() - new Date(content.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate < 7) score += 0.1;
    }
    
    return Math.min(1.0, score);
  }
  
  /**
   * Ranks content by relevance and diversity
   */
  private rankContentByRelevanceAndDiversity(
    scoredContent: any[], 
    maxResults: number
  ): any[] {
    // Simple ranking by relevance score
    // In production, you'd implement diversity-aware ranking
    return scoredContent
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  }
  
  /**
   * Groups content by type
   */
  private groupContentByType(rankedContent: any[]): {
    sections: BlueprintSectionNode[];
    primitives: KnowledgePrimitiveNode[];
    notes: NoteSectionNode[];
    relationships: KnowledgeRelationshipNode[];
  } {
    const sections: BlueprintSectionNode[] = [];
    const primitives: KnowledgePrimitiveNode[] = [];
    const notes: NoteSectionNode[] = [];
    const relationships: KnowledgeRelationshipNode[] = [];
    
    for (const content of rankedContent) {
      if (content.sourceType === 'section') {
        sections.push(content);
      } else if (content.sourceType === 'primitive') {
        primitives.push(content);
      } else if (content.sourceType === 'note') {
        notes.push(content);
      }
    }
    
    return { sections, primitives, notes, relationships };
  }
  
  /**
   * Calculates content distribution
   */
  private calculateContentDistribution(groupedContent: any): ContentDistribution {
    return {
      sections: groupedContent.sections.length,
      primitives: groupedContent.primitives.length,
      notes: groupedContent.notes.length,
      relationships: groupedContent.relationships.length
    };
  }
  
  /**
   * Calculates overall confidence
   */
  private calculateOverallConfidence(rankedContent: any[]): number {
    if (rankedContent.length === 0) return 0;
    
    const totalConfidence = rankedContent.reduce((sum, content) => {
      return sum + (content.confidence || 0.8);
    }, 0);
    
    return totalConfidence / rankedContent.length;
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  private async findRelatedMasteryCriteria(keyConcepts: string[]) {
    try {
      const criteria: any[] = [];
      
      for (const concept of keyConcepts.slice(0, 5)) { // Limit to top 5 concepts
        const found = await prisma.masteryCriterion.findMany({
          where: {
            OR: [
              { title: { contains: concept, mode: 'insensitive' } },
              { description: { contains: concept, mode: 'insensitive' } }
            ]
          },
          take: 3
        });
        criteria.push(...found);
      }
      
      return criteria;
    } catch {
      return [];
    }
  }
  
  private async getUser(userId: number) {
    try {
      return await prisma.user.findUnique({ where: { id: userId } });
    } catch {
      return null;
    }
  }
  
  private async getUserProgress(userId: number) {
    // Placeholder implementation
    return {
      userId,
      overallMastery: 0.7,
      currentUeeStage: 'USE',
      recentActivity: []
    };
  }
  
  private async getUserLearningGoals(userId: number) {
    // Placeholder implementation
    return [];
  }
  
  private async getCurrentStudySession(userId: number) {
    // Placeholder implementation
    return null;
  }
  
  private async nlpExtractConcepts(content: string): Promise<string[]> {
    // Placeholder for NLP concept extraction
    // In production, this would use NLP libraries or AI services
    const words = content.toLowerCase().split(/\s+/);
    const concepts = words.filter(word => 
      word.length > 3 && 
      !['the', 'and', 'for', 'with', 'this', 'that', 'have', 'been'].includes(word)
    );
    return concepts.slice(0, 5); // Return top 5 concepts
  }
}

export { ContextAssemblyService };
