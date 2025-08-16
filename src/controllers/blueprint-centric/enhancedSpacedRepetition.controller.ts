import { Request, Response } from 'express';
import masteryCriterionService from '../../services/blueprint-centric/masteryCriterion.service';
import { getMasteryProgress, getMasteryStats } from '../../services/mastery/masteryTracking.service';
import { EnhancedBatchReviewService } from '../../services/mastery/enhancedBatchReview.service';
import { enhancedSpacedRepetitionService } from '../../services/mastery/enhancedSpacedRepetition.service';
import { AuthRequest } from '../../middleware/auth.middleware';

const enhancedBatchReviewService = new EnhancedBatchReviewService();

// ============================================================================
// ENHANCED SPACED REPETITION CONTROLLER - BLUEPRINT-CENTRIC
// ============================================================================
// 🆕 NEW ARCHITECTURE - Uses criterion-based logic instead of primitive-based
// ============================================================================

export class EnhancedSpacedRepetitionController {
  constructor(
    private enhancedSpacedRepetitionService: any,
    private enhancedBatchReviewService: any
  ) {}
  
  /**
   * GET /api/enhanced-sr/daily-tasks
   * Get daily tasks using criterion-based logic
   */
  async getDailyTasks(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get due criteria using the enhanced spaced repetition service
      const dueCriteria = await this.enhancedSpacedRepetitionService.getDueCriteria(userId);
      
      // Transform criteria to match expected response format
      const tasks = dueCriteria.map(criterion => ({
        id: criterion.id,
        title: criterion.description || 'Review Criterion',
        bucket: 'core', // Default bucket - can be enhanced with priority logic
        masteryScore: 0, // Will be populated from mastery progress
        nextReviewAt: new Date(), // Will be populated from mastery progress
        estimatedTime: 5 // Default 5 minutes per criterion
      }));
      
      res.json({
        success: true,
        data: {
          tasks,
          totalTasks: tasks.length,
          bucketBreakdown: {
            critical: tasks.filter(t => t.bucket === 'critical').length,
            core: tasks.filter(t => t.bucket === 'core').length,
            plus: tasks.filter(t => t.bucket === 'plus').length
          }
        }
      });
    } catch (error) {
      console.error('Error generating daily tasks:', error);
      res.status(500).json({ error: 'Failed to generate daily tasks' });
    }
  }

  /**
   * GET /api/enhanced-sr/daily-summary
   * Get daily summary using criterion-based mastery stats
   */
  async getDailySummary(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get mastery stats using the enhanced spaced repetition service
      const masteryStats = await this.enhancedSpacedRepetitionService.getMasteryStats(userId);

      res.json({
        success: true,
        data: {
          summaries: [], // Will be populated with actual criterion summaries
          stats: {
            total: masteryStats.totalCriteria,
            critical: 0, // Will be calculated from stage breakdown
            core: 0, // Will be calculated from stage breakdown
            plus: masteryStats.masteredCriteria,
            canProgress: masteryStats.masteredCriteria // Simplified for now
          }
        }
      });
    } catch (error) {
      console.error('Error fetching daily summary:', error);
      res.status(500).json({ error: 'Failed to fetch daily summary' });
    }
  }

  /**
   * POST /api/enhanced-sr/review-outcome
   * Submit review outcome using criterion-based logic
   */
  async submitReviewOutcome(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionId, outcome, timeSpent } = req.body;

      if (!criterionId || !outcome) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Update mastery progress using the enhanced spaced repetition service
      await this.enhancedSpacedRepetitionService.updateMasteryProgress(userId, criterionId, {
        outcome,
        timeSpent,
        reviewedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Review outcome submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting review outcome:', error);
      res.status(500).json({ error: 'Failed to submit review outcome' });
    }
  }

  /**
   * GET /api/enhanced-sr/mastery-progress/:criterionId
   * Get mastery progress for a specific criterion
   */
  async getMasteryProgress(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionId } = req.params;

      const progress = await getMasteryProgress(userId, criterionId);

      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('Error fetching mastery progress:', error);
      res.status(500).json({ error: 'Failed to fetch mastery progress' });
    }
  }

  /**
   * GET /api/enhanced-sr/mastery-stats
   * Get overall mastery statistics
   */
  async getMasteryStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const stats = await getMasteryStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching mastery stats:', error);
      res.status(500).json({ error: 'Failed to fetch mastery stats' });
    }
  }

  /**
   * POST /api/enhanced-sr/batch-review
   * Submit batch review outcomes
   */
  async submitBatchReview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { reviews } = req.body;

      if (!Array.isArray(reviews) || reviews.length === 0) {
        return res.status(400).json({ error: 'Invalid reviews data' });
      }

      // Process batch review using the enhanced batch review service
      const results = await this.enhancedBatchReviewService.processBatchReview(userId, reviews);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error processing batch review:', error);
      res.status(500).json({ error: 'Failed to process batch review' });
    }
  }

  /**
   * GET /api/enhanced-sr/next-review
   * Get next review recommendation
   */
  async getNextReview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const nextReview = await this.enhancedSpacedRepetitionService.getNextReview(userId);

      res.json({
        success: true,
        data: nextReview
      });
    } catch (error) {
      console.error('Error getting next review:', error);
      res.status(500).json({ error: 'Failed to get next review' });
    }
  }
}

// Export controller instance
export const enhancedSpacedRepetitionController = new EnhancedSpacedRepetitionController(
  enhancedSpacedRepetitionService,
  enhancedBatchReviewService
);

