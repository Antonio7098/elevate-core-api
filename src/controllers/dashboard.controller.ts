import { Response, NextFunction } from 'express';
import dashboardService from '../services/dashboard.service';
import { AuthRequest } from '../middleware/auth.middleware'; // Assuming AuthRequest is defined here
import asyncHandler from 'express-async-handler';

/**
 * @desc    Get aggregated dashboard data
 * @route   GET /api/dashboard
 * @access  Private
 */
const getDashboardData = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || typeof req.user.userId === 'undefined') { 
      res.status(401); // Unauthorized
      throw new Error('Not authorized, no token or user ID found');
    }

    const userId = req.user.userId; 

    try {
      const dashboardDetails = await dashboardService.fetchDashboardDetails(userId);
      res.status(200).json(dashboardDetails);
    } catch (error) {
      // Log the error for server-side inspection if needed
      // console.error('Error fetching dashboard data:', error);
      // Pass to error handling middleware or send a generic error response
      res.status(500);
      throw new Error('Server error while fetching dashboard data');
    }
  }
);

export default {
  getDashboardData,
};
