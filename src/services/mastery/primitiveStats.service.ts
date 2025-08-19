import { PrismaClient } from '@prisma/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';

import prisma from '../../lib/prisma';

export interface PrimitiveMasteryStats {
  totalPrimitives: number;
  masteryDistribution: {
    critical: number;    // < 0.4
    core: number;        // 0.4 - 0.8
    plus: number;        // > 0.8
  };
  averageWeightedMastery: number;
  progressionEligible: number;
  byUeeLevel: {
    NOT_STARTED: number;
    UNDERSTAND: number;
    USE: number;
    EXPLORE: number;
  };
}

export interface ReviewActivityStats {
  totalReviews: number;
  successfulReviews: number;
  successRate: number;
  reviewsLast7Days: number;
  reviewsLast30Days: number;
  averageReviewsPerDay: number;
  streakDays: number;
}

export interface UserProgressStats {
  mastery: PrimitiveMasteryStats;
  activity: ReviewActivityStats;
  dailyTaskCompletion: {
    tasksAssignedToday: number;
    tasksCompletedToday: number;
    completionRate: number;
  };
  trends: {
    masteryGrowthLast30Days: number;
    reviewVelocityTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

export async function getPrimitiveMasteryStats(userId: number): Promise<PrimitiveMasteryStats> {
  const summaries = await prisma.userPrimitiveDailySummary.findMany({
    where: { userId }
  });

  const total = summaries.length;
  const critical = summaries.filter(s => s.weightedMasteryScore < 0.4).length;
  const core = summaries.filter(s => s.weightedMasteryScore >= 0.4 && s.weightedMasteryScore < 0.8).length;
  const plus = summaries.filter(s => s.weightedMasteryScore >= 0.8).length;

  const averageMastery = total > 0 
    ? summaries.reduce((sum, s) => sum + s.weightedMasteryScore, 0) / total 
    : 0;

  const progressionEligible = summaries.filter(s => s.canProgressToNext).length;

  const byLevel = {
    NOT_STARTED: summaries.filter(s => s.masteryLevel === 'NOT_STARTED').length,
    UNDERSTAND: summaries.filter(s => s.masteryLevel === 'UNDERSTAND').length,
    USE: summaries.filter(s => s.masteryLevel === 'USE').length,
    EXPLORE: summaries.filter(s => s.masteryLevel === 'EXPLORE').length,
  };

  return {
    totalPrimitives: total,
    masteryDistribution: { critical, core, plus },
    averageWeightedMastery: averageMastery,
    progressionEligible,
    byUeeLevel: byLevel
  };
}

export async function getReviewActivityStats(userId: number): Promise<ReviewActivityStats> {
  const now = new Date();
  const last7Days = subDays(now, 7);
  const last30Days = subDays(now, 30);

  // Get all user progress records
  const progressRecords = await prisma.userPrimitiveProgress.findMany({
    where: { userId },
    select: {
      reviewCount: true,
      successfulReviews: true,
      lastReviewedAt: true,
      createdAt: true
    }
  });

  const totalReviews = progressRecords.reduce((sum, p) => sum + p.reviewCount, 0);
  const successfulReviews = progressRecords.reduce((sum, p) => sum + p.successfulReviews, 0);
  const successRate = totalReviews > 0 ? successfulReviews / totalReviews : 0;

  // Count reviews in time periods (approximation based on lastReviewedAt)
  const reviewsLast7Days = progressRecords.filter(p => 
    p.lastReviewedAt && p.lastReviewedAt >= last7Days
  ).length;

  const reviewsLast30Days = progressRecords.filter(p => 
    p.lastReviewedAt && p.lastReviewedAt >= last30Days
  ).length;

  const averageReviewsPerDay = reviewsLast30Days / 30;

  // Calculate streak (simplified - days with any review activity)
  const recentReviewDates = progressRecords
    .filter(p => p.lastReviewedAt && p.lastReviewedAt >= subDays(now, 30))
    .map(p => startOfDay(p.lastReviewedAt!).getTime())
    .filter((date, index, arr) => arr.indexOf(date) === index)
    .sort((a, b) => b - a);

  let streakDays = 0;
  const todayStart = startOfDay(now).getTime();
  
  for (let i = 0; i < recentReviewDates.length; i++) {
    const expectedDate = todayStart - (i * 24 * 60 * 60 * 1000);
    if (recentReviewDates[i] === expectedDate) {
      streakDays++;
    } else {
      break;
    }
  }

  return {
    totalReviews,
    successfulReviews,
    successRate,
    reviewsLast7Days,
    reviewsLast30Days,
    averageReviewsPerDay,
    streakDays
  };
}

export async function getDailyTaskCompletionStats(userId: number): Promise<UserProgressStats['dailyTaskCompletion']> {
  // This would ideally track actual task completion
  // For now, we'll estimate based on review activity today
  const today = startOfDay(new Date());
  const tomorrow = endOfDay(new Date());

  const todayReviews = await prisma.userPrimitiveProgress.count({
    where: {
      userId,
      lastReviewedAt: {
        gte: today,
        lte: tomorrow
      }
    }
  });

  // Get user's bucket preferences to estimate assigned tasks
  const prefs = await prisma.userBucketPreferences.findUnique({
    where: { userId }
  });

  const estimatedAssigned = (prefs?.criticalSize || 10) + 
                           (prefs?.coreSize || 15) + 
                           (prefs?.plusSize || 5);

  return {
    tasksAssignedToday: estimatedAssigned,
    tasksCompletedToday: todayReviews,
    completionRate: estimatedAssigned > 0 ? todayReviews / estimatedAssigned : 0
  };
}

export async function getUserProgressStats(userId: number): Promise<UserProgressStats> {
  const [mastery, activity, dailyCompletion] = await Promise.all([
    getPrimitiveMasteryStats(userId),
    getReviewActivityStats(userId),
    getDailyTaskCompletionStats(userId)
  ]);

  // Calculate trends (simplified)
  const masteryGrowthLast30Days = mastery.averageWeightedMastery * 0.1; // Placeholder
  const reviewVelocityTrend: 'increasing' | 'decreasing' | 'stable' = 
    activity.reviewsLast7Days > activity.reviewsLast30Days / 4 ? 'increasing' :
    activity.reviewsLast7Days < activity.reviewsLast30Days / 4 ? 'decreasing' : 'stable';

  return {
    mastery,
    activity,
    dailyTaskCompletion: dailyCompletion,
    trends: {
      masteryGrowthLast30Days,
      reviewVelocityTrend
    }
  };
}

export async function getPrimitiveDetailedStats(
  userId: number,
  primitiveId: string
): Promise<{
  primitive: any;
  mastery: {
    weightedScore: number;
    totalCriteria: number;
    masteredCriteria: number;
    criteriaBreakdown: Array<{
      criterionId: string;
      title: string;
      weight: number;
      isMastered: boolean;
      attempts: number;
      successRate: number;
    }>;
  };
  reviewHistory: {
    totalReviews: number;
    successfulReviews: number;
    lastReviewedAt: Date | null;
    nextReviewAt: Date | null;
    currentInterval: number;
  };
}> {
  const primitive = await prisma.knowledgePrimitive.findUnique({
    where: { primitiveId },
    include: {
      masteryCriteria: {
        include: {
          userCriterionMasteries: {
            where: { userId }
          }
        }
      },
      userPrimitiveProgresses: {
        where: { userId }
      }
    }
  });

  if (!primitive) {
    throw new Error('Primitive not found');
  }

  const progress = primitive.userPrimitiveProgresses[0];
  const criteriaBreakdown = primitive.masteryCriteria.map(criterion => {
    const mastery = criterion.userCriterionMasteries[0];
    return {
      criterionId: String(criterion.criterionId),
      title: criterion.title,
      weight: criterion.weight || 1,
      isMastered: mastery?.isMastered || false,
      attempts: mastery?.attemptCount || 0,
      successRate: mastery?.attemptCount > 0 
        ? (mastery.successfulAttempts || 0) / mastery.attemptCount 
        : 0
    };
  });

  const totalWeight = criteriaBreakdown.reduce((sum, c) => sum + c.weight, 0);
  const masteredWeight = criteriaBreakdown.reduce((sum, c) => 
    sum + (c.isMastered ? c.weight : 0), 0
  );

  return {
    primitive: {
      primitiveId: primitive.primitiveId,
      title: primitive.title,
      description: primitive.description
    },
    mastery: {
      weightedScore: totalWeight > 0 ? masteredWeight / totalWeight : 0,
      totalCriteria: criteriaBreakdown.length,
      masteredCriteria: criteriaBreakdown.filter(c => c.isMastered).length,
      criteriaBreakdown
    },
    reviewHistory: {
      totalReviews: progress?.reviewCount || 0,
      successfulReviews: progress?.successfulReviews || 0,
      lastReviewedAt: progress?.lastReviewedAt || null,
      nextReviewAt: progress?.nextReviewAt || null,
      currentInterval: progress?.nextReviewAt && progress?.lastReviewedAt
        ? Math.round((progress.nextReviewAt.getTime() - progress.lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0
    }
  };
}
