import { PrismaClient, ScheduledReview, QuestionSet } from '@prisma/client';
import { getNextReviewDate } from './advancedSpacedRepetition.service';

const prisma = new PrismaClient();

interface ReviewUpdateData {
  reviewDate?: Date;
  status?: 'PENDING' | 'COMPLETED';
  type?: 'AUTO' | 'MANUAL';
}

/**
 * Schedule a new review
 * @param userId User ID
 * @param questionSetId Question set ID
 * @param reviewDate Optional review date (defaults to next day)
 * @param type Review type (AUTO or MANUAL)
 * @returns Created scheduled review
 */
export const scheduleReview = async (
  userId: number,
  questionSetId: number,
  reviewDate?: Date,
  type: 'AUTO' | 'MANUAL' = 'MANUAL'
): Promise<ScheduledReview> => {
  // Verify the question set belongs to the user
  const questionSet = await prisma.questionSet.findFirst({
    where: {
      id: questionSetId,
      folder: {
        userId
      }
    }
  });

  if (!questionSet) {
    throw new Error('Question set not found or access denied');
  }

  // If no review date provided, default to next day
  const defaultReviewDate = new Date();
  defaultReviewDate.setDate(defaultReviewDate.getDate() + 1);
  defaultReviewDate.setHours(9, 0, 0, 0); // Set to 9 AM

  return prisma.scheduledReview.create({
    data: {
      userId,
      questionSetId,
      reviewDate: reviewDate || defaultReviewDate,
      type,
      status: 'PENDING'
    },
    include: {
      questionSet: {
        select: {
          id: true,
          name: true,
          currentTotalMasteryScore: true,
          srStage: true
        }
      }
    }
  });
};

/**
 * Get all scheduled reviews for a user
 * @param userId User ID
 * @param status Optional status filter
 * @returns Array of scheduled reviews
 */
export const getScheduledReviews = async (
  userId: number,
  status?: 'PENDING' | 'COMPLETED'
): Promise<ScheduledReview[]> => {
  const where = {
    userId,
    ...(status && { status })
  };

  return prisma.scheduledReview.findMany({
    where,
    include: {
      questionSet: {
        select: {
          id: true,
          name: true,
          currentTotalMasteryScore: true,
          srStage: true
        }
      }
    },
    orderBy: {
      reviewDate: 'asc'
    }
  });
};

/**
 * Update a scheduled review
 * @param userId User ID
 * @param reviewId Review ID
 * @param data Update data
 * @returns Updated scheduled review
 */
export const updateScheduledReview = async (
  userId: number,
  reviewId: number,
  data: ReviewUpdateData
): Promise<ScheduledReview> => {
  // Verify the review belongs to the user
  const existingReview = await prisma.scheduledReview.findFirst({
    where: {
      id: reviewId,
      userId
    }
  });

  if (!existingReview) {
    throw new Error('Review not found or access denied');
  }

  return prisma.scheduledReview.update({
    where: { id: reviewId },
    data,
    include: {
      questionSet: {
        select: {
          id: true,
          name: true,
          currentTotalMasteryScore: true,
          srStage: true
        }
      }
    }
  });
};

/**
 * Cancel a scheduled review
 * @param userId User ID
 * @param reviewId Review ID
 * @returns Deleted scheduled review
 */
export const cancelScheduledReview = async (
  userId: number,
  reviewId: number
): Promise<ScheduledReview> => {
  // Verify the review belongs to the user
  const existingReview = await prisma.scheduledReview.findFirst({
    where: {
      id: reviewId,
      userId
    }
  });

  if (!existingReview) {
    throw new Error('Review not found or access denied');
  }

  return prisma.scheduledReview.delete({
    where: { id: reviewId },
    include: {
      questionSet: {
        select: {
          id: true,
          name: true,
          currentTotalMasteryScore: true,
          srStage: true
        }
      }
    }
  });
};

/**
 * Get upcoming reviews for a user
 * @param userId User ID
 * @param days Number of days to look ahead (defaults to 7)
 * @returns Array of upcoming reviews
 */
export const getUpcomingReviews = async (
  userId: number,
  days: number = 7
): Promise<ScheduledReview[]> => {
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);

  return prisma.scheduledReview.findMany({
    where: {
      userId,
      status: 'PENDING',
      reviewDate: {
        gte: new Date(),
        lte: endDate
      }
    },
    include: {
      questionSet: {
        select: {
          id: true,
          name: true,
          currentTotalMasteryScore: true,
          srStage: true
        }
      }
    },
    orderBy: {
      reviewDate: 'asc'
    }
  });
};

/**
 * Process automatic review scheduling for a question set
 * @param questionSet Question set to schedule reviews for
 * @returns Created scheduled review
 */
export const processAutomaticScheduling = async (
  questionSet: QuestionSet
): Promise<ScheduledReview | null> => {
  // Only schedule if tracking mode is AUTO
  if (questionSet.trackingMode !== 'AUTO') {
    return null;
  }

  const nextReview = getNextReviewDate(questionSet);
  
  // Don't schedule if next review is in the past
  if (nextReview <= new Date()) {
    return null;
  }

  // Get the folder to find the user ID
  const folder = await prisma.folder.findUnique({
    where: { id: questionSet.folderId! }
  });

  if (!folder) {
    throw new Error('Folder not found for automatic scheduling');
  }

  return scheduleReview(
    folder.userId,
    questionSet.id,
    nextReview,
    'AUTO'
  );
}; 