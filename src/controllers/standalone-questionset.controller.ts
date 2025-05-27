import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

/**
 * Get a specific question set by ID directly (without folder context)
 * GET /api/questionsets/:id
 */
export const getStandaloneQuestionSetById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!id || isNaN(parseInt(id))) {
    res.status(400).json({ message: 'Invalid question set ID provided' });
    return;
  }

  try {
    // Find the question set and verify ownership in a single query
    const questionSet = await prisma.questionSet.findFirst({
      where: {
        id: parseInt(id),
        folder: {
          userId: userId,
        },
      },
      include: {
        folder: true, // Include folder information
        questions: true // Include questions
      }
    });

    if (!questionSet) {
      res.status(404).json({ message: 'Question set not found or access denied' });
      return;
    }

    res.status(200).json(questionSet);
  } catch (error) {
    console.error('--- Get Standalone Question Set By ID Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Get Standalone Question Set By ID Error ---');
    next(error);
  }
};

/**
 * Get questions for a specific question set by ID directly
 * GET /api/questionsets/:id/questions
 */
export const getStandaloneQuestionSetQuestions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!id || isNaN(parseInt(id))) {
    res.status(400).json({ message: 'Invalid question set ID provided' });
    return;
  }

  try {
    // First verify the question set exists and belongs to the user
    const questionSet = await prisma.questionSet.findFirst({
      where: {
        id: parseInt(id),
        folder: {
          userId: userId,
        },
      },
    });

    if (!questionSet) {
      res.status(404).json({ message: 'Question set not found or access denied' });
      return;
    }

    // Get all questions for this question set
    const questions = await prisma.question.findMany({
      where: {
        questionSetId: parseInt(id),
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.status(200).json(questions);
  } catch (error) {
    console.error('--- Get Standalone Question Set Questions Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Get Standalone Question Set Questions Error ---');
    next(error);
  }
};
