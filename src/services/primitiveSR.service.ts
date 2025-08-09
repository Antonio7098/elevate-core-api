import { MasteryThresholdLevel } from '@prisma/client';
import prisma from '../lib/prisma';
import { addDays, format } from 'date-fns';

// --- Helper calculations ---
function calculateWeightedMastery(totalWeight: number, masteredWeight: number): number {
  if (totalWeight === 0) return 0;
  return masteredWeight / totalWeight;
}

function canProgressFromLevel(mastery: number, threshold: MasteryThresholdLevel): boolean {
  switch (threshold) {
    case 'SURVEY':
      return mastery >= 0.6;
    case 'EXPERT':
      return mastery >= 0.95;
    case 'PROFICIENT':
    default:
      return mastery >= 0.8;
  }
}

function calculateQuestionsFromWeightedMastery(
  primitiveWeightedMastery: number,
  bucketCapacity: number,
  totalPrimitivesInBucket: number
): number {
  // Base questions per primitive in this bucket
  const baseQuestionsPerPrimitive = Math.max(1, Math.floor(bucketCapacity / Math.max(1, totalPrimitivesInBucket)));
  
  // Inverse relationship: lower mastery = more questions (1.2x to 2.0x multiplier)
  const masteryMultiplier = 1.2 + (0.8 * (1 - primitiveWeightedMastery));
  
  return Math.max(1, Math.round(baseQuestionsPerPrimitive * masteryMultiplier));
}

async function selectQuestionsForPrimitive(
  primitiveId: string,
  currentUeeLevel: string,
  questionCount: number,
  userId: number
): Promise<any[]> {
  // Get mastery criteria ordered by weight (highest first)
  const criteria = await prisma.masteryCriterion.findMany({
    where: { primitiveId, ueeLevel: currentUeeLevel },
    include: {
      questions: true,
      userCriterionMasteries: { where: { userId } }
    },
    orderBy: [
      { weight: 'desc' },      // Primary: Highest weights first
      { createdAt: 'asc' }     // Secondary: Older questions for coverage
    ]
  });

  const selectedQuestions: any[] = [];
  let remainingQuestions = questionCount;

  // Three-phase selection strategy
  // Phase 1: High-weight unmastered criteria (weight > 0.7)
  const highWeightUnmastered = criteria.filter(c => 
    (c.weight ?? 1) > 0.7 && !c.userCriterionMasteries.some(m => m.isMastered)
  );
  
  for (const criterion of highWeightUnmastered) {
    if (remainingQuestions <= 0) break;
    const questions = criterion.questions.slice(0, Math.min(2, remainingQuestions));
    selectedQuestions.push(...questions.map(q => ({ ...q, criterionId: criterion.criterionId })));
    remainingQuestions -= questions.length;
  }

  // Phase 2: Medium-weight criteria (0.3 <= weight <= 0.7)
  const mediumWeight = criteria.filter(c => {
    const weight = c.weight ?? 1;
    return weight >= 0.3 && weight <= 0.7;
  });
  
  for (const criterion of mediumWeight) {
    if (remainingQuestions <= 0) break;
    const questions = criterion.questions.slice(0, Math.min(1, remainingQuestions));
    selectedQuestions.push(...questions.map(q => ({ ...q, criterionId: criterion.criterionId })));
    remainingQuestions -= questions.length;
  }

  // Phase 3: Fill remaining slots with any available questions
  const remaining = criteria.filter(c => 
    c.questions.length > 0 && 
    !selectedQuestions.some(sq => sq.criterionId === c.criterionId)
  );
  
  for (const criterion of remaining) {
    if (remainingQuestions <= 0) break;
    const questions = criterion.questions.slice(0, Math.min(1, remainingQuestions));
    selectedQuestions.push(...questions.map(q => ({ ...q, criterionId: criterion.criterionId })));
    remainingQuestions -= questions.length;
  }

  return selectedQuestions;
}

export async function updateDailySummariesForUser(userId: number) {
  // fetch primitives for the user
  const primitives = await prisma.knowledgePrimitive.findMany({
    where: { userId },
    include: {
      masteryCriteria: {
        include: {
          userCriterionMasteries: {
            where: { userId }
          }
        }
      },
      userPrimitiveProgresses: { where: { userId } }
    }
  });

  const bucketPrefs = await prisma.userBucketPreferences.findUnique({ where: { userId } });
  const threshold = bucketPrefs?.masteryThresholdLevel ?? 'PROFICIENT';

  for (const primitive of primitives) {
    const totalCriteria = primitive.masteryCriteria.length;
    const masteredCriteria = primitive.masteryCriteria.filter(c => c.userCriterionMasteries.some(m => m.isMastered)).length;
    const totalWeight = primitive.masteryCriteria.reduce((sum, c) => sum + (c.weight ?? 1), 0);
    const masteredWeight = primitive.masteryCriteria.reduce((sum, c) => {
      const mastered = c.userCriterionMasteries.some(m => m.isMastered);
      return sum + (mastered ? (c.weight ?? 1) : 0);
    }, 0);

    const weightedMastery = calculateWeightedMastery(totalWeight, masteredWeight);

    const prog = primitive.userPrimitiveProgresses[0];
    const nextReviewAt = prog?.nextReviewAt ?? null;
    const masteryLevel = prog?.masteryLevel ?? 'NOT_STARTED';

    const canProgress = canProgressFromLevel(weightedMastery, threshold);

    await prisma.userPrimitiveDailySummary.upsert({
      where: {
        userId_primitiveId: {
          userId,
          primitiveId: primitive.primitiveId
        }
      },
      create: {
        userId,
        primitiveId: primitive.primitiveId,
        primitiveTitle: primitive.title,
        masteryLevel,
        nextReviewAt,
        totalCriteria,
        masteredCriteria,
        weightedMasteryScore: weightedMastery,
        canProgressToNext: canProgress
      },
      update: {
        masteryLevel,
        nextReviewAt,
        totalCriteria,
        masteredCriteria,
        weightedMasteryScore: weightedMastery,
        canProgressToNext: canProgress,
        lastCalculated: new Date()
      }
    });
  }
}

export async function generateDailyTasks(userId: number) {
  // refresh summaries first
  await updateDailySummariesForUser(userId);

  const now = new Date();
  const prefs = await prisma.userBucketPreferences.findUnique({ where: { userId } });
  const criticalCap = prefs?.criticalSize ?? 10;
  const coreCap = prefs?.coreSize ?? 15;
  const plusCap = prefs?.plusSize ?? 5;

  const summaries = await prisma.userPrimitiveDailySummary.findMany({
    where: {
      userId,
      nextReviewAt: { lte: now } // Only include primitives that are tracked and due
    },
    orderBy: [
      { nextReviewAt: 'asc' },
      { weightedMasteryScore: 'asc' } // lower mastery first
    ]
  });

  const critical: typeof summaries = [];
  const core: typeof summaries = [];
  const plus: typeof summaries = [];

  for (const s of summaries) {
    if (s.weightedMasteryScore < 0.4 && critical.length < criticalCap) {
      critical.push(s);
    } else if (s.weightedMasteryScore < 0.8 && core.length < coreCap) {
      core.push(s);
    } else if (plus.length < plusCap) {
      plus.push(s);
    }
    if (critical.length === criticalCap && core.length === coreCap && plus.length === plusCap) break;
  }

  const selected = [...critical, ...core, ...plus];

  // Generate tasks with questions for each selected primitive
  const tasks = [];
  
  for (const s of selected) {
    const bucket = s.weightedMasteryScore < 0.4 ? 'critical' : 
                   s.weightedMasteryScore < 0.8 ? 'core' : 'plus';
    const bucketSize = bucket === 'critical' ? criticalCap : 
                       bucket === 'core' ? coreCap : plusCap;
    const totalInBucket = bucket === 'critical' ? critical.length :
                          bucket === 'core' ? core.length : plus.length;
    
    const questionCount = calculateQuestionsFromWeightedMastery(
      s.weightedMasteryScore,
      bucketSize,
      totalInBucket
    );
    
    const questions = await selectQuestionsForPrimitive(
      s.primitiveId,
      s.masteryLevel,
      questionCount,
      userId
    );
    
    tasks.push({
      primitiveId: s.primitiveId,
      primitiveTitle: s.primitiveTitle,
      masteryLevel: s.masteryLevel,
      weightedMastery: s.weightedMasteryScore,
      nextReviewAt: s.nextReviewAt,
      bucket,
      questionCount,
      questions
    });
  }
  
  return tasks;
}

// Fixed-Interval v3 Spaced Repetition Scheduling
const INTERVALS = [1, 3, 7, 21]; // days

export async function processReviewOutcome(
  userId: number,
  primitiveId: string,
  blueprintId: number,
  isCorrect: boolean
) {
  const progress = await prisma.userPrimitiveProgress.findUnique({
    where: {
      userId_primitiveId_blueprintId: {
        userId,
        primitiveId,
        blueprintId
      }
    }
  });

  if (!progress) {
    throw new Error('UserPrimitiveProgress not found');
  }

  const now = new Date();
  let newReviewCount = progress.reviewCount + 1;
  let newSuccessfulReviews = progress.successfulReviews + (isCorrect ? 1 : 0);
  let nextReviewAt: Date;

  // Check if this primitive is pinned
  const pinnedReview = await prisma.pinnedReview.findFirst({
    where: {
      userId,
      primitiveId
    }
  });

  if (isCorrect) {
    // Use Extended Fixed-Interval v3 with Tracking Intensity
    const extendedBaseIntervals = [1, 3, 7, 21, 60, 180]; // days - extended for long-term retention
    const intervalIndex = Math.min(newReviewCount - 1, extendedBaseIntervals.length - 1);
    const baseInterval = extendedBaseIntervals[intervalIndex];
    
    // Apply tracking intensity multipliers
    const trackingIntensityMultipliers = {
      DENSE: 0.7,   // 30% shorter intervals for intensive tracking
      NORMAL: 1.0,  // Standard intervals
      SPARSE: 1.5   // 50% longer intervals for light tracking
    };
    
    const intensityMultiplier = trackingIntensityMultipliers[progress.trackingIntensity] || 1.0;
    
    // Combine all adjustments (without difficulty multiplier)
    const finalInterval = Math.round(baseInterval * intensityMultiplier);
    
    // If pinned, use pinned date; otherwise use calculated interval
    nextReviewAt = pinnedReview 
      ? pinnedReview.reviewAt 
      : addDays(now, Math.max(1, finalInterval));
  } else {
    // Reset to first interval on failure with intensity adjustment
    newSuccessfulReviews = 0;
    const intensityMultiplier = progress.trackingIntensity === 'DENSE' ? 0.7 : 
                               progress.trackingIntensity === 'SPARSE' ? 1.5 : 1.0;
    const resetInterval = Math.round(1 * intensityMultiplier); // First interval with intensity
    
    // If pinned, keep pinned date; otherwise use reset interval
    nextReviewAt = pinnedReview 
      ? pinnedReview.reviewAt 
      : addDays(now, Math.max(1, resetInterval));
  }

  await prisma.userPrimitiveProgress.update({
    where: {
      userId_primitiveId_blueprintId: {
        userId,
        primitiveId,
        blueprintId
      }
    },
    data: {
      reviewCount: newReviewCount,
      successfulReviews: newSuccessfulReviews,
      lastReviewedAt: now,
      nextReviewAt,
      updatedAt: now
    }
  });

  // Trigger summary refresh for this user
  await updateDailySummariesForUser(userId);

  return {
    nextReviewAt,
    intervalDays: Math.round((nextReviewAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    successfulReviews: newSuccessfulReviews,
    totalReviews: newReviewCount
  };
}

export async function processBatchReviewOutcomes(
  userId: number,
  outcomes: Array<{
    primitiveId: string;
    blueprintId: number;
    isCorrect: boolean;
    criterionId?: string; // Optional for criterion-specific reviews
  }>
) {
  if (outcomes.length === 0) {
    return [];
  }

  console.log(`Processing batch of ${outcomes.length} review outcomes for user ${userId}`);
  
  // Use transaction for batch processing to ensure consistency
  return await prisma.$transaction(async (tx) => {
    const results = [];
    const progressUpdates = new Map<string, any>();
    const criterionUpdates = new Map<string, any>();
    const now = new Date();

    // Step 1: Process each outcome and collect updates
    for (const outcome of outcomes) {
      const { primitiveId, blueprintId, isCorrect, criterionId } = outcome;
      const progressKey = `${userId}-${primitiveId}-${blueprintId}`;

      try {
        // Get current progress
        const currentProgress = await tx.userPrimitiveProgress.findUnique({
          where: {
            userId_primitiveId_blueprintId: {
              userId,
              primitiveId,
              blueprintId
            }
          }
        });

        if (!currentProgress) {
          console.warn(`No progress found for user ${userId}, primitive ${primitiveId}, blueprint ${blueprintId}`);
          results.push({
            ...outcome,
            success: false,
            error: 'Progress record not found'
          });
          continue;
        }

        // Calculate new scheduling data
        const reviewCount = currentProgress.reviewCount + 1;
        const successfulReviews = isCorrect ? currentProgress.successfulReviews + 1 : currentProgress.successfulReviews;

        // Calculate next review date using Extended Fixed-Interval v3 with Tracking Intensity
        const extendedBaseIntervals = [1, 3, 7, 21, 60, 180]; // days - extended for long-term retention
        const intervalIndex = Math.min(reviewCount - 1, extendedBaseIntervals.length - 1);
        const baseInterval = extendedBaseIntervals[intervalIndex];
        
        // Apply tracking intensity multipliers
        const trackingIntensityMultipliers = {
          DENSE: 0.7,   // 30% shorter intervals for intensive tracking
          NORMAL: 1.0,  // Standard intervals
          SPARSE: 1.5   // 50% longer intervals for light tracking
        };
        
        const intensityMultiplier = trackingIntensityMultipliers[currentProgress.trackingIntensity] || 1.0;
        
        // Combine adjustments (without difficulty multiplier)
        const finalInterval = Math.round(baseInterval * intensityMultiplier);
        const nextReviewAt = addDays(now, Math.max(1, finalInterval)); // Minimum 1 day interval

        // Collect progress update
        progressUpdates.set(progressKey, {
          userId,
          primitiveId,
          blueprintId,
          reviewCount,
          successfulReviews,
          lastReviewedAt: now,
          nextReviewAt,
          updatedAt: now
        });

        // Handle criterion-specific updates if provided
        if (criterionId) {
          const criterionKey = `${userId}-${criterionId}-${primitiveId}-${blueprintId}`;
          
          const currentCriterion = await tx.userCriterionMastery.findUnique({
            where: {
              userId_criterionId_primitiveId_blueprintId: {
                userId,
                criterionId,
                primitiveId,
                blueprintId
              }
            }
          });

          if (currentCriterion) {
            const attemptCount = currentCriterion.attemptCount + 1;
            const successfulAttempts = isCorrect ? currentCriterion.successfulAttempts + 1 : currentCriterion.successfulAttempts;
            
            // Check for mastery (2 consecutive correct answers)
            let isMastered = currentCriterion.isMastered;
            let masteredAt = currentCriterion.masteredAt;
            
            if (isCorrect && currentCriterion.lastAttemptedAt) {
              // Check if previous attempt was also correct (simplified check)
              const wasLastCorrect = currentCriterion.successfulAttempts > 0;
              if (wasLastCorrect && !isMastered) {
                isMastered = true;
                masteredAt = now;
              }
            }

            criterionUpdates.set(criterionKey, {
              userId,
              criterionId,
              primitiveId,
              blueprintId,
              attemptCount,
              successfulAttempts,
              isMastered,
              masteredAt,
              lastAttemptedAt: now,
              updatedAt: now
            });
          }
        }

        results.push({
          ...outcome,
          success: true,
          newReviewCount: reviewCount,
          newSuccessfulReviews: successfulReviews,
          nextReviewAt
        });

      } catch (error) {
        console.error(`Error processing outcome for ${progressKey}:`, error);
        results.push({
          ...outcome,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Step 2: Perform bulk updates
    console.log(`Performing ${progressUpdates.size} progress updates and ${criterionUpdates.size} criterion updates`);

    // Bulk update progress records
    for (const [key, updateData] of progressUpdates) {
      await tx.userPrimitiveProgress.update({
        where: {
          userId_primitiveId_blueprintId: {
            userId: updateData.userId,
            primitiveId: updateData.primitiveId,
            blueprintId: updateData.blueprintId
          }
        },
        data: {
          reviewCount: updateData.reviewCount,
          successfulReviews: updateData.successfulReviews,
          lastReviewedAt: updateData.lastReviewedAt,
          nextReviewAt: updateData.nextReviewAt,
          updatedAt: updateData.updatedAt
        }
      });
    }

    // Bulk update criterion mastery records
    for (const [key, updateData] of criterionUpdates) {
      await tx.userCriterionMastery.update({
        where: {
          userId_criterionId_primitiveId_blueprintId: {
            userId: updateData.userId,
            criterionId: updateData.criterionId,
            primitiveId: updateData.primitiveId,
            blueprintId: updateData.blueprintId
          }
        },
        data: {
          attemptCount: updateData.attemptCount,
          successfulAttempts: updateData.successfulAttempts,
          isMastered: updateData.isMastered,
          masteredAt: updateData.masteredAt,
          lastAttemptedAt: updateData.lastAttemptedAt,
          updatedAt: updateData.updatedAt
        }
      });
    }

    console.log(`Batch processing completed: ${results.filter(r => r.success).length}/${results.length} successful`);
    return results;
  });
}

// UEE Ladder Progression Logic
export async function checkUeeProgression(
  userId: number,
  primitiveId: string,
  blueprintId: number
): Promise<{ canProgress: boolean; currentLevel: string; nextLevel?: string; weightedMastery: number }> {
  const progress = await prisma.userPrimitiveProgress.findUnique({
    where: {
      userId_primitiveId_blueprintId: {
        userId,
        primitiveId,
        blueprintId
      }
    }
  });

  if (!progress) {
    return { canProgress: false, currentLevel: 'NOT_STARTED', weightedMastery: 0 };
  }

  // Get criteria for current UEE level
  const criteria = await prisma.masteryCriterion.findMany({
    where: {
      primitiveId,
      ueeLevel: progress.masteryLevel
    },
    include: {
      userCriterionMasteries: {
        where: { userId }
      }
    }
  });

  // Calculate weighted mastery for current level
  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight ?? 1), 0);
  const masteredWeight = criteria.reduce((sum, c) => {
    const mastered = c.userCriterionMasteries.some(m => m.isMastered);
    return sum + (mastered ? (c.weight ?? 1) : 0);
  }, 0);

  const weightedMastery = calculateWeightedMastery(totalWeight, masteredWeight);

  // Get user's mastery threshold preference
  const prefs = await prisma.userBucketPreferences.findUnique({ where: { userId } });
  const threshold = prefs?.masteryThresholdLevel ?? 'PROFICIENT';

  const canProgress = canProgressFromLevel(weightedMastery, threshold);

  // Determine next level
  const levelProgression = {
    'NOT_STARTED': 'UNDERSTAND',
    'UNDERSTAND': 'USE',
    'USE': 'EXPLORE',
    'EXPLORE': null // No further progression
  };

  const nextLevel = levelProgression[progress.masteryLevel as keyof typeof levelProgression];

  return {
    canProgress: canProgress && nextLevel !== null,
    currentLevel: progress.masteryLevel,
    nextLevel: nextLevel || undefined,
    weightedMastery
  };
}

export async function progressToNextUeeLevel(
  userId: number,
  primitiveId: string,
  blueprintId: number
): Promise<{ success: boolean; newLevel?: string; error?: string }> {
  const progressionCheck = await checkUeeProgression(userId, primitiveId, blueprintId);

  if (!progressionCheck.canProgress) {
    return {
      success: false,
      error: `Cannot progress: weighted mastery ${progressionCheck.weightedMastery.toFixed(2)} insufficient for current threshold`
    };
  }

  if (!progressionCheck.nextLevel) {
    return {
      success: false,
      error: 'Already at maximum UEE level (EXPLORE)'
    };
  }

  // Update the user's progress to next level
  await prisma.userPrimitiveProgress.update({
    where: {
      userId_primitiveId_blueprintId: {
        userId,
        primitiveId,
        blueprintId
      }
    },
    data: {
      masteryLevel: progressionCheck.nextLevel,
      updatedAt: new Date()
    }
  });

  // Refresh summaries to reflect the level change
  await updateDailySummariesForUser(userId);

  return {
    success: true,
    newLevel: progressionCheck.nextLevel
  };
}

// Pinned Review Integration
export async function pinReview(
  userId: number,
  primitiveId: string,
  pinDate: Date
): Promise<{ success: boolean; message: string }> {
  try {
    // Create or update pinned review
    await prisma.pinnedReview.upsert({
      where: {
        userId_primitiveId: {
          userId,
          primitiveId
        }
      },
      create: {
        userId,
        primitiveId,
        reviewAt: pinDate
      },
      update: {
        reviewAt: pinDate,
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      message: `Review pinned for ${pinDate.toDateString()}`
    };
  } catch (error) {
    console.error('Error pinning review:', error);
    return {
      success: false,
      message: 'Failed to pin review'
    };
  }
}

export async function unpinReview(
  userId: number,
  primitiveId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.pinnedReview.deleteMany({
      where: {
        userId,
        primitiveId
      }
    });

    return {
      success: true,
      message: 'Review unpinned successfully'
    };
  } catch (error) {
    console.error('Error unpinning review:', error);
    return {
      success: false,
      message: 'Failed to unpin review'
    };
  }
}

export async function getPinnedReviews(userId: number): Promise<Array<{
  primitiveId: string;
  primitiveTitle: string;
  reviewAt: Date;
}>> {
  const pinnedReviews = await prisma.pinnedReview.findMany({
    where: { userId },
    include: {
      knowledgePrimitive: {
        select: {
          title: true
        }
      }
    },
    orderBy: { reviewAt: 'asc' }
  });

  return pinnedReviews.map(pr => ({
    primitiveId: pr.primitiveId,
    primitiveTitle: pr.knowledgePrimitive.title,
    reviewAt: pr.reviewAt
  }));
}

// Additional Tasks Algorithm - Adaptive task increments based on completion rates
export async function getAdditionalTasks(
  userId: number, 
  prefs: { maxDailyLimit: number; addMoreIncrements: number }, 
  completion: {
    critical: { totalAssigned: number; completedCount: number };
    core: { totalAssigned: number; completedCount: number };
    plus: { totalAssigned: number; completedCount: number };
  }
): Promise<{
  tasks: any[];
  message: string;
  canAddMore: boolean;
  bucketSource?: string;
  incrementSize?: number;
  completionRates?: {
    critical: number;
    core: number;
    plus: number;
  };
}> {
  const currentTotal = completion.critical.totalAssigned + completion.core.totalAssigned + completion.plus.totalAssigned;
  
  // Safety check: don't exceed daily limit
  if (currentTotal >= prefs.maxDailyLimit) {
    return { 
      tasks: [], 
      message: "You've reached your daily limit. Great work! ",
      canAddMore: false 
    };
  }
  
  const remainingCapacity = prefs.maxDailyLimit - currentTotal;
  const incrementSize = Math.min(prefs.addMoreIncrements, remainingCapacity);
  
  // Get available tasks from all buckets
  const { critical, core, plus } = await calculateAllBuckets(userId);
  
  // Calculate completion rates (avoid division by zero)
  const criticalCompletionRate = completion.critical.completedCount / Math.max(1, completion.critical.totalAssigned);
  const coreCompletionRate = completion.core.completedCount / Math.max(1, completion.core.totalAssigned);
  const plusCompletionRate = completion.plus.completedCount / Math.max(1, completion.plus.totalAssigned);
  
  let additionalTasks: any[] = [];
  let bucketSource = 'mixed';
  
  // Prioritize bucket with highest completion rate and available tasks
  if (criticalCompletionRate >= 0.8 && critical.length > completion.critical.totalAssigned) {
    // High critical completion rate - add more critical tasks
    const availableCritical = critical.slice(completion.critical.totalAssigned);
    additionalTasks = availableCritical.slice(0, incrementSize);
    bucketSource = 'critical';
  } else if (coreCompletionRate >= 0.7 && core.length > completion.core.totalAssigned) {
    // Good core completion rate - add more core tasks
    const availableCore = core.slice(completion.core.totalAssigned);
    additionalTasks = availableCore.slice(0, incrementSize);
    bucketSource = 'core';
  } else if (plusCompletionRate >= 0.6 && plus.length > completion.plus.totalAssigned) {
    // Decent plus completion rate - add plus tasks
    const availablePlus = plus.slice(completion.plus.totalAssigned);
    additionalTasks = availablePlus.slice(0, incrementSize);
    bucketSource = 'plus';
  } else {
    // Fallback: intelligently mix remaining tasks from all buckets
    const availableCritical = critical.slice(completion.critical.totalAssigned);
    const availableCore = core.slice(completion.core.totalAssigned);
    const availablePlus = plus.slice(completion.plus.totalAssigned);
    
    // Prioritize critical > core > plus for mixed selection
    const mixedPool = [
      ...availableCritical.slice(0, Math.ceil(incrementSize * 0.4)), // 40% critical
      ...availableCore.slice(0, Math.ceil(incrementSize * 0.4)),     // 40% core
      ...availablePlus.slice(0, Math.ceil(incrementSize * 0.2))      // 20% plus
    ];
    
    additionalTasks = mixedPool.slice(0, incrementSize);
    bucketSource = 'mixed';
  }
  
  // Generate appropriate message based on source and performance
  let message = `Added ${additionalTasks.length} more tasks. Keep going! `;
  if (bucketSource === 'critical' && criticalCompletionRate >= 0.9) {
    message = `Excellent critical task performance! Added ${additionalTasks.length} more critical tasks. `;
  } else if (bucketSource === 'core' && coreCompletionRate >= 0.8) {
    message = `Great core task progress! Added ${additionalTasks.length} more core tasks. `;
  } else if (bucketSource === 'plus') {
    message = `Nice work on plus tasks! Added ${additionalTasks.length} more to challenge you. `;
  }
  
  return {
    tasks: additionalTasks,
    message,
    canAddMore: (currentTotal + additionalTasks.length) < prefs.maxDailyLimit,
    bucketSource,
    incrementSize: additionalTasks.length,
    completionRates: {
      critical: criticalCompletionRate,
      core: coreCompletionRate,
      plus: plusCompletionRate
    }
  };
}

// Helper function to calculate all buckets (reuse existing generateDailyTasks logic)
async function calculateAllBuckets(userId: number) {
  // Get user preferences
  const preferences = await prisma.userBucketPreferences.findUnique({
    where: { userId }
  });

  if (!preferences) {
    throw new Error('User bucket preferences not found');
  }

  // Get all primitives with progress for this user
  const primitives = await prisma.knowledgePrimitive.findMany({
    include: {
      userPrimitiveProgresses: {
        where: { userId }
      },
      masteryCriteria: {
        include: {
          userCriterionMasteries: {
            where: { userId }
          }
        }
      }
    }
  });

  // Calculate weighted mastery for each primitive and categorize
  const critical: any[] = [];
  const core: any[] = [];
  const plus: any[] = [];

  for (const primitive of primitives) {
    if (primitive.userPrimitiveProgresses.length === 0) continue;

    const progress = primitive.userPrimitiveProgresses[0];
    
    // Calculate weighted mastery
    const totalWeight = primitive.masteryCriteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    const masteredWeight = primitive.masteryCriteria.reduce((sum, criterion) => {
      const mastery = criterion.userCriterionMasteries.find(m => m.userId === userId);
      return sum + (mastery?.isMastered ? criterion.weight : 0);
    }, 0);
    
    const weightedMastery = calculateWeightedMastery(totalWeight, masteredWeight);
    
    // Categorize into buckets based on mastery percentage
    const primitiveWithMastery = {
      ...primitive,
      weightedMastery,
      progress
    };
    
    if (weightedMastery < 0.4) {
      critical.push(primitiveWithMastery);
    } else if (weightedMastery < 0.8) {
      core.push(primitiveWithMastery);
    } else {
      plus.push(primitiveWithMastery);
    }
  }

  return { critical, core, plus };
}
