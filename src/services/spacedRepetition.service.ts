/**
 * Spaced Repetition Service
 * 
 * This service implements a simplified version of the SM-2 spaced repetition algorithm.
 * It calculates the next review date and updates the mastery score based on whether
 * the user answered correctly.
 */

// Define constants for the spaced repetition algorithm
export const MASTERY_MIN = 0;
export const MASTERY_MAX = 5;

// Intervals (in days) for each mastery level
export const INTERVALS = [1, 2, 4, 7, 15, 30]; // Days until next review for each mastery level
const DEFAULT_INTERVAL = 1; // Default interval in days

/**
 * Calculate the next review date and new mastery score based on whether the question was answered correctly
 * 
 * @param currentMastery - Current mastery score (0-5)
 * @param answeredCorrectly - Whether the question was answered correctly
 * @param currentInterval - Optional current interval in days
 * @returns Object with new mastery score, new interval, and next review date
 */
export const calculateNextReview = (
  currentMastery: number,
  answeredCorrectly: boolean,
  currentInterval?: number
) => {
  // Calculate new mastery score
  let newMastery = currentMastery;
  
  if (answeredCorrectly) {
    // If answered correctly, increase mastery by 1 (up to max)
    newMastery = Math.min(MASTERY_MAX, currentMastery + 1);
  } else {
    // If answered incorrectly, decrease mastery by 2 (down to min)
    newMastery = Math.max(MASTERY_MIN, currentMastery - 2);
  }
  
  // Get the new interval based on the new mastery level
  const newInterval = INTERVALS[newMastery];
  
  // Calculate the next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  
  return {
    newMastery,
    newInterval,
    nextReviewDate
  };
};

/**
 * Calculate the difficulty factor for a question based on performance
 * 
 * @param currentDifficulty - Current difficulty factor (default: 2.5)
 * @param performanceRating - Performance rating (0-5, where 5 is perfect)
 * @returns New difficulty factor
 */
export const calculateDifficultyFactor = (
  currentDifficulty: number,
  performanceRating: number
): number => {
  // SM-2 algorithm formula for calculating the difficulty factor
  let newDifficulty = currentDifficulty + (0.1 - (5 - performanceRating) * (0.08 + (5 - performanceRating) * 0.02));
  
  // Ensure the difficulty factor stays within bounds (1.3 - 2.5)
  newDifficulty = Math.min(2.5, Math.max(1.3, newDifficulty));
  
  return newDifficulty;
};

// Type for any question with masteryScore and nextReviewAt properties
export interface ReviewableQuestion {
  masteryScore: number;
  nextReviewAt: Date | null;
}

/**
 * Get questions that are due for review
 * A question is due if its next review date is in the past or today, or if it has never been reviewed
 * 
 * @param questions - Array of questions with masteryScore and nextReviewAt properties
 * @returns Array of questions that are due for review
 */
export const getDueQuestions = <T extends ReviewableQuestion>(
  questions: T[]
): T[] => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
  
  return questions.filter(question => {
    // If the question has never been reviewed, it's due
    if (question.nextReviewAt === null) return true;
    
    // If the next review date is today or earlier, it's due
    const reviewDate = new Date(question.nextReviewAt);
    reviewDate.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
    
    return reviewDate <= now;
  });
};

// Type for any question that can be prioritized
export interface PrioritizableQuestion extends ReviewableQuestion {
  id?: number;
}

/**
 * Prioritize questions for review based on mastery score and due date
 * Questions with lower mastery scores and that are more overdue get higher priority
 * 
 * @param questions - Array of questions with masteryScore and nextReviewAt properties
 * @returns Array of questions sorted by priority (highest priority first)
 */
export const prioritizeQuestions = <T extends PrioritizableQuestion>(
  questions: T[]
): T[] => {
  const now = new Date();
  
  return [...questions].sort((a, b) => {
    // If both have null nextReviewAt, sort by mastery score
    if (a.nextReviewAt === null && b.nextReviewAt === null) {
      // If both have never been reviewed, prioritize by lower mastery score
      return b.masteryScore - a.masteryScore;
    }
    
    // If only one has never been reviewed, prioritize it
    if (a.nextReviewAt === null) return -1;
    if (b.nextReviewAt === null) return 1;
    
    // Calculate how overdue each question is (in days)
    const aDaysOverdue = Math.max(0, (now.getTime() - a.nextReviewAt.getTime()) / (1000 * 60 * 60 * 24));
    const bDaysOverdue = Math.max(0, (now.getTime() - b.nextReviewAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate a priority score based on mastery and overdue days
    // Lower mastery and more overdue = higher priority
    const aPriority = (MASTERY_MAX - a.masteryScore) * 2 + aDaysOverdue;
    const bPriority = (MASTERY_MAX - b.masteryScore) * 2 + bDaysOverdue;
    
    // Sort by priority (higher priority first)
    return bPriority - aPriority;
  });
};
