import { Request, Response, NextFunction } from 'express';
import { generateTodaysTasksForUser } from '../services/todaysTasks.service';
import { AuthRequest } from '../middleware/auth.middleware'; // Corrected import

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

    const todaysTasks = await generateTodaysTasksForUser(userId, mockTodayDate);
    res.status(200).json(todaysTasks);
  } catch (error) {
    // Log the error for server-side inspection
    console.error('Error in getTodaysTasksController:', error);
    // Pass to the centralized error handler
    next(error);
  }
};
