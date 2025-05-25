/**
 * AI Service
 * 
 * This service handles communication with the Python AI Service.
 * It implements the contract defined in the AI Service Contract document.
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import {
  AIServiceBaseResponse,
  AIServiceErrorResponse,
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  ChatRequest,
  ChatResponse,
  EvaluateAnswerRequest,
  EvaluateAnswerResponse,
  isErrorResponse
} from '../types/ai-service.types';

/**
 * AI Service class for communicating with the Python AI Service
 */
export class AIService {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string;
  private apiVersion: string;

  /**
   * Create a new AI Service instance
   */
  constructor() {
    this.baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    this.apiKey = process.env.AI_SERVICE_API_KEY || '';
    this.apiVersion = process.env.AI_SERVICE_API_VERSION || 'v1';

    // Create an axios instance with default configuration
    this.client = axios.create({
      baseURL: `${this.baseUrl}/${this.apiVersion}`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      timeout: 30000 // 30 seconds timeout
    });
  }

  /**
   * Generate questions from source text
   * 
   * @param request - The request object containing the source text and options
   * @returns A promise that resolves to the generated questions
   * @throws Error if the request fails or the AI service returns an error
   */
  async generateQuestions(request: GenerateQuestionsRequest): Promise<GenerateQuestionsResponse> {
    try {
      const response = await this.client.post<GenerateQuestionsResponse | AIServiceErrorResponse>(
        '/api/generate-questions',
        request
      );

      const data = response.data;

      if (isErrorResponse(data)) {
        throw new Error(`AI Service Error: ${data.error.code} - ${data.error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
          const errorData = error.response.data as AIServiceErrorResponse;
          throw new Error(`AI Service Error: ${errorData.error.code} - ${errorData.error.message}`);
        }
        throw new Error(`Network Error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Chat with the AI
   * 
   * @param request - The request object containing the message and optional context
   * @returns A promise that resolves to the AI's response
   * @throws Error if the request fails or the AI service returns an error
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      const response = await this.client.post<ChatResponse | AIServiceErrorResponse>(
        '/api/chat',
        request
      );

      const data = response.data;

      if (isErrorResponse(data)) {
        throw new Error(`AI Service Error: ${data.error.code} - ${data.error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
          const errorData = error.response.data as AIServiceErrorResponse;
          throw new Error(`AI Service Error: ${errorData.error.code} - ${errorData.error.message}`);
        }
        throw new Error(`Network Error: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Check if the AI service is available
   * 
   * @returns A promise that resolves to true if the service is available, false otherwise
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.client.get('/health');
      return true;
    } catch (error) {
      console.error('AI Service health check failed:', error);
      return false;
    }
  }

  /**
   * Get the API version
   * 
   * @returns The API version
   */
  getApiVersion(): string {
    return this.apiVersion;
  }

  /**
   * Evaluate a user's answer to a question
   * 
   * @param request - The request object containing the question and user's answer
   * @returns A promise that resolves to the evaluation of the answer
   * @throws Error if the request fails or the AI service returns an error
   */
  async evaluateAnswer(request: EvaluateAnswerRequest): Promise<EvaluateAnswerResponse> {
    try {
      const response = await this.client.post<EvaluateAnswerResponse | AIServiceErrorResponse>(
        '/api/evaluate-answer',
        request
      );

      const data = response.data;

      if (isErrorResponse(data)) {
        throw new Error(`AI Service Error: ${data.error.code} - ${data.error.message}`);
      }

      return data;
    } catch (error) {
      if (error instanceof AxiosError) {
        if (error.response?.data && typeof error.response.data === 'object' && 'error' in error.response.data) {
          const errorData = error.response.data as AIServiceErrorResponse;
          throw new Error(`AI Service Error: ${errorData.error.code} - ${errorData.error.message}`);
        }
        throw new Error(`Network Error: ${error.message}`);
      }
      throw error;
    }
  }
}

// Export a singleton instance of the AI Service
export const aiService = new AIService();
