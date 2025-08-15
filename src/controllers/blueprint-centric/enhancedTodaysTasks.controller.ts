import { Request, Response, NextFunction } from 'express';
import { EnhancedTodaysTasksService } from '../../services/enhancedTodaysTasks.service';
import { AuthRequest } from '../../middleware/auth.middleware';

const enhancedTodaysTasksService = new EnhancedTodaysTasksService();

// ============================================================================
// ENHANCED TODAY'S TASKS CONTROLLER
// ============================================================================
// 🆕 NEW ARCHITECTURE - Uses section-based logic instead of primitive-based
// ============================================================================

export class EnhancedTodaysTasksController {
  
  /**
   * GET /api/enhanced-todays-tasks
   * Generate today's tasks using section-based organization
   */
  async getTodaysTasks(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
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
      console.error('Error in getTodaysTasks:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve daily tasks', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * GET /api/enhanced-todays-tasks/capacity-analysis
   * Get capacity analysis for today's tasks
   */
  async getCapacityAnalysis(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || typeof req.user.userId !== 'number') {
        res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
        return;
      }
      const userId = req.user.userId;

      // Get user's capacity analysis
      const capacityAnalysis = await enhancedTodaysTasksService.getUserCapacityAnalysis(userId);

      res.status(200).json({
        success: true,
        data: {
          userId,
          capacityAnalysis,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getCapacityAnalysis:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve capacity analysis', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * POST /api/enhanced-todays-tasks/complete
   * Mark a task as completed
   */
  async completeTask(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || typeof req.user.userId !== 'number') {
        res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
        return;
      }
      const userId = req.user.userId;

      const { taskId } = req.params;
      const { completionTime, performance, notes } = req.body;

      if (!taskId) {
        res.status(400).json({ message: 'Task ID is required.' });
        return;
      }

      // Complete the task
      const completionResult = await enhancedTodaysTasksService.completeTask(userId, taskId, {
        completionTime: completionTime || new Date(),
        performance: performance || 1.0,
        notes: notes || ''
      });

      res.status(200).json({
        success: true,
        data: {
          taskId,
          completionResult,
          completedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in completeTask:', error);
      res.status(500).json({ success: false, error: 'Failed to complete task', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * GET /api/enhanced-todays-tasks/progress
   * Get today's task progress
   */
  async getTaskProgress(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || typeof req.user.userId !== 'number') {
        res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
        return;
      }
      const userId = req.user.userId;

      // Get task progress for today
      const progress = await enhancedTodaysTasksService.getTodaysTaskProgress(userId);

      res.status(200).json({
        success: true,
        data: {
          userId,
          progress,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getTaskProgress:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve task progress', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * POST /api/enhanced-todays-tasks/prioritize
   * Reprioritize today's tasks
   */
  async prioritizeTasks(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || typeof req.user.userId !== 'number') {
        res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
        return;
      }
      const userId = req.user.userId;

      const { priorityOrder, focusAreas, timeConstraints } = req.body;

      if (!priorityOrder || !Array.isArray(priorityOrder)) {
        res.status(400).json({ message: 'Priority order array is required.' });
        return;
      }

      // Reprioritize tasks
      const reprioritizedTasks = await enhancedTodaysTasksService.reprioritizeTasks(userId, {
        priorityOrder,
        focusAreas: focusAreas || [],
        timeConstraints: timeConstraints || {}
      });

      res.status(200).json({
        success: true,
        data: {
          userId,
          reprioritizedTasks,
          prioritizedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in prioritizeTasks:', error);
      res.status(500).json({ success: false, error: 'Failed to prioritize tasks', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * GET /api/enhanced-todays-tasks/recommendations
   * Get personalized task recommendations
   */
  async getTaskRecommendations(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || typeof req.user.userId !== 'number') {
        res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
        return;
      }
      const userId = req.user.userId;

      const { focus = 'all', difficulty = 'all', timeAvailable } = req.query;

      // Get personalized recommendations
      const recommendations = await enhancedTodaysTasksService.getPersonalizedRecommendations(userId, {
        focus: focus as string,
        difficulty: difficulty as string,
        timeAvailable: timeAvailable ? parseInt(timeAvailable as string) : undefined
      });

      res.status(200).json({
        success: true,
        data: {
          userId,
          recommendations,
          filters: {
            focus: focus as string,
            difficulty: difficulty as string,
            timeAvailable: timeAvailable ? parseInt(timeAvailable as string) : 'unlimited'
          },
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getTaskRecommendations:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve task recommendations', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * GET /api/enhanced-todays-tasks/analytics
   * Get task completion analytics
   */
  async getTaskAnalytics(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || typeof req.user.userId !== 'number') {
        res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
        return;
      }
      const userId = req.user.userId;

      const { period = 'week', includeDetails = false } = req.query;

      // Get task analytics
      const analytics = await enhancedTodaysTasksService.getTaskAnalytics(userId, {
        period: period as string,
        includeDetails: includeDetails === 'true'
      });

      res.status(200).json({
        success: true,
        data: {
          userId,
          analytics,
          period: period as string,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getTaskAnalytics:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve task analytics', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * POST /api/enhanced-todays-tasks/skip
   * Skip a task for today
   */
  async skipTask(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || typeof req.user.userId !== 'number') {
        res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
        return;
      }
      const userId = req.user.userId;

      const { taskId, reason, rescheduleFor } = req.body;

      if (!taskId) {
        res.status(400).json({ message: 'Task ID is required.' });
        return;
      }

      // Skip the task
      const skipResult = await enhancedTodaysTasksService.skipTask(userId, taskId, {
        reason: reason || 'User choice',
        rescheduleFor: rescheduleFor || new Date(Date.now() + 24 * 60 * 60 * 1000) // Default to tomorrow
      });

      res.status(200).json({
        success: true,
        data: {
          taskId,
          skipResult,
          skippedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in skipTask:', error);
      res.status(500).json({ success: false, error: 'Failed to skip task', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * GET /api/enhanced-todays-tasks/upcoming
   * Get upcoming tasks for the next few days
   */
  async getUpcomingTasks(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || typeof req.user.userId !== 'number') {
        res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
        return;
      }
      const userId = req.user.userId;

      const { days = 7, includeCompleted = false } = req.query;

      // Get upcoming tasks
      const upcomingTasks = await enhancedTodaysTasksService.getUpcomingTasks(userId, {
        days: parseInt(days as string),
        includeCompleted: includeCompleted === 'true'
      });

      res.status(200).json({
        success: true,
        data: {
          userId,
          upcomingTasks,
          days: parseInt(days as string),
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getUpcomingTasks:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve upcoming tasks', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * POST /api/enhanced-todays-tasks/batch-complete
   * Complete multiple tasks in batch
   */
  async batchCompleteTasks(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || typeof req.user.userId !== 'number') {
        res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
        return;
      }
      const userId = req.user.userId;

      const { taskIds, completionData } = req.body;

      if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
        res.status(400).json({ message: 'Task IDs array is required and must not be empty.' });
        return;
      }

      // Complete multiple tasks
      const completionResults = await enhancedTodaysTasksService.batchCompleteTasks(userId, taskIds, completionData || {});

      res.status(200).json({
        success: true,
        data: {
          userId,
          completionResults,
          completedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in batchCompleteTasks:', error);
      res.status(500).json({ success: false, error: 'Failed to complete tasks in batch', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * GET /api/enhanced-todays-tasks/completion-streak
   * Get user's completion streak information
   */
  async getCompletionStreak(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || typeof req.user.userId !== 'number') {
        res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
        return;
      }
      const userId = req.user.userId;

      const streakInfo = await enhancedTodaysTasksService.getUserCompletionStreak(userId);

      res.status(200).json({
        success: true,
        data: {
          userId,
          streakInfo,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getCompletionStreak:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve completion streak', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * POST /api/enhanced-todays-tasks/generate-more
   * Generate additional tasks for today
   */
  async generateMoreTasks(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || typeof req.user.userId !== 'number') {
        res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
        return;
      }
      const userId = req.user.userId;

      const { count = 5, focusArea } = req.body;

      // Generate additional tasks
      const additionalTasks = await enhancedTodaysTasksService.generateAdditionalTasks(userId, {
        count: parseInt(count),
        focusArea
      });

      res.status(200).json({
        success: true,
        data: {
          userId,
          additionalTasks,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in generateMoreTasks:', error);
      res.status(500).json({ success: false, error: 'Failed to generate additional tasks', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * GET /api/enhanced-todays-tasks/tasks-for-section/:sectionId
   * Get tasks for a specific section
   */
  async getTasksForSection(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || typeof req.user.userId !== 'number') {
        res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
        return;
      }
      const userId = req.user.userId;
      const { sectionId } = req.params;

      if (!sectionId) {
        res.status(400).json({ message: 'Section ID is required.' });
        return;
      }

      const sectionTasks = await enhancedTodaysTasksService.getTasksForSection(userId, parseInt(sectionId));

      res.status(200).json({
        success: true,
        data: {
          userId,
          sectionId: parseInt(sectionId),
          tasks: sectionTasks,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getTasksForSection:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve section tasks', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  /**
   * GET /api/enhanced-todays-tasks/tasks-for-uue-stage/:stage
   * Get tasks for a specific UUE stage
   */
  async getTasksForUueStage(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user || typeof req.user.userId !== 'number') {
        res.status(401).json({ message: 'User not authenticated or user ID is missing/invalid.' });
        return;
      }
      const userId = req.user.userId;
      const { stage } = req.params;

      if (!stage) {
        res.status(400).json({ message: 'UUE stage is required.' });
        return;
      }

      const stageTasks = await enhancedTodaysTasksService.getTasksForUueStage(userId, stage);

      res.status(200).json({
        success: true,
        data: {
          userId,
          stage,
          tasks: stageTasks,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error in getTasksForUueStage:', error);
      res.status(500).json({ success: false, error: 'Failed to retrieve UUE stage tasks', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
}

// Export controller instance
export const enhancedTodaysTasksController = new EnhancedTodaysTasksController();




