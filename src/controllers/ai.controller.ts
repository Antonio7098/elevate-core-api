import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { aiService } from '../services/aiService';
import { 
  GenerateQuestionsRequest, 
  ChatRequest,
  ChatContext as AIChatContext,
  isErrorResponse 
} from '../types/ai-service.types';

const prisma = new PrismaClient();

// Define the structure for generated questions
interface GeneratedQuestion {
  text: string;
  answer: string | null;
  questionType: string;
  options: string[];
}

interface AIGenerationResult {
  title: string;
  questions: GeneratedQuestion[];
}

// Define the structure for chat messages
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Define the structure for the chat context
type ChatContext = {
  questionSetId?: number;
  folderId?: number;
};

// Define the structure for a question in the context
type ContextQuestion = {
  text: string;
  answer: string;
};

// Define the structure for a question set in the context
type ContextQuestionSet = {
  id: number;
  name: string;
  questions: ContextQuestion[];
};

interface ChatResponse {
  message: string;
  contextInfo?: string;
}

// Simulated AI service that generates questions from source text
const simulateAIQuestionGeneration = (sourceText: string, count: number = 5): AIGenerationResult => {
  // This is a placeholder function that simulates an AI service
  // In a real implementation, this would make an HTTP call to a Python AI service
  
  // Extract a snippet from the source text for the question set title
  const sourceSnippet = sourceText.length > 30 
    ? sourceText.substring(0, 30) + '...' 
    : sourceText;
  
  // Generate dummy questions based on the source text
  const questions: GeneratedQuestion[] = [];
  
  // Common question types
  const questionTypes = ['multiple-choice', 'short-answer', 'flashcard', 'true-false'];
  
  for (let i = 0; i < count; i++) {
    // Create a variety of question types
    const questionType = questionTypes[i % questionTypes.length];
    
    let question: GeneratedQuestion = {
      text: `Question ${i + 1} about "${sourceSnippet}"`,
      answer: `Sample answer for question ${i + 1}`,
      questionType,
      options: []
    };
    
    // Add options for multiple-choice questions
    if (questionType === 'multiple-choice') {
      question.options = [
        'Option A',
        'Option B',
        'Option C',
        'Option D'
      ];
    }
    
    // For true-false questions
    if (questionType === 'true-false') {
      question.options = ['True', 'False'];
      question.answer = Math.random() > 0.5 ? 'True' : 'False';
    }
    
    questions.push(question);
  }
  
  return {
    title: `AI Generated Quiz for "${sourceSnippet}"`,
    questions
  };
};

/**
 * Simulate AI chat response
 * This is a placeholder function that simulates an AI chat service
 * In a real implementation, this would make an HTTP call to a Python AI service
 */
const simulateAIChatResponse = async (message: string, context?: ChatContext): Promise<ChatResponse> => {
  // This is a placeholder function that simulates an AI service
  // In a real implementation, this would make an HTTP call to a Python AI service
  
  // If we have context, we can use it to generate a more relevant response
  let contextInfo = '';
  
  if (context?.questionSetId) {
    try {
      const questionSet = await prisma.questionSet.findUnique({
        where: { id: context.questionSetId },
        include: { questions: { take: 2 } } // Get a sample of questions for context
      });
      
      if (questionSet) {
        contextInfo = `Based on your question set "${questionSet.name}" with ${questionSet.questions.length} questions.`;
      }
    } catch (error) {
      console.error('Error fetching question set context:', error);
    }
  } else if (context?.folderId) {
    try {
      const folder = await prisma.folder.findUnique({
        where: { id: context.folderId },
        include: { questionSets: { take: 3 } } // Get a sample of question sets for context
      });
      
      if (folder) {
        contextInfo = `Based on your folder "${folder.name}" with ${folder.questionSets.length} question sets.`;
      }
    } catch (error) {
      console.error('Error fetching folder context:', error);
    }
  }
  
  // Generate a response based on the user's message
  let response = '';
  
  // Simple keyword-based responses
  if (message.toLowerCase().includes('help')) {
    response = "I'm here to help you with your study materials. You can ask me questions about your content, and I'll try to provide helpful answers.";
  } else if (message.toLowerCase().includes('explain') || message.toLowerCase().includes('what is')) {
    response = `I'll explain that for you. ${message.replace(/explain|what is/i, '')} refers to an important concept in your study materials.`;
  } else if (message.toLowerCase().includes('example')) {
    response = "Here's an example to illustrate the concept: imagine you're studying the water cycle. Water evaporates from oceans, forms clouds, and then returns as precipitation.";
  } else if (message.toLowerCase().includes('difference between')) {
    response = "The key difference lies in their fundamental properties and applications. One is typically used in certain contexts, while the other serves different purposes.";
  } else if (message.toLowerCase().includes('how to')) {
    response = "To accomplish that, you would follow these steps: 1) Understand the basic principles, 2) Apply the methodology correctly, 3) Practice with various examples.";
  } else {
    response = "That's an interesting question about your study materials. Could you provide more details or specify what aspect you'd like me to elaborate on?";
  }
  
  // Add the context info if available
  if (contextInfo) {
    response += ` ${contextInfo}`;
  }
  
  return {
    message: response,
    contextInfo
  };
};

/**
 * Generate questions from source text and create a question set
 * POST /api/ai/generate-from-source
 */
export const generateQuestionsFromSource = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sourceText, folderId, questionCount = 5, questionTypes, difficulty } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    // Verify folder exists and belongs to the user
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId: userId
      }
    });
    
    if (!folder) {
      res.status(404).json({ message: 'Folder not found or access denied' });
      return;
    }
    
    // Check if AI service is available
    const isAIServiceAvailable = await aiService.isAvailable();
    
    let generatedQuestions;
    let title = `Questions about ${sourceText.substring(0, 30)}${sourceText.length > 30 ? '...' : ''}`;
    
    if (isAIServiceAvailable) {
      // Prepare request for AI service
      const generateRequest: GenerateQuestionsRequest = {
        sourceText,
        questionCount,
        questionTypes,
        difficulty
      };
      
      try {
        // Call AI service to generate questions
        const aiResult = await aiService.generateQuestions(generateRequest);
        
        // Extract generated questions
        generatedQuestions = aiResult.questions;
        
        // Use metadata if available
        if (aiResult.metadata) {
          console.log(`AI Service processing time: ${aiResult.metadata.processingTime}`);
          console.log(`AI Model used: ${aiResult.metadata.model}`);
        }
      } catch (aiError) {
        console.error('Error from AI service:', aiError);
        // Fall back to simulation if AI service fails
        generatedQuestions = simulateAIQuestionGeneration(sourceText, questionCount).questions;
      }
    } else {
      // Fall back to simulation if AI service is not available
      console.log('AI service not available, using simulation');
      const simulatedResult = simulateAIQuestionGeneration(sourceText, questionCount);
      generatedQuestions = simulatedResult.questions;
      title = simulatedResult.title;
    }
    
    // Create a new question set
    const questionSet = await prisma.questionSet.create({
      data: {
        name: title,
        folderId: folder.id
      }
    });
    
    // Create questions in the question set
    const questions = await Promise.all(
      generatedQuestions.map(question => 
        prisma.question.create({
          data: {
            text: question.text, // Using text field as per schema
            answer: question.answer || '',
            questionType: question.questionType,
            options: question.options || [],
            questionSetId: questionSet.id,
            masteryScore: 0 // Default value as defined in the schema
          }
        })
      )
    );
    
    // Return the question set with its questions
    res.status(201).json({
      questionSet: {
        ...questionSet,
        questions
      }
    });
    
  } catch (error) {
    console.error('Error generating questions from source:', error);
    next(error);
  }
};

/**
 * Chat with AI about study materials
 * POST /api/ai/chat
 */
export const chatWithAI = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { message, questionSetId, folderId, conversation } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    // Build context with question sets and/or folders
    let aiContext: AIChatContext = {};
    let questionSets: Array<{
      id: number;
      name: string;
      folderName: string;
      totalQuestions: number;
      createdAt: string;
      questions: Array<{
        id: number;
        text: string;
        answer: string;
        questionType: string;
        masteryScore: number;
      }>;
    }> = [];
    let folderInfo = null;
    
    // Verify ownership and fetch data if context is provided
    if (questionSetId) {
      // Find the question set and verify ownership
      const questionSet = await prisma.questionSet.findFirst({
        where: {
          id: questionSetId,
          folder: {
            userId: userId
          }
        },
        include: {
          questions: true,
          folder: true // Include the parent folder for additional context
        }
      });
      
      if (!questionSet) {
        res.status(404).json({ message: 'Question set not found or access denied' });
        return;
      }
      
      // Add folder information for context
      folderInfo = {
        id: questionSet.folder.id,
        name: questionSet.folder.name,
        description: questionSet.folder.description || ''
      };
      
      // Add question set with detailed information
      questionSets.push({
        id: questionSet.id,
        name: questionSet.name,
        folderName: questionSet.folder.name,
        totalQuestions: questionSet.questions.length,
        createdAt: questionSet.createdAt.toISOString(),
        questions: questionSet.questions.map((q: any) => ({
          id: q.id,
          text: q.text,
          answer: q.answer || '',
          questionType: q.questionType,
          masteryScore: q.masteryScore || 0
        }))
      });
    } else if (folderId) {
      // Find the folder and verify ownership
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId: userId
        },
        include: {
          questionSets: {
            include: {
              questions: true
            }
          }
        }
      });
      
      if (!folder) {
        res.status(404).json({ message: 'Folder not found or access denied' });
        return;
      }
      
      // Add folder information for context
      folderInfo = {
        id: folder.id,
        name: folder.name,
        description: folder.description || '',
        totalQuestionSets: folder.questionSets.length,
        createdAt: folder.createdAt.toISOString()
      };
      
      // Add all question sets in the folder with detailed information
      questionSets = folder.questionSets.map((qs: any) => ({
        id: qs.id,
        name: qs.name,
        folderName: folder.name,
        totalQuestions: qs.questions.length,
        createdAt: qs.createdAt.toISOString(),
        questions: qs.questions.map((q: any) => ({
          id: q.id,
          text: q.text,
          answer: q.answer || '',
          questionType: q.questionType,
          masteryScore: q.masteryScore || 0
        }))
      }));
    }
    
    // Add folder and question set information to the AI context
    if (folderInfo) {
      aiContext.folderInfo = folderInfo;
    }
    
    if (questionSets.length > 0) {
      aiContext.questionSets = questionSets;
      
      // Add summary statistics
      const totalQuestions = questionSets.reduce((sum, qs) => sum + qs.questions.length, 0);
      const questionTypes = new Set<string>();
      const topics = new Set<string>();
      
      // Extract unique question types and potential topics from question texts
      questionSets.forEach(qs => {
        qs.questions.forEach((q: { questionType: string; text: string }) => {
          if (q.questionType) questionTypes.add(q.questionType);
          
          // Extract potential topics from question text (simple approach)
          const words = q.text.split(' ');
          words.forEach((word: string) => {
            if (word.length > 5 && !word.match(/^[0-9]+$/)) {
              topics.add(word.toLowerCase());
            }
          });
        });
      });
      
      // Add summary to context
      aiContext.summary = {
        totalQuestionSets: questionSets.length,
        totalQuestions,
        questionTypes: Array.from(questionTypes),
        potentialTopics: Array.from(topics).slice(0, 10) // Limit to top 10 potential topics
      };
    }
    
    // Add user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true }
    });
    
    if (user) {
      aiContext.userInfo = {
        id: user.id,
        email: user.email,
        memberSince: user.createdAt.toISOString()
      };
    }
    
    // Check if AI service is available
    const isAIServiceAvailable = await aiService.isAvailable();
    
    let aiResponse;
    
    if (isAIServiceAvailable) {
      try {
        // Add detailed logging for the context object
        console.log('\n==== AI CONTROLLER: CONTEXT LOGGING START ====');
        console.log(`Request for folder ID: ${folderId || 'none'}, question set ID: ${questionSetId || 'none'}`);
        console.log(`User ID: ${userId}, Message: "${message?.substring(0, 50)}${message?.length > 50 ? '...' : ''}"`); 
        
        if (folderInfo) {
          console.log('\nFolder Information:');
          console.log(JSON.stringify(folderInfo, null, 2));
        }
        
        if (questionSets.length > 0) {
          console.log('\nQuestion Sets Summary:');
          console.log(`Total Sets: ${questionSets.length}`);
          questionSets.forEach((qs, index) => {
            console.log(`\n  Set ${index + 1}: ${qs.name} (ID: ${qs.id})`);
            console.log(`  Questions: ${qs.questions.length}`);
            console.log(`  First few questions: ${qs.questions.slice(0, 2).map(q => `"${q.text.substring(0, 30)}..."`).join(', ')}${qs.questions.length > 2 ? ', ...' : ''}`);
          });
        }
        
        if (aiContext.summary) {
          console.log('\nContext Summary:');
          console.log(JSON.stringify(aiContext.summary, null, 2));
        }
        
        console.log('\nFull Context Object:');
        console.log(JSON.stringify(aiContext, null, 2));
        console.log('==== AI CONTROLLER: CONTEXT LOGGING END ====\n');
        
        // Prepare request for AI service
        const chatRequest: ChatRequest = {
          message,
          conversation,
          context: aiContext
        };
        
        // Call AI service for chat response
        const result = await aiService.chat(chatRequest);
        
        // Send the AI response with additional data
        res.status(200).json({
          response: result.response.message,
          references: result.response.references,
          suggestedQuestions: result.response.suggestedQuestions,
          metadata: result.metadata
        });
        return;
      } catch (aiError) {
        console.error('Error from AI service:', aiError);
        // Fall back to simulation if AI service fails
        const context: ChatContext = {};
        if (questionSetId) context.questionSetId = questionSetId;
        if (folderId) context.folderId = folderId;
        
        aiResponse = await simulateAIChatResponse(message, context);
      }
    } else {
      // Fall back to simulation if AI service is not available
      console.log('AI service not available, using simulation');
      const context: ChatContext = {};
      if (questionSetId) context.questionSetId = questionSetId;
      if (folderId) context.folderId = folderId;
      
      aiResponse = await simulateAIChatResponse(message, context);
    }
    
    // Return the simulated AI response (fallback)
    res.status(200).json({
      response: aiResponse.message,
      context: aiResponse.contextInfo
    });
    
  } catch (error) {
    console.error('Error in AI chat:', error);
    next(error);
  }
};
