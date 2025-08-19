import { PrismaClient, UserCriterionMastery } from '@prisma/client';

const prisma = new PrismaClient();

// Define the MasteryUpdateResult type
interface MasteryUpdateResult {
  success: boolean;
  oldMasteryScore: number;
  newMasteryScore: number;
  isMastered: boolean;
  stageProgression: boolean;
  nextStage: UueStage | null;
  message?: string;
}

// ============================================================================
// MASTERY TRACKING SERVICE
// ============================================================================
// 🆕 NEW ARCHITECTURE - Tracks user mastery progress across criteria
// ============================================================================

export enum MasteryThreshold {
  SURVEY = 'SURVEY',
  PROFICIENT = 'PROFICIENT',
  EXPERT = 'EXPERT'
}

export enum UueStage {
  UNDERSTAND = 'UNDERSTAND',
  USE = 'USE',
  EXPLORE = 'EXPLORE'
}

export interface MasteryProgress {
  userId: number;
  criterionId: string;
  masteryScore: number;
  isMastered: boolean;
  currentStage: UueStage;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  lastReviewAt: Date;
  nextReviewAt: Date;
  masteryThreshold: MasteryThreshold;
  thresholdValue: number;
}

export interface StageProgress {
  stage: UueStage;
  totalCriteria: number;
  masteredCriteria: number;
  masteryScore: number;
  isCompleted: boolean;
  nextStage: UueStage | null;
  prerequisites: string[];
}

// MasteryUpdateResult interface moved to enhancedBatchReview.service.ts to avoid conflicts

export interface MasteryThresholdConfig {
  threshold: MasteryThreshold;
  value: number;
  description: string;
  color: string;
}

// Default mastery thresholds
const defaultThresholds: Record<MasteryThreshold, MasteryThresholdConfig> = {
  [MasteryThreshold.SURVEY]: {
    threshold: MasteryThreshold.SURVEY,
    value: 0.6,
    description: 'Basic familiarity - 60%',
    color: '#FFA500'
  },
  [MasteryThreshold.PROFICIENT]: {
    threshold: MasteryThreshold.PROFICIENT,
    value: 0.8,
    description: 'Solid understanding - 80%',
    color: '#32CD32'
  },
  [MasteryThreshold.EXPERT]: {
    threshold: MasteryThreshold.EXPERT,
    value: 0.95,
    description: 'Deep mastery - 95%',
    color: '#4169E1'
  }
};

/**
 * Update mastery score for a criterion
 * Implements user-configurable mastery thresholds and UUE stage progression
 */
async function updateMasteryScore(
  userId: number,
  criterionId: string,
  newScore: number,
  isCorrect: boolean
): Promise<MasteryUpdateResult> {
  try {
    // Get current mastery progress
    const currentProgress = await getMasteryProgress(userId, criterionId);
    if (!currentProgress) {
      throw new Error(`No mastery progress found for criterion ${criterionId}`);
    }

    const oldMasteryScore = currentProgress.masteryScore;
    const thresholdValue = currentProgress.thresholdValue;

    // Update mastery score
    const updatedMasteryScore = calculateUpdatedScore(
      oldMasteryScore,
      newScore,
      isCorrect
    );

    // Check if criterion is now mastered
    const isMastered = updatedMasteryScore >= thresholdValue;

    // Check for UUE stage progression
    const stageProgression = await checkUueStageProgression(
      userId,
      criterionId,
      updatedMasteryScore,
      isMastered
    );

    // Get next stage if progression occurred
    const nextStage = stageProgression ? getNextStage(currentProgress.currentStage) : null;

    // Update mastery progress in database
    await updateMasteryProgress(userId, criterionId, {
      masteryScore: updatedMasteryScore,
      isMastered,
      lastReviewAt: new Date(),
      consecutiveCorrect: isCorrect ? currentProgress.consecutiveCorrect + 1 : 0,
      consecutiveIncorrect: isCorrect ? 0 : currentProgress.consecutiveIncorrect + 1
    });

    const message = generateMasteryMessage(
      oldMasteryScore,
      updatedMasteryScore,
      isMastered,
      stageProgression,
      nextStage
    );

    return {
      success: true,
      oldMasteryScore,
      newMasteryScore: updatedMasteryScore,
      isMastered,
      stageProgression,
      nextStage,
      message
    };

  } catch (error) {
    console.error(`Error updating mastery score: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Get mastery progress for a user and criterion
 */
async function getMasteryProgress(
  userId: number,
  criterionId: string
): Promise<MasteryProgress | null> {
  try {
    // Mock implementation - in real system this would query the database
    return {
      userId,
      criterionId,
      masteryScore: 0.5,
      isMastered: false,
      currentStage: UueStage.UNDERSTAND,
      consecutiveCorrect: 0,
      consecutiveIncorrect: 0,
      lastReviewAt: new Date(),
      nextReviewAt: new Date(),
      masteryThreshold: MasteryThreshold.PROFICIENT,
      thresholdValue: 0.8
    };
  } catch (error) {
    console.error(`Error getting mastery progress: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Get UUE stage progress for a user and section
 */
async function getUueStageProgress(
  userId: number,
  sectionId: string
): Promise<StageProgress[]> {
  try {
    const stages = [UueStage.UNDERSTAND, UueStage.USE, UueStage.EXPLORE];
    const stageProgress: StageProgress[] = [];

    for (const stage of stages) {
      const criteria = await getCriteriaByStage(sectionId, stage);
      const masteredCriteria = criteria.filter(c => c.isMastered).length;
      const masteryScore = criteria.length > 0 ? 
        criteria.reduce((sum, c) => sum + c.masteryScore, 0) / criteria.length : 0;

      stageProgress.push({
        stage,
        totalCriteria: criteria.length,
        masteredCriteria,
        masteryScore,
        isCompleted: masteredCriteria === criteria.length && criteria.length > 0,
        nextStage: getNextStage(stage),
        prerequisites: getStagePrerequisites(stage)
      });
    }

    return stageProgress;
  } catch (error) {
    console.error(`Error getting UUE stage progress: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Update mastery threshold for a criterion
 */
async function updateMasteryThreshold(
  userId: number,
  criterionId: string,
  threshold: MasteryThreshold
): Promise<void> {
  try {
    const thresholdValue = defaultThresholds[threshold].value;
    
    // Update threshold in database
    await updateMasteryThresholdInDB(userId, criterionId, threshold, thresholdValue);
    
    // Recalculate mastery status
    const currentProgress = await getMasteryProgress(userId, criterionId);
    if (currentProgress) {
      const isMastered = currentProgress.masteryScore >= thresholdValue;
      await updateMasteryStatus(userId, criterionId, isMastered);
    }

    console.log(`Mastery threshold updated for user ${userId}, criterion ${criterionId}: ${threshold} (${thresholdValue})`);
  } catch (error) {
    console.error(`Error updating mastery threshold: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Get mastery statistics for a user
 */
async function getMasteryStats(userId: number): Promise<{
  totalCriteria: number;
  masteredCriteria: number;
  stageBreakdown: Record<UueStage, { total: number; mastered: number; progress: number }>;
  averageMasteryScore: number;
  thresholdDistribution: Record<MasteryThreshold, number>;
}> {
  try {
    // Mock implementation - in real system this would query the database
    return {
      totalCriteria: 0,
      masteredCriteria: 0,
      stageBreakdown: {
        [UueStage.UNDERSTAND]: { total: 0, mastered: 0, progress: 0 },
        [UueStage.USE]: { total: 0, mastered: 0, progress: 0 },
        [UueStage.EXPLORE]: { total: 0, mastered: 0, progress: 0 }
      },
      averageMasteryScore: 0,
      thresholdDistribution: {
        [MasteryThreshold.SURVEY]: 0,
        [MasteryThreshold.PROFICIENT]: 0,
        [MasteryThreshold.EXPERT]: 0
      }
    };
  } catch (error) {
    console.error(`Error getting mastery stats: ${error.message}`, error.stack);
    throw error;
  }
}

/**
 * Check if user can progress to next UUE stage
 */
async function checkUueStageProgression(
  userId: number,
  criterionId: string,
  masteryScore: number,
  isMastered: boolean
): Promise<boolean> {
  if (!isMastered) {
    return false;
  }

  // Get current stage and check if all criteria in current stage are mastered
  const currentProgress = await getMasteryProgress(userId, criterionId);
  if (!currentProgress) {
    return false;
  }

  const currentStage = currentProgress.currentStage;
  const sectionId = await getSectionIdForCriterion(criterionId);
  
  if (!sectionId) {
    return false;
  }

  const stageCriteria = await getCriteriaByStage(sectionId, currentStage);
  const allStageCriteriaMastered = stageCriteria.every(criterion => 
    criterion.isMastered
  );

  if (allStageCriteriaMastered) {
    // Progress to next stage
    await progressToNextStage(userId, sectionId, currentStage);
    return true;
  }

  return false;
}

/**
 * Calculate updated mastery score
 */
function calculateUpdatedScore(
  oldScore: number,
  newScore: number,
  isCorrect: boolean
): number {
  if (isCorrect) {
    // Progressive score increase with diminishing returns
    const scoreGap = 1 - oldScore;
    const increase = scoreGap * 0.1; // 10% of remaining gap
    return Math.min(1, oldScore + increase);
  } else {
    // Score decrease on failure
    const decrease = oldScore * 0.05; // 5% of current score
    return Math.max(0, oldScore - decrease);
  }
}

/**
 * Get next UUE stage
 */
function getNextStage(currentStage: UueStage): UueStage | null {
  switch (currentStage) {
    case UueStage.UNDERSTAND:
      return UueStage.USE;
    case UueStage.USE:
      return UueStage.EXPLORE;
    case UueStage.EXPLORE:
      return null; // Already at highest stage
    default:
      return null;
  }
}

/**
 * Get stage prerequisites
 */
function getStagePrerequisites(stage: UueStage): string[] {
  switch (stage) {
    case UueStage.UNDERSTAND:
      return []; // No prerequisites
    case UueStage.USE:
      return ['UNDERSTAND']; // Must complete UNDERSTAND stage
    case UueStage.EXPLORE:
      return ['UNDERSTAND', 'USE']; // Must complete both previous stages
    default:
      return [];
  }
}

/**
 * Generate mastery message
 */
function generateMasteryMessage(
  oldScore: number,
  newScore: number,
  isMastered: boolean,
  stageProgression: boolean,
  nextStage: UueStage | null
): string {
  if (stageProgression && nextStage) {
    return `Congratulations! You've progressed to the ${nextStage} stage!`;
  } else if (isMastered) {
    return "Excellent! You've mastered this criterion!";
  } else if (newScore > oldScore) {
    return `Great progress! Your mastery increased from ${(oldScore * 100).toFixed(1)}% to ${(newScore * 100).toFixed(1)}%`;
  } else if (newScore < oldScore) {
    return `Keep practicing! Your mastery decreased to ${(newScore * 100).toFixed(1)}%`;
  } else {
    return 'Keep up the good work!';
  }
}

// Mock helper methods for development
async function getCriteriaByStage(sectionId: string, stage: UueStage): Promise<any[]> {
  return [];
}

async function getSectionIdForCriterion(criterionId: string): Promise<string | null> {
  return 'mock-section-id';
}

async function progressToNextStage(userId: number, sectionId: string, currentStage: UueStage): Promise<void> {
  // Mock implementation
}

async function updateMasteryProgress(userId: number, criterionId: string, data: any): Promise<void> {
  // Mock implementation
}

async function updateMasteryThresholdInDB(userId: number, criterionId: string, threshold: MasteryThreshold, value: number): Promise<void> {
  // Mock implementation
}

async function updateMasteryStatus(userId: number, criterionId: string, isMastered: boolean): Promise<void> {
  // Mock implementation
}

// Export all functions
export {
  updateMasteryScore,
  getMasteryProgress,
  getUueStageProgress,
  updateMasteryThreshold,
  getMasteryStats,
  checkUueStageProgression,
  calculateUpdatedScore,
  getNextStage,
  getStagePrerequisites,
  generateMasteryMessage,
  getCriteriaByStage,
  getSectionIdForCriterion,
  progressToNextStage,
  updateMasteryProgress,
  updateMasteryThresholdInDB,
  updateMasteryStatus
};

