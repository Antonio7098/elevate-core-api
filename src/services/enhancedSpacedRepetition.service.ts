import { PrismaClient } from '@prisma/client';
import { UserCriterionMastery, TrackingIntensity } from '@prisma/client';
import { masteryCriterionService } from './masteryCriterion.service';

const prisma = new PrismaClient();

export interface ReviewSchedule {
  nextReviewAt: Date;
  intervalStep: number;
  confidence: number;
  recommendedIntensity: TrackingIntensity;
}

export interface ReviewOutcome {
  success: boolean;
  newIntervalStep: number;
  nextReviewAt: Date;
  masteryProgress: number;
  message: string;
}

export class EnhancedSpacedRepetitionService {
  // Base intervals in days - simple progression
  private readonly baseIntervals = [1, 3, 7, 21, 60, 180];
  
  // Tracking intensity multipliers
  private readonly intensityMultipliers = {
    DENSE: 0.7,    // More frequent reviews
    NORMAL: 1.0,   // Standard intervals
    SPARSE: 1.5,   // Less frequent reviews
  };

  /**
   * Calculate next review interval with progressive failure handling
   */
  calculateNextReviewInterval(
    currentIntervalStep: number,
    isCorrect: boolean,
    trackingIntensity: TrackingIntensity,
    consecutiveFailures: number = 0
  ): ReviewSchedule {
    let newIntervalStep = currentIntervalStep;
    let confidence = 0.5;

    // Progressive failure handling
    if (isCorrect) {
      // Success: move up one step
      newIntervalStep = Math.min(currentIntervalStep + 1, this.baseIntervals.length - 1);
      confidence = Math.min(0.5 + (newIntervalStep * 0.1), 0.95);
    } else {
      // Failure: progressive step back
      if (consecutiveFailures === 0) {
        // First failure: go back one step
        newIntervalStep = Math.max(currentIntervalStep - 1, 0);
        confidence = Math.max(0.3, 0.5 - (consecutiveFailures * 0.1));
      } else {
        // Second consecutive failure: go back to start
        newIntervalStep = 0;
        confidence = 0.2;
      }
    }

    // Calculate actual interval with tracking intensity
    const baseInterval = this.baseIntervals[newIntervalStep];
    const multiplier = this.intensityMultipliers[trackingIntensity];
    const adjustedInterval = Math.round(baseInterval * multiplier);

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + adjustedInterval);

    // Recommend intensity adjustment based on performance
    const recommendedIntensity = this.recommendTrackingIntensity(
      newIntervalStep,
      consecutiveFailures,
      confidence
    );

    return {
      nextReviewAt,
      intervalStep: newIntervalStep,
      confidence,
      recommendedIntensity,
    };
  }

  /**
   * Process review outcome and update criterion schedule
   */
  async processReviewOutcome(
    userId: number,
    criterionId: string,
    isCorrect: boolean,
    performance: number = 0.5
  ): Promise<ReviewOutcome> {
    // Get current user mastery
    const userMastery = await this.getUserCriterionMastery(userId, criterionId);
    if (!userMastery) {
      throw new Error(`User mastery not found for criterion ${criterionId}`);
    }

    // Calculate new schedule
    const schedule = this.calculateNextReviewInterval(
      userMastery.currentIntervalStep,
      isCorrect,
      userMastery.trackingIntensity,
      userMastery.consecutiveFailures
    );

    // Update consecutive failures count
    const newConsecutiveFailures = isCorrect ? 0 : userMastery.consecutiveFailures + 1;

    // Update user mastery record
    await prisma.userCriterionMastery.update({
      where: { id: userMastery.id },
      data: {
        currentIntervalStep: schedule.intervalStep,
        nextReviewAt: schedule.nextReviewAt,
        lastReviewedAt: new Date(),
        reviewCount: userMastery.reviewCount + 1,
        successfulReviews: userMastery.successfulReviews + (isCorrect ? 1 : 0),
        consecutiveFailures: newConsecutiveFailures,
        trackingIntensity: schedule.recommendedIntensity,
      },
    });

    // Process mastery update through criterion service
    const masteryResult = await masteryCriterionService.processCriterionReview(
      userId,
      criterionId,
      isCorrect,
      performance
    );

    return {
      success: true,
      newIntervalStep: schedule.intervalStep,
      nextReviewAt: schedule.nextReviewAt,
      masteryProgress: masteryResult.newMasteryScore,
      message: masteryResult.message,
    };
  }

  /**
   * Update criterion schedule manually
   */
  async updateCriterionSchedule(
    userId: number,
    criterionId: string,
    nextInterval: ReviewSchedule
  ): Promise<void> {
    await prisma.userCriterionMastery.update({
      where: {
        userId_masteryCriterionId: {
          userId,
          masteryCriterionId: criterionId,
        },
      },
      data: {
        currentIntervalStep: nextInterval.intervalStep,
        nextReviewAt: nextInterval.nextReviewAt,
        trackingIntensity: nextInterval.recommendedIntensity,
      },
    });
  }

  /**
   * Update tracking intensity for a criterion
   */
  async updateTrackingIntensity(
    userId: number,
    criterionId: string,
    intensity: TrackingIntensity
  ): Promise<void> {
    await prisma.userCriterionMastery.update({
      where: {
        userId_masteryCriterionId: {
          userId,
          masteryCriterionId: criterionId,
        },
      },
      data: {
        trackingIntensity: intensity,
      },
    });

    // Recalculate next review date with new intensity
    const userMastery = await this.getUserCriterionMastery(userId, criterionId);
    if (userMastery) {
      const schedule = this.calculateNextReviewInterval(
        userMastery.currentIntervalStep,
        true, // Assume current performance level
        intensity,
        userMastery.consecutiveFailures
      );

      await this.updateCriterionSchedule(userId, criterionId, schedule);
    }
  }

  /**
   * Get due criteria for a user
   */
  async getDueCriteria(userId: number, date: Date = new Date()): Promise<UserCriterionMastery[]> {
    return await prisma.userCriterionMastery.findMany({
      where: {
        userId,
        nextReviewAt: {
          lte: date,
        },
      },
      include: {
        masteryCriterion: true,
      },
      orderBy: [
        { nextReviewAt: 'asc' },
        { consecutiveFailures: 'desc' },
        { masteryScore: 'asc' },
      ],
    });
  }

  /**
   * Get overdue criteria (past due by more than 3 days)
   */
  async getOverdueCriteria(userId: number, date: Date = new Date()): Promise<UserCriterionMastery[]> {
    const threeDaysAgo = new Date(date);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return await prisma.userCriterionMastery.findMany({
      where: {
        userId,
        nextReviewAt: {
          lte: threeDaysAgo,
        },
      },
      include: {
        masteryCriterion: true,
      },
      orderBy: [
        { nextReviewAt: 'asc' },
        { consecutiveFailures: 'desc' },
      ],
    });
  }

  /**
   * Get upcoming reviews (due in next 7 days)
   */
  async getUpcomingReviews(userId: number, date: Date = new Date()): Promise<UserCriterionMastery[]> {
    const sevenDaysFromNow = new Date(date);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    return await prisma.userCriterionMastery.findMany({
      where: {
        userId,
        nextReviewAt: {
          gte: date,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        masteryCriterion: true,
      },
      orderBy: { nextReviewAt: 'asc' },
    });
  }

  /**
   * Get learning statistics for a user
   */
  async getUserLearningStats(userId: number): Promise<{
    totalCriteria: number;
    masteredCriteria: number;
    activeCriteria: number;
    averageIntervalStep: number;
    successRate: number;
    recommendedIntensity: TrackingIntensity;
  }> {
    const userMasteries = await prisma.userCriterionMastery.findMany({
      where: { userId },
    });

    const totalCriteria = userMasteries.length;
    const masteredCriteria = userMasteries.filter(m => m.isMastered).length;
    const activeCriteria = userMasteries.filter(m => !m.isMastered).length;

    const totalIntervalSteps = userMasteries.reduce((sum, m) => sum + m.currentIntervalStep, 0);
    const averageIntervalStep = totalCriteria > 0 ? totalIntervalSteps / totalCriteria : 0;

    const totalReviews = userMasteries.reduce((sum, m) => sum + m.reviewCount, 0);
    const totalSuccessful = userMasteries.reduce((sum, m) => sum + m.successfulReviews, 0);
    const successRate = totalReviews > 0 ? totalSuccessful / totalReviews : 0;

    // Recommend intensity based on performance
    const recommendedIntensity = this.recommendTrackingIntensity(
      Math.round(averageIntervalStep),
      Math.max(...userMasteries.map(m => m.consecutiveFailures)),
      successRate
    );

    return {
      totalCriteria,
      masteredCriteria,
      activeCriteria,
      averageIntervalStep,
      successRate,
      recommendedIntensity,
    };
  }

  /**
   * Bulk update tracking intensity for multiple criteria
   */
  async bulkUpdateTrackingIntensity(
    userId: number,
    criteriaIds: string[],
    intensity: TrackingIntensity
  ): Promise<void> {
    await prisma.userCriterionMastery.updateMany({
      where: {
        userId,
        masteryCriterionId: { in: criteriaIds },
      },
      data: {
        trackingIntensity: intensity,
      },
    });

    // Recalculate schedules for all updated criteria
    for (const criterionId of criteriaIds) {
      const userMastery = await this.getUserCriterionMastery(userId, criterionId);
      if (userMastery) {
        const schedule = this.calculateNextReviewInterval(
          userMastery.currentIntervalStep,
          true,
          intensity,
          userMastery.consecutiveFailures
        );

        await this.updateCriterionSchedule(userId, criterionId, schedule);
      }
    }
  }

  // Private helper methods

  private async getUserCriterionMastery(userId: number, criterionId: string): Promise<UserCriterionMastery | null> {
    return await prisma.userCriterionMastery.findUnique({
      where: {
        userId_masteryCriterionId: {
          userId,
          masteryCriterionId: criterionId,
        },
      },
    });
  }

  /**
   * Recommend tracking intensity based on performance
   */
  private recommendTrackingIntensity(
    intervalStep: number,
    consecutiveFailures: number,
    confidence: number
  ): TrackingIntensity {
    // High failures or low confidence: recommend DENSE
    if (consecutiveFailures >= 2 || confidence < 0.3) {
      return 'DENSE';
    }

    // Low interval step or moderate confidence: recommend NORMAL
    if (intervalStep <= 2 || confidence < 0.6) {
      return 'NORMAL';
    }

    // High interval step and high confidence: recommend SPARSE
    return 'SPARSE';
  }

  /**
   * Get optimal review time for a criterion
   */
  getOptimalReviewTime(
    lastReviewedAt: Date | null,
    currentIntervalStep: number,
    trackingIntensity: TrackingIntensity
  ): Date {
    if (!lastReviewedAt) {
      return new Date();
    }

    const baseInterval = this.baseIntervals[currentIntervalStep];
    const multiplier = this.intensityMultipliers[trackingIntensity];
    const adjustedInterval = Math.round(baseInterval * multiplier);

    const optimalTime = new Date(lastReviewedAt);
    optimalTime.setDate(optimalTime.getDate() + adjustedInterval);
    
    return optimalTime;
  }

  /**
   * Calculate learning velocity (how quickly user is progressing)
   */
  calculateLearningVelocity(
    startDate: Date,
    endDate: Date,
    totalCriteria: number,
    masteredCriteria: number
  ): number {
    const daysDiff = this.getDaysDifference(startDate, endDate);
    if (daysDiff === 0) return 0;

    // Criteria mastered per day
    return masteredCriteria / daysDiff;
  }

  private getDaysDifference(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}

export const enhancedSpacedRepetitionService = new EnhancedSpacedRepetitionService();
