import { Question } from '@prisma/client';

// Interface for next review data
export interface NextReviewData {
  nextReviewDate: Date;
  easeFactor: number;
  interval: number;
  lapses: number;
  stage: string;
  totalMarksAwarded: number;
}

// Interface for review result
export interface ReviewResult {
  questionId: number;
  nextReviewDate: Date;
  easeFactor: number;
  interval: number;
  lapses: number;
  stage: string;
  totalMarksAwarded: number;
  isCorrect: boolean;
  timeSpentMs: number;
}

// Interface for prioritized question
export interface PrioritizedQuestion extends Omit<Question, 'markingCriteria'> {
  markingCriteria: any[];
  priority: number;
  nextReviewDate: Date;
}

// Constants
const INITIAL_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;
const MAX_EASE_FACTOR = 2.5;
const EASE_FACTOR_DECREMENT = 0.15;
const EASE_FACTOR_INCREMENT = 0.1;
const MAX_INTERVAL = 365; // days
const INITIAL_INTERVAL = 1; // day
const INTERVAL_MULTIPLIER = 1.5;

/**
 * Calculate the next review date based on the current stage and performance
 */
export function calculateNextReviewDate(
  currentStage: string,
  currentInterval: number,
  isCorrect: boolean
): Date {
  const now = new Date();
  let daysToAdd = 1; // Default to 1 day

  if (isCorrect) {
    switch (currentStage) {
      case 'LEARNING':
        daysToAdd = 1;
        break;
      case 'REVIEW':
        daysToAdd = Math.min(currentInterval * INTERVAL_MULTIPLIER, MAX_INTERVAL);
        break;
      default:
        daysToAdd = 1;
    }
  }

  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + daysToAdd);
  return nextDate;
}

/**
 * Calculate the new ease factor based on performance
 */
export function calculateNewEaseFactor(
  currentEaseFactor: number,
  isCorrect: boolean,
  lapses: number
): number {
  if (isCorrect) {
    // Increase ease factor slightly for correct answers, but cap at MAX_EASE_FACTOR
    return Math.min(currentEaseFactor + EASE_FACTOR_INCREMENT, MAX_EASE_FACTOR);
  } else {
    // Decrease ease factor for incorrect answers, but don't go below MIN_EASE_FACTOR
    return Math.max(
      currentEaseFactor - (EASE_FACTOR_DECREMENT * (lapses + 1)),
      MIN_EASE_FACTOR
    );
  }
}

/**
 * Get the initial ease factor for a new question
 */
export function getInitialEaseFactor(): number {
  return INITIAL_EASE_FACTOR;
}

/**
 * Get the initial interval for a new question
 */
export function getInitialInterval(): number {
  return INITIAL_INTERVAL;
}

/**
 * Get the initial number of lapses for a new question
 */
export function getInitialLapses(): number {
  return 0;
}

/**
 * Get the initial stage for a new question
 */
export function getInitialStage(): string {
  return 'LEARNING';
}

/**
 * Get the initial total marks awarded for a new question
 */
export function getInitialTotalMarksAwarded(): number {
  return 0;
}

/**
 * Get the maximum interval between reviews
 */
export function getMaxInterval(): number {
  return MAX_INTERVAL;
}

/**
 * Calculate the next interval based on current interval and ease factor
 */
export function getNextInterval(currentInterval: number, easeFactor: number): number {
  return Math.min(Math.ceil(currentInterval * easeFactor), MAX_INTERVAL);
}

/**
 * Determine the next stage based on current stage and performance
 */
export function getNextStage(currentStage: string, isCorrect: boolean): string {
  if (!isCorrect) return 'LEARNING';
  
  switch (currentStage) {
    case 'LEARNING':
      return 'REVIEW';
    case 'REVIEW':
      return 'REVIEW';
    default:
      return 'LEARNING';
  }
}

/**
 * Get randomized questions from a question set
 */
export function getRandomizedQuestions(questions: any[], count: number): any[] {
  const shuffled = [...questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Get user progress summary
 */
export function getUserProgressSummary(questions: any[]): {
  total: number;
  learned: number;
  learning: number;
  review: number;
  due: number;
} {
  const now = new Date();
  
  return questions.reduce(
    (acc, q) => {
      acc.total++;
      
      if (q.stage === 'LEARNED') acc.learned++;
      if (q.stage === 'LEARNING') acc.learning++;
      if (q.stage === 'REVIEW') acc.review++;
      if (new Date(q.nextReviewDate) <= now) acc.due++;
      
      return acc;
    },
    { total: 0, learned: 0, learning: 0, review: 0, due: 0 }
  );
}

// Export all utility functions
export default {
  calculateNextReviewDate,
  calculateNewEaseFactor,
  getInitialEaseFactor,
  getInitialInterval,
  getInitialLapses,
  getInitialStage,
  getInitialTotalMarksAwarded,
  getMaxInterval,
  getNextInterval,
  getNextStage,
  getRandomizedQuestions,
  getUserProgressSummary,
};
