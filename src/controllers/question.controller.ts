import { Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

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

    // 3. Fetch questions for the given question set
    const questions = await prisma.question.findMany({
      where: {
        questionSetId: parseInt(setId, 10),
      },
      orderBy: {
        createdAt: 'asc', // Or by some other order, e.g., question text
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
    const questionData: Prisma.QuestionCreateInput = {
      text,
      options: options || [],
      questionType,
      answer: answer === undefined ? null : answer,
      questionSet: {
        connect: {
          id: questionSet.id,
        },
      },
    };

    const newQuestion = await prisma.question.create({
      data: questionData,
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
