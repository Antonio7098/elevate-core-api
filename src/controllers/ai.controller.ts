import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

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
 * Generate questions from source text and create a question set
 * POST /api/ai/generate-from-source
 */
export const generateQuestionsFromSource = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sourceText, folderId, questionCount = 5 } = req.body;
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
    
    // Simulate AI question generation
    const aiResult = simulateAIQuestionGeneration(sourceText, questionCount);
    
    // Create a new question set
    const questionSet = await prisma.questionSet.create({
      data: {
        name: aiResult.title,
        folderId: folder.id
      }
    });
    
    // Create questions in the question set
    const questions = await Promise.all(
      aiResult.questions.map(question => 
        prisma.question.create({
          data: {
            text: question.text,
            answer: question.answer || null,
            questionType: question.questionType,
            options: question.options,
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
