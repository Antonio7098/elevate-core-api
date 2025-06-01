/**
 * Spaced Repetition Service
 * 
 * This service implements a Question Set-Level spaced repetition system.
 * It calculates the next review date for question sets based on the U-U-E (Understand, Use, Explore)
 * framework and the forgetting curve.
 */

import { PrismaClient, Question as PrismaQuestion, QuestionSet, UserQuestionAnswer, UserStudySession } from '@prisma/client';
import { QuestionSetWithRelations, PrioritizedQuestion } from '../controllers/review.controller';

// Extended Question type with additional properties
type ExtendedQuestion = PrismaQuestion & {
  uueFocus?: string;
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
  { min: 0, max: 19, days: 1 },    // Scores 0-19: review tomorrow
  { min: 20, max: 40, days: 2 },   // Scores 20-40: review in 2 days
  { min: 41, max: 60, days: 4 },   // Scores 41-60: review in 4 days
  { min: 61, max: 80, days: 7 },   // Scores 61-80: review in 7 days
  { min: 81, max: 90, days: 14 },  // Scores 81-90: review in 14 days
  { min: 91, max: 100, days: 30 }  // Scores 91-100: review in 30 days
];

const DEFAULT_INTERVAL = 1; // Default interval in days
const MAX_SCORE_PER_QUESTION = 1; // Max score for a question outcome is 1 (0-1 scale)

/**
 * Calculate the next review date and update mastery scores for a question set
 * based on the review results
 * 
 * @param questionSetId - ID of the question set
 * @param reviewData - Data from the user's review session
 * @returns Updated question set with new mastery scores and next review date
 */
export const processQuestionSetReview = async (
  userId: number,
  outcomes: Array<{
    questionId: number;
    scoreAchieved: number; // 0-1 from AI eval, or frontend 0-5 converted prior to this call
    userAnswerText?: string;
    timeSpentOnQuestion?: number;
  }>,
  sessionStartTime: Date,
  sessionDurationSeconds: number
): Promise<QuestionSet> => {
  return prisma.$transaction(async (tx) => {
    // Step A: Create UserStudySession Record
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

    const userQuestionAnswers = [];
    // Step B: Process Each Outcome (Create UserQuestionAnswer records)
    for (const outcome of outcomes) {
      const question = await tx.question.findUnique({
        where: { id: outcome.questionId },
      });

      if (!question || !question.questionSetId) {
        // Throw an error for non-existent questions to trigger a 404 response
        throw new Error(`Question with ID ${outcome.questionId} not found during review processing.`);
      }

      const isCorrect = outcome.scoreAchieved > 0.6; // Example: Define how isCorrect is derived

      const uqa = await tx.userQuestionAnswer.create({
        data: {
          userId,
          questionId: outcome.questionId,
          questionSetId: question.questionSetId,
          userStudySessionId: userStudySession.id,
          scoreAchieved: outcome.scoreAchieved,
          isCorrect,
          uueFocusTested: question.uueFocus || 'Understand', // Default if not set on question
          answeredAt: sessionEndedAt,
          userAnswerText: outcome.userAnswerText,
          timeSpent: outcome.timeSpentOnQuestion || 0,
        },
      });
      userQuestionAnswers.push(uqa);

      // Update Question performance statistics directly
      if (question) { // Ensure question object is available
        const marksAvailable = question.marksAvailable || 5; // Default to 5 if not set
        const normalizedScore = outcome.scoreAchieved / Math.max(1, marksAvailable); // Avoid division by zero

        const difficultyAdjustment = isCorrect ? -0.05 : 0.05;
        // Ensure question.difficultyScore is treated as a number, default to 0.5 if null/undefined
        const currentDifficulty = typeof question.difficultyScore === 'number' ? question.difficultyScore : 0.5;
        const newDifficultyScore = Math.max(0, Math.min(1, currentDifficulty + difficultyAdjustment));

        await tx.question.update({
          where: { id: outcome.questionId },
          data: {
            lastAnswerCorrect: isCorrect,
            timesAnsweredCorrectly: isCorrect ? { increment: 1 } : undefined,
            timesAnsweredIncorrectly: !isCorrect ? { increment: 1 } : undefined,
            currentMasteryScore: normalizedScore,
            difficultyScore: newDifficultyScore,
          },
        });
      }
    }

    // Step C: Identify Unique Affected QuestionSets
    const affectedQuestionSetIds = [...new Set(userQuestionAnswers.map(uqa => uqa.questionSetId).filter(id => id !== null) as number[])];

    // Step D: For Each Affected questionSetId
    for (const qSetId of affectedQuestionSetIds) {
      const questionSet = await tx.questionSet.findUnique({
        where: { id: qSetId },
        include: { 
          questions: true,
          folder: true // Include folder to get folderId for later use
        },
      });

      if (!questionSet) {
        console.warn(`QuestionSet with ID ${qSetId} not found during processing. Skipping.`);
        continue;
      }

      // D1. Fetch all Questions for this questionSetId (already done via include).
      const questionsInSet = questionSet.questions;
      if (!questionsInSet || questionsInSet.length === 0) {
        console.warn(`QuestionSet with ID ${qSetId} has no questions. Skipping UUE calculation.`);
        // Decide if we should still update SR fields like lastReviewedAt
        await tx.questionSet.update({
          where: { id: qSetId },
          data: { lastReviewedAt: sessionEndedAt }, // At least update this
        });
        continue;
      }

      // Optimization: Fetch all relevant UserQuestionAnswers upfront for all questions in this set
      const questionIds = questionsInSet.map(q => q.id);
      const allUserAnswers = await tx.userQuestionAnswer.findMany({
        where: {
          userId: userId,
          questionId: { in: questionIds },
        },
        orderBy: { answeredAt: 'desc' },
      });

      // Group answers by questionId for quick lookup
      const answersByQuestionId = new Map<number, UserQuestionAnswer>();
      for (const answer of allUserAnswers) {
        // Only store the most recent answer for each question (they're already ordered by answeredAt desc)
        if (!answersByQuestionId.has(answer.questionId)) {
          answersByQuestionId.set(answer.questionId, answer);
        }
      }

      // D2. Calculate U-U-E Scores for the Set
      let totalUnderstandScore = 0;
      let understandQuestionsCount = 0;
      let totalUseScore = 0;
      let useQuestionsCount = 0;
      let totalExploreScore = 0;
      let exploreQuestionsCount = 0;

      for (const q of questionsInSet) {
        // Get the most recent answer from our pre-fetched map
        const latestAnswer = answersByQuestionId.get(q.id);
        const score = latestAnswer ? latestAnswer.scoreAchieved : 0; // Default to 0 if no answer found

        switch (q.uueFocus) {
          case 'Understand':
            totalUnderstandScore += score;
            understandQuestionsCount++;
            break;
          case 'Use':
            totalUseScore += score;
            useQuestionsCount++;
            break;
          case 'Explore':
            totalExploreScore += score;
            exploreQuestionsCount++;
            break;
          default: // If uueFocus is not set or is different, count it towards 'Understand' or handle as error
            totalUnderstandScore += score;
            understandQuestionsCount++;
            break;
        }
      }

      const newUnderstandScore = understandQuestionsCount > 0 ? (totalUnderstandScore / understandQuestionsCount) * 100 : 0;
      const newUseScore = useQuestionsCount > 0 ? (totalUseScore / useQuestionsCount) * 100 : 0;
      const newExploreScore = exploreQuestionsCount > 0 ? (totalExploreScore / exploreQuestionsCount) * 100 : 0;

      // D3. Calculate QuestionSet.currentTotalMasteryScore
      const newTotalMasteryScore =
        newUnderstandScore * UNDERSTAND_WEIGHT +
        newUseScore * USE_WEIGHT +
        newExploreScore * EXPLORE_WEIGHT;

      // D4. Update QuestionSet Spaced Repetition Fields
      const newInterval = getIntervalForMastery(newTotalMasteryScore);
      const nextReviewDate = new Date(sessionEndedAt); // Use sessionEndedAt as the base
      nextReviewDate.setDate(sessionEndedAt.getDate() + newInterval);

      // Forgetting score calculation
      let forgettingPercentage = 0; // Represents how much is forgotten (0-100)
      if (questionSet.lastReviewedAt) {
        const daysSinceLastReview = Math.max(1, Math.floor(
          (sessionEndedAt.getTime() - questionSet.lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24)
        ));
        // Simplified strength model: increases with review count, capped for stability
        const strength = Math.min(10, 2 + Math.log1p(questionSet.reviewCount || 0)); // log1p for log(1+x)
        const retention = Math.exp(-daysSinceLastReview / strength); // Retention (0-1)
        forgettingPercentage = (1 - retention) * 100;
      } else {
        forgettingPercentage = 0; // If never reviewed, effectively 100% retention for scoring purposes
      }

      // D5. Save updates to the QuestionSet
      await tx.questionSet.update({
        where: { id: qSetId },
        data: {
          understandScore: newUnderstandScore,
          useScore: newUseScore,
          exploreScore: newExploreScore,
          currentTotalMasteryScore: newTotalMasteryScore,
          lastReviewedAt: sessionEndedAt,
          reviewCount: { increment: 1 },
          currentIntervalDays: newInterval,
          nextReviewAt: nextReviewDate,
          currentForgottenPercentage: forgettingPercentage, // Schema field name
          masteryHistory: {
            push: {
              timestamp: sessionEndedAt,
              understandScore: newUnderstandScore,
              useScore: newUseScore,
              exploreScore: newExploreScore,
              totalMasteryScore: newTotalMasteryScore,
            }
          }
        },
      });
      
      // D6. Update Parent Folder Mastery Score
      if (questionSet.folder && questionSet.folder.id) {
        const folderId = questionSet.folder.id;
        
        // Fetch all QuestionSets that belong to this folderId and the current userId
        const folderQuestionSets = await tx.questionSet.findMany({
          where: {
            folderId: folderId,
            folder: {
              userId: userId
            }
          }
        });
        
        if (folderQuestionSets.length > 0) {
          // Calculate the average of their currentTotalMasteryScore values
          const totalMasterySum = folderQuestionSets.reduce(
            (sum, set) => sum + (set.currentTotalMasteryScore || 0), 
            0
          );
          const newFolderMasteryScore = totalMasterySum / folderQuestionSets.length;
          
          // Update the currentMasteryScore field on the parent Folder model
          await tx.folder.update({
            where: { id: folderId },
            data: {
              currentMasteryScore: newFolderMasteryScore,
              // Append a new entry to the Folder.masteryHistory (if implemented as a JSON field)
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
    } // End loop over affectedQuestionSetIds

    // Since we're now returning a single QuestionSet, we'll get the first one from the affected sets
    // This assumes the first QuestionSet in the list is the primary one we want to return
    // If there are multiple affected sets, the controller would need to be updated to handle that
    if (affectedQuestionSetIds.length === 0) {
      throw new Error('No question sets were updated during review processing.');
    }
    
    // Get the updated QuestionSet to return
    const updatedQuestionSet = await tx.questionSet.findUnique({
      where: { id: affectedQuestionSetIds[0] }
    });
    
    if (!updatedQuestionSet) {
      throw new Error(`Failed to retrieve updated QuestionSet with ID ${affectedQuestionSetIds[0]}.`);
    }
    
    return updatedQuestionSet;
  });
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
 * Get question sets that are due for review for a specific user
 * A question set is due if its next review date is in the past or today, or if it has never been reviewed
 * 
 * @param userId - User ID to get due question sets for
 * @returns Array of question sets that are due for review
 */
export const getDueQuestionSets = async (userId: number): Promise<QuestionSetWithRelations[]> => {
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
  
  // Map questions and set default uueFocus if needed
  // The existing structure of questionSets already matches QuestionSetWithRelations due to the include clause.
  // We just need to ensure TypeScript knows this.
  return questionSets as QuestionSetWithRelations[];
};

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
    
    // Get the UUE focus for this question
    const uueFocus = question.uueFocus || questionSet.currentUUESetStage || 'Understand';
    
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
    const totalAnswers = (question.timesAnsweredCorrectly || 0) + (question.timesAnsweredIncorrectly || 0);
    if (totalAnswers === 0) {
      priorityScore += 20; // New questions get high priority
    } else {
      priorityScore += Math.max(0, 20 - totalAnswers * 2);
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
    
    // Get the UUE focus for this question
    const questionUueFocus = question.uueFocus || questionSet.currentUUESetStage || 'Understand';
    
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
 * Process a review session for a question set, update all relevant scores and SR data.
 * 
 * @param userId - ID of the user
 * @param questionSetId - ID of the question set reviewed
 * @param outcomes - Array of outcomes from the review session
 * @param sessionStartTime - Optional start time of the session
 * @returns Updated QuestionSet object
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
      questions: true
    }
  });
  
  // Calculate overall statistics
  const totalSets = questionSets.length;
  const totalQuestions = questionSets.reduce((sum, set) => sum + set.questions.length, 0);
  const masteredSets = questionSets.filter(set => set.currentTotalMasteryScore >= 90).length;
  const progressingSets = questionSets.filter(set => set.currentTotalMasteryScore >= 40 && set.currentTotalMasteryScore < 90).length;
  const newSets = questionSets.filter(set => set.currentTotalMasteryScore < 40).length;
  
  // Calculate average scores
  const avgUnderstandScore = questionSets.reduce((sum, set) => sum + set.understandScore, 0) / Math.max(1, totalSets);
  const avgUseScore = questionSets.reduce((sum, set) => sum + set.useScore, 0) / Math.max(1, totalSets);
  const avgExploreScore = questionSets.reduce((sum, set) => sum + set.exploreScore, 0) / Math.max(1, totalSets);
  const avgOverallScore = questionSets.reduce((sum, set) => sum + set.currentTotalMasteryScore, 0) / Math.max(1, totalSets);
  
  // Get due sets for today
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dueSets = questionSets.filter(set => 
    set.nextReviewAt === null || new Date(set.nextReviewAt) <= now
  ).length;
  
  // Calculate review streak and consistency
  const reviews: UserStudySession[] = await prisma.userStudySession.findMany({
    where: { userId },
    orderBy: { sessionEndedAt: 'desc' }
  });
  
  // Check if user has reviewed in the last 24 hours
  const lastReview = reviews[0]?.sessionEndedAt;
  const reviewedToday = lastReview && 
    (new Date().getTime() - new Date(lastReview).getTime()) < 24 * 60 * 60 * 1000;
  
  // Calculate streak (consecutive days with reviews)
  let streak = 0;
  if (reviews.length > 0) {
    const dayMs = 24 * 60 * 60 * 1000;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Group reviews by day
    const reviewDays = new Set<number>();
    reviews.forEach((review: UserStudySession) => {
      const day = new Date(review.sessionEndedAt);
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
