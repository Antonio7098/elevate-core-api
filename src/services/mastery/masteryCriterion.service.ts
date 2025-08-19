import { PrismaClient } from '@prisma/client';
import { MasteryCriterion, UserCriterionMastery, UueStage, AssessmentType } from '@prisma/client';
import { MasteryOptions } from './masteryConfiguration.service';
import { MasteryUpdateResult } from './enhancedBatchReview.service';

const prisma = new PrismaClient();

export interface CreateCriterionData {
  id?: number;
  blueprintSectionId: number;
  uueStage: UueStage;
  weight: number;
  masteryThreshold: number;
  description: string;
  questionTypes: string[];
  title: string;
  knowledgePrimitiveId: string;
  userId: number;
}

export interface UpdateCriterionData {
  weight?: number;
  masteryThreshold?: number;
  description?: string;
  questionTypes?: string[];
  title?: string;
}

// MasteryUpdateResult interface moved to enhancedBatchReview.service.ts to avoid conflicts

export interface CriterionMasteryResult {
  criterionId: number;
  masteryScore: number;
  isMastered: boolean;
  attempts: number;
  lastAttempt: Date | null;
}

// MasteryOptions interface moved to masteryConfiguration.service.ts to avoid conflicts

export class MasteryCriterionService {
  /**
   * Create a new mastery criterion
   */
  async createCriterion(data: CreateCriterionData): Promise<MasteryCriterion> {
    return await prisma.masteryCriterion.create({
      data: {
        blueprintSectionId: data.blueprintSectionId,
        uueStage: data.uueStage,
        weight: data.weight,
        masteryThreshold: data.masteryThreshold,
        description: data.description,
        title: data.title,
        knowledgePrimitiveId: data.knowledgePrimitiveId,
        userId: data.userId,
      },
    });
  }

  /**
   * Get a criterion by ID
   */
  async getCriterion(id: number): Promise<MasteryCriterion | null> {
    return await prisma.masteryCriterion.findUnique({
      where: { id },
    });
  }

  /**
   * Update a criterion
   */
  async updateCriterion(id: number, data: UpdateCriterionData): Promise<MasteryCriterion> {
    return await prisma.masteryCriterion.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a criterion
   */
  async deleteCriterion(id: number): Promise<void> {
    await prisma.masteryCriterion.delete({
      where: { id },
    });
  }

  /**
   * Process a criterion review and update mastery tracking
   */
  async processCriterionReview(
    userId: number,
    criterionId: number,
    isCorrect: boolean,
    performance: number, // 0.0 - 1.0 score
    options: MasteryOptions = {}
  ): Promise<MasteryUpdateResult> {
    const criterion = await this.getCriterion(criterionId);
    if (!criterion) {
      throw new Error(`Criterion ${criterionId} not found`);
    }

    const userMastery = await this.getOrCreateUserCriterionMastery(userId, criterionId);
    const threshold = options.customThreshold ?? criterion.masteryThreshold;
    const minGapDays = options.minGapDays ?? 1;

    // Check if enough time has passed since last attempt
    if (!options.allowRetrySameDay && userMastery.lastAttempt) {
      const daysSinceLastAttempt = this.getDaysDifference(userMastery.lastAttempt, new Date());
      if (daysSinceLastAttempt < minGapDays) {
        return {
          criterionId: criterionId.toString(),
          oldMasteryScore: userMastery.masteryScore,
          newMasteryScore: userMastery.masteryScore,
          isMastered: userMastery.isMastered,
          stageProgression: false,
          nextReviewAt: new Date(Date.now() + (minGapDays - daysSinceLastAttempt) * 24 * 60 * 60 * 1000),
        };
      }
    }

    // Update mastery score
    const newMasteryScore = this.calculateMasteryScore(userMastery.masteryScore, performance);
    const newAttempts = userMastery.attempts + 1;
    
    // Check if mastered
    const isMastered = newMasteryScore >= threshold;

    // Update user mastery record
    const updatedMastery = await prisma.userCriterionMastery.update({
      where: { userId_masteryCriterionId: { userId, masteryCriterionId: criterionId } },
      data: {
        masteryScore: newMasteryScore,
        isMastered,
        attempts: newAttempts,
        lastAttempt: new Date(),
      },
    });

    return {
      criterionId: criterionId.toString(),
      oldMasteryScore: userMastery.masteryScore,
      newMasteryScore,
      isMastered,
      stageProgression: isMastered && !userMastery.isMastered,
      nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Calculate criterion mastery score from attempt history
   */
  async calculateCriterionMastery(
    criterionId: number,
    userId: number,
    options: MasteryOptions = {}
  ): Promise<CriterionMasteryResult> {
    const userMastery = await this.getUserCriterionMastery(userId, criterionId);
    if (!userMastery) {
      throw new Error(`User mastery not found for criterion ${criterionId}`);
    }

    return {
      criterionId,
      masteryScore: userMastery.masteryScore,
      isMastered: userMastery.isMastered,
      attempts: userMastery.attempts,
      lastAttempt: userMastery.lastAttempt,
    };
  }

  /**
   * Check if criterion meets consecutive interval mastery requirements
   */
  async checkConsecutiveIntervalMastery(
    criterionId: number,
    userId: number,
    options: MasteryOptions = {}
  ): Promise<boolean> {
    const userMastery = await this.getUserCriterionMastery(userId, criterionId);
    if (!userMastery) return false;

    const criterion = await this.getCriterion(criterionId);
    if (!criterion) return false;

    // Must have at least 2 attempts
    if (userMastery.attempts < 2) return false;

    // Must be on different days
    const lastTwoDates = await this.getLastTwoAttemptDates(userId, criterionId);
    if (lastTwoDates.length < 2) return false;

    const daysDiff = this.getDaysDifference(lastTwoDates[0], lastTwoDates[1]);
    if (daysDiff < (options.minGapDays ?? 1)) return false;

    // Both attempts must be above threshold
    const threshold = options.customThreshold ?? criterion.masteryThreshold;

    return userMastery.masteryScore >= threshold;
  }

  /**
   * Get criteria by UUE stage for a section
   */
  async getCriteriaByUueStage(sectionId: number, uueStage: UueStage): Promise<MasteryCriterion[]> {
    return await prisma.masteryCriterion.findMany({
      where: {
        blueprintSectionId: sectionId,
        uueStage,
      },
      orderBy: { weight: 'desc' },
    });
  }

  /**
   * Check if user can progress to next UUE stage
   */
  async canProgressToNextUueStage(userId: number, sectionId: number, currentStage: UueStage): Promise<boolean> {
    const currentStageCriteria = await this.getCriteriaByUueStage(sectionId, currentStage);
    const userMasteries = await this.getUserMasteriesForCriteria(
      currentStageCriteria.map(c => c.id),
      userId
    );

    // All criteria in current stage must be mastered
    for (const criterion of currentStageCriteria) {
      const userMastery = userMasteries.find(m => m.masteryCriterionId === criterion.id);
      if (!userMastery || !userMastery.isMastered) {
        return false;
      }
    }

    return true;
  }

  // Private helper methods

  private async getOrCreateUserCriterionMastery(userId: number, criterionId: number): Promise<UserCriterionMastery> {
    let userMastery = await this.getUserCriterionMastery(userId, criterionId);
    
    if (!userMastery) {
      const criterion = await this.getCriterion(criterionId);
      if (!criterion) {
        throw new Error(`Criterion ${criterionId} not found`);
      }

      userMastery = await prisma.userCriterionMastery.create({
        data: {
          userId,
          masteryCriterionId: criterionId,
          blueprintSectionId: criterion.blueprintSectionId,
          masteryScore: 0.0,
          attempts: 0,
        },
      });
    }

    return userMastery;
  }

  private async getUserCriterionMastery(userId: number, criterionId: number): Promise<UserCriterionMastery | null> {
    return await prisma.userCriterionMastery.findUnique({
      where: {
        userId_masteryCriterionId: {
          userId,
          masteryCriterionId: criterionId,
        },
      },
    });
  }

  private async getUserMasteriesForCriteria(criterionIds: number[], userId: number): Promise<UserCriterionMastery[]> {
    return await prisma.userCriterionMastery.findMany({
      where: {
        userId,
        masteryCriterionId: { in: criterionIds },
      },
    });
  }

  private async getLastTwoAttemptDates(userId: number, criterionId: number): Promise<Date[]> {
    // This would need to be implemented based on your actual data structure
    // For now, returning empty array as placeholder
    return [];
  }

  private getDaysDifference(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  private calculateMasteryScore(currentScore: number, newPerformance: number): number {
    // Simple weighted average with new performance having more weight
    const weight = 0.7; // 70% weight for new performance
    return (currentScore * (1 - weight)) + (newPerformance * weight);
  }
}

export const masteryCriterionService = new MasteryCriterionService();

