import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, content, plainText, folderId, questionSetId } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  try {
    // Verify folder ownership if folderId is provided
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, userId },
      });
      if (!folder) {
        res.status(404).json({ message: 'Folder not found or access denied' });
        return;
      }
    }

    // Verify question set ownership if questionSetId is provided
    if (questionSetId) {
      const questionSet = await prisma.questionSet.findFirst({
        where: { 
          id: questionSetId,
          folder: { userId }
        },
      });
      if (!questionSet) {
        res.status(404).json({ message: 'Question set not found or access denied' });
        return;
      }
    }

    const newNote = await prisma.note.create({
      data: {
        title,
        content,
        plainText,
        userId,
        folderId: folderId || null,
        questionSetId: questionSetId || null,
      },
    });

    res.status(201).json(newNote);
  } catch (error) {
    console.error('--- Create Note Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Create Note Error ---');
    res.status(500).json({ message: 'Failed to create note' });
  }
};

export const getNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { folderId, questionSetId } = req.query;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  try {
    const where: any = { userId };

    if (folderId) {
      where.folderId = parseInt(folderId as string);
    }
    if (questionSetId) {
      where.questionSetId = parseInt(questionSetId as string);
    }

    const notes = await prisma.note.findMany({
      where,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    res.status(200).json(notes);
  } catch (error) {
    console.error('--- Get Notes Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Get Notes Error ---');
    res.status(500).json({ message: 'Failed to retrieve notes' });
  }
};

export const getNoteById = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id: noteId } = req.params;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!noteId || isNaN(parseInt(noteId))) {
    res.status(400).json({ message: 'Invalid note ID provided' });
    return;
  }

  try {
    const note = await prisma.note.findFirst({
      where: {
        id: parseInt(noteId),
        userId,
      },
    });

    if (!note) {
      res.status(404).json({ message: 'Note not found or access denied' });
      return;
    }

    res.status(200).json(note);
  } catch (error) {
    console.error('--- Get Note By ID Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Get Note By ID Error ---');
    res.status(500).json({ message: 'Failed to retrieve note' });
  }
};

export const updateNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id: noteId } = req.params;
  let { title, content, plainText, folderId, questionSetId } = req.body;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!noteId || isNaN(parseInt(noteId))) {
    res.status(400).json({ message: 'Invalid note ID provided' });
    return;
  }

  try {
    // First, verify the note exists and belongs to the user
    const existingNote = await prisma.note.findFirst({
      where: {
        id: parseInt(noteId),
        userId,
      },
    });

    if (!existingNote) {
      res.status(404).json({ message: 'Note not found or access denied' });
      return;
    }

    // Convert folderId to number if present
    if (folderId) {
      folderId = Number(folderId);
      const folder = await prisma.folder.findFirst({
        where: { id: folderId, userId },
      });
      if (!folder) {
        res.status(404).json({ message: 'Folder not found or access denied' });
        return;
      }
    }

    // Convert questionSetId to number if present
    if (questionSetId) {
      questionSetId = Number(questionSetId);
      const questionSet = await prisma.questionSet.findFirst({
        where: { 
          id: questionSetId,
          folder: { userId }
        },
      });
      if (!questionSet) {
        res.status(404).json({ message: 'Question set not found or access denied' });
        return;
      }
    }

    const updatedNote = await prisma.note.update({
      where: { id: parseInt(noteId) },
      data: {
        title,
        content,
        plainText,
        folderId: folderId || null,
        questionSetId: questionSetId || null,
      },
    });

    res.status(200).json(updatedNote);
  } catch (error) {
    console.error('--- Update Note Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Update Note Error ---');
    res.status(500).json({ message: 'Failed to update note' });
  }
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { id: noteId } = req.params;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }

  if (!noteId || isNaN(parseInt(noteId))) {
    res.status(400).json({ message: 'Invalid note ID provided' });
    return;
  }

  try {
    // First, verify the note exists and belongs to the user
    const noteToDelete = await prisma.note.findFirst({
      where: {
        id: parseInt(noteId),
        userId,
      },
    });

    if (!noteToDelete) {
      res.status(404).json({ message: 'Note not found or access denied' });
      return;
    }

    await prisma.note.delete({
      where: {
        id: parseInt(noteId),
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error('--- Delete Note Error ---');
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('Error object (raw):', error);
    }
    console.error('Error object (stringified):', JSON.stringify(error, null, 2));
    console.error('--- End Delete Note Error ---');
    res.status(500).json({ message: 'Failed to delete note' });
  }
}; 