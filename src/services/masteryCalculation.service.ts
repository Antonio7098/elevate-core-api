import { PrismaClient } from '@prisma/client';
import { MasteryCriterion, UserCriterionMastery, UueStage, BlueprintSection } from '@prisma/client';
import { masteryCriterionService } from './masteryCriterion.service';

const prisma = new PrismaClient();

export interface UueStageMasteryResult {
  stage: UueStage;
  masteryScore: number;
  isMastered: boolean;
  totalCriteria: number;
  masteredCriteria: number;
  totalWeight: number;
  criteriaBreakdown: CriterionMasteryBreakdown[];
}

export interface CriterionMasteryBreakdown {
  criterionId: string;
  description: string;
  weight: number;
  masteryScore: number;
  isMastered: boolean;
  consecutiveIntervals: number;
}

export interface PrimitiveMasteryResult {
  primitiveId: string;
  sectionId: string;
  masteryScore: number;
  isMastered: boolean;
  totalStages: number;
  masteredStages: number;
  stageBreakdown: StageMasteryBreakdown[];
  overallProgress: number;
}

export interface StageMasteryBreakdown {
  stage: UueStage;
  masteryScore: number;
  isMastered: boolean;
  criteriaCount: number;
  masteredCriteria: number;
}

export interface SectionMasteryThreshold {
  sectionId: string;
  threshold: 'SURVEY' | 'PROFICIENT' | 'EXPERT';
  thresholdValue: number;
  description: string;
}

export class MasteryCalculationService {
  // Default mastery thresholds
  private readonly defaultThresholds = {
    SURVEY: 0.6,      // 60% - Basic familiarity
    PROFICIENT: 0.8,  // 80% - Solid understanding
    EXPERT: 0.95,     // 95% - Deep mastery
  };

  /**
   * Calculate mastery score for a specific criterion
   */
  async calculateCriterionMasteryScore(
    criterionId: string,
    userId: number
  ): Promise<number> {
    const userMastery = await prisma.userCriterionMastery.findUnique({
      where: {
        userId_masteryCriterionId: {
          userId,
          masteryCriterionId: criterionId,
        },
      },
    });

    if (!userMastery) return 0.0;

    // Use the stored mastery score (calculated by MasteryCriterionService)
    return userMastery.masteryScore;
  }

  /**
   * Calculate UUE stage mastery from weighted average of criterion mastery
   */
  async calculateUueStageMastery(
    sectionId: string,
    uueStage: UueStage,
    userId: number
  ): Promise<UueStageMasteryResult> {
    // Get all criteria for this stage
    const criteria = await masteryCriterionService.getCriteriaByUueStage(sectionId, uueStage);
    
    if (criteria.length === 0) {
      return {
        stage: uueStage,
        masteryScore: 0.0,
        isMastered: false,
        totalCriteria: 0,
        masteredCriteria: 0,
        totalWeight: 0,
        criteriaBreakdown: [],
      };
    }

    // Get user mastery for all criteria in this stage
    const userMasteries = await this.getUserMasteriesForCriteria(
      criteria.map(c => c.id),
      userId
    );

    // Calculate weighted mastery
    const { weightedMastery, totalWeight, masteredCriteria, breakdown } = 
      this.calculateWeightedMastery(criteria, userMasteries);

    // Get user's mastery threshold for this section
    const userThreshold = await this.getUserMasteryThreshold(sectionId, userId);
    const thresholdValue = this.defaultThresholds[userThreshold];

    const isMastered = weightedMastery >= thresholdValue;

    return {
      stage: uueStage,
      masteryScore: weightedMastery,
      isMastered,
      totalCriteria: criteria.length,
      masteredCriteria,
      totalWeight,
      criteriaBreakdown: breakdown,
    };
  }

  /**
   * Calculate primitive mastery (all stages must be mastered)
   */
  async calculatePrimitiveMastery(
    sectionId: string,
    userId: number
  ): Promise<PrimitiveMasteryResult> {
    // Get all UUE stages for this section
    const stages: UueStage[] = ['UNDERSTAND', 'USE', 'EXPLORE'];
    
    const stageResults: StageMasteryBreakdown[] = [];
    let totalMasteryScore = 0;
    let masteredStages = 0;

    // Calculate mastery for each stage
    for (const stage of stages) {
      const stageResult = await this.calculateUueStageMastery(sectionId, stage, userId);
      
      stageResults.push({
        stage,
        masteryScore: stageResult.masteryScore,
        isMastered: stageResult.isMastered,
        criteriaCount: stageResult.totalCriteria,
        masteredCriteria: stageResult.masteredCriteria,
      });

      totalMasteryScore += stageResult.masteryScore;
      if (stageResult.isMastered) {
        masteredStages++;
      }
    }

    // Calculate overall mastery (average of all stages)
    const overallMastery = stages.length > 0 ? totalMasteryScore / stages.length : 0;
    
    // All stages must be mastered for primitive completion
    const isMastered = masteredStages === stages.length;
    
    // Calculate overall progress percentage
    const overallProgress = (masteredStages / stages.length) * 100;

    return {
      primitiveId: sectionId, // Using sectionId as primitiveId for now
      sectionId,
      masteryScore: overallMastery,
      isMastered,
      totalStages: stages.length,
      masteredStages,
      stageBreakdown: stageResults,
      overallProgress,
    };
  }

  /**
   * Calculate weighted mastery from criteria and user masteries
   */
  calculateWeightedMastery(
    criteria: MasteryCriterion[],
    userMasteries: UserCriterionMastery[]
  ): {
    weightedMastery: number;
    totalWeight: number;
    masteredCriteria: number;
    breakdown: CriterionMasteryBreakdown[];
  } {
    let totalWeightedScore = 0;
    let totalWeight = 0;
    let masteredCriteria = 0;
    const breakdown: CriterionMasteryBreakdown[] = [];

    for (const criterion of criteria) {
      const userMastery = userMasteries.find(m => m.masteryCriterionId === criterion.id);
      const masteryScore = userMastery?.masteryScore ?? 0.0;
      const weight = criterion.weight;
      
      totalWeightedScore += masteryScore * weight;
      totalWeight += weight;
      
      if (userMastery?.isMastered) {
        masteredCriteria++;
      }

      breakdown.push({
        criterionId: criterion.id,
        description: criterion.description,
        weight,
        masteryScore,
        isMastered: userMastery?.isMastered ?? false,
        consecutiveIntervals: userMastery?.consecutiveIntervals ?? 0,
      });
    }

    const weightedMastery = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    return {
      weightedMastery,
      totalWeight,
      masteredCriteria,
      breakdown,
    };
  }

  /**
   * Get mastery summary for a user across all sections
   */
  async getUserMasterySummary(userId: number): Promise<{
    totalSections: number;
    masteredSections: number;
    totalCriteria: number;
    masteredCriteria: number;
    averageMasteryScore: number;
    stageBreakdown: Record<UueStage, { count: number; mastered: number }>;
  }> {
    // Get all user masteries
    const userMasteries = await prisma.userCriterionMastery.findMany({
      where: { userId },
      include: {
        masteryCriterion: true,
        blueprintSection: true,
      },
    });

    // Group by section
    const sectionGroups = new Map<string, UserCriterionMastery[]>();
    for (const mastery of userMasteries) {
      const sectionId = mastery.blueprintSectionId;
      if (!sectionGroups.has(sectionId)) {
        sectionGroups.set(sectionId, []);
      }
      sectionGroups.get(sectionId)!.push(mastery);
    }

    let totalSections = sectionGroups.size;
    let masteredSections = 0;
    let totalCriteria = userMasteries.length;
    let masteredCriteria = userMasteries.filter(m => m.isMastered).length;
    let totalMasteryScore = 0;

    const stageBreakdown: Record<UueStage, { count: number; mastered: number }> = {
      UNDERSTAND: { count: 0, mastered: 0 },
      USE: { count: 0, mastered: 0 },
      EXPLORE: { count: 0, mastered: 0 },
    };

    // Calculate section mastery and stage breakdown
    for (const [sectionId, masteries] of sectionGroups) {
      const sectionMastery = await this.calculatePrimitiveMastery(sectionId, userId);
      if (sectionMastery.isMastered) {
        masteredSections++;
      }

      totalMasteryScore += sectionMastery.masteryScore;

      // Update stage breakdown
      for (const stageResult of sectionMastery.stageBreakdown) {
        stageBreakdown[stageResult.stage].count += stageResult.criteriaCount;
        stageBreakdown[stageResult.stage].mastered += stageResult.masteredCriteria;
      }
    }

    const averageMasteryScore = totalSections > 0 ? totalMasteryScore / totalSections : 0;

    return {
      totalSections,
      masteredSections,
      totalCriteria,
      masteredCriteria,
      averageMasteryScore,
      stageBreakdown,
    };
  }

  /**
   * Get learning progress over time
   */
  async getLearningProgress(
    userId: number,
    days: number = 30
  ): Promise<{
    date: string;
    criteriaAttempted: number;
    criteriaMastered: number;
    averageScore: number;
  }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all mastery attempts in the time period
    const masteries = await prisma.userCriterionMastery.findMany({
      where: {
        userId,
        lastAttemptDate: {
          gte: startDate,
        },
      },
      orderBy: { lastAttemptDate: 'asc' },
    });

    // Group by date
    const dailyProgress = new Map<string, {
      criteriaAttempted: number;
      criteriaMastered: number;
      totalScore: number;
      count: number;
    }>();

    for (const mastery of masteries) {
      const dateKey = mastery.lastAttemptDate.toISOString().split('T')[0];
      
      if (!dailyProgress.has(dateKey)) {
        dailyProgress.set(dateKey, {
          criteriaAttempted: 0,
          criteriaMastered: 0,
          totalScore: 0,
          count: 0,
        });
      }

      const dayData = dailyProgress.get(dateKey)!;
      dayData.criteriaAttempted++;
      dayData.totalScore += mastery.masteryScore;
      dayData.count++;

      if (mastery.isMastered) {
        dayData.criteriaMastered++;
      }
    }

    // Convert to array format
    const progress = Array.from(dailyProgress.entries()).map(([date, data]) => ({
      date,
      criteriaAttempted: data.criteriaAttempted,
      criteriaMastered: data.criteriaMastered,
      averageScore: data.count > 0 ? data.totalScore / data.count : 0,
    }));

    return progress.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get user's mastery threshold for a section
   */
  private async getUserMasteryThreshold(sectionId: string, userId: number): Promise<'SURVEY' | 'PROFICIENT' | 'EXPERT'> {
    // Try to get user-specific threshold
    const userThreshold = await prisma.sectionMasteryThreshold.findUnique({
      where: {
        userId_sectionId: {
          userId,
          sectionId,
        },
      },
    });

    if (userThreshold) {
      return userThreshold.threshold as 'SURVEY' | 'PROFICIENT' | 'EXPERT';
    }

    // Default to PROFICIENT if no user preference
    return 'PROFICIENT';
  }

  /**
   * Set user's mastery threshold for a section
   */
  async setUserMasteryThreshold(
    userId: number,
    sectionId: string,
    threshold: 'SURVEY' | 'PROFICIENT' | 'EXPERT'
  ): Promise<void> {
    await prisma.sectionMasteryThreshold.upsert({
      where: {
        userId_sectionId: {
          userId,
          sectionId,
        },
      },
      update: {
        threshold,
        thresholdValue: this.defaultThresholds[threshold],
        description: `User prefers ${threshold.toLowerCase()} level mastery`,
      },
      create: {
        userId,
        sectionId,
        threshold,
        thresholdValue: this.defaultThresholds[threshold],
        description: `User prefers ${threshold.toLowerCase()} level mastery`,
      },
    });
  }

  /**
   * Get criteria that need attention (low mastery scores)
   */
  async getCriteriaNeedingAttention(
    userId: number,
    threshold: number = 0.5
  ): Promise<{
    criterionId: string;
    description: string;
    currentScore: number;
    daysSinceLastAttempt: number;
    recommendedAction: string;
  }[]> {
    const lowMasteryCriteria = await prisma.userCriterionMastery.findMany({
      where: {
        userId,
        masteryScore: {
          lt: threshold,
        },
        isMastered: false,
      },
      include: {
        masteryCriterion: true,
      },
      orderBy: { masteryScore: 'asc' },
    });

    return lowMasteryCriteria.map(mastery => {
      const daysSinceLastAttempt = mastery.lastAttemptDate 
        ? this.getDaysDifference(mastery.lastAttemptDate, new Date())
        : 999;

      let recommendedAction = 'Review soon';
      if (daysSinceLastAttempt > 7) {
        recommendedAction = 'Urgent review needed';
      } else if (daysSinceLastAttempt > 3) {
        recommendedAction = 'Review this week';
      }

      return {
        criterionId: mastery.masteryCriterionId,
        description: mastery.masteryCriterion.description,
        currentScore: mastery.masteryScore,
        daysSinceLastAttempt,
        recommendedAction,
      };
    });
  }

  // Private helper methods

  private async getUserMasteriesForCriteria(
    criterionIds: string[],
    userId: number
  ): Promise<UserCriterionMastery[]> {
    return await prisma.userCriterionMastery.findMany({
      where: {
        userId,
        masteryCriterionId: { in: criterionIds },
      },
    });
  }

  private getDaysDifference(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}

export const masteryCalculationService = new MasteryCalculationService();
