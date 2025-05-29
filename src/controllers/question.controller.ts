import { Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

/**
 * Get questions by set ID using query parameter
 * GET /api/questions?questionSetId=:id
 */
export const getQuestionsBySetId = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const questionSetId = req.query.questionSetId as string;
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

    // Get all questions for this question set with all fields including spaced repetition data
    const questions = await prisma.question.findMany({
      where: {
        questionSetId: parseInt(questionSetId),
      },
      // Temporarily remove include until Prisma types are updated
      // include: {
      //   userAnswers: {
      //     where: {
      //       userId: userId
      //     },
      //     orderBy: [
      //       { createdAt: 'desc' }
      //     ],
      //     take: 5 // Include the 5 most recent answers for context
      //   }
      // },
      orderBy: {
        // Temporarily using only createdAt until Prisma types are updated
        createdAt: 'asc'
        // TODO: Add these back after Prisma types are updated:
        // difficultyScore: 'desc',
      },
    });

    res.status(200).json(questions);
  } catch (error) {
    console.error('--- Get Questions By Set ID Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Get Questions By Set ID Error ---');
    next(error);
  }
};

export const getQuestionsBySet = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { folderId, setId } = req.params;
  const userId = req.user!.userId;

  try {
    // 1. Verify folder ownership and existence
    const folder = await prisma.folder.findUnique({
      where: { id: parseInt(folderId, 10) },
    });

    if (!folder || folder.userId !== userId) {
      res.status(404).json({ message: 'Folder not found or access denied.' });
      return;
    }

    // 2. Verify question set existence and ensure it belongs to the folder
    const questionSet = await prisma.questionSet.findUnique({
      where: { id: parseInt(setId, 10) },
    });

    if (!questionSet || questionSet.folderId !== folder.id) {
      res.status(404).json({ message: 'Question set not found in this folder or access denied.' });
      return;
    }

    // 3. Fetch questions for the given question set with all fields including spaced repetition data
    const questions = await prisma.question.findMany({
      where: {
        questionSetId: parseInt(setId, 10),
      },
      // Temporarily remove include until Prisma types are updated
      // include: {
      //   userAnswers: {
      //     where: {
      //       userId
      //     },
      //     orderBy: [
      //       { createdAt: 'desc' }
      //     ],
      //     take: 5 // Include the 5 most recent answers for context
      //   }
      // },
      orderBy: {
        // Temporarily using only createdAt until Prisma types are updated
        createdAt: 'asc'
        // TODO: Add these back after Prisma types are updated:
        // difficultyScore: 'desc',
      },
    });

    res.status(200).json(questions);
  } catch (error) {
    next(error);
  }
};

export const createQuestion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { folderId, setId } = req.params;
  const userId = req.user!.userId;
  const { text, answer, options, questionType } = req.body;

  try {
    // 1. Verify folder ownership and existence
    const folder = await prisma.folder.findUnique({
      where: { id: parseInt(folderId, 10) },
    });

    if (!folder || folder.userId !== userId) {
      res.status(404).json({ message: 'Folder not found or access denied.' });
      return;
    }

    // 2. Verify question set existence and ensure it belongs to the folder
    const questionSet = await prisma.questionSet.findUnique({
      where: { id: parseInt(setId, 10) },
    });

    if (!questionSet || questionSet.folderId !== folder.id) {
      res.status(404).json({ message: 'Question set not found in this folder or access denied.' });
      return;
    }

    // 3. Create the new question
    const newQuestion = await prisma.question.create({
      data: {
        text,
        answer,
        options: options || [],
        questionType,
        questionSetId: parseInt(setId, 10),
      },
    });

    res.status(201).json(newQuestion);
  } catch (error) {
    next(error);
  }
};

export const getQuestionById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id, folderId, setId } = req.params;
  const questionId = parseInt(id);
  const folderIdNum = parseInt(folderId);
  const setIdNum = parseInt(setId);
  const userId = req.user?.userId;

  if (isNaN(questionId) || isNaN(folderIdNum) || isNaN(setIdNum)) {
    res.status(400).json({ message: 'Invalid ID format for question, folder, or set.' });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }

  try {
    // Use a query that verifies ownership and retrieves the question
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        questionSetId: setIdNum,
        questionSet: {
          id: setIdNum,
          folderId: folderIdNum,
          folder: {
            id: folderIdNum,
            userId: userId,
          },
        },
      },
    });

    if (!question) {
      res.status(404).json({ message: 'Question not found or access denied.' });
      return;
    }

    res.status(200).json(question);
  } catch (error) {
    console.error('Error in getQuestionById:', error);
    next(error);
  }
};

export const updateQuestion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id, folderId, setId } = req.params;
  const questionId = parseInt(id);
  const folderIdNum = parseInt(folderId);
  const setIdNum = parseInt(setId);
  const userId = req.user?.userId;
  const updateData = req.body;

  if (isNaN(questionId) || isNaN(folderIdNum) || isNaN(setIdNum)) {
    res.status(400).json({ message: 'Invalid ID format for question, folder, or set.' });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }

  try {
    // Check if the question exists and belongs to the user
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        questionSetId: setIdNum,
        questionSet: {
          id: setIdNum,
          folderId: folderIdNum,
          folder: {
            id: folderIdNum,
            userId: userId,
          },
        },
      },
    });

    if (!question) {
      res.status(404).json({ message: 'Question not found or access denied.' });
      return;
    }

    // Update the question
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: updateData,
    });

    res.status(200).json(updatedQuestion);
  } catch (error) {
    console.error('Error in updateQuestion:', error);
    next(error);
  }
};

export const deleteQuestion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { id, folderId, setId } = req.params;
  const questionId = parseInt(id);
  const folderIdNum = parseInt(folderId);
  const setIdNum = parseInt(setId);
  const userId = req.user?.userId;

  if (isNaN(questionId) || isNaN(folderIdNum) || isNaN(setIdNum)) {
    res.status(400).json({ message: 'Invalid ID format for question, folder, or set.' });
    return;
  }

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }

  try {
    // Check if the question exists and belongs to the user
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        questionSetId: setIdNum,
        questionSet: {
          id: setIdNum,
          folderId: folderIdNum,
          folder: {
            id: folderIdNum,
            userId: userId,
          },
        },
      },
    });

    if (!question) {
      res.status(404).json({ message: 'Question not found or access denied.' });
      return;
    }

    // Delete the question
    await prisma.question.delete({
      where: { id: questionId },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error in deleteQuestion:', error);
    next(error);
  }
};
