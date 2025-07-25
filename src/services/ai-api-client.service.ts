import axios, { AxiosInstance, AxiosError } from 'axios';
import { Injectable, Logger } from '@nestjs/common';

// Custom error class for AI API failures
export class AIAPIError extends Error {
  constructor(message: string, public statusCode?: number, public originalError?: any) {
    super(message);
    this.name = 'AIAPIError';
  }
}

// Type definitions for AI API requests/responses
export interface BlueprintIndexRequest {
  blueprint_id: string;
  blueprint_json: Record<string, any>;
  force_reindex: boolean;
}

export interface BlueprintUpdateRequest {
  blueprint: Record<string, any>;
  strategy: 'incremental' | 'full_reindex';
  source: string;
  timestamp: string;
}

export interface BlueprintChangePreviewRequest {
  blueprint: Record<string, any>;
  source: string;
  timestamp: string;
}

export interface AIAPIResponse {
  status: string;
  message?: string;
  [key: string]: any;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  version?: string;
  uptime?: number;
  error?: string;
}

export interface IndexingResponse extends AIAPIResponse {
  blueprint_id: string;
  indexed_at: string;
  vector_count?: number;
}

export interface UpdateResponse extends AIAPIResponse {
  changes_applied: number;
  updated_at: string;
  strategy_used: string;
}

export interface DeleteResponse extends AIAPIResponse {
  deleted_at: string;
  vectors_removed?: number;
}

export interface StatusResponse extends AIAPIResponse {
  is_indexed: boolean;
  last_indexed_at?: string;
  vector_count?: number;
  index_version?: string;
}

export interface ChangePreviewResponse {
  blueprint_id: string;
  changes: Array<{
    type: 'add' | 'modify' | 'remove';
    path: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
  total_changes: number;
  estimated_processing_time: number;
}

// Chat message request/response interfaces
export interface ChatMessageRequest {
  userId: string;
  message: string;
  chatHistory?: Array<{
    role: string;
    content: string;
  }>;
  context?: Record<string, any>;
}

export interface ChatMessageResponse {
  response?: string;
  content?: string;
  status: 'success' | 'error';
  metadata?: Record<string, any>;
}

// Blueprint query interfaces
export interface BlueprintQueryRequest {
  blueprintId: string;
  query: string;
  maxResults?: number;
}

export interface BlueprintQueryResponse {
  results: Array<{
    id: string;
    content: string;
    relevance_score: number;
    metadata?: Record<string, any>;
  }>;
  total_results: number;
}

@Injectable()
export class AIAPIClientService {
  private readonly logger = new Logger(AIAPIClientService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = (process.env.AI_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
    this.apiKey = process.env.AI_API_KEY || 'test_api_key_123';
    this.timeout = parseFloat(process.env.AI_API_TIMEOUT || '30') * 1000; // Convert to milliseconds

    if (!this.apiKey) {
      this.logger.warn('AI_API_KEY not configured. AI API calls will fail.');
    }

    // Create persistent HTTP client
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use((config) => {
      this.logger.debug(`Making AI API request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Add response interceptor for logging and error handling
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.debug(`AI API response: ${response.status} ${response.config.url}`);
        return response;
      },
      async (error: AxiosError) => {
        const config = error.config;
        const retryCount = (config as any)._retryCount || 0;
        const maxRetries = 3;

        // Log the error
        this.logger.error(`AI API request failed: ${error.message}`, error.response?.data);

        // Implement retry logic for 5xx errors and network errors
        if (
          retryCount < maxRetries &&
          (error.code === 'ECONNABORTED' || 
           error.code === 'ENOTFOUND' || 
           error.code === 'ECONNREFUSED' ||
           (error.response && error.response.status >= 500))
        ) {
          (config as any)._retryCount = retryCount + 1;
          const delay = Math.pow(2, retryCount) * 1000;
          
          this.logger.warn(`Retrying AI API request in ${delay}ms (attempt ${retryCount + 1}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.axiosInstance(config!);
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if AI API is healthy and accessible
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    try {
      const response = await this.axiosInstance.get('/api/health');
      const result = response.data as HealthCheckResponse;
      
      this.logger.log('AI API health check successful');
      return { 
        status: 'healthy',
        version: result.version,
        uptime: result.uptime
      };
    } catch (error: any) {
      this.logger.error('AI API health check failed', error);
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Index a new blueprint in the AI API for RAG retrieval
   */
  async indexBlueprint(payload: BlueprintIndexRequest): Promise<IndexingResponse> {
    try {
      const response = await this.axiosInstance.post('/api/v1/index-blueprint', payload);
      const result = response.data as IndexingResponse;
      
      this.logger.log(`Successfully indexed blueprint ${payload.blueprint_id}`);
      return result;

    } catch (error: any) {
      const message = this.extractErrorMessage(error, 'Blueprint indexing failed');
      this.logger.error(message, error.response?.data);
      throw new AIAPIError(message, error.response?.status, error);
    }
  }

  /**
   * Update an existing blueprint in the AI API
   */
  async updateBlueprint(
    blueprintId: string, 
    blueprint: Record<string, any>, 
    strategy: 'incremental' | 'full_reindex' = 'incremental'
  ): Promise<UpdateResponse> {
    try {
      console.log('\n=== AI API CLIENT DEBUG START ===');
      console.log('updateBlueprint called with:');
      console.log('- blueprintId:', blueprintId);
      console.log('- blueprint type:', typeof blueprint);
      console.log('- blueprint value:', JSON.stringify(blueprint, null, 2));
      console.log('- strategy:', strategy);
      
      // Transform the blueprint payload to match LearningBlueprint schema
      const transformedBlueprint = {
        source_id: blueprint.source_id || blueprintId,
        source_title: blueprint.source_title || `Blueprint ${blueprintId}`,
        source_type: blueprint.source_type || 'text',
        source_summary: blueprint.source_summary || {
          core_thesis_or_main_argument: 'Learning content analysis',
          inferred_purpose: 'Educational material for learning'
        },
        sections: this.transformSections(blueprint.sections || []),
        knowledge_primitives: this.transformKnowledgePrimitives(blueprint.knowledge_primitives || {})
      };
      
      console.log('Transformed blueprint:');
      console.log(JSON.stringify(transformedBlueprint, null, 2));

      const payload: BlueprintUpdateRequest = {
        blueprint: transformedBlueprint,
        strategy,
        source: 'core_api',
        timestamp: new Date().toISOString()
      };
      
      console.log('Final payload being sent to AI API:');
      console.log(JSON.stringify(payload, null, 2));
      console.log('=== AI API CLIENT DEBUG END ===\n');

      const response = await this.axiosInstance.put(`/api/v1/blueprints/${blueprintId}`, payload);
      const result = response.data as UpdateResponse;
      
      this.logger.log(`Successfully updated blueprint ${blueprintId} with ${result.changes_applied} changes`);
      return result;

    } catch (error: any) {
      const message = this.extractErrorMessage(error, 'Blueprint update failed');
      this.logger.error(message, error.response?.data);
      throw new AIAPIError(message, error.response?.status, error);
    }
  }

  /**
   * Delete a blueprint from the AI API
   */
  async deleteBlueprint(blueprintId: string): Promise<DeleteResponse> {
    try {
      const response = await this.axiosInstance.delete(`/api/v1/index-blueprint/${blueprintId}`);
      const result = response.data as DeleteResponse;
      
      this.logger.log(`Successfully deleted blueprint ${blueprintId} from AI API`);
      return result;

    } catch (error: any) {
      // Handle 404 gracefully - blueprint might already be deleted
      if (error.response?.status === 404) {
        this.logger.warn(`Blueprint ${blueprintId} not found in AI API (already deleted?)`);
        return {
          status: 'not_found',
          message: 'Blueprint not found',
          deleted_at: new Date().toISOString()
        };
      }

      const message = this.extractErrorMessage(error, 'Blueprint deletion failed');
      this.logger.error(message, error.response?.data);
      throw new AIAPIError(message, error.response?.status, error);
    }
  }

  /**
   * Get indexing status of a blueprint in the AI API
   */
  async getBlueprintStatus(blueprintId: string): Promise<StatusResponse> {
    try {
      const response = await this.axiosInstance.get(`/api/v1/blueprints/${blueprintId}/status`);
      return response.data as StatusResponse;

    } catch (error: any) {
      if (error.response?.status === 404) {
        return {
          status: 'success',
          is_indexed: false,
          message: 'Blueprint not indexed'
        };
      }

      const message = this.extractErrorMessage(error, 'Blueprint status check failed');
      this.logger.error(message, error.response?.data);
      throw new AIAPIError(message, error.response?.status, error);
    }
  }

  /**
   * Preview changes that would be made when updating a blueprint (dry run)
   */
  async previewBlueprintChanges(
    blueprintId: string, 
    blueprint: Record<string, any>
  ): Promise<ChangePreviewResponse> {
    try {
      const payload: BlueprintChangePreviewRequest = {
        blueprint,
        source: 'core_api',
        timestamp: new Date().toISOString()
      };

      const response = await this.axiosInstance.post(`/api/v1/blueprints/${blueprintId}/changes`, payload);
      const result = response.data as ChangePreviewResponse;
      
      this.logger.debug(`Preview generated for blueprint ${blueprintId}: ${result.total_changes} total changes`);
      return result;

    } catch (error: any) {
      const message = this.extractErrorMessage(error, 'Blueprint change preview failed');
      this.logger.error(message, error.response?.data);
      throw new AIAPIError(message, error.response?.status, error);
    }
  }

  /**
   * Send chat message to AI API with RAG context
   */
  async sendChatMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    try {
      const payload = {
        user_id: request.userId,
        message_content: request.message,
        conversation_history: request.chatHistory || [],
        context: request.context || {},
        session_id: request.userId, // Use userId as session_id for now
        metadata: {}
      };

      const response = await this.axiosInstance.post('/api/v1/chat/message', payload);
      const result = response.data as ChatMessageResponse;
      
      this.logger.log(`Chat message processed successfully for user ${request.userId}`);
      return result;

    } catch (error: any) {
      const message = this.extractErrorMessage(error, 'Chat message processing failed');
      this.logger.error(message, error.response?.data);
      throw new AIAPIError(message, error.response?.status, error);
    }
  }

  /**
   * Query blueprint content using RAG retrieval
   */
  async queryBlueprint(request: BlueprintQueryRequest): Promise<any[]> {
    try {
      const payload = {
        blueprint_id: request.blueprintId,
        query: request.query,
        max_results: request.maxResults || 5,
        timestamp: new Date().toISOString()
      };

      const response = await this.axiosInstance.post('/api/v1/query/blueprint', payload);
      const result = response.data;
      
      this.logger.log(`Blueprint query successful for blueprint ${request.blueprintId}`);
      return Array.isArray(result.results) ? result.results : [];

    } catch (error: any) {
      const message = this.extractErrorMessage(error, 'Blueprint query failed');
      this.logger.error(message, error.response?.data);
      throw new AIAPIError(message, error.response?.status, error);
    }
  }

  /**
   * Test connectivity to the AI API
   */
  async testConnection(): Promise<boolean> {
    try {
      const healthResult = await this.healthCheck();
      return healthResult.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Close the HTTP client (for cleanup)
   */
  async close(): Promise<void> {
    // Axios doesn't need explicit cleanup, but we can add it for completeness
    this.logger.debug('AI API client closed');
  }

  /**
   * Transform sections array to match AI API LearningBlueprint schema
   */
  private transformSections(sections: any[]): any[] {
    return sections.map((section, index) => ({
      section_id: section.section_id || section.id || `section_${index}`,
      section_name: section.section_name || section.title || section.name || `Section ${index + 1}`,
      description: section.description || section.content || 'Section content',
      parent_section_id: section.parent_section_id || section.parentId || null
    }));
  }

  /**
   * Transform knowledge primitives to match AI API LearningBlueprint schema
   */
  private transformKnowledgePrimitives(knowledgePrimitives: any): any {
    const transformed = {
      key_propositions_and_facts: [],
      key_entities_and_definitions: [],
      described_processes_and_steps: [],
      identified_relationships: [],
      implicit_and_open_questions: []
    };

    // Transform key_propositions_and_facts from strings to Proposition objects
    if (knowledgePrimitives.key_propositions_and_facts) {
      transformed.key_propositions_and_facts = knowledgePrimitives.key_propositions_and_facts.map((item: any, index: number) => {
        if (typeof item === 'string') {
          return {
            id: `prop_${index}`,
            statement: item,
            supporting_evidence: [],
            sections: []
          };
        }
        return {
          id: item.id || `prop_${index}`,
          statement: item.statement || item.toString(),
          supporting_evidence: item.supporting_evidence || [],
          sections: item.sections || []
        };
      });
    }

    // Transform other knowledge primitive types similarly
    if (knowledgePrimitives.key_entities_and_definitions) {
      transformed.key_entities_and_definitions = knowledgePrimitives.key_entities_and_definitions.map((item: any, index: number) => {
        if (typeof item === 'string') {
          return {
            id: `entity_${index}`,
            entity: item,
            definition: '',
            category: 'Object',
            sections: []
          };
        }
        return {
          id: item.id || `entity_${index}`,
          entity: item.entity || item.name || item.toString(),
          definition: item.definition || '',
          category: item.category || 'Object',
          sections: item.sections || []
        };
      });
    }

    // Copy other arrays as-is or initialize as empty
    transformed.described_processes_and_steps = knowledgePrimitives.described_processes_and_steps || [];
    transformed.identified_relationships = knowledgePrimitives.identified_relationships || [];
    transformed.implicit_and_open_questions = knowledgePrimitives.implicit_and_open_questions || [];

    return transformed;
  }

  /**
   * Extract error message from axios error or fallback
   */
  private extractErrorMessage(error: any, fallback: string): string {
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return fallback;
  }
}

// Singleton pattern for global access
let aiApiClientInstance: AIAPIClientService | null = null;

export function getAIAPIClient(): AIAPIClientService {
  if (!aiApiClientInstance) {
    throw new Error('AI API client not initialized. Call initializeAIAPIClient() first.');
  }
  return aiApiClientInstance;
}

export function initializeAIAPIClient(): AIAPIClientService {
  if (!aiApiClientInstance) {
    aiApiClientInstance = new AIAPIClientService();
  }
  return aiApiClientInstance;
}

export async function shutdownAIAPIClient(): Promise<void> {
  if (aiApiClientInstance) {
    await aiApiClientInstance.close();
    aiApiClientInstance = null;
  }
}
