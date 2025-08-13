import { PrismaClient } from '@prisma/client';
import { MasteryCriterion, UserCriterionMastery, UueStage, TrackingIntensity } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateCriterionData {
  id: string;
  blueprintSectionId: string;
  uueStage: UueStage;
  weight: number;
  masteryThreshold: number;
  description: string;
  questionTypes: string[];
}

export interface UpdateCriterionData {
  weight?: number;
  masteryThreshold?: number;
  description?: string;
  questionTypes?: string[];
}

export interface MasteryUpdateResult {
  success: boolean;
  newMasteryScore: number;
  isMastered: boolean;
  consecutiveIntervals: number;
  nextReviewAt: Date;
  message: string;
}

export interface CriterionMasteryResult {
  criterionId: string;
  masteryScore: number;
  isMastered: boolean;
  consecutiveIntervals: number;
  lastMasteredDate: Date | null;
  lastAttemptDate: Date;
  attemptHistory: number[];
}

export interface MasteryOptions {
  minGapDays?: number;
  customThreshold?: number;
  requireDifferentTimeSlots?: boolean;
  maxAttemptsForMastery?: number;
  allowRetrySameDay?: boolean;
  masteryDecayRate?: number;
  strictMode?: boolean;
}

export class MasteryCriterionService {
  /**
   * Create a new mastery criterion
   */
  async createCriterion(data: CreateCriterionData): Promise<MasteryCriterion> {
    return await prisma.masteryCriterion.create({
      data: {
        id: data.id,
        blueprintSectionId: data.blueprintSectionId,
        uueStage: data.uueStage,
        weight: data.weight,
        masteryThreshold: data.masteryThreshold,
        description: data.description,
        questionTypes: data.questionTypes,
      },
    });
  }

  /**
   * Get a criterion by ID
   */
  async getCriterion(id: string): Promise<MasteryCriterion | null> {
    return await prisma.masteryCriterion.findUnique({
      where: { id },
    });
  }

  /**
   * Update a criterion
   */
  async updateCriterion(id: string, data: UpdateCriterionData): Promise<MasteryCriterion> {
    return await prisma.masteryCriterion.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a criterion
   */
  async deleteCriterion(id: string): Promise<void> {
    await prisma.masteryCriterion.delete({
      where: { id },
    });
  }

  /**
   * Process a criterion review and update mastery tracking
   */
  async processCriterionReview(
    userId: number,
    criterionId: string,
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
    if (!options.allowRetrySameDay && userMastery.lastAttemptDate) {
      const daysSinceLastAttempt = this.getDaysDifference(userMastery.lastAttemptDate, new Date());
      if (daysSinceLastAttempt < minGapDays) {
        return {
          success: false,
          newMasteryScore: userMastery.masteryScore,
          isMastered: userMastery.isMastered,
          consecutiveIntervals: userMastery.consecutiveIntervals,
          nextReviewAt: userMastery.nextReviewAt!,
          message: `Minimum gap of ${minGapDays} days required between attempts`,
        };
      }
    }

    // Update attempt history and mastery score
    const newAttemptHistory = this.updateAttemptHistory(userMastery.attemptHistory, performance);
    const newMasteryScore = this.calculateMasteryScore(newAttemptHistory);
    
    // Check consecutive interval mastery
    const newConsecutiveIntervals = this.updateConsecutiveIntervals(
      userMastery.consecutiveIntervals,
      performance,
      threshold,
      userMastery.lastAttemptDate
    );

    const isMastered = newConsecutiveIntervals >= 2;
    const lastMasteredDate = isMastered && !userMastery.isMastered ? new Date() : userMastery.lastMasteredDate;

    // Update user mastery record
    const updatedMastery = await prisma.userCriterionMastery.update({
      where: { id: userMastery.id },
      data: {
        masteryScore: newMasteryScore,
        isMastered,
        consecutiveIntervals: newConsecutiveIntervals,
        lastMasteredDate,
        lastAttemptDate: new Date(),
        attemptHistory: newAttemptHistory,
      },
    });

    // Calculate next review interval
    const nextReviewAt = this.calculateNextReviewInterval(
      userMastery.currentIntervalStep,
      isCorrect,
      userMastery.trackingIntensity
    );

    return {
      success: true,
      newMasteryScore,
      isMastered,
      consecutiveIntervals: newConsecutiveIntervals,
      nextReviewAt,
      message: isMastered ? 'Criterion mastered!' : 'Progress recorded',
    };
  }

  /**
   * Calculate criterion mastery score from attempt history
   */
  async calculateCriterionMastery(
    criterionId: string,
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
      consecutiveIntervals: userMastery.consecutiveIntervals,
      lastMasteredDate: userMastery.lastMasteredDate,
      lastAttemptDate: userMastery.lastAttemptDate,
      attemptHistory: userMastery.attemptHistory,
    };
  }

  /**
   * Check if criterion meets consecutive interval mastery requirements
   */
  async checkConsecutiveIntervalMastery(
    criterionId: string,
    userId: number,
    options: MasteryOptions = {}
  ): Promise<boolean> {
    const userMastery = await this.getUserCriterionMastery(userId, criterionId);
    if (!userMastery) return false;

    const criterion = await this.getCriterion(criterionId);
    if (!criterion) return false;

    // Must have at least 2 attempts
    if (userMastery.attemptHistory.length < 2) return false;

    // Must be on different days
    const lastTwoDates = await this.getLastTwoAttemptDates(userId, criterionId);
    if (lastTwoDates.length < 2) return false;

    const daysDiff = this.getDaysDifference(lastTwoDates[0], lastTwoDates[1]);
    if (daysDiff < (options.minGapDays ?? 1)) return false;

    // Both attempts must be above threshold
    const [attempt1, attempt2] = userMastery.attemptHistory.slice(-2);
    const threshold = options.customThreshold ?? criterion.masteryThreshold;

    return attempt1 >= threshold && attempt2 >= threshold;
  }

  /**
   * Get criteria by UUE stage for a section
   */
  async getCriteriaByUueStage(sectionId: string, uueStage: UueStage): Promise<MasteryCriterion[]> {
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
  async canProgressToNextUueStage(userId: number, sectionId: string, currentStage: UueStage): Promise<boolean> {
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

  private async getOrCreateUserCriterionMastery(userId: number, criterionId: string): Promise<UserCriterionMastery> {
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
          consecutiveIntervals: 0,
          attemptHistory: [],
          currentIntervalStep: 0,
          trackingIntensity: 'NORMAL',
        },
      });
    }

    return userMastery;
  }

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

  private async getUserMasteriesForCriteria(criterionIds: string[], userId: number): Promise<UserCriterionMastery[]> {
    return await prisma.userCriterionMastery.findMany({
      where: {
        userId,
        masteryCriterionId: { in: criterionIds },
      },
    });
  }

  private async getLastTwoAttemptDates(userId: number, criterionId: string): Promise<Date[]> {
    // This would need to be implemented based on your actual data structure
    // For now, returning empty array as placeholder
    return [];
  }

  private getDaysDifference(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  private updateAttemptHistory(currentHistory: number[], newPerformance: number): number[] {
    const maxHistoryLength = 10; // Keep last 10 attempts
    const newHistory = [...currentHistory, newPerformance];
    return newHistory.slice(-maxHistoryLength);
  }

  private calculateMasteryScore(attemptHistory: number[]): number {
    if (attemptHistory.length === 0) return 0.0;
    
    // Use weighted average with recent attempts having more weight
    let totalWeightedScore = 0;
    let totalWeight = 0;
    
    for (let i = 0; i < attemptHistory.length; i++) {
      const weight = Math.pow(0.8, attemptHistory.length - 1 - i); // Decay factor
      totalWeightedScore += attemptHistory[i] * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? totalWeightedScore / totalWeight : 0.0;
  }

  private updateConsecutiveIntervals(
    currentConsecutive: number,
    performance: number,
    threshold: number,
    lastAttemptDate: Date | null
  ): number {
    if (performance >= threshold) {
      // Check if this is a different day from last attempt
      if (!lastAttemptDate || this.getDaysDifference(lastAttemptDate, new Date()) >= 1) {
        return currentConsecutive + 1;
      }
    } else {
      // Reset consecutive count on failure
      return 0;
    }
    
    return currentConsecutive;
  }

  private calculateNextReviewInterval(
    currentStep: number,
    isCorrect: boolean,
    trackingIntensity: TrackingIntensity
  ): Date {
    const baseIntervals = [1, 3, 7, 21, 60, 180]; // Days
    const intensityMultipliers = {
      DENSE: 0.7,
      NORMAL: 1.0,
      SPARSE: 1.5,
    };

    let nextStep = currentStep;
    if (isCorrect) {
      nextStep = Math.min(currentStep + 1, baseIntervals.length - 1);
    } else {
      nextStep = Math.max(currentStep - 1, 0);
    }

    const baseInterval = baseIntervals[nextStep];
    const multiplier = intensityMultipliers[trackingIntensity];
    const adjustedInterval = Math.round(baseInterval * multiplier);

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + adjustedInterval);
    
    return nextReviewDate;
  }
}

export const masteryCriterionService = new MasteryCriterionService();
