import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Question, Prisma, QuestionSet, Folder } from '@prisma/client';
import {
  getDueQuestionSets,
  getPrioritizedQuestions,
  getUserProgressSummary,
  processQuestionSetReview,
  UNDERSTAND_WEIGHT,
  USE_WEIGHT,
  EXPLORE_WEIGHT
} from '../services/spacedRepetition.service';
import { processAdvancedReview } from '../services/advancedSpacedRepetition.service';

// Extend QuestionSet type to include new fields
interface ExtendedQuestionSet extends QuestionSet {
  srStage: number;
  easeFactor: number;
  lapses: number;
  folder: Folder;
}

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
export const getTodayReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
export const getReviewQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
export const submitReview = async (req: Request, res: Response): Promise<void> => {
  const { questionSetId } = req.params;
  const userId = req.user?.userId;
  const { outcomes, sessionStartTime, sessionDurationSeconds } = req.body;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const questionSet = await prisma.questionSet.findUnique({
      where: { id: parseInt(questionSetId) },
      include: {
        folder: true
      }
    });

    if (!questionSet) {
      res.status(404).json({ error: 'Question set not found' });
      return;
    }

    // Type assertion after null check
    const extendedQuestionSet = questionSet as unknown as ExtendedQuestionSet;

    if (extendedQuestionSet.folder.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const updatedQuestionSet = await processAdvancedReview(
      parseInt(questionSetId),
      userId,
      outcomes
    ) as unknown as ExtendedQuestionSet;

    res.json({
      questionSet: {
        id: updatedQuestionSet.id,
        name: updatedQuestionSet.name,
        currentStage: updatedQuestionSet.srStage,
        currentInterval: updatedQuestionSet.currentIntervalDays,
        easeFactor: updatedQuestionSet.easeFactor,
        lapses: updatedQuestionSet.lapses,
        nextReviewAt: updatedQuestionSet.nextReviewAt
      }
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get review statistics for a user
 * GET /api/reviews/stats
 */
export const getReviewStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

export const startReview = async (req: Request, res: Response): Promise<void> => {
  const { questionSetId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const questionSet = await prisma.questionSet.findUnique({
      where: { id: parseInt(questionSetId) },
      include: {
        folder: true
      }
    });

    if (!questionSet) {
      res.status(404).json({ error: 'Question set not found' });
      return;
    }

    // Type assertion after null check
    const extendedQuestionSet = questionSet as unknown as ExtendedQuestionSet;

    if (extendedQuestionSet.folder.userId !== userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const questions = await getPrioritizedQuestions(
      parseInt(questionSetId),
      userId,
      10
    );

    res.json({
      questionSet: {
        id: extendedQuestionSet.id,
        name: extendedQuestionSet.name,
        currentStage: extendedQuestionSet.srStage,
        currentInterval: extendedQuestionSet.currentIntervalDays,
        easeFactor: extendedQuestionSet.easeFactor,
        lapses: extendedQuestionSet.lapses
      },
      questions
    });
  } catch (error) {
    console.error('Error starting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
