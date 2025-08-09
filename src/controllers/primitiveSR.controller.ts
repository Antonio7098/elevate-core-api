import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as primitiveSRService from '../services/primitiveSR.service';
import { cachedPrimitiveService, processReviewOutcomeWithCache, processBatchReviewOutcomesWithCache, progressToNextUeeLevelWithCache } from '../services/cachedPrimitiveSR.service';
import { onReviewSubmitted } from '../services/summaryMaintenance.service';
import { batchReviewProcessingService } from '../services/batchReviewProcessing.service';

const prisma = new PrismaClient();

// GET /api/primitive-sr/daily-tasks
export async function getDailyTasks(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const tasks = await cachedPrimitiveService.getDailyTasks(userId);
    
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

    // Get cached summaries
    const summaries = await cachedPrimitiveService.getDailySummary(userId);

    res.json({
      success: true,
      data: {
        summaries,
        stats: {
          total: summaries.length,
          critical: summaries.filter(s => s.weightedMasteryScore < 0.4).length,
          core: summaries.filter(s => s.weightedMasteryScore >= 0.4 && s.weightedMasteryScore < 0.8).length,
          plus: summaries.filter(s => s.weightedMasteryScore >= 0.8).length,
          canProgress: summaries.filter(s => s.canProgressToNext).length
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

    const { primitiveId, blueprintId, isCorrect } = req.body;

    if (!primitiveId || blueprintId === undefined || isCorrect === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: primitiveId, blueprintId, isCorrect' 
      });
    }

    const result = await processReviewOutcomeWithCache(
      userId,
      primitiveId,
      blueprintId,
      isCorrect
    );

    // Trigger summary update
    await onReviewSubmitted(userId, primitiveId);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error processing review outcome:', error);
    res.status(500).json({ error: 'Failed to process review outcome' });
  }
}

// POST /api/primitive-sr/batch-review-outcomes
export async function submitBatchReviewOutcomes(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { outcomes } = req.body;

    if (!Array.isArray(outcomes) || outcomes.length === 0) {
      return res.status(400).json({ 
        error: 'outcomes must be a non-empty array' 
      });
    }

    // Use optimized batch processing
    const results = await batchReviewProcessingService.processBatchWithOptimization(userId, outcomes);

    // Trigger summary updates for all affected primitives
    const uniquePrimitives = [...new Set(outcomes.map(o => o.primitiveId))];
    for (const primitiveId of uniquePrimitives) {
      await onReviewSubmitted(userId, primitiveId);
    }

    // Log performance metrics
    console.log(`Batch processing completed: ${results.successful}/${results.totalProcessed} successful in ${results.processingTimeMs}ms`);

    res.json({
      success: true,
      data: {
        ...results,
        performanceMetrics: {
          avgTimePerOutcome: results.processingTimeMs / results.totalProcessed,
          successRate: (results.successful / results.totalProcessed) * 100,
          throughput: results.totalProcessed / (results.processingTimeMs / 1000) // outcomes per second
        }
      }
    });
  } catch (error) {
    console.error('Error processing batch review outcomes:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process batch review outcomes',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Additional Tasks Algorithm endpoint
export const getAdditionalTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { completion } = req.body;
    
    if (!completion || !completion.critical || !completion.core || !completion.plus) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid completion data. Expected critical, core, and plus completion stats.' 
      });
    }

    // Get user preferences
    const preferences = await prisma.userBucketPreferences.findUnique({
      where: { userId }
    });

    if (!preferences) {
      return res.status(404).json({ 
        success: false, 
        error: 'User bucket preferences not found' 
      });
    }

    const startTime = Date.now();
    
    // Get additional tasks using the algorithm
    const result = await primitiveSRService.getAdditionalTasks(
      userId,
      {
        maxDailyLimit: preferences.maxDailyLimit,
        addMoreIncrements: preferences.addMoreIncrement // Correct field name
      },
      completion
    );

    const processingTime = Date.now() - startTime;

    // Trigger cache invalidation for daily tasks
    await cachedPrimitiveService.invalidateDailyTasksCache(userId);

    res.json({
      success: true,
      data: result,
      meta: {
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
        algorithm: 'Additional Tasks v1.0'
      }
    });

  } catch (error) {
    console.error('Error getting additional tasks:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get additional tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/primitive-sr/progression/:primitiveId/:blueprintId
export async function checkProgression(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { primitiveId, blueprintId } = req.params;

    const progression = await primitiveSRService.checkUeeProgression(
      userId,
      primitiveId,
      parseInt(blueprintId)
    );

    res.json({
      success: true,
      data: progression
    });
  } catch (error) {
    console.error('Error checking progression:', error);
    res.status(500).json({ error: 'Failed to check progression' });
  }
}

// POST /api/primitive-sr/progress/:primitiveId/:blueprintId
export async function progressToNextLevel(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { primitiveId, blueprintId } = req.params;

    const result = await progressToNextUeeLevelWithCache(
      userId,
      primitiveId,
      parseInt(blueprintId)
    );

    // Trigger summary update if progression was successful
    if (result.success) {
      await onReviewSubmitted(userId, primitiveId);
    }

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: {
        newLevel: result.newLevel,
        message: `Successfully progressed to ${result.newLevel} level`
      }
    });
  } catch (error) {
    console.error('Error progressing to next level:', error);
    res.status(500).json({ error: 'Failed to progress to next level' });
  }
}

// POST /api/primitive-sr/pin-review/:primitiveId
export async function pinReview(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { primitiveId } = req.params;
    const { pinDate } = req.body;

    if (!pinDate) {
      return res.status(400).json({ error: 'pinDate is required' });
    }

    const result = await primitiveSRService.pinReview(
      userId,
      primitiveId,
      new Date(pinDate)
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error pinning review:', error);
    res.status(500).json({ error: 'Failed to pin review' });
  }
}

// DELETE /api/primitive-sr/pin-review/:primitiveId
export async function unpinReview(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { primitiveId } = req.params;

    const result = await primitiveSRService.unpinReview(userId, primitiveId);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message
      });
    }

    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error unpinning review:', error);
    res.status(500).json({ error: 'Failed to unpin review' });
  }
}

// GET /api/primitive-sr/pinned-reviews
export async function getPinnedReviews(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const pinnedReviews = await primitiveSRService.getPinnedReviews(userId);

    res.json({
      success: true,
      data: pinnedReviews
    });
  } catch (error) {
    console.error('Error fetching pinned reviews:', error);
    res.status(500).json({ error: 'Failed to fetch pinned reviews' });
  }
}
