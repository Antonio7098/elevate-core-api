/**
 * Spaced Repetition Service
 * 
 * This service implements a Question Set-Level spaced repetition system.
 * It calculates the next review date for question sets based on the U-U-E (Understand, Use, Explore)
 * framework and the forgetting curve.
 */

import { PrismaClient, QuestionSet, Question as PrismaQuestion, UserQuestionSetReview } from '@prisma/client';

// Extended Question type with uueFocus instead of learningStage
type Question = Omit<PrismaQuestion, 'learningStage'> & {
  uueFocus: string;
  userAnswers?: any[];
};

const prisma = new PrismaClient();

// Define constants for the spaced repetition algorithm
export const MASTERY_MIN = 0;
export const MASTERY_MAX = 100;

// Weight distribution for U-U-E components
export const UNDERSTAND_WEIGHT = 0.4; // 40% weight for understanding
export const USE_WEIGHT = 0.4;        // 40% weight for application
export const EXPLORE_WEIGHT = 0.2;    // 20% weight for exploration

// Intervals (in days) for each mastery level range
export const INTERVALS = [
  { min: 0, max: 20, days: 1 },    // Very low mastery: review tomorrow
  { min: 20, max: 40, days: 2 },   // Low mastery: review in 2 days
  { min: 40, max: 60, days: 4 },   // Medium mastery: review in 4 days
  { min: 60, max: 80, days: 7 },   // Good mastery: review in 7 days
  { min: 80, max: 90, days: 14 },  // Very good mastery: review in 14 days
  { min: 90, max: 100, days: 30 }, // Excellent mastery: review in 30 days
];

const DEFAULT_INTERVAL = 1; // Default interval in days

/**
 * Calculate the next review date and update mastery scores for a question set
 * based on the review results
 * 
 * @param questionSetId - ID of the question set
 * @param reviewData - Data from the user's review session
 * @returns Updated question set with new mastery scores and next review date
 */
export const calculateQuestionSetNextReview = async (
  questionSetId: number,
  reviewData: {
    userId: number;
    understandScore: number;
    useScore: number;
    exploreScore: number;
    overallScore: number;
    timeSpent: number;
    questionAnswers: Array<{
      questionId: number;
      isCorrect: boolean;
      timeSpent: number;
      scoreAchieved?: number;
      confidence?: number;
      userAnswer: string;
    }>;
  }
) => {
  // Fetch the question set with its current scores
  const questionSet = await prisma.questionSet.findUnique({
    where: { id: questionSetId },
    include: { questions: true }
  });
  
  if (!questionSet) {
    throw new Error(`Question set with ID ${questionSetId} not found`);
  }
  
  // Calculate the new overall mastery score based on U-U-E components
  const newOverallScore = (
    reviewData.understandScore * UNDERSTAND_WEIGHT +
    reviewData.useScore * USE_WEIGHT +
    reviewData.exploreScore * EXPLORE_WEIGHT
  );
  
  // Apply forgetting curve effect based on time since last review
  let forgettingScore = 0;
  if (questionSet.lastReviewedAt) {
    const daysSinceLastReview = Math.max(1, Math.floor(
      (Date.now() - questionSet.lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24)
    ));
    // Ebbinghaus forgetting curve: retention = e^(-time/strength)
    // where strength increases with each successful review
    const strength = 2 + Math.log(questionSet.reviewCount + 1);
    forgettingScore = 100 * Math.exp(-daysSinceLastReview / strength);
  }
  
  // Get the appropriate interval based on the new mastery score
  const newInterval = getIntervalForMastery(newOverallScore);
  
  // Calculate the next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  
  // Update question set with new scores
  const updatedQuestionSet = await prisma.questionSet.update({
    where: { id: questionSetId },
    data: {
      understandScore: reviewData.understandScore,
      useScore: reviewData.useScore,
      exploreScore: reviewData.exploreScore,
      overallMasteryScore: newOverallScore,
      forgettingScore,
      nextReviewAt: nextReviewDate,
      currentIntervalDays: newInterval,
      lastReviewedAt: new Date(),
      reviewCount: { increment: 1 },
      userReviews: {
        create: {
          userId: reviewData.userId,
          understandScore: reviewData.understandScore,
          useScore: reviewData.useScore,
          exploreScore: reviewData.exploreScore,
          overallScore: newOverallScore,
          timeSpent: reviewData.timeSpent,
        }
      }
    }
  });
  
  // Update individual questions based on answers
  await updateQuestionPerformance(reviewData.questionAnswers, reviewData.userId);
  
  return updatedQuestionSet;
};

/**
 * Get the appropriate interval in days based on overall mastery score
 * 
 * @param overallScore - Overall mastery score (0-100)
 * @returns Interval in days
 */
export const getIntervalForMastery = (overallScore: number): number => {
  // Find the appropriate interval based on the overall mastery score
  const interval = INTERVALS.find(
    range => overallScore >= range.min && overallScore <= range.max
  );
  
  return interval ? interval.days : DEFAULT_INTERVAL;
};

/**
 * Update individual question performance based on user answers
 * 
 * @param questionAnswers - Array of question answers from the review session
 * @param userId - The ID of the user who submitted the answers
 */
export const updateQuestionPerformance = async (
  questionAnswers: Array<{
    questionId: number;
    isCorrect: boolean;
    timeSpent: number;
    scoreAchieved?: number;
    confidence?: number;
    userAnswer: string;
  }>,
  userId: number
) => {
  const updates = questionAnswers.map(async (answer) => {
    // Create UserQuestionAnswer record first
    await prisma.userQuestionAnswer.create({
      data: {
        userId: userId,
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        isCorrect: answer.isCorrect,
        scoreAchieved: answer.scoreAchieved, // Will be null if not provided
        timeSpent: answer.timeSpent, // Defaulted to 0 from controller if not sent
        answeredAt: new Date(),
        // confidence field from original 'answer' is not in UserQuestionAnswer schema, so not included here
      },
    });

    // Then, find the question to update its aggregate stats
    const question = await prisma.question.findUnique({
      where: { id: answer.questionId },
    });

    if (!question) {
      console.warn(`Question with ID ${answer.questionId} not found during performance update.`);
      return; // Skip if question not found
    }

    // Calculate difficulty adjustment based on correctness and scoreAchieved
    let difficultyAdjustment = 0;
    if (answer.scoreAchieved !== undefined && answer.scoreAchieved !== null) {
      // Higher score = less difficult, lower score = more difficult
      // Assuming scoreAchieved is 0-100. Perfect score (100) might decrease difficulty, 0 might increase it significantly.
      difficultyAdjustment = (50 - answer.scoreAchieved) / 500; // e.g. score 0 -> +0.1, score 50 -> 0, score 100 -> -0.1
    } else {
      // Fallback if scoreAchieved is not available, use isCorrect
      difficultyAdjustment = answer.isCorrect ? -0.05 : 0.1;
    }
    // Factor in confidence if provided (lower confidence = higher difficulty)
    // Note: 'confidence' was part of the original 'answer' type but not directly on 'UserQuestionAnswer' schema.
    // If we want to use confidence, it should be passed in 'answer' object if available.
    if (answer.confidence !== undefined) {
      difficultyAdjustment += (3 - answer.confidence) * 0.02; // Assumes 1-5 scale, centered at 3
    }

    // Update the question with new performance data using existing fields
    await prisma.question.update({
      where: { id: answer.questionId },
      data: {
        lastAnswerCorrect: answer.isCorrect,
        timesAnswered: { increment: 1 },
        timesAnsweredWrong: answer.isCorrect ? undefined : { increment: 1 },
        // DO NOT include 'userAnswers: { create: ... } }' here, as UserQuestionAnswer is created above.
      },
    });
  });

  await Promise.all(updates);
};

// Type for a question set due for review
export interface DueQuestionSet extends QuestionSet {
  questions: Question[];
  folder: {
    id: number;
    name: string;
    description?: string | null;
  };
}

/**
 * Get question sets that are due for review for a specific user
 * A question set is due if its next review date is in the past or today, or if it has never been reviewed
 * 
 * @param userId - User ID to get due question sets for
 * @returns Array of question sets that are due for review
 */
export const getDueQuestionSets = async (userId: number): Promise<DueQuestionSet[]> => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Set to beginning of day for comparison
  
  // Get all question sets for the user
  const questionSets = await prisma.questionSet.findMany({
    where: {
      folder: {
        userId: userId
      },
      OR: [
        { nextReviewAt: null }, // Never reviewed
        { nextReviewAt: { lte: now } } // Due today or earlier
      ]
    },
    include: {
      questions: true,
      folder: true
    }
  });
  
  // Map the learningStage field to uueFocus for each question
  const dueQuestionSets = questionSets.map(set => ({
    ...set,
    questions: set.questions.map(q => ({
      ...q,
      // @ts-ignore - Convert learningStage to uueFocus
      uueFocus: q.learningStage || 'Understand',
      // @ts-ignore - Remove learningStage
      learningStage: undefined
    })) as unknown as Question[]
  })) as DueQuestionSet[];
  
  return dueQuestionSets;
};

// Interface for prioritized questions within a question set
export interface PrioritizedQuestion extends Question {
  priorityScore: number;
  uueFocus: string;
}

/**
 * Get prioritized questions for a review session of a specific question set
 * Questions are prioritized based on U-U-E focus, difficulty, and previous performance
 * 
 * @param questionSetId - Question set ID to get questions for
 * @param userId - User ID to get questions for
 * @param count - Number of questions to return (default: 10)
 * @returns Array of questions sorted by priority (highest priority first)
 */
export const getPrioritizedQuestions = async (
  questionSetId: number,
  userId: number,
  count: number = 10
): Promise<PrioritizedQuestion[]> => {
  // Get the question set with all questions
  const questionSet = await prisma.questionSet.findUnique({
    where: { id: questionSetId },
    include: {
      questions: {
        include: {
          userAnswers: {
            where: { userId },
            orderBy: { answeredAt: 'desc' },
            take: 5 // Get the 5 most recent answers for each question
          }
        }
      }
    }
  });
  
  if (!questionSet) {
    throw new Error(`Question set with ID ${questionSetId} not found`);
  }
  
  // Get the user's current U-U-E focus for this question set
  let currentFocus = 'Understand';
  if (questionSet.understandScore >= 70) {
    currentFocus = 'Use';
    if (questionSet.useScore >= 70) {
      currentFocus = 'Explore';
    }
  }
  
  // Calculate priority score for each question
  const prioritizedQuestions = questionSet.questions.map(question => {
    let priorityScore = 0;
    
    // Convert learningStage to uueFocus for compatibility
    // @ts-ignore - Access learningStage property
    const uueFocus = question.uueFocus || question.learningStage || 'Understand';
    
    // 1. Prioritize questions based on U-U-E focus
    if (uueFocus === currentFocus) {
      priorityScore += 30;
    } else if (
      (currentFocus === 'Use' && uueFocus === 'Understand') ||
      (currentFocus === 'Explore' && uueFocus === 'Use')
    ) {
      priorityScore += 15; // Previous stages still get some priority
    }
    
    // 2. Prioritize questions that were previously answered incorrectly
    if (question.lastAnswerCorrect === false) {
      priorityScore += 25;
    }
    
    // 3. U-U-E focus priority
    if (uueFocus === 'Understand') {
      priorityScore += 10; // Understanding focus gets higher priority
    } else if (uueFocus === 'Explore') {
      priorityScore -= 5;  // Exploration focus gets lower priority
    }
    
    // 4. Prioritize questions that haven't been answered many times
    if (question.timesAnswered === 0) {
      priorityScore += 20; // New questions get high priority
    } else {
      priorityScore += Math.max(0, 20 - question.timesAnswered * 2);
    }
    
    // 5. Analyze recent performance from user answers
    const recentAnswers = question.userAnswers;
    if (recentAnswers.length > 0) {
      // Calculate percentage of correct answers
      const correctAnswers = recentAnswers.filter(a => a.isCorrect).length;
      const correctPercentage = (correctAnswers / recentAnswers.length) * 100;
      
      // Lower correct percentage = higher priority
      priorityScore += Math.max(0, 20 - (correctPercentage / 5));
    }
    
    // Convert learningStage to uueFocus for compatibility
    // @ts-ignore - Access learningStage property
    const questionUueFocus = question.uueFocus || question.learningStage || 'Understand';
    
    return {
      ...question,
      priorityScore,
      uueFocus: questionUueFocus
    };
  });
  
  // Sort by priority score (highest first) and return the requested number
  return prioritizedQuestions
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, count);
};

/**
 * Get a summary of a user's progress across all question sets
 * 
 * @param userId - User ID to get progress for
 * @returns Summary of the user's progress
 */
export const getUserProgressSummary = async (userId: number) => {
  // Get all question sets for the user
  const questionSets = await prisma.questionSet.findMany({
    where: {
      folder: {
        userId
      }
    },
    include: {
      questions: true,
      userReviews: {
        orderBy: {
          completedAt: 'desc'
        },
        take: 10 // Get the 10 most recent reviews
      }
    }
  });
  
  // Calculate overall statistics
  const totalSets = questionSets.length;
  const totalQuestions = questionSets.reduce((sum, set) => sum + set.questions.length, 0);
  const masteredSets = questionSets.filter(set => set.overallMasteryScore >= 90).length;
  const progressingSets = questionSets.filter(set => set.overallMasteryScore >= 40 && set.overallMasteryScore < 90).length;
  const newSets = questionSets.filter(set => set.overallMasteryScore < 40).length;
  
  // Calculate average scores
  const avgUnderstandScore = questionSets.reduce((sum, set) => sum + set.understandScore, 0) / Math.max(1, totalSets);
  const avgUseScore = questionSets.reduce((sum, set) => sum + set.useScore, 0) / Math.max(1, totalSets);
  const avgExploreScore = questionSets.reduce((sum, set) => sum + set.exploreScore, 0) / Math.max(1, totalSets);
  const avgOverallScore = questionSets.reduce((sum, set) => sum + set.overallMasteryScore, 0) / Math.max(1, totalSets);
  
  // Get due sets for today
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dueSets = questionSets.filter(set => 
    set.nextReviewAt === null || new Date(set.nextReviewAt) <= now
  ).length;
  
  // Calculate review streak and consistency
  const reviews = await prisma.userQuestionSetReview.findMany({
    where: { userId },
    orderBy: { completedAt: 'desc' }
  });
  
  // Check if user has reviewed in the last 24 hours
  const lastReview = reviews[0]?.completedAt;
  const reviewedToday = lastReview && 
    (new Date().getTime() - lastReview.getTime()) < 24 * 60 * 60 * 1000;
  
  // Calculate streak (consecutive days with reviews)
  let streak = 0;
  if (reviews.length > 0) {
    const dayMs = 24 * 60 * 60 * 1000;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Group reviews by day
    const reviewDays = new Set();
    reviews.forEach(review => {
      const day = new Date(review.completedAt);
      day.setHours(0, 0, 0, 0);
      reviewDays.add(day.getTime());
    });
    
    // Count consecutive days
    let currentDay = today.getTime();
    while (reviewDays.has(currentDay)) {
      streak++;
      currentDay -= dayMs;
    }
  }
  
  return {
    totalSets,
    totalQuestions,
    masteredSets,
    progressingSets,
    newSets,
    dueSets,
    avgScores: {
      understand: avgUnderstandScore,
      use: avgUseScore,
      explore: avgExploreScore,
      overall: avgOverallScore
    },
    reviewStreak: streak,
    reviewedToday,
    totalReviews: reviews.length
  };
};
