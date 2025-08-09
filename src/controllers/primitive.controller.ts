import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import * as primitiveSRService from '../services/primitiveSR.service';
import { cachedPrimitiveService } from '../services/cachedPrimitiveSR.service';

import sharedPrisma from '../lib/prisma';

// Allow prisma to be reassigned for testing
let prisma = sharedPrisma;

// Function to set prisma client for testing
export function setPrismaClient(client: PrismaClient) {
  prisma = client;
}

// Reset to default prisma client
export function resetPrismaClient() {
  prisma = sharedPrisma;
}

// Interface for primitive details response
interface PrimitiveDetailsResponse {
  id: number;
  title: string;
  description: string;
  primitiveType: string;
  difficultyLevel: string;
  estimatedTimeMinutes: number;
  trackingIntensity: string;
  currentUeeLevel: string;
  nextReviewAt: Date | null;
  lastReviewedAt: Date | null;
  reviewCount: number;
  successfulReviews: number;
  criteria: Array<{
    id: string;
    description: string;
    ueeLevel: string;
    weight: number;
    isMastered: boolean;
    attemptCount: number;
    successfulAttempts: number;
    lastAttemptedAt: Date | null;
    masteredAt: Date | null;
  }>;
  weightedMasteryScore: number;
  canProgressToNext: boolean;
}

// POST /api/primitives/review - Submit review outcomes for multiple primitives
export const submitReview = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { outcomes } = req.body;

    if (!outcomes || !Array.isArray(outcomes) || outcomes.length === 0) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid request. Expected array of review outcomes.' 
      });
      return;
    }

    // Validate outcome structure
    for (const outcome of outcomes) {
      if (!outcome.primitiveId || !outcome.blueprintId || typeof outcome.isCorrect !== 'boolean') {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid outcome structure. Required: primitiveId, blueprintId, isCorrect' 
        });
        return;
      }
    }

    const startTime = Date.now();

    // Process review outcomes using the primitive SR service
    const results = await primitiveSRService.processBatchReviewOutcomes(userId, outcomes);
    
    // Invalidate the user's cache
    cachedPrimitiveService.invalidateUserCache(userId);
    
    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      data: {
        message: `Processed ${results.length} review outcomes`,
        totalProcessed: results.length,
        outcomes: results
      }
    });

  } catch (error) {
    console.error('Error processing primitive review:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process review outcomes',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// POST /api/primitives/:id/tracking - Toggle tracking status for a primitive
export const toggleTracking = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { id: primitiveId } = req.params;
    const { isTracking } = req.body;

    if (typeof isTracking !== 'boolean') {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid request. Expected boolean isTracking field.' 
      });
      return;
    }

    // Find the user's progress record for this primitive
    const progress = await prisma.userPrimitiveProgress.findFirst({
      where: {
        userId,
        primitiveId
      }
    });

    if (!progress) {
      res.status(404).json({ 
        success: false, 
        error: 'Primitive progress not found for user' 
      });
      return;
    }

    // Toggle tracking by setting/clearing nextReviewAt
    const isCurrentlyTracking = progress.nextReviewAt !== null;
    const newTrackingStatus = isTracking;
    
    await prisma.userPrimitiveProgress.update({
      where: {
        id: progress.id
      },
      data: {
        nextReviewAt: newTrackingStatus ? new Date() : null,
        updatedAt: new Date()
      }
    });

    // Invalidate caches
    cachedPrimitiveService.invalidateUserCache(userId);

    res.json({
      success: true,
      data: {
        primitiveId,
        isTracking: newTrackingStatus,
        message: `Tracking ${newTrackingStatus ? 'enabled' : 'disabled'} for primitive`
      }
    });

  } catch (error) {
    console.error('Error toggling primitive tracking:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update tracking status',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/primitives - List all primitives for a user
export const listPrimitives = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const { page = 1, limit = 50, trackingStatus, masteryLevel } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause for filtering
    const whereClause: any = {
      userPrimitiveProgresses: {
        some: {
          userId
        }
      }
    };

    // Apply tracking filter if specified
    if (trackingStatus) {
      if (trackingStatus === 'TRACKED') {
        whereClause.userPrimitiveProgresses.some.nextReviewAt = {
          not: null
        };
      } else if (trackingStatus === 'UNTRACKED') {
        whereClause.userPrimitiveProgresses.some.nextReviewAt = null;
      }
    }

    // Apply mastery filter if specified
    if (masteryLevel) {
      whereClause.masteryCriteria = {
        some: {
          userCriterionMasteries: {
            some: {
              userId,
              masteryLevel
            }
          }
        }
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.knowledgePrimitive.count({
      where: whereClause
    });

    // Fetch primitives with related data
    const primitives = await prisma.knowledgePrimitive.findMany({
      where: whereClause,
      include: {
        userPrimitiveProgresses: {
          where: { userId },
        },
        masteryCriteria: {
          include: {
            userCriterionMasteries: {
              where: { userId }
            }
          }
        }
      },
      skip,
      take: limitNum,
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    const responsePrimitives = primitives.map(p => {
      const progress = p.userPrimitiveProgresses?.[0] as any;
      return {
        id: p.id,
        primitiveId: p.primitiveId,
        title: p.title,
        description: p.description,
        primitiveType: p.primitiveType,
        difficultyLevel: p.difficultyLevel,
        isTracking: progress?.nextReviewAt !== null,
        masteryLevel: progress?.masteryLevel ?? 'UNSEEN',
        nextReviewAt: progress?.nextReviewAt,
      };
    });

    res.json({
      success: true,
      data: {
        primitives: responsePrimitives,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCount,
          pages: Math.ceil(totalCount / limitNum)
        }
      }
    });

  } catch (error) {
    console.error('Error listing primitives:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve primitives',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/primitives/:id/details - Get detailed information for a specific primitive
export const getPrimitiveDetails = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const primitiveId = req.params.id;

    // Fetch the primitive with related data
    const primitive = await prisma.knowledgePrimitive.findUnique({
      where: { primitiveId },
      include: {
        userPrimitiveProgresses: { 
          where: { userId } 
        },
        masteryCriteria: { 
          include: { 
            userCriterionMasteries: { 
              where: { userId } 
            } 
          } 
        }
      }
    });

    if (!primitive) {
      res.status(404).json({ 
        success: false, 
        error: 'Primitive not found or not accessible to user' 
      });
      return;
    }

    const progress = primitive.userPrimitiveProgresses?.[0];
    
    // Calculate weighted mastery
    const totalWeight = primitive.masteryCriteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    const masteredWeight = primitive.masteryCriteria.reduce((sum, criterion) => {
      const mastery = criterion.userCriterionMasteries.find(m => m.userId === userId);
      return sum + (mastery?.isMastered ? criterion.weight : 0);
    }, 0);
    
    const weightedMasteryScore = totalWeight > 0 ? masteredWeight / totalWeight : 0;

    // Check if can progress to next level
    const canProgressToNext = await primitiveSRService.checkUeeProgression(
      userId, 
      primitiveId, 
      progress?.blueprintId || 0
    );

    // Transform criteria data
    const criteria = primitive.masteryCriteria.map(criterion => {
      const mastery = criterion.userCriterionMasteries.find(m => m.userId === userId);
      
      return {
        id: criterion.criterionId,
        description: criterion.title,
        ueeLevel: criterion.ueeLevel,
        weight: criterion.weight,
        isMastered: mastery?.isMastered || false,
        attemptCount: mastery?.attemptCount || 0,
        successfulAttempts: mastery?.successfulAttempts || 0,
        lastAttemptedAt: mastery?.lastAttemptedAt,
        masteredAt: mastery?.masteredAt
      };
    });

    const response: PrimitiveDetailsResponse = {
      id: primitive.id,
      title: primitive.title,
      description: primitive.description,
      primitiveType: primitive.primitiveType,
      difficultyLevel: primitive.difficultyLevel,
      estimatedTimeMinutes: primitive.estimatedTimeMinutes,
      trackingIntensity: progress?.trackingIntensity || 'NORMAL',
      currentUeeLevel: progress?.masteryLevel || 'SURVEY',
      nextReviewAt: progress?.nextReviewAt || null,
      lastReviewedAt: progress?.lastReviewedAt || null,
      reviewCount: progress?.reviewCount || 0,
      successfulReviews: progress?.successfulReviews || 0,
      criteria,
      weightedMasteryScore,
      canProgressToNext: canProgressToNext.canProgress
    };

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error getting primitive details:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve primitive details',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// POST /api/primitives/:id/tracking-intensity - Set tracking intensity for a primitive
export const setTrackingIntensity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const primitiveId = req.params.id;
    const { intensity } = req.body;

    // Validate intensity value
    if (!['LOW', 'NORMAL', 'HIGH', 'DENSE'].includes(intensity)) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid intensity value. Must be LOW, NORMAL, or HIGH.' 
      });
      return;
    }

    // Find the user's progress record for this primitive
    const progress = await prisma.userPrimitiveProgress.findFirst({
      where: {
        userId,
        primitiveId
      }
    });

    if (!progress) {
      res.status(404).json({ 
        success: false, 
        error: 'Primitive progress not found for user' 
      });
      return;
    }

    // Update the tracking intensity
    await prisma.userPrimitiveProgress.update({
      where: {
        id: progress.id
      },
      data: {
        trackingIntensity: intensity,
        updatedAt: new Date()
      }
    });

    // Invalidate caches
    cachedPrimitiveService.invalidateUserCache(userId);

    res.json({
      success: true,
      data: {
        primitiveId,
        intensity,
        message: `Tracking intensity updated to ${intensity}`
      }
    });

  } catch (error) {
    console.error('Error setting tracking intensity:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update tracking intensity',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// GET /api/primitives/:id/tracking-intensity - Get tracking intensity for a primitive
export const getTrackingIntensity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const primitiveId = req.params.id;

    // Find the user's progress record for this primitive
    const progress = await prisma.userPrimitiveProgress.findFirst({
      where: {
        userId,
        primitiveId
      },
      select: {
        trackingIntensity: true
      }
    });

    if (!progress) {
      res.status(404).json({ 
        success: false, 
        error: 'Primitive progress not found for user' 
      });
      return;
    }

    res.json({
      success: true,
      data: {
        primitiveId,
        intensity: progress.trackingIntensity
      }
    });

  } catch (error) {
    console.error('Error getting tracking intensity:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve tracking intensity',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// DELETE /api/primitives/:id/tracking-intensity - Reset tracking intensity to default
export const deleteTrackingIntensity = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'User not authenticated' });
      return;
    }

    const primitiveId = req.params.id;

    // Find the user's progress record for this primitive
    const progress = await prisma.userPrimitiveProgress.findFirst({
      where: {
        userId,
        primitiveId
      }
    });

    if (!progress) {
      res.status(404).json({ 
        success: false, 
        error: 'Primitive progress not found for user' 
      });
      return;
    }

    // Reset tracking intensity to default (NORMAL)
    await prisma.userPrimitiveProgress.update({
      where: {
        id: progress.id
      },
      data: {
        trackingIntensity: 'NORMAL',
        updatedAt: new Date()
      }
    });

    // Invalidate caches
    cachedPrimitiveService.invalidateUserCache(userId);

    res.json({
      success: true,
      data: {
        primitiveId,
        intensity: 'NORMAL',
        message: 'Tracking intensity reset to NORMAL'
      }
    });

  } catch (error) {
    console.error('Error resetting tracking intensity:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to reset tracking intensity',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
