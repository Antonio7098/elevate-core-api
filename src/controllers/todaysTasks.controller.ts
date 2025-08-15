import { Request, Response, NextFunction } from 'express';
import { EnhancedTodaysTasksService } from '../services/enhancedTodaysTasks.service';
import { AuthRequest } from '../middleware/auth.middleware';

const enhancedTodaysTasksService = new EnhancedTodaysTasksService();

export const getTodaysTasksController = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || typeof req.user.userId !== 'number') {
      res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
      return;
    }
    const userId = req.user.userId;

    // Optional: Allow overriding today's date for testing via query param
    const mockTodayQuery = req.query.mockToday as string | undefined;
    let mockTodayDate: Date | undefined = undefined;
    if (mockTodayQuery) {
      const parsedDate = new Date(mockTodayQuery);
      if (!isNaN(parsedDate.getTime())) {
        mockTodayDate = parsedDate;
      }
    }

    // Generate today's tasks using the new enhanced service
    const todaysTasks = await enhancedTodaysTasksService.generateTodaysTasksForUser(userId);
    
    // Transform to match expected response format
    const response = {
      success: true,
      data: {
        tasks: [
          ...todaysTasks.critical.tasks.map(task => ({ ...task, bucket: 'critical' })),
          ...todaysTasks.core.tasks.map(task => ({ ...task, bucket: 'core' })),
          ...todaysTasks.plus.tasks.map(task => ({ ...task, bucket: 'plus' }))
        ],
        totalTasks: todaysTasks.totalTasks,
        bucketDistribution: {
          critical: todaysTasks.critical.count,
          core: todaysTasks.core.count,
          plus: todaysTasks.plus.count
        },
        capacityAnalysis: todaysTasks.capacityAnalysis,
        recommendations: todaysTasks.recommendations,
        estimatedTime: todaysTasks.estimatedTime,
        generatedAt: new Date().toISOString()
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getTodaysTasksController:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve daily tasks', details: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// GET /api/todays-tasks/capacity-analysis
export const getCapacityAnalysis = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || typeof req.user.userId !== 'number') {
      res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
      return;
    }
    const userId = req.user.userId;

    // Get capacity analysis using the enhanced service
    const todaysTasks = await enhancedTodaysTasksService.generateTodaysTasksForUser(userId);
    
    res.status(200).json({
      success: true,
      data: todaysTasks.capacityAnalysis
    });
  } catch (error) {
    console.error('Error in getCapacityAnalysis:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve capacity analysis' });
  }
};

// POST /api/todays-tasks/generate-more
export const generateMoreTasks = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || typeof req.user.userId !== 'number') {
      res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
      return;
    }
    const userId = req.user.userId;

    const { bucket, count = 5 } = req.body;

    if (!bucket || !['critical', 'core', 'plus'].includes(bucket)) {
      res.status(400).json({ message: 'Invalid bucket specified. Must be critical, core, or plus.' });
      return;
    }

    // Generate additional tasks for the specified bucket
    // This would need to be implemented in the enhanced service
    const additionalTasks = []; // Placeholder for additional task generation
    
    res.status(200).json({
      success: true,
      data: {
        tasks: additionalTasks,
        bucket,
        count: additionalTasks.length
      }
    });
  } catch (error) {
    console.error('Error in generateMoreTasks:', error);
    res.status(500).json({ success: false, error: 'Failed to generate additional tasks' });
  }
};
