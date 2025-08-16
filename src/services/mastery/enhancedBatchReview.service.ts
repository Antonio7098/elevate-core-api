// Removed NestJS dependency
import { PrismaClient } from '@prisma/client';

export interface BatchReviewOutcome {
  userId: number;
  criterionId: string;
  isCorrect: boolean;
  reviewDate: Date;
  timeSpentSeconds: number;
  confidence: number;
}

export interface BatchProcessingResult {
  success: boolean;
  processedCount: number;
  successCount: number;
  failureCount: number;
  masteryUpdates: number;
  stageProgressions: number;
  errors: string[];
  processingTime: number;
}

export interface BatchValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: string[];
}

export interface MasteryUpdateResult {
  criterionId: string;
  oldMasteryScore: number;
  newMasteryScore: number;
  isMastered: boolean;
  stageProgression: boolean;
  nextReviewAt: Date;
}

export class EnhancedBatchReviewService {
  // Using console instead of NestJS Logger
  private readonly prisma = new PrismaClient();

  /**
   * Process batch review outcomes with criterion-based logic
   * Implements consecutive interval mastery checking and UUE stage progression
   */
  async processBatchWithOptimization(
    userId: number,
    outcomes: BatchReviewOutcome[]
  ): Promise<BatchProcessingResult> {
    const startTime = Date.now();
    const result: BatchProcessingResult = {
      success: true,
      processedCount: 0,
      successCount: 0,
      failureCount: 0,
      masteryUpdates: 0,
      stageProgressions: 0,
      errors: [],
      processingTime: 0
    };

    try {
      // Validate batch input
      const validation = this.validateBatchInput(outcomes);
      if (!validation.isValid) {
        result.success = false;
        result.errors = validation.errors;
        return result;
      }

      // Process outcomes in optimized batches
      const batchSize = 50; // Process 50 at a time for optimal performance
      const batches = this.chunkArray(outcomes, batchSize);

      for (const batch of batches) {
        const batchResult = await this.processBatch(userId, batch);
        
        result.processedCount += batchResult.processedCount;
        result.successCount += batchResult.successCount;
        result.failureCount += batchResult.failureCount;
        result.masteryUpdates += batchResult.masteryUpdates;
        result.stageProgressions += batchResult.stageProgressions;
        
        if (batchResult.errors.length > 0) {
          result.errors.push(...batchResult.errors);
        }
      }

      result.processingTime = Date.now() - startTime;
      console.log(`Batch processing completed: ${result.processedCount} items in ${result.processingTime}ms`);

    } catch (error) {
      result.success = false;
      result.errors.push(`Batch processing failed: ${error.message}`);
      console.error(`Batch processing error: ${error.message}`, error.stack);
    }

    return result;
  }

  /**
   * Process a single batch of review outcomes
   */
  private async processBatch(
    userId: number,
    outcomes: BatchReviewOutcome[]
  ): Promise<BatchProcessingResult> {
    const result: BatchProcessingResult = {
      success: true,
      processedCount: 0,
      successCount: 0,
      failureCount: 0,
      masteryUpdates: 0,
      stageProgressions: 0,
      errors: [],
      processingTime: 0
    };

    // Group outcomes by criterion for batch processing
    const criterionGroups = this.groupOutcomesByCriterion(outcomes);

    for (const [criterionId, criterionOutcomes] of criterionGroups) {
      try {
        const criterionResult = await this.processCriterionBatch(
          userId,
          criterionId,
          criterionOutcomes
        );

        result.processedCount += criterionResult.processedCount;
        result.successCount += criterionResult.successCount;
        result.failureCount += criterionResult.failureCount;
        result.masteryUpdates += criterionResult.masteryUpdates;
        result.stageProgressions += criterionResult.stageProgressions;

      } catch (error) {
        result.errors.push(`Criterion ${criterionId} processing failed: ${error.message}`);
        result.failureCount += criterionOutcomes.length;
      }
    }

    return result;
  }

  /**
   * Process all outcomes for a single criterion
   */
  private async processCriterionBatch(
    userId: number,
    criterionId: string,
    outcomes: BatchReviewOutcome[]
  ): Promise<BatchProcessingResult> {
    const result: BatchProcessingResult = {
      success: true,
      processedCount: 0,
      successCount: 0,
      failureCount: 0,
      masteryUpdates: 0,
      stageProgressions: 0,
      errors: [],
      processingTime: 0
    };

    // Sort outcomes by review date (oldest first)
    const sortedOutcomes = outcomes.sort((a, b) => 
      a.reviewDate.getTime() - b.reviewDate.getTime()
    );

    // Process outcomes sequentially to maintain mastery progression
    for (const outcome of sortedOutcomes) {
      try {
        const masteryUpdate = await this.processSingleOutcome(userId, outcome);
        
        result.processedCount++;
        result.successCount++;
        
        if (masteryUpdate.newMasteryScore !== masteryUpdate.oldMasteryScore) {
          result.masteryUpdates++;
        }
        
        if (masteryUpdate.stageProgression) {
          result.stageProgressions++;
        }

      } catch (error) {
        result.failureCount++;
        result.errors.push(`Outcome processing failed: ${error.message}`);
      }
    }

    return result;
  }

  /**
   * Process a single review outcome
   */
  private async processSingleOutcome(
    userId: number,
    outcome: BatchReviewOutcome
  ): Promise<MasteryUpdateResult> {
    const { criterionId, isCorrect, reviewDate, timeSpentSeconds, confidence } = outcome;

    // Get current mastery progress
    const currentProgress = await this.getMasteryProgress(userId, criterionId);
    if (!currentProgress) {
      throw new Error(`No mastery progress found for criterion ${criterionId}`);
    }

    const oldMasteryScore = currentProgress.masteryScore;

    // Calculate new mastery score based on performance
    const newMasteryScore = this.calculateNewMasteryScore(
      oldMasteryScore,
      isCorrect,
      confidence,
      timeSpentSeconds
    );

    // Check for mastery achievement
    const isMastered = newMasteryScore >= currentProgress.masteryThreshold;

    // Check for UUE stage progression
    const stageProgression = await this.checkStageProgression(
      userId,
      criterionId,
      newMasteryScore,
      isMastered
    );

    // Update mastery progress
    await this.updateMasteryProgress(userId, criterionId, {
      masteryScore: newMasteryScore,
      isMastered,
      lastReviewAt: reviewDate,
      consecutiveCorrect: isCorrect ? currentProgress.consecutiveCorrect + 1 : 0,
      consecutiveIncorrect: isCorrect ? 0 : currentProgress.consecutiveIncorrect + 1
    });

    // Calculate next review interval
    const nextReviewAt = this.calculateNextReviewInterval(
      currentProgress.intervalStep,
      isCorrect,
      currentProgress.trackingIntensity
    );

    // Update review schedule
    await this.updateReviewSchedule(userId, criterionId, nextReviewAt);

    return {
      criterionId,
      oldMasteryScore,
      newMasteryScore,
      isMastered,
      stageProgression,
      nextReviewAt
    };
  }

  /**
   * Calculate new mastery score based on performance
   */
  private calculateNewMasteryScore(
    currentScore: number,
    isCorrect: boolean,
    confidence: number,
    timeSpentSeconds: number
  ): number {
    let scoreChange = 0;

    if (isCorrect) {
      // Positive score change based on confidence and time efficiency
      const confidenceBonus = confidence * 0.1; // 0-10% bonus
      const timeBonus = Math.max(0, (60 - timeSpentSeconds) / 60 * 0.05); // 0-5% bonus for speed
      scoreChange = 0.05 + confidenceBonus + timeBonus; // Base 5% + bonuses
    } else {
      // Negative score change based on confidence (higher confidence = bigger penalty)
      scoreChange = -(confidence * 0.1); // 0-10% penalty
    }

    // Apply score change with bounds
    const newScore = Math.max(0, Math.min(1, currentScore + scoreChange));
    return Math.round(newScore * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Check if user can progress to next UUE stage
   */
  private async checkStageProgression(
    userId: number,
    criterionId: string,
    masteryScore: number,
    isMastered: boolean
  ): Promise<boolean> {
    if (!isMastered) {
      return false;
    }

    // Get current stage and check if all criteria in current stage are mastered
    const currentStage = await this.getCurrentUueStage(userId, criterionId);
    const stageCriteria = await this.getStageCriteria(userId, currentStage);
    
    const allStageCriteriaMastered = stageCriteria.every(criterion => 
      criterion.masteryScore >= criterion.masteryThreshold
    );

    if (allStageCriteriaMastered) {
      // Progress to next stage
      await this.progressToNextStage(userId, criterionId, currentStage);
      return true;
    }

    return false;
  }

  /**
   * Calculate next review interval
   */
  private calculateNextReviewInterval(
    currentInterval: number,
    isCorrect: boolean,
    trackingIntensity: string
  ): Date {
    let newInterval: number;

    if (isCorrect) {
      // Progressive interval increase
      newInterval = Math.min(currentInterval * 1.5, 180); // Cap at 6 months
    } else {
      // Reset to shorter interval on failure
      newInterval = Math.max(1, Math.floor(currentInterval * 0.5));
    }

    // Apply tracking intensity multiplier
    const intensityMultipliers = {
      'DENSE': 0.7,
      'NORMAL': 1.0,
      'SPARSE': 1.5
    };

    const multiplier = intensityMultipliers[trackingIntensity] || 1.0;
    const adjustedInterval = Math.round(newInterval * multiplier);

    const nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + adjustedInterval);

    return nextReviewAt;
  }

  /**
   * Validate batch input data
   */
  private validateBatchInput(outcomes: BatchReviewOutcome[]): BatchValidationResult {
    const result: BatchValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      recommendations: []
    };

    if (!outcomes || outcomes.length === 0) {
      result.isValid = false;
      result.errors.push('No outcomes provided');
      return result;
    }

    if (outcomes.length > 1000) {
      result.warnings.push('Large batch size may impact performance');
      result.recommendations.push('Consider processing in smaller batches');
    }

    // Validate individual outcomes
    for (let i = 0; i < outcomes.length; i++) {
      const outcome = outcomes[i];
      
      if (!outcome.userId || !outcome.criterionId) {
        result.errors.push(`Outcome ${i}: Missing userId or criterionId`);
        result.isValid = false;
      }

      if (outcome.confidence < 0 || outcome.confidence > 1) {
        result.errors.push(`Outcome ${i}: Invalid confidence value (0-1)`);
        result.isValid = false;
      }

      if (outcome.timeSpentSeconds < 0) {
        result.errors.push(`Outcome ${i}: Invalid time spent`);
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Group outcomes by criterion for batch processing
   */
  private groupOutcomesByCriterion(outcomes: BatchReviewOutcome[]): Map<string, BatchReviewOutcome[]> {
    const groups = new Map<string, BatchReviewOutcome[]>();
    
    for (const outcome of outcomes) {
      if (!groups.has(outcome.criterionId)) {
        groups.set(outcome.criterionId, []);
      }
      groups.get(outcome.criterionId)!.push(outcome);
    }
    
    return groups;
  }

  /**
   * Split array into chunks for batch processing
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Mock helper methods for development
  private async getMasteryProgress(userId: number, criterionId: string): Promise<any> {
    return {
      masteryScore: 0.5,
      masteryThreshold: 0.8,
      intervalStep: 7,
      trackingIntensity: 'NORMAL',
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0
    };
  }

  private async updateMasteryProgress(userId: number, criterionId: string, data: any): Promise<void> {
    // Mock implementation
  }

  private async updateReviewSchedule(userId: number, criterionId: string, nextReviewAt: Date): Promise<void> {
    // Mock implementation
  }

  private async getCurrentUueStage(userId: number, criterionId: string): Promise<string> {
    return 'UNDERSTAND';
  }

  private async getStageCriteria(userId: number, stage: string): Promise<any[]> {
    return [];
  }

  private async progressToNextStage(userId: number, criterionId: string, currentStage: string): Promise<void> {
    // Mock implementation
  }
}




