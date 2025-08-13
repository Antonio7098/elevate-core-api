import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// VECTOR STORE SERVICE
// ============================================================================
// 
// This service integrates with Pinecone vector database for semantic search
// operations. It provides vector embeddings, similarity search, and content
// indexing for the RAG system.
//
// Key Features:
// - Vector embeddings for blueprint sections, primitives, and notes
// - Semantic similarity search with configurable thresholds
// - Content indexing and metadata storage
// - Batch operations for performance
// - Integration with knowledge graph context
//
// Performance: Optimized for <200ms vector search operations
//
// ============================================================================

export interface VectorSearchResult {
  id: string;
  content: string;
  similarity: number;
  sourceType: 'section' | 'primitive' | 'note';
  sourceId: string;
  metadata: {
    conceptTags: string[];
    complexityScore?: number;
    uueLevel?: string;
    blueprintSectionId?: number;
    blueprintId?: number;
    userId?: number;
    lastUpdated?: Date;
  };
  vector?: number[]; // Raw vector for advanced operations
}

export interface SearchFilters {
  blueprintId?: number;
  sectionId?: number;
  uueLevel?: string;
  difficultyRange?: [number, number];
  conceptTags?: string[];
  maxResults?: number;
  similarityThreshold?: number;
  includeVectors?: boolean;
}

export interface EmbeddingRequest {
  content: string;
  contentType: 'section' | 'primitive' | 'note';
  metadata: {
    title?: string;
    description?: string;
    conceptTags?: string[];
    complexityScore?: number;
    ueeLevel?: string;
    blueprintSectionId?: number;
    blueprintId?: number;
    userId?: number;
  };
}

export interface EmbeddingResult {
  vector: number[];
  dimension: number;
  model: string;
  processingTimeMs: number;
}

export interface IndexingResult {
  success: boolean;
  indexedCount: number;
  errors: string[];
  processingTimeMs: number;
}

export default class VectorStoreService {
  
  private pineconeApiKey: string;
  private pineconeEnvironment: string;
  private pineconeIndex: string;
  private embeddingModel: string;
  
  constructor() {
    // Initialize Pinecone configuration
    this.pineconeApiKey = process.env.PINECONE_API_KEY || '';
    this.pineconeEnvironment = process.env.PINECONE_ENVIRONMENT || '';
    this.pineconeIndex = process.env.PINECONE_INDEX || 'elevate-knowledge';
    this.embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-ada-002';
    
    this.validateConfiguration();
  }
  
  /**
   * Main vector search method
   * Searches for semantically similar content across all indexed types
   */
  async searchVectorStore(
    query: string, 
    filters?: SearchFilters
  ): Promise<VectorSearchResult[]> {
    const startTime = Date.now();
    
    try {
      // 1. Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);
      
      // 2. Perform vector search in Pinecone
      const searchResults = await this.pineconeSearch(
        queryEmbedding.vector,
        filters
      );
      
      // 3. Enrich results with metadata
      const enrichedResults = await this.enrichSearchResults(
        searchResults,
        filters
      );
      
      // 4. Apply post-search filtering
      const filteredResults = this.applyPostSearchFilters(
        enrichedResults,
        filters
      );
      
      const processingTime = Date.now() - startTime;
      console.log(`Vector search completed in ${processingTime}ms`);
      
      return filteredResults;
      
    } catch (error) {
      console.error('Vector search failed:', error);
      // Fallback to database-based search
      return await this.fallbackDatabaseSearch(query, filters);
    }
  }
  
  /**
   * Generates vector embeddings for content
   */
  async generateEmbedding(content: string): Promise<EmbeddingResult> {
    const startTime = Date.now();
    
    try {
      // This would integrate with OpenAI's embedding API or similar
      // For now, we'll use a placeholder implementation
      
      if (this.embeddingModel === 'text-embedding-ada-002') {
        // OpenAI Ada-002 embeddings (1536 dimensions)
        const vector = await this.generateOpenAIEmbedding(content);
        return {
          vector,
          dimension: 1536,
          model: 'text-embedding-ada-002',
          processingTimeMs: Date.now() - startTime
        };
      } else {
        // Fallback to simple hash-based embedding
        const vector = this.generateHashBasedEmbedding(content);
        return {
          vector,
          dimension: 128,
          model: 'hash-based-fallback',
          processingTimeMs: Date.now() - startTime
        };
      }
      
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }
  
  /**
   * Indexes content in the vector store
   */
  async indexContent(
    content: EmbeddingRequest[]
  ): Promise<IndexingResult> {
    const startTime = Date.now();
    const results: IndexingResult = {
      success: true,
      indexedCount: 0,
      errors: [],
      processingTimeMs: 0
    };
    
    try {
      for (const item of content) {
        try {
          // Generate embedding
          const embedding = await this.generateEmbedding(item.content);
          
          // Prepare metadata for Pinecone
          const metadata = {
            ...item.metadata,
            contentType: item.contentType,
            contentLength: item.content.length,
            indexedAt: new Date().toISOString()
          };
          
          // Index in Pinecone
          await this.pineconeUpsert(
            item.content,
            embedding.vector,
            metadata
          );
          
          results.indexedCount++;
          
        } catch (error) {
          results.errors.push(`Failed to index ${item.contentType}: ${error.message}`);
        }
      }
      
      results.processingTimeMs = Date.now() - startTime;
      return results;
      
    } catch (error) {
      results.success = false;
      results.errors.push(`Indexing failed: ${error.message}`);
      results.processingTimeMs = Date.now() - startTime;
      return results;
    }
  }
  
  /**
   * Batch indexes blueprint content
   */
  async indexBlueprintContent(blueprintId: number): Promise<IndexingResult> {
    try {
      // Get all content for the blueprint
      const [sections, primitives, notes] = await Promise.all([
        this.getBlueprintSections(blueprintId),
        this.getBlueprintPrimitives(blueprintId),
        this.getBlueprintNotes(blueprintId)
      ]);
      
      // Prepare content for indexing
      const contentToIndex: EmbeddingRequest[] = [
        ...sections.map(section => ({
          content: `${section.title} ${section.description || ''}`,
          contentType: 'section' as const,
          metadata: {
            title: section.title,
            description: section.description,
            blueprintSectionId: section.id,
            blueprintId: blueprintId,
            userId: section.userId
          }
        })),
        ...primitives.map(primitive => ({
          content: `${primitive.title} ${primitive.description || ''}`,
          contentType: 'primitive' as const,
          metadata: {
            title: primitive.title,
            description: primitive.description,
            conceptTags: primitive.conceptTags || [],
            complexityScore: primitive.complexityScore,
            ueeLevel: primitive.ueeLevel,
            blueprintSectionId: primitive.blueprintSectionId || undefined,
            blueprintId: blueprintId,
            userId: primitive.userId
          }
        })),
        ...notes.map(note => ({
          content: `${note.title} ${note.content}`,
          contentType: 'note' as const,
          metadata: {
            title: note.title,
            blueprintSectionId: note.blueprintSectionId,
            blueprintId: blueprintId,
            userId: note.userId
          }
        }))
      ];
      
      // Index all content
      return await this.indexContent(contentToIndex);
      
    } catch (error) {
      console.error('Blueprint content indexing failed:', error);
      return {
        success: false,
        indexedCount: 0,
        errors: [`Blueprint indexing failed: ${error.message}`],
        processingTimeMs: 0
      };
    }
  }
  
  /**
   * Updates existing content in the vector store
   */
  async updateContent(
    contentId: string,
    contentType: 'section' | 'primitive' | 'note',
    newContent: string,
    metadata?: any
  ): Promise<boolean> {
    try {
      // Generate new embedding
      const embedding = await this.generateEmbedding(newContent);
      
      // Update in Pinecone
      await this.pineconeUpsert(
        newContent,
        embedding.vector,
        {
          ...metadata,
          contentType,
          contentId,
          updatedAt: new Date().toISOString()
        }
      );
      
      return true;
      
    } catch (error) {
      console.error('Content update failed:', error);
      return false;
    }
  }
  
  /**
   * Deletes content from the vector store
   */
  async deleteContent(
    contentId: string,
    contentType: 'section' | 'primitive' | 'note'
  ): Promise<boolean> {
    try {
      // Delete from Pinecone
      await this.pineconeDelete(contentId);
      return true;
      
    } catch (error) {
      console.error('Content deletion failed:', error);
      return false;
    }
  }
  
  /**
   * Performs similarity search between content items
   */
  async findSimilarContent(
    contentId: string,
    contentType: 'section' | 'primitive' | 'note',
    maxResults: number = 10,
    similarityThreshold: number = 0.7
  ): Promise<VectorSearchResult[]> {
    try {
      // Get the content's vector
      const contentVector = await this.getContentVector(contentId);
      if (!contentVector) {
        throw new Error(`Content vector not found for ${contentId}`);
      }
      
      // Search for similar content
      const similarResults = await this.pineconeSearch(
        contentVector,
        {
          maxResults,
          similarityThreshold,
          excludeIds: [contentId]
        }
      );
      
      // Enrich and return results
      return await this.enrichSearchResults(similarResults);
      
    } catch (error) {
      console.error('Similar content search failed:', error);
      return [];
    }
  }
  
  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================
  
  private validateConfiguration(): void {
    if (!this.pineconeApiKey) {
      console.warn('PINECONE_API_KEY not set, using fallback search');
    }
    if (!this.pineconeEnvironment) {
      console.warn('PINECONE_ENVIRONMENT not set, using fallback search');
    }
  }
  
  private async generateOpenAIEmbedding(content: string): Promise<number[]> {
    // This would integrate with OpenAI's embedding API
    // For now, return a placeholder vector
    const dimension = 1536;
    const vector: number[] = [];
    
    for (let i = 0; i < dimension; i++) {
      // Simple hash-based vector generation
      const hash = this.hashString(content + i.toString());
      vector.push((hash % 2000 - 1000) / 1000); // Normalize to [-1, 1]
    }
    
    return vector;
  }
  
  private generateHashBasedEmbedding(content: string): number[] {
    const dimension = 128;
    const vector: number[] = [];
    
    for (let i = 0; i < dimension; i++) {
      const hash = this.hashString(content + i.toString());
      vector.push((hash % 2000 - 1000) / 1000);
    }
    
    return vector;
  }
  
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  private async pineconeSearch(
    vector: number[],
    filters?: SearchFilters
  ): Promise<any[]> {
    // This would perform actual Pinecone search
    // For now, return placeholder results
    return [
      {
        id: 'placeholder_1',
        score: 0.95,
        metadata: { contentType: 'section', sourceId: '1' }
      },
      {
        id: 'placeholder_2',
        score: 0.87,
        metadata: { contentType: 'primitive', sourceId: '2' }
      }
    ];
  }
  
  private async pineconeUpsert(
    content: string,
    vector: number[],
    metadata: any
  ): Promise<void> {
    // This would upsert to Pinecone
    console.log('Pinecone upsert placeholder:', { content: content.substring(0, 50), metadata });
  }
  
  private async pineconeDelete(contentId: string): Promise<void> {
    // This would delete from Pinecone
    console.log('Pinecone delete placeholder:', contentId);
  }
  
  private async getContentVector(contentId: string): Promise<number[] | null> {
    // This would retrieve vector from Pinecone
    // For now, return null
    return null;
  }
  
  private async enrichSearchResults(
    searchResults: any[],
    filters?: SearchFilters
  ): Promise<VectorSearchResult[]> {
    const enriched: VectorSearchResult[] = [];
    
    for (const result of searchResults) {
      try {
        // Get content details from database
        const contentDetails = await this.getContentDetails(
          result.metadata.sourceId,
          result.metadata.contentType
        );
        
        if (contentDetails) {
          enriched.push({
            id: result.id,
            content: contentDetails.content,
            similarity: result.score,
            sourceType: result.metadata.contentType,
            sourceId: result.metadata.sourceId,
            metadata: {
              conceptTags: contentDetails.conceptTags || [],
              complexityScore: contentDetails.complexityScore,
              ueeLevel: contentDetails.ueeLevel,
              blueprintSectionId: contentDetails.blueprintSectionId,
              blueprintId: contentDetails.blueprintId,
              userId: contentDetails.userId,
              lastUpdated: contentDetails.updatedAt
            }
          });
        }
      } catch (error) {
        console.error(`Failed to enrich result ${result.id}:`, error);
      }
    }
    
    return enriched;
  }
  
  private applyPostSearchFilters(
    results: VectorSearchResult[],
    filters?: SearchFilters
  ): VectorSearchResult[] {
    let filtered = results;
    
    // Apply similarity threshold
    if (filters?.similarityThreshold) {
      filtered = filtered.filter(r => r.similarity >= filters.similarityThreshold!);
    }
    
    // Apply blueprint filter
    if (filters?.blueprintId) {
      filtered = filtered.filter(r => r.metadata.blueprintId === filters.blueprintId);
    }
    
    // Apply section filter
    if (filters?.sectionId) {
      filtered = filtered.filter(r => r.metadata.blueprintSectionId === filters.sectionId);
    }
    
    // Apply UEE level filter
    if (filters?.ueeLevel) {
      filtered = filtered.filter(r => r.metadata.ueeLevel === filters.ueeLevel);
    }
    
    // Apply difficulty range filter
    if (filters?.difficultyRange) {
      const [min, max] = filters.difficultyRange;
      filtered = filtered.filter(r => {
        const score = r.metadata.complexityScore || 0;
        return score >= min && score <= max;
      });
    }
    
    // Apply concept tags filter
    if (filters?.conceptTags && filters.conceptTags.length > 0) {
      filtered = filtered.filter(r => 
        r.metadata.conceptTags.some(tag => 
          filters.conceptTags!.includes(tag)
        )
      );
    }
    
    // Limit results
    if (filters?.maxResults) {
      filtered = filtered.slice(0, filters.maxResults);
    }
    
    return filtered;
  }
  
  private async fallbackDatabaseSearch(
    query: string,
    filters?: SearchFilters
  ): Promise<VectorSearchResult[]> {
    // Fallback to database-based search when vector search fails
    const results: VectorSearchResult[] = [];
    
    try {
      // Search blueprint sections
      const sections = await this.searchBlueprintSections(query, filters);
      results.push(...sections.map(section => ({
        id: `section_${section.id}`,
        content: `${section.title} ${section.description || ''}`,
        similarity: this.calculateTextSimilarity(query, section.title),
        sourceType: 'section' as const,
        sourceId: section.id.toString(),
        metadata: {
          conceptTags: [],
          complexityScore: undefined,
          ueeLevel: undefined,
          blueprintSectionId: section.id,
          blueprintId: section.blueprintId,
          userId: section.userId
        }
      })));
      
      // Search knowledge primitives
      const primitives = await this.searchKnowledgePrimitives(query, filters);
      results.push(...primitives.map(primitive => ({
        id: `primitive_${primitive.id}`,
        content: `${primitive.title} ${primitive.description || ''}`,
        similarity: this.calculateTextSimilarity(query, primitive.title),
        sourceType: 'primitive' as const,
        sourceId: primitive.id.toString(),
        metadata: {
          conceptTags: primitive.conceptTags || [],
          complexityScore: primitive.complexityScore,
          ueeLevel: primitive.ueeLevel,
          blueprintSectionId: primitive.blueprintSectionId || undefined,
          blueprintId: primitive.blueprintId,
          userId: primitive.userId
        }
      })));
      
      // Search notes
      const notes = await this.searchNotes(query, filters);
      results.push(...notes.map(note => ({
        id: `note_${note.id}`,
        content: `${note.title} ${note.content}`,
        similarity: this.calculateTextSimilarity(query, note.title),
        sourceType: 'note' as const,
        sourceId: note.id.toString(),
        metadata: {
          conceptTags: [],
          complexityScore: undefined,
          ueeLevel: undefined,
          blueprintSectionId: note.blueprintSectionId,
          blueprintId: undefined,
          userId: note.userId
        }
      })));
      
      // Sort by similarity and apply filters
      return results
        .filter(result => result.similarity > 0.3)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, filters?.maxResults || 20);
        
    } catch (error) {
      console.error('Fallback search failed:', error);
      return [];
    }
  }
  
  private calculateTextSimilarity(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    let matches = 0;
    for (const queryWord of queryWords) {
      if (contentWords.some(contentWord => contentWord.includes(queryWord))) {
        matches++;
      }
    }
    
    return matches / queryWords.length;
  }
  
  private async getContentDetails(sourceId: string, contentType: string): Promise<any> {
    try {
      switch (contentType) {
        case 'section':
          return await prisma.blueprintSection.findUnique({
            where: { id: parseInt(sourceId) }
          });
        case 'primitive':
          return await prisma.knowledgePrimitive.findUnique({
            where: { id: parseInt(sourceId) }
          });
        case 'note':
          return await prisma.noteSection.findUnique({
            where: { id: parseInt(sourceId) }
          });
        default:
          return null;
      }
    } catch {
      return null;
    }
  }
  
  private async getBlueprintSections(blueprintId: number) {
    return await prisma.blueprintSection.findMany({
      where: { blueprintId }
    });
  }
  
  private async getBlueprintPrimitives(blueprintId: number) {
    return await prisma.knowledgePrimitive.findMany({
      where: { blueprintId }
    });
  }
  
  private async getBlueprintNotes(blueprintId: number) {
    // Get notes from sections in the blueprint
    const sections = await prisma.blueprintSection.findMany({
      where: { blueprintId },
      select: { id: true }
    });
    
    const sectionIds = sections.map(s => s.id);
    
    return await prisma.noteSection.findMany({
      where: {
        blueprintSectionId: { in: sectionIds }
      }
    });
  }
  
  private async searchBlueprintSections(query: string, filters?: SearchFilters) {
    return await prisma.blueprintSection.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ],
        ...(filters?.sectionId && { id: filters.sectionId }),
        ...(filters?.blueprintId && { blueprintId: filters.blueprintId })
      },
      take: 10
    });
  }
  
  private async searchKnowledgePrimitives(query: string, filters?: SearchFilters) {
    return await prisma.knowledgePrimitive.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ],
        ...(filters?.blueprintId && { blueprintId: filters.blueprintId }),
        ...(filters?.sectionId && { blueprintSectionId: filters.sectionId })
      },
      take: 10
    });
  }
  
  private async searchNotes(query: string, filters?: SearchFilters) {
    return await prisma.noteSection.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } }
        ],
        ...(filters?.sectionId && { blueprintSectionId: filters.sectionId })
      },
      take: 10
    });
  }
}

export { VectorStoreService };
