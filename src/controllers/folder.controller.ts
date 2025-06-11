// src/controllers/folder.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware'; // For req.user
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, description, parentId } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  try {
    let parentFolder = null;
    if (parentId !== undefined && parentId !== null) {
      parentFolder = await prisma.folder.findFirst({
        where: { id: parentId, userId },
      });
      if (!parentFolder) {
        res.status(400).json({ message: 'Parent folder not found or access denied' });
        return;
      }
    }
    const createData: any = {
      name,
      description,
      userId
    };

    if (parentId) {
      createData.parent = { connect: { id: parentId } };
    }

    const folder = await prisma.folder.create({
      data: createData
    });
    res.status(201).json(folder);
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
    res.status(500).json({ message: 'Failed to create folder' });
  }
};

// Helper to build a nested folder tree from a flat array
function buildFolderTree(folders: any[]): any[] {
  const idToNode: Record<number, any> = {};
  const roots: any[] = [];
  folders.forEach(folder => {
    idToNode[folder.id] = { ...folder, children: [] };
  });
  folders.forEach(folder => {
    if (folder.parentId && idToNode[folder.parentId]) {
      idToNode[folder.parentId].children.push(idToNode[folder.id]);
    } else {
      roots.push(idToNode[folder.id]);
    }
  });
  return roots;
}

export const getFolders = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  try {
    const folders = await prisma.folder.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    const tree = buildFolderTree(folders);
    res.status(200).json(tree);
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
      include: {
        children: true // Include the children of the folder
      }
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
  const { name, description, parentId } = req.body;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!folderId || isNaN(parseInt(folderId))) {
    res.status(400).json({ message: 'Invalid folder ID provided' });
    return;
  }

  // Construct the data object for Prisma update
  const dataToUpdate: { name?: string; description?: string | null; parent?: { connect: { id: number } } | { disconnect: true } } = {};
  if (name !== undefined) {
    dataToUpdate.name = name;
  }
  if (description !== undefined) {
    dataToUpdate.description = description;
  }
  if (parentId !== undefined) {
    if (parentId === null) {
      dataToUpdate.parent = { disconnect: true };
    } else {
      // Prevent a folder from becoming its own parent
      if (parseInt(folderId) === parentId) {
        res.status(400).json({ message: 'A folder cannot be its own parent' });
        return;
      }
      // Check if the parent folder exists and belongs to the user
      const parentFolder = await prisma.folder.findFirst({
        where: { id: parentId, userId },
      });
      if (!parentFolder) {
        res.status(400).json({ message: 'Parent folder not found or access denied' });
        return;
      }
      // Prevent cycles by checking if the parent is a descendant of the current folder
      let currentParent = await prisma.folder.findUnique({ where: { id: parentId } }) as { id: number; parentId: number | null } | null;
      while (currentParent?.parentId) {
        if (currentParent.parentId === parseInt(folderId)) {
          res.status(400).json({ message: 'Cannot create a cycle in folder hierarchy' });
          return;
        }
        currentParent = await prisma.folder.findUnique({ where: { id: currentParent.parentId } }) as { id: number; parentId: number | null } | null;
      }
      dataToUpdate.parent = { connect: { id: parentId } };
    }
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
