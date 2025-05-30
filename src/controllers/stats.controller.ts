import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware'; // Import AuthRequest
import * as statsService from '../services/stats.service';
// We will check error.status for errors thrown by createError from http-errors

export const getQuestionSetStatsDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const questionSetId = parseInt(req.params.setId, 10);
    if (isNaN(questionSetId)) {
      res.status(400).json({ message: 'Invalid QuestionSet ID format.' });
      return;
    }

    const details = await statsService.fetchQuestionSetStatsDetails(userId, questionSetId);
    res.json(details);
  } catch (error: any) {
    if (error && error.status === 404) {
      res.status(404).json({ message: error.message || 'Resource not found.' });
    } else if (error && error.status === 403) {
      res.status(403).json({ message: error.message || 'Access forbidden.' });
    } else {
      next(error);
    }
  }
};

export const getFolderStatsDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const folderId = parseInt(req.params.folderId, 10);
    if (isNaN(folderId)) {
      res.status(400).json({ message: 'Invalid Folder ID format.' });
      return;
    }

    const details = await statsService.fetchFolderStatsDetails(userId, folderId);
    res.json(details);
  } catch (error: any) {
    if (error && error.status === 404) {
      res.status(404).json({ message: error.message || 'Resource not found.' });
    } else if (error && error.status === 403) {
      res.status(403).json({ message: error.message || 'Access forbidden.' });
    } else {
      next(error);
    }
  }
};
