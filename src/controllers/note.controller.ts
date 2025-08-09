import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import { blocksToHtml, blocksToPlainText, htmlToBlocks } from '../utils/blocknote';

export const createNote = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, content, contentBlocks, plainText, folderId, questionSetId } = req.body as any;
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

    // Prepare structured content
    let blocks: any = contentBlocks ?? null;
    if (!blocks && typeof content === 'string') {
      // Attempt conversion from legacy HTML (placeholder)
      blocks = htmlToBlocks(content);
    }

    const contentHtml = blocks ? blocksToHtml(blocks) : (typeof content === 'string' ? content : null);
    const contentPlain = blocks ? blocksToPlainText(blocks) : (typeof plainText === 'string' ? plainText : null);
    const version = blocks ? 2 : 1;

    const newNote = await prisma.note.create({
      data: {
        title,
        content: typeof content === 'string' ? content : contentHtml || '',
        contentBlocks: blocks ?? undefined,
        contentHtml: contentHtml ?? undefined,
        plainText: contentPlain ?? undefined,
        contentVersion: version,
        userId,
        folderId: folderId || null,
      },
    });

    // Return response with questionSetId for backward compatibility (not stored in DB)
    res.status(201).json({
      ...newNote,
      questionSetId: questionSetId || null,
      contentBlocks: newNote.contentBlocks ?? blocks ?? null,
      contentHtml: newNote.contentHtml ?? contentHtml ?? null,
      plainText: newNote.plainText ?? contentPlain ?? null,
      contentVersion: newNote.contentVersion ?? version,
    });
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
    // Note: questionSetId filtering is no longer supported as notes are not directly linked to question sets
    // The questionSetId parameter is ignored for backward compatibility

    const notes = await prisma.note.findMany({
      where,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Add questionSetId to each note for backward compatibility (not stored in DB)
    const notesWithQuestionSetId = notes.map(note => ({
      ...note,
      questionSetId: questionSetId ? parseInt(questionSetId as string) : null, // Echo back the requested questionSetId
    }));
    res.status(200).json(notesWithQuestionSetId);
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
  let { title, content, contentBlocks, plainText, folderId, questionSetId } = req.body as any;

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

    // Determine updates
    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (folderId !== undefined) updates.folderId = folderId || null;

    // Content updates
    let blocks: any = contentBlocks ?? null;
    if (!blocks && typeof content === 'string') {
      blocks = htmlToBlocks(content);
    }
    if (content !== undefined || contentBlocks !== undefined || plainText !== undefined) {
      const contentHtml = blocks ? blocksToHtml(blocks) : (typeof content === 'string' ? content : existingNote.contentHtml ?? null);
      const contentPlain = blocks ? blocksToPlainText(blocks) : (typeof plainText === 'string' ? plainText : existingNote.plainText ?? null);
      updates.content = typeof content === 'string' ? content : (contentHtml ?? existingNote.content ?? '');
      updates.contentBlocks = blocks !== null ? blocks : existingNote.contentBlocks ?? undefined;
      updates.contentHtml = contentHtml ?? existingNote.contentHtml ?? undefined;
      updates.plainText = contentPlain ?? existingNote.plainText ?? undefined;
      updates.contentVersion = blocks ? 2 : (existingNote.contentVersion ?? 1);
    }

    const updatedNote = await prisma.note.update({
      where: { id: parseInt(noteId) },
      data: updates,
    });

    // Return response with questionSetId for backward compatibility (not stored in DB)
    res.status(200).json({
      ...updatedNote,
      questionSetId: questionSetId || null,
      contentBlocks: updatedNote.contentBlocks ?? null,
      contentHtml: updatedNote.contentHtml ?? null,
      plainText: updatedNote.plainText ?? null,
      contentVersion: updatedNote.contentVersion,
    });
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