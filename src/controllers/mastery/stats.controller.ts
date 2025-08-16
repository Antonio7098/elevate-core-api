import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as primitiveStatsService from '../../services/mastery/primitiveStats.service';
// Primitive-centric stats controller - replaces old question set-based stats

// GET /api/stats/primitives/:primitiveId - Get detailed stats for a specific primitive
export const getPrimitiveStatsDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const primitiveId = req.params.primitiveId;
    if (!primitiveId) {
      res.status(400).json({ message: 'Invalid Primitive ID format.' });
      return;
    }

    const details = await primitiveStatsService.getPrimitiveDetailedStats(userId, primitiveId);
    res.json({
      success: true,
      data: details
    });
  } catch (error: any) {
    if (error && error.status === 404) {
      res.status(404).json({ message: error.message || 'Primitive not found.' });
    } else if (error && error.status === 403) {
      res.status(403).json({ message: error.message || 'Access forbidden.' });
    } else {
      next(error);
    }
  }
};

// GET /api/stats/overview - Get overall user progress stats
export const getOverallStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const stats = await primitiveStatsService.getUserProgressStats(userId);
    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    if (error && error.status === 404) {
      res.status(404).json({ message: error.message || 'Resource not found.' });
    } else {
      next(error);
    }
  }
};

// GET /api/stats/mastery - Get primitive mastery distribution stats
export const getMasteryStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const masteryStats = await primitiveStatsService.getPrimitiveMasteryStats(userId);
    res.json({
      success: true,
      data: masteryStats
    });
  } catch (error: any) {
    next(error);
  }
};

// GET /api/stats/activity - Get review activity stats
export const getActivityStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const activityStats = await primitiveStatsService.getReviewActivityStats(userId);
    res.json({
      success: true,
      data: activityStats
    });
  } catch (error: any) {
    next(error);
  }
};

// GET /api/stats/daily-completion - Get daily task completion stats
export const getDailyCompletionStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const completionStats = await primitiveStatsService.getDailyTaskCompletionStats(userId);
    res.json({
      success: true,
      data: completionStats
    });
  } catch (error: any) {
    next(error);
  }
};

// DEPRECATED: Folder-based stats are being phased out in favor of primitive-centric stats
// GET /api/stats/folders/:folderId - Returns 410 Gone to indicate deprecation
export const getFolderStatsDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  res.status(410).json({
    success: false,
    error: 'This endpoint has been deprecated',
    message: 'Folder-based stats have been replaced with primitive-centric stats. Please use /api/stats/overview or /api/stats/mastery instead.',
    deprecatedAt: '2024-01-01',
    alternatives: [
      '/api/stats/overview - Get overall user progress stats',
      '/api/stats/mastery - Get primitive mastery distribution',
      '/api/stats/activity - Get review activity stats'
    ]
  });
};
