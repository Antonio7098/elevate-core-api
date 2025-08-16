// src/services/aiService.ts
import axios from 'axios';
import { EvaluateAnswerRequest, EvaluateAnswerResponse } from '../../types/ai-service.types';

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
      const apiKey = process.env.AI_SERVICE_API_KEY;
      if (!apiKey) {
        throw new Error('AI_SERVICE_API_KEY environment variable is not set');
      }

      const requestBody = {
        questionContext: payload.questionContext,
        userAnswer: payload.userAnswer,
        context: payload.context
      };

      // Log to file for debugging
      const fs = require('fs');
      const logData = {
        timestamp: new Date().toISOString(),
        url: `${this.apiUrl}/api/v1/ai/evaluate-answer`,
        payload: requestBody
      };
      fs.appendFileSync('/tmp/ai-service-debug.log', JSON.stringify(logData, null, 2) + '\n');
      
      console.log('🔍 [AI Service] Sending request to AI service:');
      console.log('URL:', `${this.apiUrl}/api/v1/ai/evaluate-answer`);
      console.log('Payload:', JSON.stringify(requestBody, null, 2));

      const response = await axios.post(`${this.apiUrl}/api/v1/ai/evaluate-answer`, requestBody, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('❌ [AI Service] Error evaluating answer:');
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      throw error;
    }
  }
}

// Export a singleton instance for use in controllers
export default new AIService();
