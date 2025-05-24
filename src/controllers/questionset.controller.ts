import { Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const createQuestionSet = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { folderId } = req.params;
  const { name } = req.body;

  if (!userId) {
    // This should ideally be caught by 'protect' middleware, but as a safeguard:
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  const parsedFolderId = parseInt(folderId);
  if (isNaN(parsedFolderId)) {
    res.status(400).json({ message: 'Invalid folder ID provided' });
    return;
  }

  // Removed inline validation for name, as it's handled by validateQuestionSetCreate middleware

  try {
    // 1. Verify the folder exists and belongs to the user
    const folder = await prisma.folder.findUnique({
      where: {
        id: parsedFolderId,
        userId: userId,
      },
    });

    if (!folder) {
      res.status(404).json({ message: 'Folder not found or access denied' });
      return;
    }

    // 2. Create the new question set
    const newQuestionSet = await prisma.questionSet.create({
      data: {
        name: name.trim(),
        folderId: parsedFolderId,
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
    res.status(500).json({ message: 'Failed to create question set' });
  }
};

export const getQuestionSetsByFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { folderId } = req.params;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  const parsedFolderId = parseInt(folderId);
  if (isNaN(parsedFolderId)) {
    res.status(400).json({ message: 'Invalid folder ID provided' });
    return;
  }

  try {
    // 1. Verify the folder exists and belongs to the user to ensure authorization
    const folder = await prisma.folder.findUnique({
      where: {
        id: parsedFolderId,
        userId: userId,
      },
    });

    if (!folder) {
      res.status(404).json({ message: 'Folder not found or access denied' });
      return;
    }

    // 2. Retrieve all question sets for this folder
    const questionSets = await prisma.questionSet.findMany({
      where: {
        folderId: parsedFolderId,
      },
      orderBy: {
        createdAt: 'desc', // Or by name, etc.
      },
    });

    res.status(200).json(questionSets);
  } catch (error) {
    console.error('Error fetching question sets by folder:', error);
    res.status(500).json({ message: 'Failed to retrieve question sets' });
  }
};

export const getQuestionSetById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const questionSetId = parseInt(req.params.id, 10);
    const userId = req.user!.userId;

    // We already have validateIdParam middleware, so no need to check isNaN here again.

    const questionSet = await prisma.questionSet.findUnique({
      where: {
        id: questionSetId,
      },
      include: {
        folder: true, // Include the folder to check ownership
      },
    });

    if (!questionSet) {
      res.status(404).json({ message: 'Question set not found' });
      return;
    }

    // Check if the authenticated user owns the folder containing the question set
    if (questionSet.folder.userId !== userId) {
      // Return 404 to avoid revealing the existence of the question set to unauthorized users
      res.status(404).json({ message: 'Question set not found or access denied' });
      return;
    }

    // Exclude folder details from the response if not needed, or transform as necessary
    // For now, let's return the question set along with its folder ID.
    // If we want to hide folder details, we can do: const { folder, ...qsData } = questionSet;
    res.status(200).json(questionSet);
  } catch (error) {
    console.error('Error in getQuestionSetById:', error);
    res.status(500).json({ message: 'Failed to retrieve question set' });
  }
};

export const updateQuestionSet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const questionSetId = parseInt(req.params.id, 10); // id from /:id
    const userId = req.user!.userId;
    const { name } = req.body;

    // No need to validate questionSetId here as validateIdParam middleware handles it.
    // Name validation is handled by validateQuestionSetUpdate middleware.

    const questionSet = await prisma.questionSet.findUnique({
      where: { id: questionSetId },
      include: { folder: true },
    });

    if (!questionSet) {
      res.status(404).json({ message: 'Question set not found' });
      return;
    }

    if (questionSet.folder.userId !== userId) {
      res.status(404).json({ message: 'Question set not found or access denied' });
      return;
    }

    // If name is not provided in the body, nothing to update (or handle as per requirements)
    // For now, we assume if 'name' is undefined, we don't update it.
    // The validation middleware (validateQuestionSetUpdate) makes 'name' optional.
    // If it's present, it must be a non-empty string.
    if (name === undefined) {
      // If name is not in the body, just return the current question set or a 200 OK with no changes.
      // Or, one might argue this should be a 400 if no updatable fields are provided.
      // For now, let's return the existing object if no name is passed to update.
      res.status(200).json(questionSet);
      return;
    }

    const updatedQuestionSet = await prisma.questionSet.update({
      where: { id: questionSetId },
      data: { name }, // Only update name if provided
    });

    res.status(200).json(updatedQuestionSet);
  } catch (error) {
    console.error('Error in updateQuestionSet:', error);
    res.status(500).json({ message: 'Failed to update question set' });
  }
};

export const deleteQuestionSet = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const questionSetId = parseInt(req.params.id, 10);
    const userId = req.user!.userId;

    // validateIdParam middleware handles questionSetId validation

    const questionSet = await prisma.questionSet.findUnique({
      where: { id: questionSetId },
      include: { folder: true },
    });

    if (!questionSet) {
      res.status(404).json({ message: 'Question set not found' });
      return;
    }

    if (questionSet.folder.userId !== userId) {
      res.status(404).json({ message: 'Question set not found or access denied' });
      return;
    }

    await prisma.questionSet.delete({
      where: { id: questionSetId },
    });

    res.status(204).send(); // No content for successful deletion
  } catch (error) {
    console.error('Error in deleteQuestionSet:', error);
    res.status(500).json({ message: 'Failed to delete question set' });
  }
};
