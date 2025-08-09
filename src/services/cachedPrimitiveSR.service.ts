import NodeCache from 'node-cache';
import { format } from 'date-fns';
import * as primitiveSRService from './primitiveSR.service';

class CachedPrimitiveService {
  private cache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL
  
  async getDailyTasks(userId: number): Promise<any[]> {
    const cacheKey = `daily-tasks:${userId}:${format(new Date(), 'yyyy-MM-dd')}`;
    
    let tasks = this.cache.get<any[]>(cacheKey);
    if (!tasks) {
      console.log(`Cache miss for daily tasks: ${cacheKey}`);
      tasks = await primitiveSRService.generateDailyTasks(userId);
      this.cache.set(cacheKey, tasks);
      console.log(`Cached daily tasks for user ${userId}: ${tasks.length} tasks`);
    } else {
      console.log(`Cache hit for daily tasks: ${cacheKey}`);
    }
    return tasks;
  }

  async getDailySummary(userId: number): Promise<any[]> {
    const cacheKey = `daily-summary:${userId}:${format(new Date(), 'yyyy-MM-dd')}`;
    
    let summary = this.cache.get<any[]>(cacheKey);
    if (!summary) {
      console.log(`Cache miss for daily summary: ${cacheKey}`);
      await primitiveSRService.updateDailySummariesForUser(userId);
      
      // Get the updated summaries from database
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      summary = await prisma.userPrimitiveDailySummary.findMany({
        where: { userId },
        orderBy: [
          { weightedMasteryScore: 'asc' },
          { nextReviewAt: 'asc' }
        ]
      });
      
      this.cache.set(cacheKey, summary);
      console.log(`Cached daily summary for user ${userId}: ${summary.length} primitives`);
    } else {
      console.log(`Cache hit for daily summary: ${cacheKey}`);
    }
    return summary;
  }

  async getUserStats(userId: number): Promise<any> {
    const cacheKey = `user-stats:${userId}`;
    
    let stats = this.cache.get<any>(cacheKey);
    if (!stats) {
      console.log(`Cache miss for user stats: ${cacheKey}`);
      const { getUserProgressStats } = await import('./primitiveStats.service');
      stats = await getUserProgressStats(userId);
      
      // Cache stats for 30 minutes (shorter TTL for frequently changing data)
      this.cache.set(cacheKey, stats, 1800);
      console.log(`Cached user stats for user ${userId}`);
    } else {
      console.log(`Cache hit for user stats: ${cacheKey}`);
    }
    return stats;
  }

  // Cache invalidation methods
  invalidateUserCache(userId: number): void {
    const patterns = [
      `daily-tasks:${userId}:*`,
      `daily-summary:${userId}:*`,
      `user-stats:${userId}`
    ];
    
    patterns.forEach(pattern => {
      const keys = this.cache.keys().filter(key => this.matchesPattern(key, pattern));
      keys.forEach(key => {
        this.cache.del(key);
        console.log(`Invalidated cache key: ${key}`);
      });
    });
  }

  invalidateDailyTasksCache(userId: number): void {
    const today = format(new Date(), 'yyyy-MM-dd');
    const cacheKey = `daily-tasks:${userId}:${today}`;
    this.cache.del(cacheKey);
    console.log(`Invalidated daily tasks cache for user ${userId}`);
  }

  invalidateDailySummaryCache(userId: number): void {
    const today = format(new Date(), 'yyyy-MM-dd');
    const cacheKey = `daily-summary:${userId}:${today}`;
    this.cache.del(cacheKey);
    console.log(`Invalidated daily summary cache for user ${userId}`);
  }

  private matchesPattern(key: string, pattern: string): boolean {
    const regexPattern = pattern.replace(/\*/g, '.*');
    return new RegExp(`^${regexPattern}$`).test(key);
  }

  // Cache statistics
  getCacheStats(): {
    keys: number;
    hits: number;
    misses: number;
    ksize: number;
    vsize: number;
  } {
    return this.cache.getStats();
  }

  // Clear all cache
  clearCache(): void {
    this.cache.flushAll();
    console.log('Cleared all cache');
  }
}

// Export singleton instance
export const cachedPrimitiveService = new CachedPrimitiveService();

// Enhanced service functions with automatic cache invalidation
export async function processReviewOutcomeWithCache(
  userId: number,
  primitiveId: string,
  blueprintId: number,
  isCorrect: boolean
) {
  // Process the review
  const result = await primitiveSRService.processReviewOutcome(
    userId,
    primitiveId,
    blueprintId,
    isCorrect
  );

  // Invalidate relevant caches
  cachedPrimitiveService.invalidateUserCache(userId);

  return result;
}

export async function processBatchReviewOutcomesWithCache(
  userId: number,
  outcomes: Array<{
    primitiveId: string;
    blueprintId: number;
    isCorrect: boolean;
  }>
) {
  // Process the batch
  const results = await primitiveSRService.processBatchReviewOutcomes(userId, outcomes);

  // Invalidate relevant caches
  cachedPrimitiveService.invalidateUserCache(userId);

  return results;
}

export async function progressToNextUeeLevelWithCache(
  userId: number,
  primitiveId: string,
  blueprintId: number
) {
  // Process the progression
  const result = await primitiveSRService.progressToNextUeeLevel(
    userId,
    primitiveId,
    blueprintId
  );

  // Invalidate relevant caches if progression was successful
  if (result.success) {
    cachedPrimitiveService.invalidateUserCache(userId);
  }

  return result;
}
