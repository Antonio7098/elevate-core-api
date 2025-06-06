import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Question, Prisma, QuestionSet } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getDueQuestionSets,
  getPrioritizedQuestions,
  getUserProgressSummary,
  processQuestionSetReview, // Added
  // calculateQuestionSetNextReview, // Removed
  // updateQuestionPerformance, // Removed
  UNDERSTAND_WEIGHT, // Kept if used elsewhere, otherwise can be removed if submitReview was only consumer
  USE_WEIGHT,        // Kept if used elsewhere
  EXPLORE_WEIGHT     // Kept if used elsewhere
} from '../services/spacedRepetition.service';

const prisma = new PrismaClient();

// Type for Question Set with related data
export type QuestionSetWithRelations = QuestionSet & {
  questions: Question[];
  folder: {
    id: number;
    name: string;
    description?: string | null;
  };
};

// Interface for prioritized question, extending the base Prisma Question type
export interface PrioritizedQuestion extends Question {
  priorityScore: number;
  uueFocus: string;
};

/**
 * Get question sets due for review today
 * GET /api/reviews/today
 */
export const getTodayReviews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (process.env.NODE_ENV !== 'test') { console.log(`🔍 [Reviews] GET /api/reviews/today called`); }
  if (process.env.NODE_ENV !== 'test') { console.log(`🔍 [Reviews] Request headers:`, req.headers); }
  if (process.env.NODE_ENV !== 'test') { console.log(`🔍 [Reviews] Auth header: ${req.headers.authorization || 'None'}`); }
  if (process.env.NODE_ENV !== 'test') { console.log(`🔍 [Reviews] req.user:`, req.user); }
  
  try {
    const userId = req.user?.userId;
    if (process.env.NODE_ENV !== 'test') { console.log(`🔍 [Reviews] Extracted userId from req.user:`, userId); }
    
    if (!userId) {
      console.error(`❌ [Reviews] User not authenticated - userId is missing from req.user`);
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    // Get question sets that are due for review today
    const dueQuestionSets = await getDueQuestionSets(userId);
    
    // Return the question sets due for review
    res.status(200).json({
      count: dueQuestionSets.length,
      questionSets: dueQuestionSets.map(set => ({
        id: set.id,
        name: set.name,
        folderId: set.folderId,
        folderName: set.folder.name,
        totalQuestions: set.questions.length,
        // U-U-E scores
        understandScore: set.understandScore,
        useScore: set.useScore,
        exploreScore: set.exploreScore,
        overallMasteryScore: set.currentTotalMasteryScore,
        // Review info
        lastReviewedAt: set.lastReviewedAt,
        reviewCount: set.reviewCount,
        // First few questions as preview
        previewQuestions: set.questions.slice(0, 3).map((q: Question) => ({
          id: q.id,
          text: q.text,
          questionType: q.questionType,
          uueFocus: q.uueFocus
        }))
      }))
    });
    
  } catch (error) {
    console.error('Error getting today reviews:', error);
    next(error);
  }
};

/**
 * Get questions for a specific review session
 * GET /api/questionsets/:id/review-questions
 */
export const getReviewQuestions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const questionSetId = parseInt(req.params.id);
    const count = req.query.count ? parseInt(req.query.count as string) : 10;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    // Verify that the question set belongs to the user
    const questionSet = await prisma.questionSet.findFirst({
      where: {
        id: questionSetId,
        folder: {
          userId: userId
        }
      }
    });
    
    if (!questionSet) {
      res.status(404).json({ message: 'Question set not found or access denied' });
      return;
    }
    
    // Get prioritized questions for the review session
    const questions = await getPrioritizedQuestions(questionSetId, userId, count);
    
    // Return the questions for the review session
    res.status(200).json({
      questionSetId,
      questionSetName: questionSet.name,
      count: questions.length,
      questions: questions.map((q: PrioritizedQuestion) => ({
        id: q.id,
        text: q.text,
        questionType: q.questionType,
        options: q.options,
        uueFocus: q.uueFocus,
        conceptTags: q.conceptTags,
        totalMarksAvailable: q.totalMarksAvailable,
        priorityScore: q.priorityScore
      }))
    });
    
  } catch (error) {
    console.error('Error getting review questions:', error);
    next(error);
  }
};

// New interface for the incoming payload from the frontend
export interface FrontendReviewOutcome {
  questionId: string; // Will be parsed to number
  scoreAchieved: number; // Expected as 0-5 from frontend, will be normalized to 0-1 for service
  uueFocus?: 'Understand' | 'Use' | 'Explore'; // Optional: service fetches authoritative uueFocus
  userAnswerText?: string; // Renamed from userAnswer
  timeSpentOnQuestion?: number; // Optional: time spent on this specific question
}

export interface FrontendReviewSubmission {
  questionSetId: string; // Will be parsed to number
  outcomes: FrontendReviewOutcome[];
  sessionDurationSeconds: number; // Renamed from timeSpent, total time for the review session in seconds
}

/**
 * Interface for the question set review submission request body
 * This is the OLD interface, kept for reference during transition or if other parts still use it.
 * The submitReview function will now primarily work with FrontendReviewSubmission.
 */
interface QuestionSetReviewSubmission {
  questionSetId: number;
  understandScore: number;
  useScore: number;
  exploreScore: number;
  overallScore: number;
  timeSpent: number;
  questionAnswers: Array<{
    questionId: number;
    isCorrect: boolean;
    userAnswer: string;
    timeSpent: number;
    scoreAchieved: number;
    confidence?: number;
  }>;
}

interface UserQuestionAnswerData {
  questionId: number;
  isCorrect: boolean;
  scoreAchieved: number;
  timeSpent: number;
  userAnswerText: string;
}

/**
 * Submit a review for a question set
 * POST /api/reviews
 */
export const submitReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const sessionStartTime = new Date(); // Capture session start time
  try {
    if (process.env.NODE_ENV !== 'test') { console.log('SUBMIT_REVIEW_START: Content-Type:', req.headers['content-type']); }
    if (process.env.NODE_ENV !== 'test') { console.log('SUBMIT_REVIEW_START: Request Body:', JSON.stringify(req.body, null, 2)); }
    const userId = req.user?.userId;

    if (!userId) {
      console.error('SUBMIT_REVIEW_ERROR: User not authenticated');
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { questionSetId: rawQuestionSetId, outcomes: rawOutcomes, sessionDurationSeconds } = req.body as FrontendReviewSubmission;

    // Validate payload
    if (!rawQuestionSetId || !rawOutcomes || !Array.isArray(rawOutcomes) || typeof sessionDurationSeconds !== 'number') {
      console.error('SUBMIT_REVIEW_ERROR: Invalid payload structure - missing fields');
      res.status(400).json({ message: 'Invalid payload: questionSetId, outcomes array, and sessionDurationSeconds are required.' });
      return;
    }

    const questionSetId = parseInt(rawQuestionSetId);
    if (isNaN(questionSetId)) {
      console.error('SUBMIT_REVIEW_ERROR: Invalid questionSetId format');
      res.status(400).json({ message: 'Invalid questionSetId format. Must be a number.' });
      return;
    }

    if (rawOutcomes.length === 0) {
      console.error('SUBMIT_REVIEW_ERROR: Outcomes array cannot be empty');
      res.status(400).json({ message: 'Outcomes array cannot be empty.' });
      return;
    }

    const processedOutcomes = rawOutcomes.map(outcome => {
      const qId = parseInt(outcome.questionId);
      if (isNaN(qId)) {
        // This error will be caught by the catch block below
        throw new Error(`Invalid questionId in outcomes: ${outcome.questionId}. Must be a number.`);
      }

      const scoreAchievedRaw = outcome.scoreAchieved;
      if (typeof scoreAchievedRaw !== 'number' || scoreAchievedRaw < 0 || scoreAchievedRaw > 5) {
        // This error will be caught by the catch block below
        throw new Error(`Invalid scoreAchieved in outcomes: ${scoreAchievedRaw} for QID ${qId}. Must be a number between 0 and 5.`);
      }
      // Normalize score from 0-5 (frontend) to 0-1 (service)
      const normalizedScore = scoreAchievedRaw / 5;
      
      return {
        questionId: qId,
        scoreAchieved: normalizedScore,
        userAnswerText: outcome.userAnswerText,
        timeSpentOnQuestion: outcome.timeSpentOnQuestion, // This is optional in FrontendReviewOutcome
      };
    });

    const updatedQuestionSet = await processQuestionSetReview(
      userId,
      processedOutcomes,
      sessionStartTime, 
      sessionDurationSeconds 
    );

    // Return the updated QuestionSet directly as per service layer's return
    res.status(200).json(updatedQuestionSet);

  } catch (error) {
    if (process.env.NODE_ENV !== 'test') { console.error('====== DETAILED ERROR IN SUBMIT REVIEW ======', error); } // Outer log for any error
    if (error instanceof Error) {
      if (process.env.NODE_ENV !== 'test') { console.error('Error Name:', error.name); }         // Detailed log for Error instances
      if (process.env.NODE_ENV !== 'test') { console.error('Error Message:', error.message); }   // Detailed log
      if (process.env.NODE_ENV !== 'test') { console.error('Error Stack:', error.stack); }       // Detailed log

      // Specific error handling based on message content
      if (error.message.startsWith('Invalid questionId') || error.message.startsWith('Invalid scoreAchieved')) {
        res.status(400).json({ message: error.message });
        return;
      } else if (error.message.includes('not found during review processing') || error.message.includes('QuestionSet with ID')) { // Catch service layer 'not found' for questions or question sets
        res.status(404).json({ message: error.message }); 
        return;
      } else {
        // For other Error instances, pass to the global error handler
        next(error);
      }
    } else {
      // Handle cases where the thrown object is not an Error instance
      console.error('Non-Error object thrown in submitReview:', error);
      next(error); 
    }
  }
};

/**
 * Get review statistics for a user
 * GET /api/reviews/stats
 */
export const getReviewStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    // Get user progress summary
    const progressSummary = await getUserProgressSummary(userId);
    
    // Return the statistics
    res.status(200).json(progressSummary);
    
  } catch (error) {
    console.error('Error getting review stats:', error);
    next(error);
  }
};
