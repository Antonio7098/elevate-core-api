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
        include: { questionSets: { include: { questions: { take: 2 } } } }
      });
      
      if (folder) {
        contextInfo = `Based on your folder "${folder.name}" with ${folder.questionSets.length} question sets.`;
      }
    } catch (error) {
      console.error('Error fetching folder context:', error);
    }
  }
  
  // Generate a simple response based on the message
  let response = `AI Assistant: I received your message: "${message}". `;
  
  // Add some context-specific information if available
  if (contextInfo) {
    response += contextInfo;
  }
  
  // Add a generic response
  response += ' How can I help you with your studies today?';
  
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
    const { sourceText, folderId, count, title } = req.body;
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    if (!sourceText || !folderId) {
      res.status(400).json({ message: 'Source text and folder ID are required' });
      return;
    }
    
    // Verify folder ownership
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        userId
      }
    });
    
    if (!folder) {
      res.status(404).json({ message: 'Folder not found or not owned by user' });
      return;
    }
    
    // Check if AI service is available
    const isAIServiceAvailable = await aiService.isAvailable();
    
    let generationResult;
    
    if (isAIServiceAvailable) {
      try {
        // Prepare request for AI service
        const request: GenerateQuestionsRequest = {
          sourceText,
          questionCount: count || 5
        };
        
        // Call AI service to generate questions
        const result = await aiService.generateQuestions(request);
        
        // Check if the response is an error
        if (!result.success) {
          console.error('Error from AI service:', 'AI service returned an error');
          // Fall back to simulation
          generationResult = simulateAIQuestionGeneration(sourceText, count);
        } else {
          generationResult = {
            title: title || `Generated from source (${new Date().toLocaleDateString()})`,
            questions: result.questions
          };
        }
      } catch (aiError) {
        console.error('Error from AI service:', aiError);
        // Fall back to simulation
        generationResult = simulateAIQuestionGeneration(sourceText, count);
      }
    } else {
      // Fall back to simulation if AI service is not available
      console.log('AI service not available, using simulation');
      generationResult = simulateAIQuestionGeneration(sourceText, count);
    }
    
    // Create a new question set
    const questionSet = await prisma.questionSet.create({
      data: {
        name: title || generationResult.title,
        folderId,
        // Initialize mastery scores
        overallMasteryScore: 0,
        understandScore: 0,
        useScore: 0,
        exploreScore: 0,
        forgettingScore: 0,
        masteryOverTime: {},
        reviewCount: 0
      }
    });
    
    // Create questions from the generated result
    await Promise.all(
      generationResult.questions.map(question => 
        prisma.question.create({
          data: {
            text: question.text,
            answer: question.answer,
            questionType: question.questionType,
            options: question.options || [],
            questionSetId: questionSet.id,
            // Adding required fields from the updated schema
            uueFocus: 'Understand',
            conceptTags: [],
            marksAvailable: 1
          }
        })
      )
    );
    
    res.status(201).json({
      message: 'Question set created successfully',
      questionSet: {
        id: questionSet.id,
        name: questionSet.name,
        questionCount: generationResult.questions.length
      }
    });
    
  } catch (error) {
    console.error('Error generating questions:', error);
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
    
    // Array to store question sets for context
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
        uueFocus: string;
        difficultyScore: number;
        timesAnswered: number;
        lastAnswerCorrect: boolean | null;
      }>;
    }> = [];
    let folderInfo = null;
    
    // If a specific question set is requested
    if (questionSetId) {
      // Find the question set and verify ownership
      const questionSet = await prisma.questionSet.findFirst({
        where: {
          id: questionSetId,
          folder: {
            userId
          }
        },
        include: {
          questions: true,
          folder: true
        }
      });
      
      if (!questionSet) {
        res.status(404).json({ message: 'Question set not found or not owned by user' });
        return;
      }
      
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
          uueFocus: q.uueFocus || q.learningStage || 'Understand',
          difficultyScore: q.difficultyScore || 0.5,
          timesAnswered: q.timesAnswered || 0,
          lastAnswerCorrect: q.lastAnswerCorrect
        }))
      });
    } else if (folderId) {
      // Find the folder and verify ownership
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          userId
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
        res.status(404).json({ message: 'Folder not found or not owned by user' });
        return;
      }
      
      folderInfo = {
        id: folder.id,
        name: folder.name,
        totalQuestionSets: folder.questionSets.length
      };
      
      // Add all question sets from the folder
      folder.questionSets.forEach(qs => {
        questionSets.push({
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
            uueFocus: q.uueFocus || q.learningStage || 'Understand',
            difficultyScore: q.difficultyScore || 0.5,
            timesAnswered: q.timesAnswered || 0,
            lastAnswerCorrect: q.lastAnswerCorrect
          }))
        });
      });
    } else {
      // No specific context provided, get a summary of user's data
      const folders = await prisma.folder.findMany({
        where: { userId },
        include: {
          questionSets: {
            include: {
              questions: true
            }
          }
        }
      });
      
      // Process all folders and question sets
      folders.forEach(folder => {
        folder.questionSets.forEach(qs => {
          questionSets.push({
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
              uueFocus: q.uueFocus || q.learningStage || 'Understand',
              difficultyScore: q.difficultyScore || 0.5,
              timesAnswered: q.timesAnswered || 0,
              lastAnswerCorrect: q.lastAnswerCorrect
            }))
          });
        });
      });
    }
    
    // Add question sets to context
    aiContext.questionSets = questionSets;
    
    // If we have question sets, add a summary
    if (questionSets.length > 0) {
      // Calculate total questions
      const totalQuestions = questionSets.reduce((sum, qs) => sum + qs.questions.length, 0);
      
      // Extract unique question types and potential topics
      const questionTypes = new Set<string>();
      const topics = new Set<string>();
      
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
