import { Request, Response, NextFunction } from 'express';
import { generateDailyTasks } from '../services/primitiveSR.service';
import { cachedPrimitiveService } from '../services/cachedPrimitiveSR.service';
import { AuthRequest } from '../middleware/auth.middleware';

export const getTodaysTasksController = async (
  req: AuthRequest, // Corrected type
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user || typeof req.user.userId !== 'number') { // Corrected to req.user.userId
      res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
      return;
    }
    const userId = req.user.userId; // Corrected to req.user.userId

    // Optional: Allow overriding today's date for testing via query param
    const mockTodayQuery = req.query.mockToday as string | undefined;
    let mockTodayDate: Date | undefined = undefined;
    if (mockTodayQuery) {
      const parsedDate = new Date(mockTodayQuery);
      if (!isNaN(parsedDate.getTime())) {
        mockTodayDate = parsedDate;
      }
    }

    // Generate primitive-based daily tasks using SR service (mocked in tests)
    const dailyTasks = await generateDailyTasks(userId);
    
    // Transform to match expected response format
    const response = {
      success: true,
      data: {
        tasks: dailyTasks,
        totalTasks: dailyTasks.length,
        bucketDistribution: {
          critical: dailyTasks.filter(t => t.bucket === 'critical').length,
          core: dailyTasks.filter(t => t.bucket === 'core').length,
          plus: dailyTasks.filter(t => t.bucket === 'plus').length
        },
        generatedAt: new Date().toISOString()
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getTodaysTasksController:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve daily tasks', details: error instanceof Error ? error.message : 'Unknown error' });
  }
};
