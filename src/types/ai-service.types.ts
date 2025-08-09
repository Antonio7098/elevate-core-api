/**
 * AI Service Types
 * 
 * This file contains TypeScript interfaces for the AI Service contract.
 * These types define the request and response formats for communication
 * between the Core API and the Python AI Service.
 */

import { CognitiveApproach, ExplanationStyle, InteractionStyle } from '@prisma/client';
import { GenerateQuestionRequest, QuestionScope, QuestionTone } from './aiGeneration.types';

// Common types

/**
 * Base response interface for all AI service responses
 */
export interface AIServiceBaseResponse {
  success: boolean;
  metadata?: {
    processingTime?: string;
    model?: string;
    tokensUsed?: number;
  };
}

/**
 * Error response from the AI service
 */
export interface AIServiceErrorResponse extends AIServiceBaseResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

// Question Generation Types

/**
 * Request to generate questions from content
 */
export interface GenerateQuestionsRequest {
  content: string;
  questionType?: 'multiple-choice' | 'true-false' | 'short-answer' | 'mixed';
  difficulty?: string;
  count?: number;
  uueFocus?: 'Understand' | 'Use' | 'Explore';
  language?: string;
}

/**
 * A generated question
 */
export interface GeneratedQuestion {
  text: string;
  questionType: 'multiple-choice' | 'true-false' | 'short-answer';
  answer: string;
  options?: string[];
  explanation?: string;
  uueFocus?: 'Understand' | 'Use' | 'Explore';
  difficulty?: string | number;
  topics?: string[];
  totalMarksAvailable?: number;
  markingCriteria?: string[] | string;
}

/**
 * Response from the question generation endpoint
 */
export interface GenerateQuestionsResponse extends AIServiceBaseResponse {
  success: true;
  questions: GeneratedQuestion[];
  metadata: {
    processingTime: string;
    model: string;
    sourceTextLength: number;
  };
}

// Chat Types

/**
 * A message in the conversation history
 */
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

/**
 * Context for the chat request
 */
export interface ChatContext {
  // Question sets information
  questionSets?: Array<{
    id: number;
    name: string;
    folderName?: string;
    totalQuestions?: number;
    createdAt?: string;
    questions: Array<{
      id?: number;
      text: string;
      answer: string;
      questionType?: string;
      currentMasteryScore?: number;
    }>;
  }>;
  
  // Folder information
  folderInfo?: {
    id: number;
    name: string;
    description?: string;
    totalQuestionSets?: number;
    createdAt?: string;
  };
  
  // Summary statistics
  summary?: {
    totalQuestionSets: number;
    totalQuestions: number;
    questionTypes: string[];
    potentialTopics: string[];
  };
  
  // User information
  userInfo?: {
    id: number;
    email: string;
    memberSince: string;
  };
  
  // Learning preferences
  learningStyles?: CognitiveApproach[];
  preferredAiTone?: ExplanationStyle;
  preferredAiVerbosity?: InteractionStyle;
  primaryGoal?: string;
}

/**
 * Request to chat with the AI
 */
export interface ChatRequest {
  message: string;
  conversation?: ConversationMessage[];
  context?: ChatContext;
  language?: string;
}

/**
 * Response from the chat endpoint
 */
export interface ChatResponse extends AIServiceBaseResponse {
  success: true;
  response: {
    message: string;
    references?: Array<{
      text: string;
      source: string;
    }>;
    suggestedQuestions?: string[];
  };
  metadata: {
    processingTime: string;
    model: string;
    tokensUsed: number;
  };
}

/**
 * Type guard to check if a response is an error
 */
export function isErrorResponse(response: AIServiceBaseResponse): response is AIServiceErrorResponse {
  return !response.success;
}

/**
 * Type guard to check if a response is a successful question generation response
 */
export function isGenerateQuestionsResponse(
  response: AIServiceBaseResponse
): response is GenerateQuestionsResponse {
  return response.success && 'questions' in response;
}

/**
 * Type guard to check if a response is a successful chat response
 */
export function isChatResponse(response: AIServiceBaseResponse): response is ChatResponse {
  return response.success && 'response' in response;
}

// Answer Evaluation Types

export interface EvaluateAnswerRequest {
  questionContext: {
    questionId: string | number;
    questionText: string;
    expectedAnswer?: string;
    questionType: string;
    options?: string[];
    marksAvailable?: number;
    markingCriteria?: string | string[] | null;
    uueFocus?: string | null;
  };
  userAnswer: string;
  context?: {
    questionSetName?: string;
    folderName?: string;
  };
}

export interface EvaluateAnswerResponse {
  marks_achieved: number;
  corrected_answer: string;
  feedback: string;
}

export function isEvaluateAnswerResponse(
  response: any
): response is EvaluateAnswerResponse {
  return response && typeof response.marks_achieved === 'number' && 
         typeof response.corrected_answer === 'string' && 
         typeof response.feedback === 'string';
}