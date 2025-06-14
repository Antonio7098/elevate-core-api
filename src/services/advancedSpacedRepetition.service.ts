import { PrismaClient, QuestionSet, UserQuestionAnswer } from '@prisma/client';

const prisma = new PrismaClient();

// SM-2 Algorithm Constants
const MIN_EASE_FACTOR = 1.3;
const INITIAL_EASE_FACTOR = 2.5;
const QUALITY_WEIGHTS = {
  BLACKOUT: 0,    // Complete blackout
  INCORRECT: 1,   // Incorrect response
  HARD: 2,        // Hard to recall
  GOOD: 3,        // Good response
  EASY: 4,        // Perfect response
  PERFECT: 5      // Perfect response with no effort
};

// Stages for the spaced repetition system
export const SR_STAGES = {
  NEW: 0,         // New question
  LEARNING: 1,    // In learning phase
  REVIEW: 2,      // In review phase
  MASTERED: 3     // Mastered
};

// Intervals for each stage (in days)
const STAGE_INTERVALS = {
  [SR_STAGES.NEW]: 0,
  [SR_STAGES.LEARNING]: [1, 6],  // 1 day, then 6 days
  [SR_STAGES.REVIEW]: 0,         // Dynamic based on ease factor
  [SR_STAGES.MASTERED]: 0        // Dynamic based on ease factor
};

/**
 * Calculate the next interval using the SM-2 algorithm
 * @param currentStage Current SR stage
 * @param currentInterval Current interval in days
 * @param easeFactor Current ease factor
 * @param quality Quality of the response (0-5)
 * @returns Object containing new interval, stage, and ease factor
 */
export const calculateNextInterval = (
  currentStage: number,
  currentInterval: number,
  easeFactor: number,
  quality: number
): { interval: number; stage: number; easeFactor: number } => {
  let newStage = currentStage;
  let newInterval = currentInterval;
  let newEaseFactor = easeFactor;

  // Calculate new ease factor
  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

  // Determine new stage and interval based on current stage and quality
  switch (currentStage) {
    case SR_STAGES.NEW:
      newStage = SR_STAGES.LEARNING;
      newInterval = STAGE_INTERVALS[SR_STAGES.LEARNING][0];
      break;

    case SR_STAGES.LEARNING:
      if (quality >= QUALITY_WEIGHTS.GOOD) {
        newStage = SR_STAGES.REVIEW;
        newInterval = STAGE_INTERVALS[SR_STAGES.LEARNING][1];
      } else {
        newInterval = STAGE_INTERVALS[SR_STAGES.LEARNING][0];
      }
      break;

    case SR_STAGES.REVIEW:
      if (quality >= QUALITY_WEIGHTS.GOOD) {
        newInterval = Math.round(currentInterval * newEaseFactor);
        if (newInterval >= 30) {
          newStage = SR_STAGES.MASTERED;
        }
      } else if (quality <= QUALITY_WEIGHTS.INCORRECT) {
        newStage = SR_STAGES.LEARNING;
        newInterval = STAGE_INTERVALS[SR_STAGES.LEARNING][0];
      } else {
        newInterval = Math.max(1, Math.round(currentInterval * 0.5));
      }
      break;

    case SR_STAGES.MASTERED:
      if (quality <= QUALITY_WEIGHTS.INCORRECT) {
        newStage = SR_STAGES.LEARNING;
        newInterval = STAGE_INTERVALS[SR_STAGES.LEARNING][0];
      } else if (quality <= QUALITY_WEIGHTS.HARD) {
        newStage = SR_STAGES.REVIEW;
        newInterval = Math.max(1, Math.round(currentInterval * 0.5));
      } else {
        newInterval = Math.round(currentInterval * newEaseFactor);
      }
      break;
  }

  return {
    interval: newInterval,
    stage: newStage,
    easeFactor: newEaseFactor
  };
};

/**
 * Process a review session and update the spaced repetition data
 * @param userId User ID
 * @param questionSetId Question Set ID
 * @param outcomes Array of review outcomes
 * @param sessionStartTime Start time of the session
 * @param sessionDurationSeconds Duration of the session in seconds
 */
export const processAdvancedReview = async (
  userId: number,
  questionSetId: number,
  outcomes: Array<{
    questionId: number;
    scoreAchieved: number;
    userAnswerText?: string;
    timeSpentOnQuestion?: number;
  }>,
  sessionStartTime: Date,
  sessionDurationSeconds: number
): Promise<QuestionSet> => {
  return prisma.$transaction(async (tx) => {
    // Create study session record
    const sessionEndedAt = new Date();
    const userStudySession = await tx.userStudySession.create({
      data: {
        userId,
        sessionStartedAt: sessionStartTime,
        sessionEndedAt,
        timeSpentSeconds: sessionDurationSeconds,
        answeredQuestionsCount: outcomes.length,
      },
    });

    // Process each outcome
    for (const outcome of outcomes) {
      const question = await tx.question.findUnique({
        where: { id: outcome.questionId },
        select: {
          id: true,
          questionSetId: true,
          uueFocus: true,
          currentMasteryScore: true,
          totalMarksAvailable: true
        }
      });

      if (!question) {
        throw new Error(`Question with ID ${outcome.questionId} not found`);
      }

      // Convert score to quality (0-5)
      const quality = Math.round(outcome.scoreAchieved * 5);
      const isCorrect = quality >= QUALITY_WEIGHTS.GOOD;

      // Create user answer record
      await tx.userQuestionAnswer.create({
        data: {
          userId,
          questionId: outcome.questionId,
          questionSetId: question.questionSetId,
          userStudySessionId: userStudySession.id,
          scoreAchieved: outcome.scoreAchieved,
          isCorrect,
          uueFocusTested: question.uueFocus || 'Understand',
          answeredAt: sessionEndedAt,
          userAnswerText: outcome.userAnswerText,
          timeSpent: outcome.timeSpentOnQuestion || 0,
        },
      });

      // Update question performance
      await tx.question.update({
        where: { id: outcome.questionId },
        data: {
          lastAnswerCorrect: isCorrect,
          timesAnsweredCorrectly: isCorrect ? { increment: 1 } : undefined,
          timesAnsweredIncorrectly: !isCorrect ? { increment: 1 } : undefined,
          currentMasteryScore: outcome.scoreAchieved,
        },
      });
    }

    // Get the question set
    const questionSet = await tx.questionSet.findUnique({
      where: { id: questionSetId },
      include: {
        questions: true,
        folder: true
      }
    });

    if (!questionSet) {
      throw new Error(`Question set with ID ${questionSetId} not found`);
    }

    // Calculate new SR parameters
    const quality = Math.round(
      outcomes.reduce((sum, o) => sum + o.scoreAchieved, 0) / outcomes.length * 5
    );

    const { interval, stage, easeFactor } = calculateNextInterval(
      questionSet.srStage,
      questionSet.currentIntervalDays || 0,
      questionSet.easeFactor || INITIAL_EASE_FACTOR,
      quality
    );

    // Calculate next review date
    const nextReviewDate = new Date(sessionEndedAt);
    nextReviewDate.setDate(sessionEndedAt.getDate() + interval);

    // Update question set
    const updatedQuestionSet = await tx.questionSet.update({
      where: { id: questionSetId },
      data: {
        srStage: stage,
        easeFactor,
        currentIntervalDays: interval,
        nextReviewAt: nextReviewDate,
        lastReviewedAt: sessionEndedAt,
        reviewCount: { increment: 1 },
        lapses: quality <= QUALITY_WEIGHTS.INCORRECT ? { increment: 1 } : undefined,
        masteryHistory: {
          push: {
            timestamp: sessionEndedAt,
            stage,
            interval,
            easeFactor,
            quality
          }
        }
      }
    });

    // Update folder mastery score if needed
    if (questionSet.folder) {
      const folderQuestionSets = await tx.questionSet.findMany({
        where: {
          folderId: questionSet.folder.id,
          folder: { userId }
        }
      });

      if (folderQuestionSets.length > 0) {
        const totalMasterySum = folderQuestionSets.reduce(
          (sum, set) => sum + (set.currentTotalMasteryScore || 0),
          0
        );
        const newFolderMasteryScore = totalMasterySum / folderQuestionSets.length;

        await tx.folder.update({
          where: { id: questionSet.folder.id },
          data: {
            currentMasteryScore: newFolderMasteryScore,
            masteryHistory: {
              push: {
                timestamp: sessionEndedAt,
                score: newFolderMasteryScore
              }
            }
          }
        });
      }
    }

    return updatedQuestionSet;
  });
};

/**
 * Get the next review date for a question set
 * @param questionSet Question set to calculate next review for
 * @returns Next review date
 */
export const getNextReviewDate = (questionSet: QuestionSet): Date => {
  if (!questionSet.nextReviewAt) {
    return new Date();
  }

  const now = new Date();
  const nextReview = new Date(questionSet.nextReviewAt);

  // If the next review is in the past, return now
  if (nextReview <= now) {
    return now;
  }

  return nextReview;
};

/**
 * Get the current stage of a question set
 * @param questionSet Question set to get stage for
 * @returns Current stage name
 */
export const getCurrentStage = (questionSet: QuestionSet): string => {
  switch (questionSet.srStage) {
    case SR_STAGES.NEW:
      return 'New';
    case SR_STAGES.LEARNING:
      return 'Learning';
    case SR_STAGES.REVIEW:
      return 'Review';
    case SR_STAGES.MASTERED:
      return 'Mastered';
    default:
      return 'Unknown';
  }
}; 