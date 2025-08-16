import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { getAllQuestionsInFolderTree, getAllNotesInFolderTree } from '../../services/legacy/recursiveFolder.service';

export const getAllQuestionsInFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const folderId = parseInt(req.params.folderId);
    if (isNaN(folderId)) {
      res.status(400).json({ error: 'Invalid folder ID' });
      return;
    }

    const userId = req.user!.userId;
    const folderTree = await getAllQuestionsInFolderTree(folderId, userId);
    res.json(folderTree);
  } catch (error) {
    if (error instanceof Error && error.message === 'Folder not found or access denied') {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error getting questions in folder tree:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export const getAllNotesInFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const folderId = parseInt(req.params.folderId);
    if (isNaN(folderId)) {
      res.status(400).json({ error: 'Invalid folder ID' });
      return;
    }

    const userId = req.user!.userId;
    const folderTree = await getAllNotesInFolderTree(folderId, userId);
    res.json(folderTree);
  } catch (error) {
    if (error instanceof Error && error.message === 'Folder not found or access denied') {
      res.status(404).json({ error: error.message });
    } else {
      console.error('Error getting notes in folder tree:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}; 