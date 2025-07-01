// src/services/aiService.ts
import axios from 'axios';
import { EvaluateAnswerRequest, EvaluateAnswerResponse } from '../types/ai-service.types';

/**
 * AIService class for interacting with the AI backend service
 * This class is primarily used by the legacy AI controller and routes
 * New code should use the AiRAGService instead
 */
export class AIService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  /**
   * Check if the AI service is available
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.apiUrl}/health`);
      return response.data?.status === 'healthy';
    } catch (error) {
      console.error('AI Service health check failed:', error);
      return false;
    }
  }

  /**
   * Generate questions from source text
   */
  async generateQuestions(payload: { 
    sourceText: string; 
    questionCount: number; 
    folderId?: string | number;
  }) {
    try {
      const response = await axios.post(`${this.apiUrl}/generate/questions`, {
        source_text: payload.sourceText,
        question_count: payload.questionCount,
        folder_id: payload.folderId
      });
      return {
        response: response.data,
        metadata: {}
      };
    } catch (error) {
      console.error('Error generating questions:', error);
      throw error;
    }
  }

  /**
   * Chat with the AI service
   */
  async chat(payload: { 
    message: string; 
    context?: any;
  }) {
    try {
      const response = await axios.post(`${this.apiUrl}/chat`, {
        message: payload.message,
        context: payload.context
      });
      return {
        response: response.data,
        metadata: {}
      };
    } catch (error) {
      console.error('Error in chat:', error);
      throw error;
    }
  }

  /**
   * Generate a note from source text
   */
  async generateNote(payload: {
    sourceText: string;
    folderId?: string | number;
  }) {
    try {
      const response = await axios.post(`${this.apiUrl}/generate/note`, {
        source_text: payload.sourceText,
        folder_id: payload.folderId
      });
      return {
        response: response.data,
        metadata: {}
      };
    } catch (error) {
      console.error('Error generating note:', error);
      throw error;
    }
  }

  /**
   * Evaluate a user's answer to a question
   */
  async evaluateAnswer(payload: EvaluateAnswerRequest): Promise<EvaluateAnswerResponse> {
    try {
      const response = await axios.post(`${this.apiUrl}/evaluate/answer`, {
        question_context: payload.questionContext,
        user_answer: payload.userAnswer,
        context: payload.context
      });
      return response.data;
    } catch (error) {
      console.error('Error evaluating answer:', error);
      throw error;
    }
  }
}

// Export a singleton instance for use in controllers
export default new AIService();
