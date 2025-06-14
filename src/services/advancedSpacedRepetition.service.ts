import { PrismaClient, QuestionSet, UserQuestionAnswer, Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

// SM-2 Algorithm Constants
const MIN_EASE_FACTOR = 1.3;
const INITIAL_EASE_FACTOR = 2.5;
const QUALITY_WEIGHTS = [0, 0.1, 0.2, 0.3, 0.4, 0.5];

// Stages for spaced repetition
const STAGES = {
  LEARNING: 'LEARNING',
  REVIEW: 'REVIEW',
  MASTERED: 'MASTERED',
} as const;

type SRStage = typeof STAGES[keyof typeof STAGES];

// Define intervals for each stage
const STAGE_INTERVALS: Record<SRStage, number | number[]> = {
  [STAGES.LEARNING]: [1, 10], // Minutes for learning stage
  [STAGES.REVIEW]: 1, // Days for review stage
  [STAGES.MASTERED]: 7, // Days for mastered stage
};

// Calculate next interval based on SM-2 algorithm
function calculateNextInterval(
  currentStage: SRStage,
  currentInterval: number,
  easeFactor: number,
  quality: number
): { nextInterval: number; nextEaseFactor: number } {
  // Get the base interval for the current stage
  const baseInterval = Array.isArray(STAGE_INTERVALS[currentStage])
    ? (STAGE_INTERVALS[currentStage] as number[])[0]
    : STAGE_INTERVALS[currentStage] as number;

  // Calculate new ease factor
  const newEaseFactor = Math.max(
    MIN_EASE_FACTOR,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Calculate next interval
  let nextInterval: number;
  if (currentStage === STAGES.LEARNING) {
    // For learning stage, use predefined intervals
    const learningIntervals = STAGE_INTERVALS[STAGES.LEARNING] as number[];
    const currentIndex = learningIntervals.indexOf(currentInterval);
    nextInterval = learningIntervals[Math.min(currentIndex + 1, learningIntervals.length - 1)];
  } else {
    // For review and mastered stages, use SM-2 formula
    nextInterval = Math.round(currentInterval * newEaseFactor);
  }

  return { nextInterval, nextEaseFactor: newEaseFactor };
}

// Process a review session
export async function processAdvancedReview(
  questionSetId: number,
  userId: number,
  answers: Array<{ questionId: number; quality: number }>
): Promise<void> {
  const questionSet = await prisma.questionSet.findUnique({
    where: { id: questionSetId },
    include: { questions: true }
  });

  if (!questionSet) {
    throw new Error('Question set not found');
  }

  // Destructure needed fields
  const { srStage, currentIntervalDays, easeFactor, questions } = questionSet as any;

  // Create user study session
  const studySession = await prisma.userStudySession.create({
    data: {
      userId,
      sessionStartedAt: new Date(),
      sessionEndedAt: new Date(),
      timeSpentSeconds: 0,
      answeredQuestionsCount: answers.length
    }
  });

  // Process each answer
  for (const answer of answers) {
    const question = questions.find((q: any) => q.id === answer.questionId);
    if (!question) continue;

    const currentStage = srStage as unknown as SRStage;
    const currentInterval = currentIntervalDays || 0;
    const currentEaseFactor = easeFactor || INITIAL_EASE_FACTOR;

    const { nextInterval, nextEaseFactor } = calculateNextInterval(
      currentStage,
      currentInterval,
      currentEaseFactor,
      answer.quality
    );

    // Create answer record
    await prisma.userQuestionAnswer.create({
      data: {
        userId,
        questionId: answer.questionId,
        userStudySessionId: studySession.id,
        isCorrect: answer.quality >= 4,
        timeSpent: 0,
        scoreAchieved: answer.quality / 5,
        questionSetId
      }
    });

    // Update question set with new spaced repetition data
    await prisma.questionSet.update({
      where: { id: questionSetId },
      data: {
        currentIntervalDays: nextInterval,
        easeFactor: nextEaseFactor,
        srStage: determineNextStage(currentStage, answer.quality) as unknown as number
      } as any
    });
  }
}

// Determine next stage based on current stage and performance
function determineNextStage(currentStage: SRStage, quality: number): SRStage {
  if (currentStage === STAGES.LEARNING) {
    return quality >= 4 ? STAGES.REVIEW : STAGES.LEARNING;
  } else if (currentStage === STAGES.REVIEW) {
    return quality >= 4 ? STAGES.MASTERED : STAGES.LEARNING;
  } else {
    return quality >= 4 ? STAGES.MASTERED : STAGES.REVIEW;
  }
}

// Get next review date for a question set
export function getNextReviewDate(questionSet: any): Date {
  const { srStage, currentIntervalDays } = questionSet;
  const currentStage = srStage as unknown as SRStage;
  const interval = currentIntervalDays || 0;
  
  if (currentStage === STAGES.LEARNING) {
    const learningIntervals = STAGE_INTERVALS[STAGES.LEARNING] as number[];
    const nextInterval = learningIntervals[Math.min(interval, learningIntervals.length - 1)];
    return new Date(Date.now() + nextInterval * 60 * 1000); // Convert minutes to milliseconds
  } else {
    return new Date(Date.now() + interval * 24 * 60 * 60 * 1000); // Convert days to milliseconds
  }
}

// Get current stage of a question set
export function getCurrentStage(questionSet: any): SRStage {
  const { srStage } = questionSet;
  return srStage as unknown as SRStage;
} 