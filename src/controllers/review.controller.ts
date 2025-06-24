import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Question, Prisma, QuestionSet, Folder } from '@prisma/client';
import {
  getDueQuestionSets,
  getPrioritizedQuestions,
  getUserProgressSummary,
  processAdvancedReview,
  QuestionSetWithRelations,
  PrioritizedQuestion,
} from '../services/advancedSpacedRepetition.service';
import { FrontendReviewOutcome } from '../types/review';

const prisma = new PrismaClient();

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
      questionSets: dueQuestionSets.map((set: QuestionSetWithRelations) => ({
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
export const getReviewQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const questionSetId = parseInt(req.params.questionSetId);
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

    const now = new Date();
    if (questionSet.nextReviewAt && new Date(questionSet.nextReviewAt) > now) {
      res.status(403).json({ 
        message: 'This question set is not due for review yet.',
        nextReviewAt: questionSet.nextReviewAt
      });
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
  const userId = req.user?.userId;
  // questionSetId is now optional and not used for authorization here
  const { outcomes, sessionDurationSeconds } = req.body as { outcomes: FrontendReviewOutcome[], sessionDurationSeconds: number };

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!outcomes || !Array.isArray(outcomes) || outcomes.length === 0) {
    res.status(400).json({ error: 'Review outcomes are required.' });
    return;
  }

  try {
    const updatedQuestionSets = await processAdvancedReview(
      userId,
      outcomes,
      sessionDurationSeconds,
    );

    // Return the array of updated sets directly, as expected by tests.
    res.status(200).json(updatedQuestionSets);
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific errors thrown from the service layer.
      if (error.message.includes('not found during review processing')) {
        res.status(404).json({ message: error.message });
        return;
      }
      if (error.message === 'ACCESS_DENIED') {
        res.status(403).json({ message: 'Access denied to one or more question sets.' });
        return;
      }
    }
    // Generic error handler
    console.error('Error submitting review:', error);
    res.status(500).json({ message: 'Internal server error' });
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

export const startReview = async (req: Request, res: Response) => {
  const { questionSetId } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const questionSet = await prisma.questionSet.findFirst({
      where: { 
        id: parseInt(questionSetId),
        folder: {
          userId: userId
        }
      }
    });

    if (!questionSet) {
      return res.status(404).json({ error: 'Question set not found or access denied' });
    }

    const now = new Date();
    if (questionSet.nextReviewAt && new Date(questionSet.nextReviewAt) > now) {
      return res.status(403).json({ 
        message: 'This question set is not due for review yet.',
        nextReviewAt: questionSet.nextReviewAt
      });
    }

    const questions = await getPrioritizedQuestions(
      parseInt(questionSetId),
      userId,
      10
    );

    res.json({
      questionSet: {
        id: questionSet.id,
        name: questionSet.name,
        currentInterval: questionSet.currentIntervalDays,
        masteryScore: questionSet.currentTotalMasteryScore,
        nextReviewAt: questionSet.nextReviewAt
      },
      questions
    });
  } catch (error) {
    console.error('Error starting review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
