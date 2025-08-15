import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EnhancedSpacedRepetitionService } from '../services/enhancedSpacedRepetition.service';
import { EnhancedBatchReviewService } from '../services/enhancedBatchReview.service';
import { onReviewSubmitted } from '../services/summaryMaintenance.service';

const prisma = new PrismaClient();
const enhancedSpacedRepetitionService = new EnhancedSpacedRepetitionService();
const enhancedBatchReviewService = new EnhancedBatchReviewService();

// GET /api/primitive-sr/daily-tasks
export async function getDailyTasks(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get due criteria using the new enhanced service
    const dueCriteria = await enhancedSpacedRepetitionService.getDueCriteria(userId);
    
    // Transform criteria to match expected response format
    const tasks = dueCriteria.map(criterion => ({
      id: criterion.id,
      title: criterion.description,
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

// GET /api/primitive-sr/daily-summary
export async function getDailySummary(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get mastery stats using the new enhanced service
    const masteryStats = await enhancedSpacedRepetitionService.getMasteryStats(userId);

    res.json({
      success: true,
      data: {
        summaries: [], // Will be populated with actual criterion summaries
        stats: {
          total: masteryStats.totalCriteria,
          critical: masteryStats.overdueCriteria,
          core: masteryStats.dueCriteria,
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

// POST /api/primitive-sr/review-outcome
export async function submitReviewOutcome(req: Request, res: Response) {
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

    // Process review outcome using the new enhanced service
    const result = await enhancedSpacedRepetitionService.processReviewOutcome({
      userId,
      criterionId,
      isCorrect,
      reviewDate: new Date(),
      timeSpentSeconds,
      confidence
    });

    // Trigger summary update (keeping existing functionality)
    // await onReviewSubmitted(userId, criterionId);

    res.json({
      success: true,
      data: {
        message: 'Review outcome processed successfully',
        criterionId,
        isCorrect,
        nextReviewAt: result.nextReviewAt,
        masteryUpdated: true
      }
    });
  } catch (error) {
    console.error('Error processing review outcome:', error);
    res.status(500).json({ error: 'Failed to process review outcome' });
  }
}

// POST /api/primitive-sr/batch-review
export async function submitBatchReviewOutcomes(req: Request, res: Response) {
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

    // Process batch using the new enhanced service
    const result = await enhancedBatchReviewService.processBatchWithOptimization(
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

// GET /api/primitive-sr/mastery-progress/:criterionId
export async function getMasteryProgress(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { criterionId } = req.params;

    if (!criterionId) {
      return res.status(400).json({ error: 'Missing criterionId parameter' });
    }

    // Get mastery progress using the new enhanced service
    const progress = await enhancedSpacedRepetitionService.getMasteryProgress(userId, criterionId);

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

// PUT /api/primitive-sr/tracking-intensity/:criterionId
export async function updateTrackingIntensity(req: Request, res: Response) {
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

    // Update tracking intensity using the new enhanced service
    await enhancedSpacedRepetitionService.updateTrackingIntensity(userId, criterionId, intensity);

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

// GET /api/primitive-sr/mastery-stats
export async function getMasteryStats(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get mastery stats using the new enhanced service
    const stats = await enhancedSpacedRepetitionService.getMasteryStats(userId);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching mastery stats:', error);
    res.status(500).json({ error: 'Failed to fetch mastery stats' });
  }
}
