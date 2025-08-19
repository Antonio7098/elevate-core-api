import { PrismaClient } from '@prisma/client';
import { UueStage, UserCriterionMastery, MasteryCriterion } from '@prisma/client';
import { masteryCalculationService } from './masteryCalculation.service';
import { masteryCriterionService } from './masteryCriterion.service';

const prisma = new PrismaClient();

export interface StageProgressionResult {
  currentStage: UueStage;
  canProgress: boolean;
  nextStage: UueStage | null;
  prerequisitesMet: boolean;
  missingCriteria: string[];
  progressPercentage: number;
  recommendations: string[];
}

export interface StageUnlockResult {
  stage: UueStage;
  unlocked: boolean;
  unlockDate: Date | null;
  criteriaProgress: {
    total: number;
    mastered: number;
    remaining: number;
  };
  nextMilestone: string;
}

export interface LearningPath {
  sectionId: number;
  sectionName: string;
  stages: {
    stage: UueStage;
    status: 'LOCKED' | 'IN_PROGRESS' | 'MASTERED';
    progress: number;
    estimatedCompletion: Date | null;
    criteria: {
      id: number;
      description: string;
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED';
      masteryScore: number;
    }[];
  }[];
  overallProgress: number;
  estimatedTotalTime: number; // in minutes
}

export class UueStageProgressionService {
  // UUE stage progression order
  private readonly stageOrder: UueStage[] = ['UNDERSTAND', 'USE', 'EXPLORE'];
  
  // Minimum mastery thresholds for stage advancement
  private readonly stageThresholds = {
    UNDERSTAND: 0.8, // 80% mastery required
    USE: 0.8,        // 80% mastery required
    EXPLORE: 0.8,    // 80% mastery required
  };

  /**
   * Check if user can progress to next UUE stage
   */
  async canProgressToNextUueStage(
    userId: number,
    sectionId: number,
    currentStage: UueStage
  ): Promise<StageProgressionResult> {
    // Get current stage criteria and user mastery
    const currentStageCriteria = await masteryCriterionService.getCriteriaByUueStage(sectionId, currentStage);
    const userMasteries = await this.getUserMasteriesForCriteria(
      currentStageCriteria.map(c => c.id),
      userId
    );

    // Check if all criteria in current stage are mastered
    let masteredCriteria = 0;
    let totalMasteryScore = 0;
    const missingCriteria: string[] = [];

    for (const criterion of currentStageCriteria) {
      const userMastery = userMasteries.find(m => m.masteryCriterionId === criterion.id);
      if (userMastery) {
        totalMasteryScore += userMastery.masteryScore;
        if (userMastery.isMastered) {
          masteredCriteria++;
        } else {
          missingCriteria.push(criterion.description);
        }
      }
    }

    const progressPercentage = (masteredCriteria / currentStageCriteria.length) * 100;
    const prerequisitesMet = masteredCriteria === currentStageCriteria.length;
    
    // Determine next stage
    const currentStageIndex = this.stageOrder.indexOf(currentStage);
    const nextStage = currentStageIndex < this.stageOrder.length - 1 
      ? this.stageOrder[currentStageIndex + 1] 
      : null;

    // Generate recommendations
    const recommendations = this.generateProgressionRecommendations(
      currentStage,
      progressPercentage,
      missingCriteria,
      userMasteries
    );

    return {
      currentStage,
      canProgress: prerequisitesMet,
      nextStage,
      prerequisitesMet,
      missingCriteria,
      progressPercentage,
      recommendations,
    };
  }

  /**
   * Unlock next UUE stage when prerequisites are met
   */
  async unlockNextStage(
    userId: number,
    sectionId: number,
    currentStage: UueStage
  ): Promise<StageUnlockResult | null> {
    const progressionResult = await this.canProgressToNextUueStage(userId, sectionId, currentStage);
    
    if (!progressionResult.canProgress || !progressionResult.nextStage) {
      return null;
    }

    const nextStage = progressionResult.nextStage!;
    
    // Get criteria for next stage
    const nextStageCriteria = await masteryCriterionService.getCriteriaByUueStage(sectionId, nextStage);
    
    // Create user mastery records for next stage criteria
    for (const criterion of nextStageCriteria) {
      await this.createUserMasteryRecord(userId, criterion.id, sectionId, nextStage);
    }

    // Record stage unlock
    await this.recordStageUnlock(userId, sectionId, nextStage);

    return {
      stage: nextStage,
      unlocked: true,
      unlockDate: new Date(),
      criteriaProgress: {
        total: nextStageCriteria.length,
        mastered: 0,
        remaining: nextStageCriteria.length,
      },
      nextMilestone: this.getNextMilestone(nextStage),
    };
  }

  /**
   * Get complete learning path for a user
   */
  async getLearningPath(userId: number, sectionId: number): Promise<LearningPath> {
    const section = await prisma.blueprintSection.findUnique({
      where: { id: sectionId },
      select: { name: true },
    });

    if (!section) {
      throw new Error(`Section ${sectionId} not found`);
    }

    const stages: LearningPath['stages'] = [];
    let overallProgress = 0;
    let estimatedTotalTime = 0;

    // Process each UUE stage
    for (const stage of this.stageOrder) {
      const stageResult = await this.getStageStatus(userId, sectionId, stage);
      stages.push(stageResult);
      
      overallProgress += stageResult.progress;
      if (stageResult.estimatedCompletion) {
        estimatedTotalTime += this.estimateStageTime(stageResult);
      }
    }

    overallProgress = overallProgress / this.stageOrder.length;

    return {
      sectionId,
      sectionName: section.name,
      stages,
      overallProgress,
      estimatedTotalTime,
    };
  }

  /**
   * Get stage status and progress
   */
  private async getStageStatus(
    userId: number,
    sectionId: number,
    stage: UueStage
  ): Promise<LearningPath['stages'][0]> {
    const criteria = await masteryCriterionService.getCriteriaByUueStage(sectionId, stage);
    const userMasteries = await this.getUserMasteriesForCriteria(
      criteria.map(c => c.id),
      userId
    );

    let masteredCount = 0;
    let totalMasteryScore = 0;
    const criteriaDetails = [];

    for (const criterion of criteria) {
      const userMastery = userMasteries.find(m => m.masteryCriterionId === criterion.id);
      const masteryScore = userMastery?.masteryScore ?? 0;
      const status = this.getCriterionStatus(userMastery);
      
      if (status === 'MASTERED') {
        masteredCount++;
      }
      
      totalMasteryScore += masteryScore;
      
      criteriaDetails.push({
        id: criterion.id,
        description: criterion.description,
        status,
        masteryScore,
      });
    }

    const progress = criteria.length > 0 ? (masteredCount / criteria.length) * 100 : 0;
    const status = this.determineStageStatus(progress, masteredCount, criteria.length);
    const estimatedCompletion = this.estimateStageCompletion(userId, sectionId, stage, progress);

    return {
      stage,
      status,
      progress,
      estimatedCompletion,
      criteria: criteriaDetails,
    };
  }

  /**
   * Get user's current stage in a section
   */
  async getCurrentStage(userId: number, sectionId: number): Promise<UueStage> {
    // Find the highest stage where user has some progress
    for (let i = this.stageOrder.length - 1; i >= 0; i--) {
      const stage = this.stageOrder[i];
      const criteria = await masteryCriterionService.getCriteriaByUueStage(sectionId, stage);
      const userMasteries = await this.getUserMasteriesForCriteria(
        criteria.map(c => c.id),
        userId
      );

      if (userMasteries.length > 0) {
        return stage;
      }
    }

    return 'UNDERSTAND'; // Default to first stage
  }

  /**
   * Get stage completion statistics
   */
  async getStageCompletionStats(userId: number, sectionId: number): Promise<{
    totalStages: number;
    completedStages: number;
    currentStage: UueStage;
    nextMilestone: string;
    estimatedTimeToCompletion: number; // in minutes
  }> {
    const currentStage = await this.getCurrentStage(userId, sectionId);
    const learningPath = await this.getLearningPath(userId, sectionId);
    
    const completedStages = learningPath.stages.filter(s => s.status === 'MASTERED').length;
    const nextMilestone = this.getNextMilestone(currentStage);
    
    // Estimate time to completion based on current progress
    const remainingStages = learningPath.stages.filter(s => s.status !== 'MASTERED');
    const estimatedTimeToCompletion = remainingStages.reduce((total, stage) => {
      return total + this.estimateStageTime(stage);
    }, 0);

    return {
      totalStages: this.stageOrder.length,
      completedStages,
      currentStage,
      nextMilestone,
      estimatedTimeToCompletion,
    };
  }

  // Private helper methods

  private async getUserMasteriesForCriteria(
    criterionIds: number[],
    userId: number
  ): Promise<UserCriterionMastery[]> {
    return await prisma.userCriterionMastery.findMany({
      where: {
        userId,
        masteryCriterionId: { in: criterionIds },
      },
    });
  }

  private async createUserMasteryRecord(
    userId: number,
    criterionId: number,
    sectionId: number,
    uueStage: UueStage
  ): Promise<void> {
    // Check if record already exists
    const existing = await prisma.userCriterionMastery.findUnique({
      where: {
        userId_masteryCriterionId: {
          userId,
          masteryCriterionId: criterionId,
        },
      },
    });

    if (!existing) {
      await prisma.userCriterionMastery.create({
        data: {
          userId,
          masteryCriterionId: criterionId,
          blueprintSectionId: sectionId,
          uueStage,
          masteryScore: 0.0,
          consecutiveIntervals: 0,
          attemptHistory: [],
          currentIntervalStep: 0,
          trackingIntensity: 'NORMAL',
        },
      });
    }
  }

  private async recordStageUnlock(
    userId: number,
    sectionId: number,
    stage: UueStage
  ): Promise<void> {
    // This could be extended to track stage unlock history
    // For now, we just create the mastery records
    console.log(`User ${userId} unlocked ${stage} stage in section ${sectionId}`);
  }

  private generateProgressionRecommendations(
    currentStage: UueStage,
    progressPercentage: number,
    missingCriteria: string[],
    userMasteries: UserCriterionMastery[]
  ): string[] {
    const recommendations: string[] = [];

    if (progressPercentage < 50) {
      recommendations.push(`Focus on mastering basic concepts in ${currentStage} stage`);
      recommendations.push('Consider reducing tracking intensity for better retention');
    } else if (progressPercentage < 80) {
      recommendations.push(`You're close to completing ${currentStage} stage`);
      recommendations.push(`Focus on: ${missingCriteria.slice(0, 3).join(', ')}`);
    } else if (progressPercentage < 100) {
      recommendations.push(`Almost there! Master these final criteria: ${missingCriteria.join(', ')}`);
      recommendations.push('Consider increasing tracking intensity for faster completion');
    }

    // Add stage-specific recommendations
    if (currentStage === 'UNDERSTAND' && progressPercentage < 60) {
      recommendations.push('Focus on comprehension before moving to application');
    } else if (currentStage === 'USE' && progressPercentage < 70) {
      recommendations.push('Practice applying concepts in different contexts');
    } else if (currentStage === 'EXPLORE' && progressPercentage < 80) {
      recommendations.push('Deep dive into advanced applications and edge cases');
    }

    return recommendations;
  }

  private getNextMilestone(currentStage: UueStage): string {
    const currentIndex = this.stageOrder.indexOf(currentStage);
    if (currentIndex >= this.stageOrder.length - 1) {
      return 'Section Complete!';
    }
    
    const nextStage = this.stageOrder[currentIndex + 1];
    return `Complete ${nextStage} stage`;
  }

  private getCriterionStatus(userMastery?: UserCriterionMastery): 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED' {
    if (!userMastery) return 'NOT_STARTED';
    if (userMastery.isMastered) return 'MASTERED';
    return 'IN_PROGRESS';
  }

  private determineStageStatus(
    progress: number,
    masteredCount: number,
    totalCount: number
  ): 'LOCKED' | 'IN_PROGRESS' | 'MASTERED' {
    if (masteredCount === 0) return 'LOCKED';
    if (progress >= 100) return 'MASTERED';
    return 'IN_PROGRESS';
  }

  private estimateStageCompletion(
    userId: number,
    sectionId: number,
    stage: UueStage,
    currentProgress: number
  ): Date | null {
    if (currentProgress >= 100) return null;
    
    // Simple estimation based on current progress and typical learning rate
    const remainingProgress = 100 - currentProgress;
    const estimatedDays = Math.ceil(remainingProgress / 10); // Assume 10% progress per day
    
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + estimatedDays);
    
    return completionDate;
  }

  private estimateStageTime(stage: LearningPath['stages'][0]): number {
    // Estimate time based on stage complexity and remaining criteria
    const baseTimePerCriterion = 5; // minutes
    const remainingCriteria = stage.criteria.filter(c => c.status !== 'MASTERED').length;
    
    return remainingCriteria * baseTimePerCriterion;
  }
}

export const uueStageProgressionService = new UueStageProgressionService();

