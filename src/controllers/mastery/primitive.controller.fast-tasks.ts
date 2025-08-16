import { Request, Response } from 'express';
import { cachedPrimitiveService } from '../../services/mastery/cachedPrimitiveSR.service';

// GET /api/primitives/due - Fast daily tasks endpoint using cached denormalized data
export const getDailyTasksPrimitive = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const startTime = Date.now();

    // Use cached service for optimal performance with denormalized summary data
    const tasks = await cachedPrimitiveService.getDailyTasks(userId);
    
    // Transform to optimized response format
    const optimizedTasks = tasks.map(task => ({
      primitiveId: task.primitiveId,
      title: task.primitiveTitle,
      masteryLevel: task.masteryLevel,
      weightedMasteryScore: task.weightedMasteryScore,
      bucket: task.bucket,
      questionCount: task.questionCount,
      nextReviewAt: task.nextReviewAt,
      // Questions loaded separately for performance - only include count
      hasQuestions: task.questions && task.questions.length > 0
    }));

    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        tasks: optimizedTasks,
        totalTasks: optimizedTasks.length,
        bucketDistribution: {
          critical: optimizedTasks.filter(t => t.bucket === 'critical').length,
          core: optimizedTasks.filter(t => t.bucket === 'core').length,
          plus: optimizedTasks.filter(t => t.bucket === 'plus').length
        },
        performance: {
          processingTimeMs: Math.max(processingTime, 1), // Ensure at least 1ms for very fast operations
          cached: true,
          tasksPerSecond: processingTime > 0 ? optimizedTasks.length / (processingTime / 1000) : Math.max(optimizedTasks.length * 1000, 1)
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error getting daily tasks for primitives:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve daily tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
