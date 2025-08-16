import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { ChatMessageDto } from '../../dtos/ai-rag/chat-message.dto';
import { EvaluateAnswerRequest } from '../../types/ai-service.types';
import { Prisma, PrismaClient } from '@prisma/client'; // Correctly import Prisma types
import { QuestionSet, Question } from '@prisma/client';
import aiService from '../../services/ai/aiService';

const prisma = new PrismaClient();

// Define the structure for generated questions
interface GeneratedQuestion {
  text: string;
  answer: string | null;
  questionType: string;
  options: string[];
  marksAvailable?: number; // This maps to totalMarksAvailable in the schema
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
interface ChatContext { 
  questionSetId?: number; 
  folderId?: number; // Added to support folder context in simulation
  userInfo?: { 
    id: number; 
    email: string; 
    memberSince: string; 
  }; 
  summary?: { 
    totalQuestionSets: number; 
    totalQuestions: number; 
    questionTypes: string[]; 
    potentialTopics: string[]; 
  }; 
}  

// Define the structure for a question in the context
interface ContextQuestion {
  text: string;
  answer: string;
}

// Define the structure for a question set in the context
interface ContextQuestionSet {
  id: number;
  name: string;
  questions: ContextQuestion[];
}

interface ChatResponse {
  message: string;
  contextInfo?: string;
}

interface AIQuestion { id: number; text: string; questionType: string; answer: string; }  
interface AIQuestionSet { id: number; name: string; questions: AIQuestion[]; }

interface AIContext {
  questionSets: AIQuestionSet[];
  summary?: {
    totalQuestionSets: number;
    totalQuestions: number;
    questionTypes: string[];
    potentialTopics: string[];
  };
  userInfo?: {
    id: number;
    email: string;
    memberSince: string;
  };
}

// Simulated AI service that generates questions from source text

const simulateAIQuestionGeneration = (sourceText: string, count: number = 5): AIGenerationResult => {
  const sourceSnippet = sourceText.length > 30 ? sourceText.substring(0, 30) + '...' : sourceText;
  const questions: any[] = [];
  const questionTypes = ['multiple-choice', 'short-answer', 'flashcard', 'true-false'];

  for (let i = 0; i < count; i++) {
    const questionType = questionTypes[i % questionTypes.length];
    let question: any = {
      text: `Question ${i + 1} about "${sourceSnippet}"`,
      answer: `Sample answer for question ${i + 1}`,
      questionType,
      options: [],
      totalMarksAvailable: 10,
      markingCriteria: [
        { description: 'Correctness', marks: 5 },
        { description: 'Clarity', marks: 5 },
      ],
    };

    if (questionType === 'multiple-choice') {
      question.options = ['Option A', 'Option B', 'Option C', 'Option D'];
    }

    if (questionType === 'true-false') {
      question.options = ['True', 'False'];
      question.answer = Math.random() > 0.5 ? 'True' : 'False';
    }
    questions.push(question);
  }

  return {
    title: `AI Generated Quiz for "${sourceSnippet}"`,
    questions,
  };
};

/**
 * Simulate AI chat response
 * This is a placeholder function that simulates an AI chat service
 * In a real implementation, this would make an HTTP call to a Python AI service
 */
// The simulateAIChatResponse function is now redundant and has been removed.
// The core logic has been moved to AiRAGService.handleChatMessage.


// Simulated AI service that generates notes from source text
const simulateNoteGeneration = (sourceText: string, noteStyle: string, sourceFidelity: string): { title: string; content: string } => {
  // This is a placeholder function that simulates an AI service
  // In a real implementation, this would make an HTTP call to a Python AI service
  
  // Extract a snippet from the source text for the note title
  const sourceSnippet = sourceText.length > 30 
    ? sourceText.substring(0, 30) + '...' 
    : sourceText;
  
  // Generate dummy note content based on the source text
  const noteContent = `This is a generated note about "${sourceSnippet}" in ${noteStyle} style with ${sourceFidelity} fidelity.`;
  
  return {
    title: `Generated Note for "${sourceSnippet}"`,
    content: noteContent
  };
};

/**
 * Generate questions from source text and create a question set
 * POST /api/ai/generate-from-source
 * 
 * @deprecated This endpoint is deprecated. Use POST /api/ai/primitives/from-source instead.
 */
export const generateQuestionsFromSource = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // DEPRECATED: Return 410 Gone with migration guidance
  res.status(410).json({
    success: false,
    error: 'This endpoint has been deprecated',
    message: 'Question set-based AI generation has been replaced with primitive-centric generation',
    alternatives: [
      'POST /api/ai/primitives/from-source - Create primitives directly from source text',
      'POST /api/ai/primitives/from-blueprint - Generate primitives from learning blueprints'
    ],
    migrationGuide: 'https://docs.elevate.com/api/migration/primitive-ai'
  });
  return;

  // OLD IMPLEMENTATION BELOW (kept for reference)
  /*
  // Return 401 if user is not authenticated (for unit tests)
  if (!req.user) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  try {
    const { sourceId, questionScope, questionTone, questionCount = 5 } = req.body as {
      sourceId: number;
      questionScope: string;
      questionTone: string;
      questionCount?: number;
    };

    // 1. Auth guard
    if (!req.user?.userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    // 2. Fetch the source note
    const note = await prisma.note.findFirst({ 
      where: { 
        id: sourceId, 
        userId: req.user.userId 
      } 
    });
    
    if (!note) {
      res.status(404).json({ message: 'Note not found or not owned by user' });
      return;
    }
    
    const sourceText = note.content ?? '';
    const name = `Questions from ${note.title}`;
    const folderId = note.folderId;
    
    // 3. Validate folder ownership if folderId provided
    let folder: Folder | null = null;
    if (folderId) {
      folder = await prisma.folder.findFirst({ where: { id: folderId, userId: req.user.userId } });
      if (!folder) {
        res.status(404).json({ message: 'Folder not found or not owned by user' });
        return;
      }
    }

    // 3. Decide whether to call (disabled) AI service or local simulation
    // const isAIServiceAvailable = await aiService.isAvailable();
    const isAIServiceAvailable = false; // Always false for now / tests

    let generated: AIGenerationResult;
    if (isAIServiceAvailable) {
      try {
        // const aiResponse = await aiService.generateQuestions({ sourceText, questionCount });
        throw new Error('AI service disabled');
      } catch (err) {
        generated = simulateAIQuestionGeneration(sourceText, questionCount);
      }
    } else {
      generated = simulateAIQuestionGeneration(sourceText, questionCount);
    }

    // 4. Persist QuestionSet & Questions via Prisma (these are mocked in unit tests)
    const questionSet = await prisma.questionSet.create({
      data: {
        title: generated.title,
        userId: req.user.userId,
        folderId: folder ? folder.id : null,
      },
    });

    for (const q of generated.questions) {
      await prisma.question.create({
        data: {
          text: q.text,
          answer: q.answer ?? '',
          totalMarksAvailable: q.marksAvailable || 1,
          questionSetId: questionSet.id,
          questionType: 'multiple-choice', // Default type
          options: [], // Default empty options
          imageUrls: [], // Default empty image URLs
          conceptTags: [], // Default empty tags
        },
      });
    }

    res.status(201).json({ questionSet: { ...questionSet, questions: generated.questions } });
  } catch (error) {
    next(error);
  }
  */
};

/**
 * Generate a note from source text (another note)
 * POST /api/ai/generate-note
 * 
 * @deprecated This endpoint is deprecated. Use the new primitive-centric AI endpoints instead.
 */
export const generateNoteFromSource = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  // DEPRECATED: Return 410 Gone with migration guidance
  res.status(410).json({
    success: false,
    error: 'This endpoint has been deprecated',
    message: 'Note generation from AI has been replaced with primitive-centric content creation',
    alternatives: [
      'POST /api/ai/primitives/from-source - Create structured primitives with criteria',
      'POST /api/ai/primitives/batch-create - Generate multiple primitives from sources'
    ]
  });
  return;

  // OLD IMPLEMENTATION BELOW (kept for reference)
  /*
  try {
    res.status(501).json({ message: 'AI note generation is temporarily disabled.' });
    return;
  } catch (error) {
    next(error);
  }
  */
};

/**
 * Chat with AI about study materials
 * POST /api/ai/chat
 */
export const chatWithAI = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  try {
    const chatRequestDto = req.body as ChatMessageDto;

    // const result = await aiRagService.handleChatMessage(chatRequestDto, userId);

    // res.status(200).json(result);
    res.status(200).json({ message: 'Answer evaluation temporarily disabled' });

  } catch (error) {

    if (error instanceof Error) {
        if (error.message.includes('not found or access denied')) {
            res.status(404).json({ message: error.message });
            return;
        }
    }
    next(error);
  }
};

/**
 * Evaluate a user's answer to a question using AI
 * POST /api/ai/evaluate-answer
 */
export const evaluateAnswer = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { questionId, userAnswer } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }

  if (!questionId || !userAnswer) {
    res.status(400).json({ message: 'Question ID and user answer are required.' });
    return;
  }

  try {
    // Fetch the question and verify ownership
    // Note: In the new schema, we need to check ownership through the questionSet's generatedFromBlueprint
    const question = await prisma.question.findFirst({
      where: {
        id: parseInt(questionId),
        questionSet: {
          generatedFromBlueprint: {
            userId: userId
          }
        }
      },
      include: {
        questionSet: {
          include: {
            generatedFromBlueprint: true
          }
        }
      }
    });

    if (!question) {
      res.status(404).json({ message: 'Question not found or access denied.' });
      return;
    }

    // Check if AI service is available
    const isAIServiceAvailable = await aiService.isServiceAvailable();

    if (!isAIServiceAvailable) {
      res.status(503).json({ message: 'AI service is currently unavailable.' });
      return;
    }

    // Prepare the evaluation request for the AI service
    const evaluationRequest: EvaluateAnswerRequest = {
      questionContext: {
        questionId: question.id,
        questionText: question.text,
        expectedAnswer: question.answer || "No expected answer provided",
        marksAvailable: question.totalMarksAvailable,
        questionType: question.questionType,
        // markingCriteria field doesn't exist in schema
      },
      userAnswer: userAnswer,
      context: {
        questionSetName: question.questionSet.name,
        folderName: 'Unknown' // folder relationship doesn't exist in new schema
      }
    };

    // Call the AI service
    const aiResponse = await aiService.evaluateAnswer(evaluationRequest);

    // Return the AI service response in the format the frontend expects
    res.status(200).json({
      correctedAnswer: aiResponse.corrected_answer,
      marksAvailable: question.totalMarksAvailable,
      marksAchieved: aiResponse.marks_achieved,
      feedback: aiResponse.feedback || `You achieved ${aiResponse.marks_achieved} out of ${question.totalMarksAvailable} marks. ${aiResponse.corrected_answer}`
    });

  } catch (error) {
    console.error('Error evaluating answer:', error);
    next(error);
  }
};
