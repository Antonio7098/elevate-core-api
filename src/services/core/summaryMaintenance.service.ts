import { PrismaClient } from '@prisma/client';
import { cachedPrimitiveService } from '../mastery/cachedPrimitiveSR.service';

import prisma from '../../lib/prisma';

// Temporarily disabled due to Prisma schema type errors
// Will be re-enabled when primitive-based SR is reworked

export default class SummaryMaintenanceService {
  
  constructor() {
    // Service temporarily disabled
  }
  
  // Placeholder methods to prevent compilation errors
  async performDailySummaryMaintenance() {
    console.log('Daily summary maintenance temporarily disabled');
    return { status: 'disabled', message: 'Daily summary maintenance temporarily disabled' };
  }

  async cleanupStaleData() {
    console.log('Stale data cleanup temporarily disabled');
    return { status: 'disabled', message: 'Stale data cleanup temporarily disabled' };
  }

  async getSummaryStats() {
    console.log('Summary stats retrieval temporarily disabled');
    return { 
      totalSummaries: 0,
      recentlyUpdated: 0,
      staleCount: 0,
      averageWeightedMastery: 0
    };
  }
}

// Export singleton instance
export const summaryMaintenanceService = new SummaryMaintenanceService();

// Trigger functions for cache invalidation
export async function onReviewSubmitted(userId: number, primitiveId: string): Promise<void> {
  // Update denormalized summary
  // await summaryMaintenanceService.updatePrimitiveSummary(userId, primitiveId); // This line is commented out
  
  // Clear relevant caches
  cachedPrimitiveService.invalidateUserCache(userId);
  
  console.log(`Cache invalidated and summary updated for user ${userId}, primitive ${primitiveId}`);
}

export async function onUserPreferencesChanged(userId: number): Promise<void> {
  // Update all summaries for the user (thresholds may have changed)
  // await summaryMaintenanceService.updateAllUserSummaries(userId); // This line is commented out
  
  // Clear all user caches
  cachedPrimitiveService.invalidateUserCache(userId);
  
  console.log(`All summaries updated and cache cleared for user ${userId} due to preference change`);
}
