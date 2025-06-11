import { Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

/**
 * Get all question sets within a folder
 * GET /api/folders/:folderId/questionsets
 */
export const getQuestionSetsByFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { folderId } = req.params;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!folderId || isNaN(parseInt(folderId))) {
    res.status(400).json({ message: 'Invalid folder ID provided' });
    return;
  }

  try {
    // First, verify the folder exists and belongs to the user
    const folder = await prisma.folder.findFirst({
      where: {
        id: parseInt(folderId),
        userId,
      },
    });

    if (!folder) {
      res.status(404).json({ message: 'Folder not found or access denied' });
      return;
    }

    const questionSets = await prisma.questionSet.findMany({
      where: {
        folderId: parseInt(folderId),
      },
      include: {
        questions: true,
        notes: {
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.status(200).json(questionSets);
  } catch (error) {
    console.error('--- Get Question Sets By Folder Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Get Question Sets By Folder Error ---');
    res.status(500).json({ message: 'Failed to retrieve question sets' });
  }
};

/**
 * Get a specific question set by ID
 * GET /api/folders/:folderId/questionsets/:id
 */
export const getQuestionSetById = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id: setId } = req.params;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!setId || isNaN(parseInt(setId))) {
    res.status(400).json({ message: 'Invalid question set ID provided' });
    return;
  }

  try {
    const questionSet = await prisma.questionSet.findFirst({
      where: {
        id: parseInt(setId),
        folder: { userId },
      },
      include: {
        questions: true,
        notes: {
          orderBy: {
            updatedAt: 'desc',
          },
        },
      },
    });

    if (!questionSet) {
      res.status(404).json({ message: 'Question set not found or access denied' });
      return;
    }

    res.status(200).json(questionSet);
  } catch (error) {
    console.error('--- Get Question Set By ID Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Get Question Set By ID Error ---');
    res.status(500).json({ message: 'Failed to retrieve question set' });
  }
};

/**
 * Create a new question set
 * POST /api/folders/:folderId/questionsets
 */
export const createQuestionSet = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { folderId } = req.params;
  const { name } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!folderId || isNaN(parseInt(folderId))) {
    res.status(400).json({ message: 'Invalid folder ID provided' });
    return;
  }

  try {
    // Verify folder exists and belongs to the user
    const folder = await prisma.folder.findUnique({
      where: {
        id: parseInt(folderId),
        userId: userId,
      },
    });

    if (!folder) {
      res.status(404).json({ message: 'Folder not found or access denied' });
      return;
    }

    // Create the new question set
    const newQuestionSet = await prisma.questionSet.create({
      data: {
        name,
        folderId: parseInt(folderId),
        nextReviewAt: new Date(), // Set nextReviewAt to today by default
      },
    });

    res.status(201).json(newQuestionSet);
  } catch (error) {
    console.error('--- Create Question Set Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Create Question Set Error ---');
    next(error);
  }
};

/**
 * Update a question set
 * PUT /api/folders/:folderId/questionsets/:id
 */
export const updateQuestionSet = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { folderId, id: setId } = req.params;
  const { name } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!folderId || isNaN(parseInt(folderId)) || !setId || isNaN(parseInt(setId))) {
    res.status(400).json({ message: 'Invalid folder ID or question set ID provided' });
    return;
  }

  try {
    // Verify question set exists and belongs to the user
    const questionSet = await prisma.questionSet.findFirst({
      where: {
        id: parseInt(setId),
        folderId: parseInt(folderId),
        folder: {
          userId: userId,
        },
      },
    });

    if (!questionSet) {
      res.status(404).json({ message: 'Question set not found or access denied' });
      return;
    }

    // Update the question set
    const updatedQuestionSet = await prisma.questionSet.update({
      where: {
        id: parseInt(setId),
      },
      data: {
        name,
      },
    });

    res.status(200).json(updatedQuestionSet);
  } catch (error) {
    console.error('--- Update Question Set Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Update Question Set Error ---');
    next(error);
  }
};

/**
 * Delete a question set
 * DELETE /api/folders/:folderId/questionsets/:id
 */
export const deleteQuestionSet = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const { folderId, id: setId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!folderId || isNaN(parseInt(folderId)) || !setId || isNaN(parseInt(setId))) {
    res.status(400).json({ message: 'Invalid folder ID or question set ID provided' });
    return;
  }

  try {
    // Verify question set exists and belongs to the user
    const questionSet = await prisma.questionSet.findFirst({
      where: {
        id: parseInt(setId),
        folderId: parseInt(folderId),
        folder: {
          userId: userId,
        },
      },
    });

    if (!questionSet) {
      res.status(404).json({ message: 'Question set not found or access denied' });
      return;
    }

    // Check if there are any questions in this set
    const questionCount = await prisma.question.count({
      where: {
        questionSetId: parseInt(setId),
      },
    });

    // Delete all questions in the set first if there are any
    if (questionCount > 0) {
      await prisma.question.deleteMany({
        where: {
          questionSetId: parseInt(setId),
        },
      });
    }

    // Delete the question set
    await prisma.questionSet.delete({
      where: {
        id: parseInt(setId),
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('--- Delete Question Set Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Delete Question Set Error ---');
    next(error);
  }
};
