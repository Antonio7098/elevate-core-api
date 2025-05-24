// src/controllers/folder.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware'; // For req.user
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    // This should ideally not happen if 'protect' middleware is working correctly
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  try {
    const newFolder = await prisma.folder.create({
      data: {
        name,
        description,
        userId,
      },
    });
    res.status(201).json(newFolder);
  } catch (error) {
    console.error('--- Create Folder Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Create Folder Error ---');
    // Check for specific Prisma errors if needed, e.g., unique constraint violation
    res.status(500).json({ message: 'Failed to create folder' });
  }
};

export const getFolders = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    // This should ideally not happen if 'protect' middleware is working correctly
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  try {
    const folders = await prisma.folder.findMany({
      where: {
        userId,
      },
      orderBy: {
        updatedAt: 'desc', // Optional: order by most recently updated
      },
    });
    res.status(200).json(folders);
  } catch (error) {
    console.error('--- Get Folders Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Get Folders Error ---');
    res.status(500).json({ message: 'Failed to retrieve folders' });
  }
};

export const getFolderById = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id: folderId } = req.params;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!folderId || isNaN(parseInt(folderId))) {
    res.status(400).json({ message: 'Invalid folder ID provided' });
    return;
  }

  try {
    const folder = await prisma.folder.findUnique({
      where: {
        id: parseInt(folderId),
        userId: userId, // Ensure the folder belongs to the authenticated user
      },
    });

    if (!folder) {
      res.status(404).json({ message: 'Folder not found or access denied' });
      return;
    }

    res.status(200).json(folder);
  } catch (error) {
    console.error('--- Get Folder By ID Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Get Folder By ID Error ---');
    res.status(500).json({ message: 'Failed to retrieve folder' });
  }
};

export const updateFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id: folderId } = req.params;
  const { name, description } = req.body;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!folderId || isNaN(parseInt(folderId))) {
    res.status(400).json({ message: 'Invalid folder ID provided' });
    return;
  }

  // Construct the data object for Prisma update
  // Only include fields that are actually provided in the request body
  const dataToUpdate: { name?: string; description?: string | null } = {};
  if (name !== undefined) {
    dataToUpdate.name = name;
  }
  if (description !== undefined) {
    // If description is explicitly passed as null, it will be set to null.
    // If description is an empty string, it will be set to an empty string.
    dataToUpdate.description = description;
  }

  if (Object.keys(dataToUpdate).length === 0) {
    res.status(400).json({ message: 'No update data provided' });
    return;
  }

  try {
    // First, verify the folder exists and belongs to the user
    const existingFolder = await prisma.folder.findUnique({
      where: {
        id: parseInt(folderId),
        userId: userId,
      },
    });

    if (!existingFolder) {
      res.status(404).json({ message: 'Folder not found or access denied' });
      return;
    }

    // Update the folder
    const updatedFolder = await prisma.folder.update({
      where: {
        id: parseInt(folderId),
        // No need to repeat userId here as we've already confirmed ownership
      },
      data: dataToUpdate,
    });

    res.status(200).json(updatedFolder);
  } catch (error) {
    console.error('--- Update Folder Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Update Folder Error ---');
    // Handle specific Prisma errors, e.g., P2025 (Record to update not found - though our check should prevent this)
    res.status(500).json({ message: 'Failed to update folder' });
  }
};

export const deleteFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id: folderId } = req.params;

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
    const folderToDelete = await prisma.folder.findUnique({
      where: {
        id: parseInt(folderId),
        userId: userId,
      },
    });

    if (!folderToDelete) {
      // If the folder doesn't exist or doesn't belong to the user, return 404
      res.status(404).json({ message: 'Folder not found or access denied' });
      return;
    }

    // If the folder exists and belongs to the user, proceed with deletion
    await prisma.folder.delete({
      where: {
        id: parseInt(folderId),
      },
    });

    res.status(204).send(); // 204 No Content for successful deletion
  } catch (error) {
    console.error('--- Delete Folder Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Delete Folder Error ---');
    // Handle specific Prisma errors, e.g., P2025 (Record to delete not found - our check should prevent this)
    res.status(500).json({ message: 'Failed to delete folder' });
  }
};
