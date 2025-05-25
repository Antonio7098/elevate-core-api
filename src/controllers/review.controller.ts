import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Question, Prisma } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import { calculateNextReview, getDueQuestions, prioritizeQuestions } from '../services/spacedRepetition.service';

const prisma = new PrismaClient();

// Type for Question with related data
type QuestionWithRelations = {
  id: number;
  text: string;
  answer: string | null;
  options: string[];
  questionType: string;
  masteryScore: number;
  nextReviewAt: Date | null;
  questionSetId: number;
  createdAt: Date;
  updatedAt: Date;
  questionSet: {
    id: number;
    name: string;
    folderId: number;
    folder: {
      id: number;
      name: string;
    };
  };
};

/**
 * Get questions due for review today
 * GET /api/reviews/today
 */
export const getTodayReviews = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    // Get all questions from the user's question sets
    const questions = await prisma.question.findMany({
      where: {
        questionSet: {
          folder: {
            userId: userId
          }
        }
      },
      include: {
        questionSet: {
          select: {
            id: true,
            name: true,
            folderId: true,
            folder: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    // Filter questions that are due for review today
    const dueQuestions = getDueQuestions<QuestionWithRelations>(questions);
    
    // Prioritize questions based on mastery score and due date
    const prioritizedQuestions = prioritizeQuestions<QuestionWithRelations>(dueQuestions);
    
    // Return the questions due for review
    res.status(200).json({
      count: prioritizedQuestions.length,
      questions: prioritizedQuestions.map(question => ({
        id: question.id,
        text: question.text,
        questionType: question.questionType,
        options: question.options,
        masteryScore: question.masteryScore,
        nextReviewAt: question.nextReviewAt,
        questionSetId: question.questionSetId,
        questionSetName: question.questionSet.name,
        folderId: question.questionSet.folderId,
        folderName: question.questionSet.folder.name
      }))
    });
    
  } catch (error) {
    console.error('Error getting today reviews:', error);
    next(error);
  }
};

/**
 * Interface for the review submission request body
 */
interface ReviewSubmission {
  questionId: number;
  answeredCorrectly: boolean;
  userAnswer?: string;
}

/**
 * Submit a review for a question
 * POST /api/reviews
 */
export const submitReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { questionId, answeredCorrectly, userAnswer } = req.body as ReviewSubmission;
    
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }
    
    // Verify that the question belongs to the user
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        questionSet: {
          folder: {
            userId: userId
          }
        }
      }
    });
    
    if (!question) {
      res.status(404).json({ message: 'Question not found or access denied' });
      return;
    }
    
    // Calculate the next review date and mastery score
    const currentInterval = question.nextReviewAt 
      ? Math.ceil((new Date().getTime() - question.nextReviewAt.getTime()) / (1000 * 60 * 60 * 24))
      : 1;
    
    const { newMastery, nextReviewDate } = calculateNextReview(
      question.masteryScore,
      answeredCorrectly,
      currentInterval
    );
    
    // Update the question with the new mastery score and next review date
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        masteryScore: newMastery,
        nextReviewAt: nextReviewDate
      }
    });
    
    // Return the updated question
    res.status(200).json({
      question: updatedQuestion,
      reviewResult: {
        answeredCorrectly,
        oldMasteryScore: question.masteryScore,
        newMasteryScore: newMastery,
        nextReviewAt: nextReviewDate
      }
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
    
    // Get all questions from the user's question sets
    const questions = await prisma.question.findMany({
      where: {
        questionSet: {
          folder: {
            userId: userId
          }
        }
      }
    });
    
    // Calculate statistics
    const totalQuestions = questions.length;
    const reviewedQuestions = questions.filter(q => q.nextReviewAt !== null).length;
    const masteredQuestions = questions.filter(q => q.masteryScore >= 4).length;
    const dueQuestions = getDueQuestions<Question>(questions).length;
    
    // Group questions by mastery level
    const masteryLevels = [0, 1, 2, 3, 4, 5];
    const questionsByMastery = masteryLevels.map(level => ({
      level,
      count: questions.filter(q => q.masteryScore === level).length
    }));
    
    // Return the statistics
    res.status(200).json({
      totalQuestions,
      reviewedQuestions,
      masteredQuestions,
      dueQuestions,
      questionsByMastery,
      completionRate: totalQuestions > 0 ? (masteredQuestions / totalQuestions) * 100 : 0
    });
    
  } catch (error) {
    console.error('Error getting review stats:', error);
    next(error);
  }
};
