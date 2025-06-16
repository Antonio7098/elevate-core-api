import { Prisma, QuestionSet, Question, UserStudySession } from '@prisma/client';
import prisma from '../lib/prisma';
import { FrontendReviewOutcome } from '../types/review';
import { addDays } from 'date-fns';

// --- TYPE DEFINITIONS ---
// Moved from review.controller.ts to avoid circular dependencies
export type QuestionSetWithRelations = QuestionSet & {
  questions: Question[];
  folder: {
    id: number;
    name: string;
    description?: string | null;
    userId: number;
  };
};

export interface PrioritizedQuestion extends Question {
  priorityScore: number;
  uueFocus: string;
}

// --- CONFIGURATION CONSTANTS ---
const MASTERY_THRESHOLD = 0.75; // 75% mastery required to advance
const SR_INTERVALS_DAYS = [1, 3, 7, 30]; // Fixed intervals in days
const MAX_CONSECUTIVE_FAILURES_FOR_DEMOTION = 2;
const MAX_CONSECUTIVE_FAILURES_FOR_RESET = 3;

/**
 * Processes a multi-set review submission, calculates historical mastery,
 * and updates SR schedules based on fixed intervals and progressive failure penalties.
 */
export async function processAdvancedReview(
  userId: number,
  outcomes: FrontendReviewOutcome[],
  sessionDurationSeconds: number,
): Promise<QuestionSet[]> {
  if (!outcomes || outcomes.length === 0) {
    return [];
  }

  // 1. Group outcomes by questionSetId and authorize
  const outcomesBySet = new Map<number, FrontendReviewOutcome[]>();
  const questionIds = outcomes.map(o => o.questionId);

  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, questionSetId: true, questionSet: { include: { folder: true } } },
  });

  for (const outcome of outcomes) {
    const question = questions.find(q => q.id === outcome.questionId);
    if (!question || !question.questionSetId || !question.questionSet) {
      // Throw an error that the controller can catch and convert to a 404.
      throw new Error(`Question with ID ${outcome.questionId} not found during review processing.`);
    }

    // Authorization check
    if (question.questionSet.folder?.userId !== userId) {
      throw new Error('ACCESS_DENIED');
    }


    if (!outcomesBySet.has(question.questionSetId)) {
      outcomesBySet.set(question.questionSetId, []);
    }
    outcomesBySet.get(question.questionSetId)!.push(outcome);
  }

  // 2. Create a parent study session for this review block
  const userStudySession = await prisma.userStudySession.create({
    data: { userId, timeSpentSeconds: sessionDurationSeconds, answeredQuestionsCount: outcomes.length },
  });

  const transactionPromises: Prisma.PrismaPromise<any>[] = [];
  const updatedSetIds: number[] = [];

  // 3. Process each question set
  for (const [questionSetId, sessionOutcomes] of outcomesBySet.entries()) {
    const questionSet = await prisma.questionSet.findUnique({
      where: { id: questionSetId },
      include: {
        questions: {
          select: { id: true, uueFocus: true, totalMarksAvailable: true },
        },
      },
    });

    if (!questionSet) continue;
    updatedSetIds.push(questionSetId);

    const { sessionMarksAchieved, sessionMarksAvailable } = sessionOutcomes.reduce(
      (acc, cur) => {
        acc.sessionMarksAchieved += cur.marksAchieved;
        acc.sessionMarksAvailable += cur.marksAvailable;
        return acc;
      },
      { sessionMarksAchieved: 0, sessionMarksAvailable: 0 },
    );

    // Atomically create the set-specific session and all its associated answer records.
    // This is now pushed to the transaction promises array.
    transactionPromises.push(
      prisma['questionSetStudySession'].create({
        data: {
          userId,
          sessionId: userStudySession.id,
          questionSetId,
          sessionMarksAchieved,
          sessionMarksAvailable,
          srStageBefore: questionSet.srStage,
          questionsAnswered: {
            connect: sessionOutcomes.map(o => ({ id: o.questionId })),
          },
          // Use a nested write to create answers and link them atomically
          userQuestionAnswers: {
            create: sessionOutcomes.map(outcome => ({
              userId,
              questionId: outcome.questionId,
              scoreAchieved: outcome.marksAchieved,
              userAnswerText: outcome.userAnswerText,
              timeSpent: outcome.timeSpentOnQuestion ?? 0,
              isCorrect: outcome.marksAchieved > 0, // A simple heuristic for now
            })),
          },
        },
      }),
    );

    // This now runs *after* the new answers have been saved within the transaction.
    const { totalMastery, uueScores } = await calculateHistoricalMastery(userId, questionSet, sessionOutcomes);
    const isFailure = totalMastery <= MASTERY_THRESHOLD;
    const nextSrStage = await determineNextSrStage(userId, questionSet, totalMastery);
    const nextReviewAt = getNextReviewDate(nextSrStage, isFailure);

    transactionPromises.push(
      prisma.questionSet.update({
        where: { id: questionSetId },
        data: {
          lastReviewedAt: new Date(),
          nextReviewAt,
          srStage: nextSrStage,
          reviewCount: { // Increment review count on each submission
            increment: 1,
          },
          currentTotalMasteryScore: totalMastery,
          exploreScore: uueScores.Explore,
          understandScore: uueScores.Understand,
          useScore: uueScores.Use,
          masteryHistory: {
            push: {
              date: new Date().toISOString(),
              score: totalMastery,
            },
          },
        },
      }),
    );
  }

  // 4. Execute transaction and return updated sets
  await prisma.$transaction(transactionPromises);

  return prisma.questionSet.findMany({
    where: { id: { in: updatedSetIds } },
  });
}

/**
 * Calculates the overall mastery and UUE sub-scores for a question set
 * based on the user's most recent answer for each question in the set.
 */
async function calculateHistoricalMastery(
  userId: number,
  questionSet: QuestionSet & {
    questions: { id: number; uueFocus: string; totalMarksAvailable: number }[];
  },
  pendingOutcomes: FrontendReviewOutcome[] = [],
): Promise<{ totalMastery: number; uueScores: Record<string, number> }> {
  const questionIds = questionSet.questions.map(q => q.id);

  // 1. Get the most recent answers from the database
  const historicalAnswers = await prisma.userQuestionAnswer.findMany({
    where: {
      userId,
      questionId: { in: questionIds },
    },
    select: {
      questionId: true,
      scoreAchieved: true,
    },
    orderBy: { answeredAt: 'desc' },
    distinct: ['questionId'],
  });

  // 2. Create a map of the most recent scores, giving precedence to pending outcomes
  const latestScores = new Map<number, number>();
  for (const answer of historicalAnswers) {
    latestScores.set(answer.questionId, answer.scoreAchieved);
  }
  for (const outcome of pendingOutcomes) {
    latestScores.set(outcome.questionId, outcome.marksAchieved);
  }

  const marks = {
    total: { achieved: 0, available: 0 },
    uue: {
      Explore: { achieved: 0, available: 0 },
      Understand: { achieved: 0, available: 0 },
      Use: { achieved: 0, available: 0 },
    },
  };

  // 3. Calculate marks based on the definitive latest scores
  for (const question of questionSet.questions) {
    const achieved = latestScores.get(question.id) ?? 0;
    const available = question.totalMarksAvailable;

    marks.total.achieved += achieved;
    marks.total.available += available;

    const uue = question.uueFocus;
    if (uue === 'Explore' || uue === 'Understand' || uue === 'Use') {
      marks.uue[uue].achieved += achieved;
      marks.uue[uue].available += available;
    }
  }

  const calculateScore = (achieved: number, available: number) =>
    available > 0 ? Math.round((achieved / available) * 100) : 0;

  return {
    totalMastery: calculateScore(marks.total.achieved, marks.total.available),
    uueScores: {
      Explore: calculateScore(marks.uue.Explore.achieved, marks.uue.Explore.available),
      Understand: calculateScore(
        marks.uue.Understand.achieved,
        marks.uue.Understand.available,
      ),
      Use: calculateScore(marks.uue.Use.achieved, marks.uue.Use.available),
    },
  };
}

/**
 * Determines the next SR stage based on mastery score and consecutive failures.
 */
async function determineNextSrStage(
  userId: number,
  questionSet: QuestionSet,
  totalMastery: number,
): Promise<number> {
  if (totalMastery > MASTERY_THRESHOLD) {
    // Success: advance stage
    return Math.min(questionSet.srStage + 1, SR_INTERVALS_DAYS.length - 1);
  }

  // Failure: check for consecutive failures
  const recentSessions = await prisma['questionSetStudySession'].findMany({
    where: {
      questionSetId: questionSet.id,
      userId: userId,
    },
    orderBy: { createdAt: 'desc' },
    take: MAX_CONSECUTIVE_FAILURES_FOR_RESET - 1,
  });

  let consecutiveFailures = 1; // Current session is a failure
  for (const session of recentSessions) {
    const sessionMastery =
      session.sessionMarksAvailable > 0
        ? session.sessionMarksAchieved / session.sessionMarksAvailable
        : 0;
    if (sessionMastery <= MASTERY_THRESHOLD) {
      consecutiveFailures++;
    } else {
      break; // Streak is broken
    }
  }

  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES_FOR_RESET) {
    return 0; // 3rd failure: Reset to stage 0
    } else if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES_FOR_DEMOTION) {
    return Math.max(0, questionSet.srStage - 1); // 2nd failure: Demote
  } else {
    return questionSet.srStage; // 1st failure: Stay in stage
  }
}

/**
 * Calculates the next review date based on the SR stage.
 * A failed session always results in a next review in 1 day.
 */
export function getNextReviewDate(stage: number, failed: boolean = false): Date {
  if (failed) {
    return addDays(new Date(), 1);
  }
  const interval = SR_INTERVALS_DAYS[stage] ?? 1;
  return addDays(new Date(), interval);
}

// --- HELPER FUNCTIONS (Moved from legacy service) ---

/**
 * Get question sets that are due for review for a specific user
 * A question set is due if its next review date is in the past or today, or if it has never been reviewed
 */
export const getDueQuestionSets = async (userId: number): Promise<QuestionSetWithRelations[]> => {
  const now = new Date();
  now.setHours(23, 59, 59, 999); // End of today

  const dueSets = await prisma.questionSet.findMany({
    where: {
      folder: {
        userId: userId,
      },
      OR: [
        {
          nextReviewAt: {
            lte: now,
          },
        },
        {
          nextReviewAt: null,
        },
      ],
    },
    include: {
      questions: true,
      folder: true,
    },
  });

  return dueSets as unknown as QuestionSetWithRelations[];
};

/**
 * Get prioritized questions for a review session of a specific question set
 * Questions are prioritized based on U-U-E focus, difficulty, and previous performance
 */
export const getPrioritizedQuestions = async (
  questionSetId: number,
  userId: number,
  count: number = 10
): Promise<PrioritizedQuestion[]> => {
  const questionsInSet = await prisma.question.findMany({
    where: { questionSetId },
    include: {
      userAnswers: {
        where: { userId },
        orderBy: { answeredAt: 'desc' },
      },
      questionSet: {
        select: {
          currentUUESetStage: true,
        },
      },
    },
  });

  const prioritizedQuestions = questionsInSet.map(question => {
    let priorityScore = 50;
    const now = new Date().getTime();

    if (question.userAnswers.length > 0) {
      const lastAnswer = question.userAnswers[0];
      const daysSinceLastAnswer = (now - new Date(lastAnswer.answeredAt).getTime()) / (1000 * 60 * 60 * 24);

      priorityScore += Math.min(20, daysSinceLastAnswer / 2); // Add up to 20 points for recency

      const correctPercentage = (question.userAnswers.filter(a => a.isCorrect).length / question.userAnswers.length) * 100;
      priorityScore += Math.max(0, 20 - (correctPercentage / 5)); // Lower correct % = higher priority
    }

    const questionUueFocus = question.uueFocus || question.questionSet?.currentUUESetStage || 'Understand';

    return {
      ...question,
      priorityScore,
      uueFocus: questionUueFocus,
    };
  });

  return prioritizedQuestions
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, count);
};

/**
 * Get a summary of the user's progress, including stats and review streak.
 */
export const getUserProgressSummary = async (userId: number) => {
  const questionSets = await prisma.questionSet.findMany({
    where: { folder: { userId } },
    include: { questions: true },
  });

  const typedQuestionSets = questionSets as QuestionSetWithRelations[];

  const totalSets = typedQuestionSets.length;
  const totalQuestions = typedQuestionSets.reduce((sum, set) => sum + (set.questions?.length || 0), 0);
  const masteredSets = typedQuestionSets.filter(set => (set.currentTotalMasteryScore || 0) >= 90).length;

  const avgOverallScore = totalSets > 0 ? typedQuestionSets.reduce((sum, set) => sum + (set.currentTotalMasteryScore || 0), 0) / totalSets : 0;

  const now = new Date();
  const dueSets = typedQuestionSets.filter(set =>
    set.nextReviewAt === null || new Date(set.nextReviewAt) <= now
  ).length;

  const reviews: UserStudySession[] = await prisma.userStudySession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  let streak = 0;
  if (reviews.length > 0) {
    const reviewDays = new Set<string>();
    reviews.forEach(review => {
      reviewDays.add(new Date(review.createdAt).toISOString().split('T')[0]);
    });

    let currentDay = new Date();
    while (reviewDays.has(currentDay.toISOString().split('T')[0])) {
      streak++;
      currentDay.setDate(currentDay.getDate() - 1);
    }
  }

  return {
    totalSets,
    totalQuestions,
    masteredSets,
    dueSets,
    avgScores: {
      overall: avgOverallScore,
    },
    reviewStreak: streak,
    totalReviews: reviews.length,
  };
};