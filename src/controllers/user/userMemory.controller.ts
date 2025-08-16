import { Request, Response } from 'express';
import { UserMemoryService, UserMemoryUpdateData } from '../../services/user/userMemory.service';
import { AppError } from '../../utils/errorHandler';
import { AuthRequest } from '../../middleware/auth.middleware';

// Remove or update the global Express Request type extension to match { userId: number }
declare global {
  namespace Express {
    interface Request {
      user?: { userId: number };
    }
  }
}

export class UserMemoryController {
  /**
   * Get the authenticated user's memory
   */
  static async getUserMemory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const userMemory = await UserMemoryService.getUserMemory(userId);
      res.status(200).json(userMemory);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        console.error('Error in getUserMemory:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }

  /**
   * Update the authenticated user's memory
   */
  static async updateUserMemory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Accept only the new fields
      const updateData: UserMemoryUpdateData = req.body;
      const updatedMemory = await UserMemoryService.updateUserMemory(userId, updateData);
      res.status(200).json(updatedMemory);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ message: error.message });
      } else {
        console.error('Error in updateUserMemory:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  }
} 