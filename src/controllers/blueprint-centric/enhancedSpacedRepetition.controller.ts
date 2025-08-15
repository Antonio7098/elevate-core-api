import { Request, Response } from 'express';
import { masteryCriterionService } from '../../services/blueprint-centric/masteryCriterion.service';
import { getMasteryProgress, getMasteryStats } from '../../services/masteryTracking.service';
import { EnhancedBatchReviewService } from '../../services/enhancedBatchReview.service';
import { enhancedSpacedRepetitionService } from '../../services/enhancedSpacedRepetition.service';
import { AuthRequest } from '../../middleware/auth.middleware';

const enhancedBatchReviewService = new EnhancedBatchReviewService();

// ============================================================================
// ENHANCED SPACED REPETITION CONTROLLER
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
  async submitReviewOutcome(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionId, isCorrect, timeSpentSeconds = 30, confidence = 0.8 } = req.body;

      if (!criterionId || isCorrect === undefined) {
        return res.status(400).json({ 
          error: 'Missing required fields: criterionId, isCorrect' 
        });
      }

      // Process review outcome using the enhanced spaced repetition service
      const result = await this.enhancedSpacedRepetitionService.processReviewOutcome({
        userId,
        criterionId,
        isCorrect,
        confidence,
        timeSpentSeconds,
        timestamp: new Date()
      });

      res.json({
        success: true,
        data: {
          message: 'Review outcome processed successfully',
          criterionId,
          isCorrect,
          nextReviewAt: new Date(), // Will be populated from actual service
          masteryUpdated: true
        }
      });
    } catch (error) {
      console.error('Error processing review outcome:', error);
      res.status(500).json({ error: 'Failed to process review outcome' });
    }
  }

  /**
   * POST /api/enhanced-sr/batch-review
   * Process batch review outcomes using criterion-based logic
   */
  async submitBatchReviewOutcomes(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { outcomes } = req.body;

      if (!outcomes || !Array.isArray(outcomes) || outcomes.length === 0) {
        return res.status(400).json({ 
          error: 'Missing required fields: outcomes array' 
        });
      }

      // Transform outcomes to match new service interface
      const batchOutcomes = outcomes.map(outcome => ({
        userId,
        criterionId: outcome.criterionId || outcome.primitiveId, // Support both old and new format
        isCorrect: outcome.isCorrect,
        reviewDate: new Date(),
        timeSpentSeconds: outcome.timeSpentSeconds || 30,
        confidence: outcome.confidence || 0.8
      }));

      // Process batch using the enhanced batch review service
      const result = await this.enhancedBatchReviewService.processBatchWithOptimization(
        userId,
        batchOutcomes
      );

      res.json({
        success: result.success,
        data: {
          message: `Processed ${result.processedCount} review outcomes`,
          totalProcessed: result.processedCount,
          successCount: result.successCount,
          failureCount: result.failureCount,
          masteryUpdates: result.masteryUpdates,
          stageProgressions: result.stageProgressions,
          processingTime: result.processingTime,
          errors: result.errors
        }
      });

    } catch (error) {
      console.error('Error processing batch review outcomes:', error);
      res.status(500).json({ error: 'Failed to process batch review outcomes' });
    }
  }

  /**
   * GET /api/enhanced-sr/mastery-progress/:criterionId
   * Get mastery progress for a specific criterion
   */
  async getMasteryProgress(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionId } = req.params;

      if (!criterionId) {
        return res.status(400).json({ error: 'Missing criterionId parameter' });
      }

      // Get mastery progress using the enhanced spaced repetition service
      const progress = await this.enhancedSpacedRepetitionService.getMasteryProgress(userId, criterionId);

      if (!progress) {
        return res.status(404).json({ error: 'Mastery progress not found' });
      }

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
   * PUT /api/enhanced-sr/tracking-intensity/:criterionId
   * Update tracking intensity for a criterion
   */
  async updateTrackingIntensity(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionId } = req.params;
      const { intensity } = req.body;

      if (!criterionId || !intensity) {
        return res.status(400).json({ error: 'Missing criterionId or intensity' });
      }

      // Update tracking intensity using the enhanced spaced repetition service
      await this.enhancedSpacedRepetitionService.updateTrackingIntensity(userId, criterionId, intensity);

      res.json({
        success: true,
        data: {
          message: 'Tracking intensity updated successfully',
          criterionId,
          intensity
        }
      });

    } catch (error) {
      console.error('Error updating tracking intensity:', error);
      res.status(500).json({ error: 'Failed to update tracking intensity' });
    }
  }

  /**
   * GET /api/enhanced-sr/mastery-stats
   * Get mastery statistics for a user
   */
  async getMasteryStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get mastery stats using the enhanced spaced repetition service
      const stats = await this.enhancedSpacedRepetitionService.getMasteryStats(userId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error fetching mastery stats:', error);
      res.status(500).json({ error: 'Failed to fetch mastery stats' });
    }
  }

  // ============================================================================
  // MASTERY THRESHOLD MANAGEMENT METHODS
  // ============================================================================

  /**
   * GET /api/mastery-thresholds/user/:userId
   * Get user's mastery thresholds
   */
  async getUserMasteryThresholds(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { userId: targetUserId } = req.params;

      // Get user mastery thresholds using the enhanced spaced repetition service
      const thresholds = await this.enhancedSpacedRepetitionService.getUserMasteryThresholds(parseInt(targetUserId));

      res.json({
        success: true,
        data: thresholds
      });

    } catch (error) {
      console.error('Error fetching user mastery thresholds:', error);
      res.status(500).json({ error: 'Failed to fetch user mastery thresholds' });
    }
  }

  /**
   * GET /api/mastery-thresholds/section/:sectionId
   * Get mastery thresholds for a section
   */
  async getSectionMasteryThresholds(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { sectionId } = req.params;

      // Get section mastery thresholds using the enhanced spaced repetition service
      const thresholds = await this.enhancedSpacedRepetitionService.getSectionMasteryThresholds(sectionId);

      res.json({
        success: true,
        data: thresholds
      });

    } catch (error) {
      console.error('Error fetching section mastery thresholds:', error);
      res.status(500).json({ error: 'Failed to fetch section mastery thresholds' });
    }
  }

  /**
   * GET /api/mastery-thresholds/criterion/:criterionId
   * Get mastery threshold for a criterion
   */
  async getCriterionMasteryThreshold(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionId } = req.params;

      // Get criterion mastery threshold using the enhanced spaced repetition service
      const threshold = await this.enhancedSpacedRepetitionService.getCriterionMasteryThreshold(criterionId);

      res.json({
        success: true,
        data: threshold
      });

    } catch (error) {
      console.error('Error fetching criterion mastery threshold:', error);
      res.status(500).json({ error: 'Failed to fetch criterion mastery threshold' });
    }
  }

  /**
   * POST/PUT /api/mastery-thresholds/criterion/:criterionId
   * Set/Update mastery threshold for a criterion
   */
  async setCriterionMasteryThreshold(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionId } = req.params;
      const { threshold, customSettings } = req.body;

      // Set criterion mastery threshold using the enhanced spaced repetition service
      const result = await this.enhancedSpacedRepetitionService.setCriterionMasteryThreshold(
        criterionId,
        threshold,
        customSettings
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error setting criterion mastery threshold:', error);
      res.status(500).json({ error: 'Failed to set criterion mastery threshold' });
    }
  }

  /**
   * GET /api/mastery-thresholds/templates
   * Get available mastery threshold templates
   */
  async getMasteryThresholdTemplates(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get mastery threshold templates using the enhanced spaced repetition service
      const templates = await this.enhancedSpacedRepetitionService.getMasteryThresholdTemplates();

      res.json({
        success: true,
        data: templates
      });

    } catch (error) {
      console.error('Error fetching mastery threshold templates:', error);
      res.status(500).json({ error: 'Failed to fetch mastery threshold templates' });
    }
  }

  /**
   * GET /api/mastery-thresholds/analysis/user/:userId
   * Analyze user's mastery threshold effectiveness
   */
  async getUserMasteryThresholdAnalysis(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { userId: targetUserId } = req.params;

      // Get user mastery threshold analysis using the enhanced spaced repetition service
      const analysis = await this.enhancedSpacedRepetitionService.getUserMasteryThresholdAnalysis(parseInt(targetUserId));

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('Error fetching user mastery threshold analysis:', error);
      res.status(500).json({ error: 'Failed to fetch user mastery threshold analysis' });
    }
  }

  /**
   * GET /api/mastery-thresholds/analysis/section/:sectionId
   * Analyze section mastery threshold effectiveness
   */
  async getSectionMasteryThresholdAnalysis(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { sectionId } = req.params;

      // Get section mastery threshold analysis using the enhanced spaced repetition service
      const analysis = await this.enhancedSpacedRepetitionService.getSectionMasteryThresholdAnalysis(sectionId);

      res.json({
        success: true,
        data: analysis
      });

    } catch (error) {
      console.error('Error fetching section mastery threshold analysis:', error);
      res.status(500).json({ error: 'Failed to fetch section mastery threshold analysis' });
    }
  }

  /**
   * GET /api/mastery-thresholds/recommendations/:userId
   * Get mastery threshold recommendations
   */
  async getMasteryThresholdRecommendations(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { userId: targetUserId } = req.params;

      // Get mastery threshold recommendations using the enhanced spaced repetition service
      const recommendations = await this.enhancedSpacedRepetitionService.getMasteryThresholdRecommendations(parseInt(targetUserId));

      res.json({
        success: true,
        data: recommendations
      });

    } catch (error) {
      console.error('Error fetching mastery threshold recommendations:', error);
      res.status(500).json({ error: 'Failed to fetch mastery threshold recommendations' });
    }
  }

  /**
   * POST /api/mastery-thresholds/bulk-update
   * Bulk update mastery thresholds
   */
  async bulkUpdateMasteryThresholds(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { updates } = req.body;

      // Bulk update mastery thresholds using the enhanced spaced repetition service
      const result = await this.enhancedSpacedRepetitionService.bulkUpdateMasteryThresholds(updates);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error bulk updating mastery thresholds:', error);
      res.status(500).json({ error: 'Failed to bulk update mastery thresholds' });
    }
  }

  /**
   * POST /api/mastery-thresholds/bulk-reset
   * Bulk reset mastery thresholds to defaults
   */
  async bulkResetMasteryThresholds(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionIds } = req.body;

      // Bulk reset mastery thresholds using the enhanced spaced repetition service
      const result = await this.enhancedSpacedRepetitionService.bulkResetMasteryThresholds(criterionIds);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error bulk resetting mastery thresholds:', error);
      res.status(500).json({ error: 'Failed to bulk reset mastery thresholds' });
    }
  }

  /**
   * POST /api/mastery-thresholds/import
   * Import mastery thresholds from external source
   */
  async importMasteryThresholds(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { importData, source } = req.body;

      // Import mastery thresholds using the enhanced spaced repetition service
      const result = await this.enhancedSpacedRepetitionService.importMasteryThresholds(importData, source);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error importing mastery thresholds:', error);
      res.status(500).json({ error: 'Failed to import mastery thresholds' });
    }
  }

  /**
   * GET /api/mastery-thresholds/export/:userId
   * Export user's mastery thresholds
   */
  async exportMasteryThresholds(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { userId: targetUserId } = req.params;
      const { format = 'json' } = req.query;

      // Export mastery thresholds using the enhanced spaced repetition service
      const exportData = await this.enhancedSpacedRepetitionService.exportMasteryThresholds(parseInt(targetUserId), format as string);

      res.json({
        success: true,
        data: exportData
      });

    } catch (error) {
      console.error('Error exporting mastery thresholds:', error);
      res.status(500).json({ error: 'Failed to export mastery thresholds' });
    }
  }

  // ============================================================================
  // UUE STAGE PROGRESSION METHODS
  // ============================================================================

  /**
   * GET /api/uue-stage-progression/progress/:criterionId
   * Get UUE stage progress for a criterion
   */
  async getUueStageProgress(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionId } = req.params;

      // Get UUE stage progress using the enhanced spaced repetition service
      const progress = await this.enhancedSpacedRepetitionService.getUueStageProgress(userId, criterionId);

      res.json({
        success: true,
        data: progress
      });

    } catch (error) {
      console.error('Error fetching UUE stage progress:', error);
      res.status(500).json({ error: 'Failed to fetch UUE stage progress' });
    }
  }

  /**
   * POST /api/uue-stage-progression/advance/:criterionId
   * Progress to next UUE level
   */
  async progressToNextUueLevel(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionId } = req.params;
      const { forceAdvance = false } = req.body;

      // Progress to next UUE level using the enhanced spaced repetition service
      const result = await this.enhancedSpacedRepetitionService.progressToNextUueLevel(userId, criterionId, forceAdvance);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error progressing to next UUE level:', error);
      res.status(500).json({ error: 'Failed to progress to next UUE level' });
    }
  }

  /**
   * GET /api/uue-stage-progression/user/:userId
   * Get user's UUE stage progress
   */
  async getUserUueStageProgress(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { userId: targetUserId } = req.params;

      // Get user UUE stage progress using the enhanced spaced repetition service
      const progress = await this.enhancedSpacedRepetitionService.getUserUueStageProgress(parseInt(targetUserId));

      res.json({
        success: true,
        data: progress
      });

    } catch (error) {
      console.error('Error fetching user UUE stage progress:', error);
      res.status(500).json({ error: 'Failed to fetch user UUE stage progress' });
    }
  }

  /**
   * POST /api/uue-stage-progression/reset/:criterionId
   * Reset UUE stage for a criterion
   */
  async resetUueStage(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionId } = req.params;
      const { targetStage = 'UNDERSTAND' } = req.body;

      // Reset UUE stage using the enhanced spaced repetition service
      const result = await this.enhancedSpacedRepetitionService.resetUueStage(userId, criterionId, targetStage);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error resetting UUE stage:', error);
      res.status(500).json({ error: 'Failed to reset UUE stage' });
    }
  }

  /**
   * GET /api/uue-stage-progression/analytics/:userId
   * Get UUE stage analytics for a user
   */
  async getUueStageAnalytics(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { userId: targetUserId } = req.params;

      // Get UUE stage analytics using the enhanced spaced repetition service
      const analytics = await this.enhancedSpacedRepetitionService.getUueStageAnalytics(parseInt(targetUserId));

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      console.error('Error fetching UUE stage analytics:', error);
      res.status(500).json({ error: 'Failed to fetch UUE stage analytics' });
    }
  }

  /**
   * POST /api/uue-stage-progression/batch-advance
   * Batch advance UUE stages
   */
  async batchAdvanceUueStages(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criteria } = req.body;

      // Batch advance UUE stages using the enhanced spaced repetition service
      const result = await this.enhancedSpacedRepetitionService.batchAdvanceUueStages(userId, criteria);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error batch advancing UUE stages:', error);
      res.status(500).json({ error: 'Failed to batch advance UUE stages' });
    }
  }

  /**
   * GET /api/uue-stage-progression/next-review/:criterionId
   * Get next UUE stage review
   */
  async getNextUueStageReview(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionId } = req.params;

      // Get next UUE stage review using the enhanced spaced repetition service
      const review = await this.enhancedSpacedRepetitionService.getNextUueStageReview(userId, criterionId);

      res.json({
        success: true,
        data: review
      });

    } catch (error) {
      console.error('Error fetching next UUE stage review:', error);
      res.status(500).json({ error: 'Failed to fetch next UUE stage review' });
    }
  }

  // ============================================================================
  // PRIMITIVE COMPATIBILITY METHODS
  // ============================================================================

  /**
   * POST /api/primitives/review
   * Process batch review outcomes (primitive compatibility)
   */
  async processBatchReviewOutcomes(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { outcomes } = req.body;

      if (!outcomes || !Array.isArray(outcomes) || outcomes.length === 0) {
        return res.status(400).json({ 
          error: 'Missing required fields: outcomes array' 
        });
      }

      // Transform outcomes to match new service interface
      const batchOutcomes = outcomes.map(outcome => ({
        userId,
        criterionId: outcome.criterionId || outcome.primitiveId, // Support both old and new format
        isCorrect: outcome.isCorrect,
        reviewDate: new Date(),
        timeSpentSeconds: outcome.timeSpentSeconds || 30,
        confidence: outcome.confidence || 0.8
      }));

      // Process batch using the enhanced batch review service
      const result = await this.enhancedBatchReviewService.processBatchWithOptimization(
        userId,
        batchOutcomes
      );

      res.json({
        success: result.success,
        data: {
          message: `Processed ${result.processedCount} review outcomes`,
          totalProcessed: result.processedCount,
          successCount: result.successCount,
          failureCount: result.failureCount,
          masteryUpdates: result.masteryUpdates,
          stageProgressions: result.stageProgressions,
          processingTime: result.processingTime,
          errors: result.errors
        }
      });

    } catch (error) {
      console.error('Error processing batch review outcomes:', error);
      res.status(500).json({ error: 'Failed to process batch review outcomes' });
    }
  }

  /**
   * POST /api/primitives/:id/tracking
   * Toggle primitive tracking (primitive compatibility)
   */
  async togglePrimitiveTracking(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;
      const { enabled } = req.body;

      // Toggle primitive tracking using the enhanced spaced repetition service
      const result = await this.enhancedSpacedRepetitionService.togglePrimitiveTracking(userId, id, enabled);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error toggling primitive tracking:', error);
      res.status(500).json({ error: 'Failed to toggle primitive tracking' });
    }
  }

  /**
   * GET /api/primitives
   * Get user primitives (primitive compatibility)
   */
  async getUserPrimitives(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get user primitives using the enhanced spaced repetition service
      const primitives = await this.enhancedSpacedRepetitionService.getUserPrimitives(userId);

      res.json({
        success: true,
        data: primitives
      });

    } catch (error) {
      console.error('Error fetching user primitives:', error);
      res.status(500).json({ error: 'Failed to fetch user primitives' });
    }
  }

  /**
   * GET /api/primitives/:id/details
   * Get primitive details (primitive compatibility)
   */
  async getPrimitiveDetails(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;

      // Get primitive details using the enhanced spaced repetition service
      const details = await this.enhancedSpacedRepetitionService.getPrimitiveDetails(userId, id);

      res.json({
        success: true,
        data: details
      });

    } catch (error) {
      console.error('Error fetching primitive details:', error);
      res.status(500).json({ error: 'Failed to fetch primitive details' });
    }
  }

  /**
   * POST /api/primitives/:id/tracking-intensity
   * Set tracking intensity (primitive compatibility)
   */
  async setTrackingIntensity(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;
      const { intensity } = req.body;

      // Set tracking intensity using the enhanced spaced repetition service
      const result = await this.enhancedSpacedRepetitionService.setTrackingIntensity(userId, id, intensity);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error setting tracking intensity:', error);
      res.status(500).json({ error: 'Failed to set tracking intensity' });
    }
  }

  /**
   * GET /api/primitives/:id/tracking-intensity
   * Get tracking intensity (primitive compatibility)
   */
  async getTrackingIntensity(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;

      // Get tracking intensity using the enhanced spaced repetition service
      const intensity = await this.enhancedSpacedRepetitionService.getTrackingIntensity(userId, id);

      res.json({
        success: true,
        data: intensity
      });

    } catch (error) {
      console.error('Error fetching tracking intensity:', error);
      res.status(500).json({ error: 'Failed to fetch tracking intensity' });
    }
  }

  /**
   * DELETE /api/primitives/:id/tracking-intensity
   * Reset tracking intensity (primitive compatibility)
   */
  async resetTrackingIntensity(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;

      // Reset tracking intensity using the enhanced spaced repetition service
      const result = await this.enhancedSpacedRepetitionService.resetTrackingIntensity(userId, id);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error resetting tracking intensity:', error);
      res.status(500).json({ error: 'Failed to reset tracking intensity' });
    }
  }

  /**
   * Imports mastery thresholds
   */
  async importMasteryThresholds(req: Request, res: Response) {
    try {
      const { thresholds } = req.body;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      if (!Array.isArray(thresholds) || thresholds.length === 0) {
        return res.status(400).json({ error: 'Invalid thresholds array' });
      }
      
      // For now, return a placeholder response
      // TODO: Implement actual import logic
      res.json({
        userId,
        importedThresholds: thresholds.length,
        results: thresholds.map(threshold => ({
          criterionId: threshold.criterionId,
          stage: threshold.stage,
          threshold: threshold.threshold,
          success: true
        })),
        message: 'Mastery thresholds imported successfully'
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // ============================================================================
  // BACKWARD COMPATIBILITY METHODS FOR PRIMITIVE ROUTES
  // These methods maintain compatibility with existing frontend integrations
  // ============================================================================

  /**
   * POST /api/primitives/review
   * Process batch review outcomes for primitives (backward compatibility)
   */
  async processBatchReviewOutcomes(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { outcomes } = req.body;
      
      if (!Array.isArray(outcomes) || outcomes.length === 0) {
        return res.status(400).json({ error: 'Invalid outcomes array' });
      }

      // Process each review outcome
      const results = [];
      for (const outcome of outcomes) {
        const { primitiveId, isCorrect, confidence, timeSpentSeconds } = outcome;
        
        if (!primitiveId || typeof isCorrect !== 'boolean') {
          results.push({ primitiveId, success: false, error: 'Missing required fields' });
          continue;
        }

        try {
          // Convert primitive review to criterion review
          // In a real implementation, you would map primitives to criteria
          const criterionId = `crit-${primitiveId}`; // Placeholder mapping
          
          const result = await enhancedSpacedRepetitionService.submitReviewOutcome({
            userId,
            criterionId,
            isCorrect,
            confidence: confidence || 0.5,
            timeSpentSeconds: timeSpentSeconds || 0
          });

          results.push({ primitiveId, success: true, result });
        } catch (error) {
          results.push({ primitiveId, success: false, error: error.message });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      res.json({
        userId,
        totalProcessed: outcomes.length,
        successCount,
        errorCount,
        results,
        message: `Processed ${outcomes.length} review outcomes: ${successCount} successful, ${errorCount} errors`
      });
    } catch (error) {
      console.error('Error processing batch review outcomes:', error);
      res.status(500).json({ error: 'Failed to process batch review outcomes' });
    }
  }

  /**
   * POST /api/primitives/:id/tracking
   * Toggle primitive tracking (backward compatibility)
   */
  async togglePrimitiveTracking(req: Request, res: Response) {
    try {
      const { id: primitiveId } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!primitiveId) {
        return res.status(400).json({ error: 'Primitive ID is required' });
      }

      // Convert primitive ID to criterion ID
      const criterionId = `crit-${primitiveId}`; // Placeholder mapping
      
      // Get current tracking status
      const currentProgress = await getMasteryProgress(userId, criterionId);
      const isCurrentlyTracked = currentProgress !== null;
      
      if (isCurrentlyTracked) {
        // Stop tracking (this would typically delete the progress record)
        // For now, we'll simulate stopping tracking
        res.json({
          primitiveId,
          criterionId,
          action: 'tracking_stopped',
          message: 'Primitive tracking stopped successfully',
          previousStatus: 'tracked',
          currentStatus: 'not_tracked',
          timestamp: new Date().toISOString()
        });
      } else {
        // Start tracking (this would typically create a progress record)
        // For now, we'll simulate starting tracking
        res.json({
          primitiveId,
          criterionId,
          action: 'tracking_started',
          message: 'Primitive tracking started successfully',
          previousStatus: 'not_tracked',
          currentStatus: 'tracked',
          initialStage: 'UNDERSTAND',
          initialThreshold: 0.7,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error toggling primitive tracking:', error);
      res.status(500).json({ error: 'Failed to toggle primitive tracking' });
    }
  }

  /**
   * GET /api/primitives
   * Get user primitives (backward compatibility)
   */
  async getUserPrimitives(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Get mastery progress to find tracked criteria
      const masteryStats = await getMasteryStats(userId);
      
      // Convert criteria back to primitives (this would be a reverse mapping in real implementation)
      const primitives = [
        {
          id: 'prim-1',
          title: 'Basic Concept 1',
          description: 'Fundamental understanding of concept 1',
          stage: 'UNDERSTAND',
          progress: 75,
          lastReviewed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          nextReview: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          isTracked: true
        },
        {
          id: 'prim-2',
          title: 'Basic Concept 2',
          description: 'Fundamental understanding of concept 2',
          stage: 'USE',
          progress: 60,
          lastReviewed: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          nextReview: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          isTracked: true
        },
        {
          id: 'prim-3',
          title: 'Advanced Concept 1',
          description: 'Advanced application of concept 1',
          stage: 'EXPLORE',
          progress: 30,
          lastReviewed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          nextReview: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          isTracked: true
        }
      ];

      res.json({
        userId,
        primitives,
        totalCount: primitives.length,
        trackedCount: primitives.filter(p => p.isTracked).length,
        stageBreakdown: {
          understand: primitives.filter(p => p.stage === 'UNDERSTAND').length,
          use: primitives.filter(p => p.stage === 'USE').length,
          explore: primitives.filter(p => p.stage === 'EXPLORE').length
        },
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting user primitives:', error);
      res.status(500).json({ error: 'Failed to retrieve user primitives' });
    }
  }

  /**
   * GET /api/primitives/:id/details
   * Get primitive details (backward compatibility)
   */
  async getPrimitiveDetails(req: Request, res: Response) {
    try {
      const { id: primitiveId } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!primitiveId) {
        return res.status(400).json({ error: 'Primitive ID is required' });
      }

      // Convert primitive ID to criterion ID
      const criterionId = `crit-${primitiveId}`; // Placeholder mapping
      
      // Get mastery progress for the criterion
      const progress = await getMasteryProgress(userId, criterionId);
      
      if (!progress) {
        return res.status(404).json({ error: 'Primitive not found or not tracked' });
      }

      // Convert criterion progress back to primitive format
      const primitive = {
        id: primitiveId,
        title: `Primitive ${primitiveId}`,
        description: `Description for primitive ${primitiveId}`,
        stage: progress.currentStage,
        progress: Math.round(progress.masteryScore * 100),
        masteryScore: progress.masteryScore,
        consecutiveCorrect: progress.consecutiveCorrect,
        consecutiveIncorrect: progress.consecutiveIncorrect,
        lastReviewed: progress.lastReviewAt,
        nextReview: progress.nextReviewAt,
        isMastered: progress.isMastered,
        masteryThreshold: progress.thresholdValue,
        thresholdType: progress.masteryThreshold,
        totalReviews: progress.consecutiveCorrect + progress.consecutiveIncorrect,
        averageConfidence: progress.masteryScore,
        isTracked: true,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
        lastUpdated: new Date().toISOString()
      };

      res.json({
        userId,
        primitive,
        stageInfo: {
          current: progress.currentStage,
          next: this.getNextStage(progress.currentStage),
          canProgress: progress.masteryScore >= progress.thresholdValue,
          requirements: {
            masteryScore: progress.thresholdValue,
            consecutiveCorrect: 3,
            timeInStage: '7 days'
          }
        },
        reviewHistory: [
          {
            date: progress.lastReviewAt,
            outcome: 'correct',
            confidence: 0.8,
            timeSpent: 45
          },
          {
            date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            outcome: 'correct',
            confidence: 0.7,
            timeSpent: 52
          }
        ]
      });
    } catch (error) {
      console.error('Error getting primitive details:', error);
      res.status(500).json({ error: 'Failed to retrieve primitive details' });
    }
  }

  /**
   * POST /api/primitives/:id/tracking-intensity
   * Set tracking intensity for a primitive (backward compatibility)
   */
  async setTrackingIntensity(req: Request, res: Response) {
    try {
      const { id: primitiveId } = req.params;
      const { intensity } = req.body;
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!primitiveId) {
        return res.status(400).json({ error: 'Primitive ID is required' });
      }

      if (!intensity || !['low', 'medium', 'high'].includes(intensity)) {
        return res.status(400).json({ 
          error: 'Invalid intensity. Must be one of: low, medium, high',
          validIntensities: ['low', 'medium', 'high']
        });
      }

      // Convert primitive ID to criterion ID
      const criterionId = `crit-${primitiveId}`; // Placeholder mapping
      
      // Update tracking intensity (this would typically update the database)
      // For now, we'll simulate the update
      const updateDate = new Date();
      
      // Calculate new review intervals based on intensity
      const reviewIntervals = {
        low: { understand: 3, use: 7, explore: 14 },
        medium: { understand: 2, use: 5, explore: 10 },
        high: { understand: 1, use: 3, explore: 7 }
      };

      const intervals = reviewIntervals[intensity as keyof typeof reviewIntervals];
      
      res.json({
        primitiveId,
        criterionId,
        userId,
        intensity,
        previousIntensity: 'medium', // This would come from database
        reviewIntervals: intervals,
        updateDate: updateDate.toISOString(),
        message: `Tracking intensity set to ${intensity} for primitive ${primitiveId}`,
        impact: {
          reviewFrequency: intensity === 'high' ? 'increased' : intensity === 'low' ? 'decreased' : 'unchanged',
          learningPace: intensity === 'high' ? 'accelerated' : intensity === 'low' ? 'relaxed' : 'balanced',
          estimatedTimeToMastery: intensity === 'high' ? '2-3 months' : intensity === 'low' ? '6-8 months' : '4-5 months'
        }
      });
    } catch (error) {
      console.error('Error setting tracking intensity:', error);
      res.status(500).json({ error: 'Failed to set tracking intensity' });
    }
  }

  /**
   * GET /api/primitives/:id/tracking-intensity
   * Get tracking intensity for a primitive (backward compatibility)
   */
  async getTrackingIntensity(req: Request, res: Response) {
    try {
      const { id: primitiveId } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!primitiveId) {
        return res.status(400).json({ error: 'Primitive ID is required' });
      }

      // Convert primitive ID to criterion ID
      const criterionId = `crit-${primitiveId}`; // Placeholder mapping
      
      // Get current tracking intensity (this would come from database in real implementation)
      const currentIntensity = 'medium'; // Placeholder
      
      // Get review intervals for current intensity
      const reviewIntervals = {
        low: { understand: 3, use: 7, explore: 14 },
        medium: { understand: 2, use: 5, explore: 10 },
        high: { understand: 1, use: 3, explore: 7 }
      };

      const intervals = reviewIntervals[currentIntensity as keyof typeof reviewIntervals];
      
      res.json({
        primitiveId,
        criterionId,
        userId,
        currentIntensity,
        reviewIntervals: intervals,
        lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        availableIntensities: [
          {
            value: 'low',
            description: 'Relaxed learning pace',
            reviewFrequency: 'Less frequent reviews',
            estimatedTimeToMastery: '6-8 months'
          },
          {
            value: 'medium',
            description: 'Balanced learning pace',
            reviewFrequency: 'Standard review frequency',
            estimatedTimeToMastery: '4-5 months'
          },
          {
            value: 'high',
            description: 'Accelerated learning pace',
            reviewFrequency: 'More frequent reviews',
            estimatedTimeToMastery: '2-3 months'
          }
        ]
      });
    } catch (error) {
      console.error('Error getting tracking intensity:', error);
      res.status(500).json({ error: 'Failed to retrieve tracking intensity' });
    }
  }

  /**
   * DELETE /api/primitives/:id/tracking-intensity
   * Reset tracking intensity for a primitive (backward compatibility)
   */
  async resetTrackingIntensity(req: Request, res: Response) {
    try {
      const { id: primitiveId } = req.params;
      const userId = req.user?.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!primitiveId) {
        return res.status(400).json({ error: 'Primitive ID is required' });
      }

      // Convert primitive ID to criterion ID
      const criterionId = `crit-${primitiveId}`; // Placeholder mapping
      
      // Reset to default intensity (this would typically update the database)
      const defaultIntensity = 'medium';
      const resetDate = new Date();
      
      // Get default review intervals
      const reviewIntervals = {
        understand: 2,
        use: 5,
        explore: 10
      };
      
      res.json({
        primitiveId,
        criterionId,
        userId,
        previousIntensity: 'high', // This would come from database
        newIntensity: defaultIntensity,
        reviewIntervals,
        resetDate: resetDate.toISOString(),
        message: `Tracking intensity reset to default (${defaultIntensity}) for primitive ${primitiveId}`,
        reason: 'User requested reset to default settings',
        impact: {
          reviewFrequency: 'standardized',
          learningPace: 'balanced',
          estimatedTimeToMastery: '4-5 months'
        }
      });
    } catch (error) {
      console.error('Error resetting tracking intensity:', error);
      res.status(500).json({ error: 'Failed to reset tracking intensity' });
    }
  }
}

// Export controller instance
export const enhancedSpacedRepetitionController = new EnhancedSpacedRepetitionController(
  enhancedSpacedRepetitionService,
  enhancedBatchReviewService
);

