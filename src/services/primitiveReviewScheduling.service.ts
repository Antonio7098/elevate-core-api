import { PrismaClient } from '@prisma/client';
import { addDays, startOfDay, endOfDay } from 'date-fns';

import prisma from '../lib/prisma';

export interface ScheduledReview {
  primitiveId: string;
  primitiveTitle: string;
  masteryLevel: string;
  nextReviewAt: Date;
  priority: 'critical' | 'core' | 'plus';
  weightedMastery: number;
}

export async function getScheduledReviewsForUser(
  userId: number,
  startDate?: Date,
  endDate?: Date
): Promise<ScheduledReview[]> {
  const start = startDate ? startOfDay(startDate) : new Date();
  const end = endDate ? endOfDay(endDate) : addDays(start, 7); // Default 7-day window

  const summaries = await prisma.userPrimitiveDailySummary.findMany({
    where: {
      userId,
      nextReviewAt: {
        gte: start,
        lte: end
      }
    },
    orderBy: [
      { nextReviewAt: 'asc' },
      { weightedMasteryScore: 'asc' }
    ]
  });

  return summaries.map(summary => ({
    primitiveId: summary.primitiveId,
    primitiveTitle: summary.primitiveTitle,
    masteryLevel: summary.masteryLevel,
    nextReviewAt: summary.nextReviewAt!,
    priority: summary.weightedMasteryScore < 0.4 ? 'critical' : 
              summary.weightedMasteryScore < 0.8 ? 'core' : 'plus',
    weightedMastery: summary.weightedMasteryScore
  }));
}

export async function getOverdueReviews(userId: number): Promise<ScheduledReview[]> {
  const now = new Date();
  
  const summaries = await prisma.userPrimitiveDailySummary.findMany({
    where: {
      userId,
      OR: [
        { nextReviewAt: null },
        { nextReviewAt: { lt: now } }
      ]
    },
    orderBy: [
      { weightedMasteryScore: 'asc' },
      { nextReviewAt: 'asc' }
    ]
  });

  return summaries.map(summary => ({
    primitiveId: summary.primitiveId,
    primitiveTitle: summary.primitiveTitle,
    masteryLevel: summary.masteryLevel,
    nextReviewAt: summary.nextReviewAt || now,
    priority: summary.weightedMasteryScore < 0.4 ? 'critical' : 
              summary.weightedMasteryScore < 0.8 ? 'core' : 'plus',
    weightedMastery: summary.weightedMasteryScore
  }));
}

export async function scheduleReviewForPrimitive(
  userId: number,
  primitiveId: string,
  blueprintId: number,
  reviewDate: Date
): Promise<void> {
  await prisma.userPrimitiveProgress.updateMany({
    where: {
      userId,
      primitiveId,
      blueprintId
    },
    data: {
      nextReviewAt: reviewDate,
      updatedAt: new Date()
    }
  });

  // Refresh the daily summary for this user
  const { updateDailySummariesForUser } = await import('./primitiveSR.service');
  await updateDailySummariesForUser(userId);
}

export async function bulkScheduleReviews(
  userId: number,
  schedules: Array<{
    primitiveId: string;
    blueprintId: number;
    reviewDate: Date;
  }>
): Promise<void> {
  for (const schedule of schedules) {
    await scheduleReviewForPrimitive(
      userId,
      schedule.primitiveId,
      schedule.blueprintId,
      schedule.reviewDate
    );
  }
}

export async function getReviewCalendar(
  userId: number,
  month: number,
  year: number
): Promise<Record<string, ScheduledReview[]>> {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const reviews = await getScheduledReviewsForUser(userId, startDate, endDate);
  
  const calendar: Record<string, ScheduledReview[]> = {};
  
  reviews.forEach(review => {
    const dateKey = review.nextReviewAt.toISOString().split('T')[0];
    if (!calendar[dateKey]) {
      calendar[dateKey] = [];
    }
    calendar[dateKey].push(review);
  });

  return calendar;
}
