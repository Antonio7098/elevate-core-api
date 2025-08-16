import { PrismaClient } from '@prisma/client';
import { cachedPrimitiveService } from '../mastery/cachedPrimitiveSR.service';

import prisma from '../../lib/prisma';

class SummaryMaintenanceService {
  async updatePrimitiveSummary(userId: number, primitiveId: string): Promise<void> {
    const summary = await this.calculateSummaryData(userId, primitiveId);
    
    await prisma.userPrimitiveDailySummary.upsert({
      where: { 
        userId_primitiveId: { userId, primitiveId } 
      },
      update: {
        ...summary,
        lastCalculated: new Date()
      },
      create: { 
        userId, 
        primitiveId, 
        ...summary 
      }
    });

    // Invalidate related caches
    cachedPrimitiveService.invalidateDailySummaryCache(userId);
    cachedPrimitiveService.invalidateDailyTasksCache(userId);
  }

  async updateAllUserSummaries(userId: number): Promise<void> {
    const primitives = await prisma.knowledgePrimitive.findMany({
      where: { userId },
      select: { primitiveId: true }
    });

    console.log(`Updating summaries for ${primitives.length} primitives for user ${userId}`);

    for (const primitive of primitives) {
      await this.updatePrimitiveSummary(userId, primitive.primitiveId);
    }

    console.log(`Completed summary update for user ${userId}`);
  }

  async batchUpdateSummaries(userIds: number[]): Promise<void> {
    console.log(`Starting batch summary update for ${userIds.length} users`);

    for (const userId of userIds) {
      try {
        await this.updateAllUserSummaries(userId);
      } catch (error) {
        console.error(`Failed to update summaries for user ${userId}:`, error);
      }
    }

    console.log('Completed batch summary update');
  }

  private async calculateSummaryData(userId: number, primitiveId: string): Promise<{
    primitiveTitle: string;
    masteryLevel: string;
    nextReviewAt: Date | null;
    totalCriteria: number;
    masteredCriteria: number;
    weightedMasteryScore: number;
    canProgressToNext: boolean;
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
      throw new Error(`Primitive ${primitiveId} not found`);
    }

    const progress = primitive.userPrimitiveProgresses[0];
    const totalCriteria = primitive.masteryCriteria.length;
    const masteredCriteria = primitive.masteryCriteria.filter(c => 
      c.userCriterionMasteries.some(m => m.isMastered)
    ).length;

    const totalWeight = primitive.masteryCriteria.reduce((sum, c) => sum + (c.weight ?? 1), 0);
    const masteredWeight = primitive.masteryCriteria.reduce((sum, c) => {
      const mastered = c.userCriterionMasteries.some(m => m.isMastered);
      return sum + (mastered ? (c.weight ?? 1) : 0);
    }, 0);

    const weightedMasteryScore = totalWeight > 0 ? masteredWeight / totalWeight : 0;

    // Get user's mastery threshold preference
    const prefs = await prisma.userBucketPreferences.findUnique({ where: { userId } });
    const threshold = prefs?.masteryThresholdLevel ?? 'PROFICIENT';

    let canProgress = false;
    switch (threshold) {
      case 'SURVEY':
        canProgress = weightedMasteryScore >= 0.6;
        break;
      case 'EXPERT':
        canProgress = weightedMasteryScore >= 0.95;
        break;
      case 'PROFICIENT':
      default:
        canProgress = weightedMasteryScore >= 0.8;
        break;
    }

    return {
      primitiveTitle: primitive.title,
      masteryLevel: progress?.masteryLevel ?? 'NOT_STARTED',
      nextReviewAt: progress?.nextReviewAt ?? null,
      totalCriteria,
      masteredCriteria,
      weightedMasteryScore,
      canProgressToNext: canProgress
    };
  }

  // Scheduled maintenance functions
  async performDailySummaryMaintenance(): Promise<void> {
    console.log('Starting daily summary maintenance...');

    // Get all users who have had recent activity
    const activeUsers = await prisma.userPrimitiveProgress.findMany({
      where: {
        lastReviewedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: { userId: true },
      distinct: ['userId']
    });

    const userIds = activeUsers.map(u => u.userId);
    console.log(`Found ${userIds.length} active users for maintenance`);

    await this.batchUpdateSummaries(userIds);

    console.log('Daily summary maintenance completed');
  }

  async cleanupStaleData(): Promise<void> {
    console.log('Starting stale data cleanup...');

    // Remove summaries for primitives that no longer exist
    const orphanedSummaries = await prisma.userPrimitiveDailySummary.findMany({
      where: {
        knowledgePrimitive: null
      },
      select: { id: true, userId: true, primitiveId: true }
    });

    if (orphanedSummaries.length > 0) {
      console.log(`Removing ${orphanedSummaries.length} orphaned summaries`);
      
      await prisma.userPrimitiveDailySummary.deleteMany({
        where: {
          id: {
            in: orphanedSummaries.map(s => s.id)
          }
        }
      });

      // Invalidate caches for affected users
      const affectedUsers = [...new Set(orphanedSummaries.map(s => s.userId))];
      affectedUsers.forEach(userId => {
        cachedPrimitiveService.invalidateUserCache(userId);
      });
    }

    console.log('Stale data cleanup completed');
  }

  // Performance monitoring
  async getSummaryStats(): Promise<{
    totalSummaries: number;
    recentlyUpdated: number;
    staleCount: number;
    averageWeightedMastery: number;
  }> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [total, recent, stale, avgMastery] = await Promise.all([
      prisma.userPrimitiveDailySummary.count(),
      prisma.userPrimitiveDailySummary.count({
        where: { lastCalculated: { gte: oneHourAgo } }
      }),
      prisma.userPrimitiveDailySummary.count({
        where: { lastCalculated: { lt: oneDayAgo } }
      }),
      prisma.userPrimitiveDailySummary.aggregate({
        _avg: { weightedMasteryScore: true }
      })
    ]);

    return {
      totalSummaries: total,
      recentlyUpdated: recent,
      staleCount: stale,
      averageWeightedMastery: avgMastery._avg.weightedMasteryScore ?? 0
    };
  }
}

// Export singleton instance
export const summaryMaintenanceService = new SummaryMaintenanceService();

// Trigger functions for cache invalidation
export async function onReviewSubmitted(userId: number, primitiveId: string): Promise<void> {
  // Update denormalized summary
  await summaryMaintenanceService.updatePrimitiveSummary(userId, primitiveId);
  
  // Clear relevant caches
  cachedPrimitiveService.invalidateUserCache(userId);
  
  console.log(`Cache invalidated and summary updated for user ${userId}, primitive ${primitiveId}`);
}

export async function onUserPreferencesChanged(userId: number): Promise<void> {
  // Update all summaries for the user (thresholds may have changed)
  await summaryMaintenanceService.updateAllUserSummaries(userId);
  
  // Clear all user caches
  cachedPrimitiveService.invalidateUserCache(userId);
  
  console.log(`All summaries updated and cache cleared for user ${userId} due to preference change`);
}
