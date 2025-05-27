import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Question, Prisma, QuestionSet } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getDueQuestionSets,
  getPrioritizedQuestions,
  calculateQuestionSetNextReview,
  getUserProgressSummary
} from '../services/spacedRepetition.service';

const prisma = new PrismaClient();

// Type for Question Set with related data
type QuestionSetWithRelations = QuestionSet & {
  questions: Question[];
  folder: {
    id: number;
    name: string;
    description?: string | null;
  };
};

// Type for prioritized question with uueFocus field
type PrioritizedQuestion = Omit<Question, 'learningStage'> & {
  priorityScore: number;
  uueFocus: string;
};

/**
 * Get question sets due for review today
 * GET /api/reviews/today
 */
export const getTodayReviews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  console.log(`🔍 [Reviews] GET /api/reviews/today called`);
  console.log(`🔍 [Reviews] Request headers:`, req.headers);
  console.log(`🔍 [Reviews] Auth header: ${req.headers.authorization || 'None'}`);
  console.log(`🔍 [Reviews] req.user:`, req.user);
  
  try {
    const userId = req.user?.userId;
    console.log(`🔍 [Reviews] Extracted userId from req.user:`, userId);
    
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
        overallMasteryScore: set.overallMasteryScore,
        // Review info
        lastReviewedAt: set.lastReviewedAt,
        reviewCount: set.reviewCount,
        // First few questions as preview
        previewQuestions: set.questions.slice(0, 3).map(q => ({
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
      questions: questions.map(q => ({
        id: q.id,
        text: q.text,
        questionType: q.questionType,
        options: q.options,
        uueFocus: q.uueFocus,
        conceptTags: q.conceptTags,
        difficultyScore: q.difficultyScore,
        priorityScore: q.priorityScore
      }))
    });
    
  } catch (error) {
    console.error('Error getting review questions:', error);
    next(error);
  }
};

/**
 * Interface for the question set review submission request body
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

/**
 * Submit a review for a question set
 * POST /api/reviews
 */
export const submitReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const reviewData = req.body as QuestionSetReviewSubmission;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    // Verify that the question set belongs to the user
    const questionSet = await prisma.questionSet.findFirst({
      where: {
        id: reviewData.questionSetId,
        folder: {
          userId: userId
        }
      }
    });
    
    if (!questionSet) {
      res.status(404).json({ message: 'Question set not found or access denied' });
      return;
    }
    
    // Verify that all questions belong to the question set
    const questionIds = reviewData.questionAnswers.map(a => a.questionId);
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
        questionSetId: reviewData.questionSetId
      }
    });
    
    if (questions.length !== questionIds.length) {
      res.status(400).json({ message: 'Some questions do not belong to the specified question set' });
      return;
    }
    
    // Calculate the next review date and update mastery scores
    const updatedQuestionSet = await calculateQuestionSetNextReview(
      reviewData.questionSetId,
      {
        userId,
        understandScore: reviewData.understandScore,
        useScore: reviewData.useScore,
        exploreScore: reviewData.exploreScore,
        overallScore: reviewData.overallScore,
        timeSpent: reviewData.timeSpent,
        questionAnswers: reviewData.questionAnswers.map(a => ({
          questionId: a.questionId,
          isCorrect: a.isCorrect,
          timeSpent: a.timeSpent,
          scoreAchieved: a.scoreAchieved,
          confidence: a.confidence
        }))
      }
    );
    
    // Return the updated question set
    res.status(200).json({
      questionSet: {
        id: updatedQuestionSet.id,
        name: updatedQuestionSet.name,
        understandScore: updatedQuestionSet.understandScore,
        useScore: updatedQuestionSet.useScore,
        exploreScore: updatedQuestionSet.exploreScore,
        overallMasteryScore: updatedQuestionSet.overallMasteryScore,
        nextReviewAt: updatedQuestionSet.nextReviewAt,
        reviewCount: updatedQuestionSet.reviewCount
      },
      message: 'Review submitted successfully'
    });
    
  } catch (error) {
    console.error('Error submitting review:', error);
    next(error);
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
