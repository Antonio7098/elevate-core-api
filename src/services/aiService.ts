/**
 * AI Service
 * 
 * This service handles communication with the Python AI Service.
 * It implements the contract defined in the AI Service Contract document.
 */

import axios, { AxiosError, AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import { UserMemoryService } from './userMemory.service';
import {
  AIServiceBaseResponse,
  AIServiceErrorResponse,
  GenerateQuestionsResponse,
  ChatRequest,
  ChatResponse,
  EvaluateAnswerRequest,
  EvaluateAnswerResponse,
  isErrorResponse,
  isGenerateQuestionsResponse
} from '../types/ai-service.types';
import { GenerateQuestionRequest, GenerateNoteRequest } from '../types/aiGeneration.types';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * AI Service class for communicating with the Python AI Service
 */
export class AIService {
  private client: AxiosInstance;
  private readonly baseUrl: string;
  private apiKey: string;
  private apiVersion: string;

  /**
   * Create a new AI Service instance
   */
  constructor() {
    // Ensure environment variables are loaded
    dotenv.config();
    
    this.baseUrl = config.aiService.url;
    this.apiKey = process.env.AI_SERVICE_API_KEY || '';
    this.apiVersion = process.env.AI_SERVICE_API_VERSION || 'v1';
    
    // console.log(`[AIService] Using base URL: ${this.baseUrl}`);
    // console.log(`[AIService] API Key length: ${this.apiKey.length}`);
    // console.log(`[AIService] API Version: ${this.apiVersion}`);

    // Create an axios instance with default configuration
    this.client = axios.create({
      baseURL: this.baseUrl,  // Don't include version in base URL
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
  async generateQuestions(request: GenerateQuestionRequest): Promise<GenerateQuestionsResponse> {
    try {
      return await this.client.post('/generate-questions', request);  // Only use defined fields in request
    } catch (error) {
      throw new Error('Error generating questions');
    }
  }

  /**
   * Generate a note from source text
   * 
   * @param request - The request object containing the source text and options
   * @returns A promise that resolves to the generated note
   * @throws Error if the request fails or the AI service returns an error
   */
  async generateNote(request: GenerateNoteRequest): Promise<any> {
    try {
      // Logic to call AI service with request fields (noteStyle, sourceFidelity, etc.)
      // For now, simulate or implement AI call
      return await this.client.post('/generate-note', request);  // Adapt endpoint URL as per AI service contract
    } catch (error) {
      throw new Error('Error generating note');
    }
  }

  /**
   * Chat with the AI
   * 
   * @param request - The request object containing the message and optional context
   * @returns A promise that resolves to the AI's response
   * @throws Error if the request fails or the AI service returns an error
   */
  async chat(request: ChatRequest, userId?: number): Promise<ChatResponse> {
    try {
      // Get user preferences if userId is provided
      let userPreferences;
      if (userId) {
        const userMemory = await UserMemoryService.getUserMemory(userId);
        if (userMemory) {
          userPreferences = {
            cognitiveApproach: userMemory.cognitiveApproach,
            explanationStyles: userMemory.explanationStyles,
            interactionStyle: userMemory.interactionStyle,
            primaryGoal: userMemory.primaryGoal
          };
        }
      }

      // Add user preferences to context if available
      const requestWithContext = {
        ...request,
        context: {
          ...request.context,
          ...userPreferences
        }
      };

      logger.info('Chatting with AI with context:', {
        request: requestWithContext,
        userId
      });

      // Add detailed logging for the chat request
      console.log('\n==== AI SERVICE: REQUEST LOGGING START ====');
      console.log(`Message: "${request.message?.substring(0, 50)}${request.message?.length > 50 ? '...' : ''}"`); 
      
      // Log conversation history if present
      if (request.conversation && request.conversation.length > 0) {
        console.log('\nConversation History:');
        request.conversation.forEach((msg, i) => {
          console.log(`  ${msg.role}: "${msg.content?.substring(0, 30)}${msg.content?.length > 30 ? '...' : ''}"`); 
        });
      }
      
      // Log context information
      if (request.context) {
        console.log('\nContext Information:');
        
        // Log folder info
        if (request.context.folderInfo) {
          console.log('\nFolder:');
          console.log(`  Name: ${request.context.folderInfo.name}`);
          console.log(`  ID: ${request.context.folderInfo.id}`);
          if (request.context.folderInfo.description) {
            console.log(`  Description: ${request.context.folderInfo.description}`);
          }
        }
        
        // Log question sets
        if (request.context.questionSets && request.context.questionSets.length > 0) {
          console.log('\nQuestion Sets:');
          console.log(`  Count: ${request.context.questionSets.length}`);
          
          // Log first question set as example
          const firstSet = request.context.questionSets[0];
          console.log(`  First Set: "${firstSet.name}" (ID: ${firstSet.id})`);
          console.log(`  Questions in first set: ${firstSet.questions.length}`);
          
          if (firstSet.questions.length > 0) {
            console.log('  Sample questions:');
            firstSet.questions.slice(0, 2).forEach((q, i) => {
              console.log(`    Q${i+1}: "${q.text.substring(0, 40)}${q.text.length > 40 ? '...' : ''}"`);
            });
          }
        }

        // Log user preferences
        if (request.context.learningStyles) {
          console.log('\nUser Learning Styles:', request.context.learningStyles);
        }
        if (request.context.preferredAiTone) {
          console.log('Preferred AI Tone:', request.context.preferredAiTone);
        }
        if (request.context.preferredAiVerbosity) {
          console.log('Preferred AI Verbosity:', request.context.preferredAiVerbosity);
        }
        if (request.context.primaryGoal) {
          console.log('Primary Goal:', request.context.primaryGoal);
        }
        
        // Log summary if available
        if (request.context.summary) {
          console.log('\nSummary:');
          console.log(`  Total Question Sets: ${request.context.summary.totalQuestionSets}`);
          console.log(`  Total Questions: ${request.context.summary.totalQuestions}`);
          console.log(`  Question Types: ${request.context.summary.questionTypes.join(', ')}`);
        }
      }
      
      // Log the full request object (but truncate large arrays)
      const logRequest = { ...requestWithContext };
      if (logRequest.context?.questionSets && logRequest.context.questionSets.length > 0) {
        // For each question set, limit the number of questions logged
        logRequest.context.questionSets = logRequest.context.questionSets.map(qs => {
          if (qs.questions.length > 3) {
            return {
              ...qs,
              questions: [
                ...qs.questions.slice(0, 3),
                { text: `... ${qs.questions.length - 3} more questions ...`, answer: '...' }
              ]
            };
          }
          return qs;
        });
      }
      
      console.log('\nFull Request Object (truncated):');
      console.log(JSON.stringify(logRequest, null, 2));
      console.log('\nSending request to Python AI Service endpoint:', `${this.baseUrl}/chat`);
      console.log('==== AI SERVICE: REQUEST LOGGING END ====\n');
      
      // Make the actual request to the Python service
      const response = await this.client.post<ChatResponse | AIServiceErrorResponse>(
        '/chat',
        requestWithContext
      );

      const data = response.data;

      if (isErrorResponse(data)) {
        throw new Error(data.error.message);
      }

      return data;
    } catch (error) {
      logger.error('Error chatting with AI:', error);
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
      console.log('[AIService] Checking if AI service is available...');
      console.log('[AIService] API Key:', this.apiKey);
      console.log('[AIService] Request URL:', `${this.baseUrl}/health`);
      console.log('[AIService] Request headers:', this.client.defaults.headers);
      
      const response = await this.client.get('/health');
      console.log('[AIService] Health check response:', response.status, response.data);
      return true;
    } catch (error: any) {
      console.error('[AIService] Health check failed:', error.message);
      if (error.response) {
        console.error('[AIService] Response status:', error.response.status);
        console.error('[AIService] Response data:', error.response.data);
      }
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
      console.log('[AIService] Evaluating answer with request:', JSON.stringify(request));
      const response = await this.client.post<EvaluateAnswerResponse | AIServiceErrorResponse>(
        '/evaluate-answer',
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
