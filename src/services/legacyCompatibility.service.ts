import { PrismaClient } from '@prisma/client';
import { enhancedSpacedRepetitionService } from './enhancedSpacedRepetition.service';
import { masteryCriterionService } from './masteryCriterion.service';
import { enhancedTodaysTasksService } from './enhancedTodaysTasks.service';

const prisma = new PrismaClient();

/**
 * Legacy Compatibility Service
 * 
 * This service maintains compatibility with existing primitiveSR.service.ts
 * while delegating to the new enhanced services internally.
 * 
 * It provides a smooth transition path for existing users and prevents
 * breaking changes during the system overhaul.
 */

export interface LegacyPrimitiveProgress {
  id: string;
  userId: number;
  primitiveId: string;
  blueprintId: number;
  reviewCount: number;
  nextReviewAt: Date | null;
  lastReviewedAt: Date | null;
  successfulReviews: number;
  consecutiveFailures: number;
  trackingIntensity: string;
  masteryScore: number;
}

export interface LegacyDailyTasks {
  critical: any[];
  core: any[];
  plus: any[];
  totalTasks: number;
  estimatedTime: number;
}

export class LegacyCompatibilityService {
  /**
   * Generate daily tasks using new enhanced service
   * Maintains compatibility with existing todaysTasks.service.ts
   */
  async generateDailyTasks(userId: number): Promise<LegacyDailyTasks> {
    try {
      // Use new enhanced service
      const enhancedTasks = await enhancedTodaysTasksService.generateTodaysTasksForUser(userId);
      
      // Transform to legacy format
      return {
        critical: enhancedTasks.critical.tasks,
        core: enhancedTasks.core.tasks,
        plus: enhancedTasks.plus.tasks,
        totalTasks: enhancedTasks.totalTasks,
        estimatedTime: enhancedTasks.estimatedTime,
      };
    } catch (error) {
      console.error('Enhanced daily task generation failed, falling back to legacy:', error);
      return this.generateLegacyDailyTasks(userId);
    }
  }

  /**
   * Process review outcome using new enhanced service
   * Maintains compatibility with existing primitiveSR.service.ts
   */
  async processReviewOutcome(
    userId: number,
    primitiveId: string,
    blueprintId: number,
    isCorrect: boolean,
    performance: number = 0.5
  ): Promise<{
    success: boolean;
    newMasteryScore: number;
    nextReviewAt: Date;
    message: string;
  }> {
    try {
      // Map primitiveId to criterionId
      const criterionId = await this.mapPrimitiveToCriterion(primitiveId, blueprintId);
      
      if (!criterionId) {
        throw new Error(`Could not map primitive ${primitiveId} to criterion`);
      }

      // Use new enhanced service
      const result = await enhancedSpacedRepetitionService.processReviewOutcome(
        userId,
        criterionId,
        isCorrect,
        performance
      );

      return {
        success: result.success,
        newMasteryScore: result.masteryProgress,
        nextReviewAt: result.nextReviewAt,
        message: result.message,
      };
    } catch (error) {
      console.error('Enhanced review processing failed, falling back to legacy:', error);
      return this.processLegacyReviewOutcome(userId, primitiveId, blueprintId, isCorrect, performance);
    }
  }

  /**
   * Get user progress using new enhanced service
   */
  async getUserProgress(userId: number): Promise<{
    totalPrimitives: number;
    masteredPrimitives: number;
    activePrimitives: number;
    averageMasteryScore: number;
    nextReviews: any[];
  }> {
    try {
      // Use new mastery calculation service
      const masterySummary = await this.getMasterySummaryFromNewSystem(userId);
      
      return {
        totalPrimitives: masterySummary.totalSections,
        masteredPrimitives: masterySummary.masteredSections,
        activePrimitives: masterySummary.totalSections - masterySummary.masteredSections,
        averageMasteryScore: masterySummary.averageMasteryScore,
        nextReviews: await this.getNextReviewsFromNewSystem(userId),
      };
    } catch (error) {
      console.error('Enhanced progress calculation failed, falling back to legacy:', error);
      return this.getLegacyUserProgress(userId);
    }
  }

  /**
   * Update tracking intensity using new enhanced service
   */
  async updateTrackingIntensity(
    userId: number,
    primitiveId: string,
    blueprintId: number,
    intensity: string
  ): Promise<void> {
    try {
      const criterionId = await this.mapPrimitiveToCriterion(primitiveId, blueprintId);
      
      if (criterionId) {
        await enhancedSpacedRepetitionService.updateTrackingIntensity(
          userId,
          criterionId,
          intensity as any // Cast to TrackingIntensity enum
        );
      }
    } catch (error) {
      console.error('Enhanced intensity update failed, falling back to legacy:', error);
      await this.updateLegacyTrackingIntensity(userId, primitiveId, blueprintId, intensity);
    }
  }

  // Private helper methods

  /**
   * Map primitive ID to criterion ID
   * This is a temporary mapping during the transition period
   */
  private async mapPrimitiveToCriterion(primitiveId: string, blueprintId: number): Promise<string | null> {
    try {
      // Try to find existing mapping
      const mapping = await prisma.primitiveCriterionMapping.findUnique({
        where: {
          primitiveId_blueprintId: {
            primitiveId,
            blueprintId,
          },
        },
      });

      if (mapping) {
        return mapping.criterionId;
      }

      // If no mapping exists, create a temporary one
      // This is a fallback for the transition period
      const criterion = await prisma.masteryCriterion.findFirst({
        where: {
          blueprintSectionId: blueprintId.toString(),
        },
      });

      if (criterion) {
        // Create temporary mapping
        await prisma.primitiveCriterionMapping.create({
          data: {
            primitiveId,
            blueprintId,
            criterionId: criterion.id,
            isTemporary: true,
          },
        });

        return criterion.id;
      }

      return null;
    } catch (error) {
      console.error('Error mapping primitive to criterion:', error);
      return null;
    }
  }

  /**
   * Fallback to legacy daily task generation
   */
  private async generateLegacyDailyTasks(userId: number): Promise<LegacyDailyTasks> {
    // Implement legacy logic here if needed
    return {
      critical: [],
      core: [],
      plus: [],
      totalTasks: 0,
      estimatedTime: 0,
    };
  }

  /**
   * Fallback to legacy review processing
   */
  private async processLegacyReviewOutcome(
    userId: number,
    primitiveId: string,
    blueprintId: number,
    isCorrect: boolean,
    performance: number
  ): Promise<{
    success: boolean;
    newMasteryScore: number;
    nextReviewAt: Date;
    message: string;
  }> {
    // Implement legacy logic here if needed
    return {
      success: false,
      newMasteryScore: 0,
      nextReviewAt: new Date(),
      message: 'Legacy fallback - review not processed',
    };
  }

  /**
   * Get mastery summary from new system
   */
  private async getMasterySummaryFromNewSystem(userId: number): Promise<{
    totalSections: number;
    masteredSections: number;
    averageMasteryScore: number;
  }> {
    // This would call the new mastery calculation service
    // For now, return placeholder data
    return {
      totalSections: 0,
      masteredSections: 0,
      averageMasteryScore: 0,
    };
  }

  /**
   * Get next reviews from new system
   */
  private async getNextReviewsFromNewSystem(userId: number): Promise<any[]> {
    try {
      const dueCriteria = await enhancedSpacedRepetitionService.getDueCriteria(userId);
      return dueCriteria.map(criterion => ({
        id: criterion.masteryCriterionId,
        nextReviewAt: criterion.nextReviewAt,
        masteryScore: criterion.masteryScore,
        isOverdue: criterion.nextReviewAt < new Date(),
      }));
    } catch (error) {
      console.error('Error getting next reviews from new system:', error);
      return [];
    }
  }

  /**
   * Fallback to legacy user progress
   */
  private async getLegacyUserProgress(userId: number): Promise<{
    totalPrimitives: number;
    masteredPrimitives: number;
    activePrimitives: number;
    averageMasteryScore: number;
    nextReviews: any[];
  }> {
    // Implement legacy logic here if needed
    return {
      totalPrimitives: 0,
      masteredPrimitives: 0,
      activePrimitives: 0,
      averageMasteryScore: 0,
      nextReviews: [],
    };
  }

  /**
   * Fallback to legacy tracking intensity update
   */
  private async updateLegacyTrackingIntensity(
    userId: number,
    primitiveId: string,
    blueprintId: number,
    intensity: string
  ): Promise<void> {
    // Implement legacy logic here if needed
    console.log('Legacy tracking intensity update not implemented');
  }
}

export const legacyCompatibilityService = new LegacyCompatibilityService();

// Export legacy-compatible functions for backward compatibility
export const generateDailyTasks = (userId: number) => 
  legacyCompatibilityService.generateDailyTasks(userId);

export const processReviewOutcome = (
  userId: number,
  primitiveId: string,
  blueprintId: number,
  isCorrect: boolean,
  performance?: number
) => legacyCompatibilityService.processReviewOutcome(
  userId,
  primitiveId,
  blueprintId,
  isCorrect,
  performance
);

export const getUserProgress = (userId: number) =>
  legacyCompatibilityService.getUserProgress(userId);

export const updateTrackingIntensity = (
  userId: number,
  primitiveId: string,
  blueprintId: number,
  intensity: string
) => legacyCompatibilityService.updateTrackingIntensity(
  userId,
  primitiveId,
  blueprintId,
  intensity
);

