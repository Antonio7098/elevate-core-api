import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  scheduleReview,
  getScheduledReviews,
  updateScheduledReview,
  cancelScheduledReview,
  getUpcomingReviews
} from '../services/reviewScheduling.service';

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
  };
}

const prisma = new PrismaClient();

/**
 * Schedule a new review
 * POST /api/reviews/schedule
 */
export const scheduleNewReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { questionSetId, reviewDate, type } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const scheduledReview = await scheduleReview(
      userId,
      questionSetId,
      reviewDate ? new Date(reviewDate) : undefined,
      type
    );

    res.status(201).json(scheduledReview);
  } catch (error) {
    console.error('Error scheduling review:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Get all scheduled reviews for a user
 * GET /api/reviews/scheduled
 */
export const getScheduledReviewsList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { status } = req.query;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const reviews = await getScheduledReviews(
      userId,
      status as 'PENDING' | 'COMPLETED' | undefined
    );

    res.json(reviews);
  } catch (error) {
    console.error('Error getting scheduled reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update a scheduled review
 * PUT /api/reviews/scheduled/:id
 */
export const updateScheduledReviewById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { reviewDate, status, type } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const updatedReview = await updateScheduledReview(
      userId,
      parseInt(id),
      {
        reviewDate: reviewDate ? new Date(reviewDate) : undefined,
        status,
        type
      }
    );

    res.json(updatedReview);
  } catch (error) {
    console.error('Error updating scheduled review:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Cancel a scheduled review
 * DELETE /api/reviews/scheduled/:id
 */
export const cancelScheduledReviewById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { id } = req.params;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const deletedReview = await cancelScheduledReview(userId, parseInt(id));
    res.json(deletedReview);
  } catch (error) {
    console.error('Error canceling scheduled review:', error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

/**
 * Get upcoming reviews for a user
 * GET /api/reviews/upcoming
 */
export const getUpcomingReviewsList = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { days } = req.query;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const reviews = await getUpcomingReviews(
      userId,
      days ? parseInt(days as string) : undefined
    );

    res.json(reviews);
  } catch (error) {
    console.error('Error getting upcoming reviews:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 