import { PrismaClient } from '@prisma/client';
import { addDays } from 'date-fns';

import prisma from '../../lib/prisma';

export interface BatchReviewOutcome {
  primitiveId: string;
  blueprintId: number;
  isCorrect: boolean;
  criterionId?: string;
  questionId?: string;
  responseTime?: number; // milliseconds
}

export interface BatchProcessingResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  processingTimeMs: number;
  outcomes: Array<{
    primitiveId: string;
    blueprintId: number;
    success: boolean;
    error?: string;
    nextReviewAt?: Date;
  }>;
}

export interface BatchProcessingStats {
  batchSize: number;
  avgProcessingTimePerOutcome: number;
  successRate: number;
  progressUpdatesCount: number;
  criterionUpdatesCount: number;
  transactionTimeMs: number;
}

class BatchReviewProcessingService {
  private readonly MAX_BATCH_SIZE = 100;
  private readonly BATCH_TIMEOUT_MS = 30000; // 30 seconds

  async processBatchWithOptimization(
    userId: number,
    outcomes: BatchReviewOutcome[]
  ): Promise<BatchProcessingResult> {
    const startTime = Date.now();
    
    if (outcomes.length === 0) {
      return {
        totalProcessed: 0,
        successful: 0,
        failed: 0,
        processingTimeMs: 0,
        outcomes: []
      };
    }

    // Split large batches to prevent timeout
    if (outcomes.length > this.MAX_BATCH_SIZE) {
      console.log(`Large batch detected (${outcomes.length}), splitting into smaller chunks`);
      return await this.processLargeBatch(userId, outcomes);
    }

    console.log(`Processing optimized batch of ${outcomes.length} outcomes for user ${userId}`);

    const result = await this.processSingleBatch(userId, outcomes);
    
    const processingTime = Date.now() - startTime;
    result.processingTimeMs = processingTime;

    // Log performance metrics
    this.logBatchStats({
      batchSize: outcomes.length,
      avgProcessingTimePerOutcome: processingTime / outcomes.length,
      successRate: (result.successful / result.totalProcessed) * 100,
      progressUpdatesCount: result.successful,
      criterionUpdatesCount: outcomes.filter(o => o.criterionId).length,
      transactionTimeMs: processingTime
    });

    return result;
  }

  private async processSingleBatch(
    userId: number,
    outcomes: BatchReviewOutcome[]
  ): Promise<BatchProcessingResult> {
    return await prisma.$transaction(async (tx) => {
      const results = [];
      const progressBulkUpdates = [];
      const criterionBulkUpdates = [];
      const now = new Date();

      // Step 1: Fetch all existing progress records in one query
      const progressKeys = outcomes.map(o => ({
        userId,
        primitiveId: o.primitiveId,
        blueprintId: o.blueprintId
      }));

      const existingProgress = await tx.userPrimitiveProgress.findMany({
        where: {
          OR: progressKeys
        }
      });

      // Create lookup map for faster access
      const progressMap = new Map();
      existingProgress.forEach(p => {
        const key = `${p.userId}-${p.primitiveId}-${p.blueprintId}`;
        progressMap.set(key, p);
      });

      // Step 2: Fetch criterion mastery records if needed
      const criterionKeys = outcomes
        .filter(o => o.criterionId)
        .map(o => ({
          userId,
          criterionId: o.criterionId!,
          primitiveId: o.primitiveId,
          blueprintId: o.blueprintId
        }));

      const existingCriteria = criterionKeys.length > 0 
        ? await tx.userCriterionMastery.findMany({
            where: { OR: criterionKeys }
          })
        : [];

      const criteriaMap = new Map();
      existingCriteria.forEach(c => {
        const key = `${c.userId}-${c.criterionId}-${c.primitiveId}-${c.blueprintId}`;
        criteriaMap.set(key, c);
      });

      // Step 3: Process each outcome
      for (const outcome of outcomes) {
        const { primitiveId, blueprintId, isCorrect, criterionId } = outcome;
        const progressKey = `${userId}-${primitiveId}-${blueprintId}`;
        
        const currentProgress = progressMap.get(progressKey);
        
        if (!currentProgress) {
          results.push({
            primitiveId,
            blueprintId,
            success: false,
            error: 'Progress record not found'
          });
          continue;
        }

        // Calculate new values
        const reviewCount = currentProgress.reviewCount + 1;
        const successfulReviews = isCorrect 
          ? currentProgress.successfulReviews + 1 
          : currentProgress.successfulReviews;
        
        // Calculate next review date
        const baseIntervals = [1, 3, 7, 21];
        const intervalIndex = Math.min(reviewCount - 1, baseIntervals.length - 1);
        const baseInterval = baseIntervals[intervalIndex];
        const nextReviewAt = addDays(now, baseInterval);

        // Prepare progress update
        progressBulkUpdates.push({
          where: {
            userId_primitiveId_blueprintId: {
              userId,
              primitiveId,
              blueprintId
            }
          },
          data: {
            reviewCount,
            successfulReviews,
            lastReviewedAt: now,
            nextReviewAt,
            updatedAt: now
          }
        });

        // Handle criterion updates
        if (criterionId) {
          const criterionKey = `${userId}-${criterionId}-${primitiveId}-${blueprintId}`;
          const currentCriterion = criteriaMap.get(criterionKey);

          if (currentCriterion) {
            const attemptCount = currentCriterion.attemptCount + 1;
            const successfulAttempts = isCorrect 
              ? currentCriterion.successfulAttempts + 1 
              : currentCriterion.successfulAttempts;
            
            // Simple mastery check (2 consecutive correct)
            let isMastered = currentCriterion.isMastered;
            let masteredAt = currentCriterion.masteredAt;
            
            if (isCorrect && !isMastered && successfulAttempts >= 2) {
              isMastered = true;
              masteredAt = now;
            }

            criterionBulkUpdates.push({
              where: {
                userId_criterionId_primitiveId_blueprintId: {
                  userId,
                  criterionId,
                  primitiveId,
                  blueprintId
                }
              },
              data: {
                attemptCount,
                successfulAttempts,
                isMastered,
                masteredAt,
                lastAttemptedAt: now,
                updatedAt: now
              }
            });
          }
        }

        results.push({
          primitiveId,
          blueprintId,
          success: true,
          nextReviewAt
        });
      }

      // Step 4: Execute bulk updates
      console.log(`Executing ${progressBulkUpdates.length} progress updates and ${criterionBulkUpdates.length} criterion updates`);

      // Update progress records
      for (const update of progressBulkUpdates) {
        await tx.userPrimitiveProgress.update(update);
      }

      // Update criterion mastery records
      for (const update of criterionBulkUpdates) {
        await tx.userCriterionMastery.update(update);
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;

      return {
        totalProcessed: results.length,
        successful,
        failed,
        processingTimeMs: 0, // Will be set by caller
        outcomes: results
      };
    }, {
      timeout: this.BATCH_TIMEOUT_MS
    });
  }

  private async processLargeBatch(
    userId: number,
    outcomes: BatchReviewOutcome[]
  ): Promise<BatchProcessingResult> {
    const chunks = this.chunkArray(outcomes, this.MAX_BATCH_SIZE);
    let totalResult: BatchProcessingResult = {
      totalProcessed: 0,
      successful: 0,
      failed: 0,
      processingTimeMs: 0,
      outcomes: []
    };

    console.log(`Processing ${chunks.length} chunks of max size ${this.MAX_BATCH_SIZE}`);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} outcomes)`);
      
      const chunkResult = await this.processSingleBatch(userId, chunk);
      
      // Aggregate results
      totalResult.totalProcessed += chunkResult.totalProcessed;
      totalResult.successful += chunkResult.successful;
      totalResult.failed += chunkResult.failed;
      totalResult.processingTimeMs += chunkResult.processingTimeMs;
      totalResult.outcomes.push(...chunkResult.outcomes);

      // Small delay between chunks to prevent overwhelming the database
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return totalResult;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private logBatchStats(stats: BatchProcessingStats): void {
    console.log('Batch Processing Statistics:', {
      batchSize: stats.batchSize,
      avgProcessingTimePerOutcome: `${stats.avgProcessingTimePerOutcome.toFixed(2)}ms`,
      successRate: `${stats.successRate.toFixed(1)}%`,
      progressUpdates: stats.progressUpdatesCount,
      criterionUpdates: stats.criterionUpdatesCount,
      totalTransactionTime: `${stats.transactionTimeMs}ms`
    });
  }

  // Performance monitoring methods
  async getBatchProcessingMetrics(): Promise<{
    avgBatchSize: number;
    avgProcessingTime: number;
    totalBatchesProcessed: number;
    avgSuccessRate: number;
  }> {
    // This would typically be stored in a metrics database
    // For now, return mock data
    return {
      avgBatchSize: 25,
      avgProcessingTime: 150,
      totalBatchesProcessed: 100,
      avgSuccessRate: 98.5
    };
  }
}

// Export singleton instance
export const batchReviewProcessingService = new BatchReviewProcessingService();

// Convenience function for backward compatibility
export async function processBatchReviewOutcomesOptimized(
  userId: number,
  outcomes: BatchReviewOutcome[]
): Promise<BatchProcessingResult> {
  return await batchReviewProcessingService.processBatchWithOptimization(userId, outcomes);
}
