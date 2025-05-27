import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Question, Prisma, QuestionSet } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getDueQuestionSets,
  getPrioritizedQuestions,
  calculateQuestionSetNextReview,
  getUserProgressSummary,
  UNDERSTAND_WEIGHT,
  USE_WEIGHT,
  EXPLORE_WEIGHT,
  updateQuestionPerformance
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
        marksAvailable: q.marksAvailable,
        priorityScore: q.priorityScore
      }))
    });
    
  } catch (error) {
    console.error('Error getting review questions:', error);
    next(error);
  }
};

// New interface for the incoming payload from the frontend
interface FrontendReviewOutcome {
  questionId: string;
  scoreAchieved: number;
  uueFocus: 'Understand' | 'Use' | 'Explore';
  userAnswer: string;
}

interface FrontendReviewSubmission {
  questionSetId: string;
  outcomes: FrontendReviewOutcome[];
  timeSpent: number; // Added to capture total session time
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

/**
 * Submit a review for a question set
 * POST /api/reviews
 */
export const submitReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const frontendReviewData = req.body as FrontendReviewSubmission;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const questionSetIdNumber = parseInt(frontendReviewData.questionSetId, 10);
    if (isNaN(questionSetIdNumber)) {
      res.status(400).json({ message: 'Invalid Question Set ID format.' });
      return;
    }

    // Fetch the question set and its questions to verify ownership and get necessary data
    const questionSet = await prisma.questionSet.findFirst({
      where: {
        id: questionSetIdNumber,
        folder: {
          userId: userId
        }
      },
      include: {
        questions: true // Include all questions for this set
      }
    });

    if (!questionSet) {
      res.status(404).json({ message: 'Question set not found or access denied' });
      return;
    }

    // Create a map of questions for easy lookup
    const questionsMap = new Map(questionSet.questions.map(q => [q.id.toString(), q]));

    const parsedQuestionAnswers: Array<{
      questionId: number;
      isCorrect: boolean;
      timeSpent: number; 
      scoreAchieved: number; // Raw marks
      confidence?: number; 
      userAnswer: string;
    }> = [];

    let understandRawScore = 0;
    let understandMaxMarks = 0;
    let useRawScore = 0;
    let useMaxMarks = 0;
    let exploreRawScore = 0;
    let exploreMaxMarks = 0;

    for (const outcome of frontendReviewData.outcomes) {
      const questionIdNumber = parseInt(outcome.questionId, 10);
      if (isNaN(questionIdNumber)) {
        res.status(400).json({ message: `Invalid Question ID format for outcome: ${outcome.questionId}` });
        return;
      }

      const question = questionsMap.get(outcome.questionId);
      if (!question) {
        res.status(400).json({ message: `Question ID ${outcome.questionId} does not belong to Question Set ID ${questionSetIdNumber} or not found.` });
        return;
      }

      const currentQuestionMarksAvailable = question.marksAvailable || 1; // Default to 1 if not set
      const isCorrectForThisQuestion = outcome.scoreAchieved / currentQuestionMarksAvailable >= 0.5; // 50% or more marks

      parsedQuestionAnswers.push({
        questionId: questionIdNumber,
        isCorrect: isCorrectForThisQuestion,
        scoreAchieved: outcome.scoreAchieved, // Store raw marks
        timeSpent: 0, // Default as frontend does not send per-question time for now
        userAnswer: outcome.userAnswer,
      });

      // Use uueFocus from the DB Question entity as source of truth
      switch (question.uueFocus) { 
        case 'Understand':
          understandRawScore += outcome.scoreAchieved;
          understandMaxMarks += currentQuestionMarksAvailable;
          break;
        case 'Use':
          useRawScore += outcome.scoreAchieved;
          useMaxMarks += currentQuestionMarksAvailable;
          break;
        case 'Explore':
          exploreRawScore += outcome.scoreAchieved;
          exploreMaxMarks += currentQuestionMarksAvailable;
          break;
      }
    }

    const calculatedUnderstandScore = understandMaxMarks > 0 ? (understandRawScore / understandMaxMarks) * 100 : 0;
    const calculatedUseScore = useMaxMarks > 0 ? (useRawScore / useMaxMarks) * 100 : 0;
    const calculatedExploreScore = exploreMaxMarks > 0 ? (exploreRawScore / exploreMaxMarks) * 100 : 0;

    const calculatedOverallScore = 
      (calculatedUnderstandScore * UNDERSTAND_WEIGHT) +
      (calculatedUseScore * USE_WEIGHT) +
      (calculatedExploreScore * EXPLORE_WEIGHT);
    
    // updateQuestionPerformance is called within calculateQuestionSetNextReview
    // No need to call it directly here if calculateQuestionSetNextReview handles it.

    // Create UserQuestionSetReview entry
    await prisma.userQuestionSetReview.create({
      data: {
        userId: userId,
        questionSetId: questionSetIdNumber,
        understandScore: calculatedUnderstandScore,
        useScore: calculatedUseScore,
        exploreScore: calculatedExploreScore,
        overallScore: calculatedOverallScore,
        timeSpent: frontendReviewData.timeSpent,
        // completedAt is @default(now())
      }
    });

    // Call the service function to update QuestionSet mastery and next review date
    const updatedQuestionSet = await calculateQuestionSetNextReview(
      questionSetIdNumber,
      {
        userId, // userId is needed by calculateQuestionSetNextReview for context or further updates
        understandScore: calculatedUnderstandScore, // Pass the 0-100 score
        useScore: calculatedUseScore,             // Pass the 0-100 score
        exploreScore: calculatedExploreScore,       // Pass the 0-100 score
        overallScore: calculatedOverallScore,       // Pass the 0-100 score
        timeSpent: frontendReviewData.timeSpent,
        questionAnswers: parsedQuestionAnswers // Pass the raw scores here for UserQuestionAnswer creation
      }
    );

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
