import { Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth.middleware';

const prisma = new PrismaClient();

/**
 * Get all questions for a specific question set
 * This endpoint is protected and only returns questions for sets owned by the authenticated user
 * GET /api/questionsets/:id/questions
 */
export const getQuestionsByQuestionSetId = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const questionSetId = req.params.id;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!questionSetId || isNaN(parseInt(questionSetId))) {
    res.status(400).json({ message: 'Invalid question set ID provided' });
    return;
  }

  try {
    // Verify the question set exists and belongs to the user
    const questionSet = await prisma.questionSet.findFirst({
      where: {
        id: parseInt(questionSetId),
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
        questionSetId: parseInt(questionSetId),
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.status(200).json({
      questionSet: {
        id: questionSet.id,
        name: questionSet.name,
        folderId: questionSet.folderId
      },
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        questionType: q.questionType,
        answer: q.answer,
        options: q.options,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching questions by question set ID:', error);
    next(error);
  }
};
