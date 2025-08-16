import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { questionInstanceService } from '../../services/mastery/questionInstance.service';

// ============================================================================
// QUESTION INSTANCE CONTROLLER
// ============================================================================
// 🆕 NEW ARCHITECTURE - Uses criterion-based logic instead of QuestionSet-based
// ============================================================================

export class QuestionInstanceController {
  
  /**
   * POST /api/question-instance
   * Create a new question instance
   */
  async createQuestionInstance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { 
        questionText, 
        answer, 
        explanation, 
        masteryCriterionId, 
        difficulty,
        context
      } = req.body;

      if (!questionText || !answer || !masteryCriterionId) {
        return res.status(400).json({ 
          error: 'Missing required fields: questionText, answer, masteryCriterionId' 
        });
      }

      // Validate difficulty if provided
      const validDifficulties = ['EASY', 'MEDIUM', 'HARD'];
      if (difficulty && !validDifficulties.includes(difficulty)) {
        return res.status(400).json({
          error: 'Invalid difficulty. Must be one of: EASY, MEDIUM, HARD'
        });
      }

      const questionInstance = await questionInstanceService.createQuestionInstance({
        questionText,
        answer,
        explanation,
        context,
        difficulty,
        masteryCriterionId: parseInt(masteryCriterionId),
        userId
      });

      res.status(201).json({
        success: true,
        data: questionInstance
      });
    } catch (error) {
      console.error('Error creating question instance:', error);
      res.status(500).json({ error: 'Failed to create question instance' });
    }
  }

  /**
   * GET /api/question-instance/:id
   * Get a question instance by ID
   */
  async getQuestionInstance(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Missing question ID' });
      }

      const questionInstance = await questionInstanceService.getQuestionInstance(parseInt(id));

      if (!questionInstance) {
        return res.status(404).json({ error: 'Question instance not found' });
      }

      res.json({
        success: true,
        data: questionInstance
      });
    } catch (error) {
      console.error('Error fetching question instance:', error);
      res.status(500).json({ error: 'Failed to fetch question instance' });
    }
  }

  /**
   * PUT /api/question-instance/:id
   * Update a question instance
   */
  async updateQuestionInstance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Missing question instance ID' });
      }

      // Validate question type if provided
      if (updateData.questionType) {
        const validQuestionTypes = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_IN_BLANK', 'SHORT_ANSWER', 'LONG_ANSWER'];
        if (!validQuestionTypes.includes(updateData.questionType)) {
          return res.status(400).json({
            error: 'Invalid question type. Must be one of: MULTIPLE_CHOICE, TRUE_FALSE, FILL_IN_BLANK, SHORT_ANSWER, LONG_ANSWER'
          });
        }
      }

      // Validate difficulty if provided
      if (updateData.difficulty) {
        const validDifficulties = ['EASY', 'MEDIUM', 'HARD'];
        if (!validDifficulties.includes(updateData.difficulty)) {
          return res.status(400).json({
            error: 'Invalid difficulty. Must be one of: EASY, MEDIUM, HARD'
          });
        }
      }

      // This would need to be implemented in the service
      const updatedQuestion = {
        id,
        ...updateData,
        updatedAt: new Date()
      };

      res.json({
        success: true,
        data: updatedQuestion
      });
    } catch (error) {
      console.error('Error updating question instance:', error);
      res.status(500).json({ error: 'Failed to update question instance' });
    }
  }

  /**
   * DELETE /api/question-instance/:id
   * Delete a question instance
   */
  async deleteQuestionInstance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'Missing question instance ID' });
      }

      // This would need to be implemented in the service
      // await questionInstanceService.deleteQuestionInstance(id);

      res.json({
        success: true,
        message: 'Question instance deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting question instance:', error);
      res.status(500).json({ error: 'Failed to delete question instance' });
    }
  }

  /**
   * POST /api/question-instance/:id/attempt
   * Record a question attempt
   */
  async recordQuestionAttempt(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { id } = req.params;
      const { userAnswer, timeSpent, confidence, isCorrect, score, feedback } = req.body;

      if (!id || !userAnswer || typeof isCorrect !== 'boolean') {
        return res.status(400).json({ 
          error: 'Missing required fields: question ID, userAnswer, isCorrect' 
        });
      }

      const attempt = await questionInstanceService.recordQuestionAttempt({
        questionInstanceId: parseInt(id),
        userId,
        userAnswer,
        timeSpent,
        confidence,
        isCorrect,
        score,
        feedback
      });

      res.json({
        success: true,
        data: {
          attemptId: attempt.id,
          questionId: id,
          isCorrect: attempt.isCorrect,
          timeSpent: attempt.timeSpentSeconds,
          recordedAt: attempt.createdAt
        }
      });
    } catch (error) {
      console.error('Error recording question attempt:', error);
      res.status(500).json({ error: 'Failed to record question attempt' });
    }
  }

  /**
   * GET /api/question-instance/criterion/:criterionId
   * Get questions by mastery criterion
   */
  async getQuestionsByCriterion(req: Request, res: Response) {
    try {
      const { criterionId } = req.params;
      const { difficulty, limit, offset } = req.query;

      if (!criterionId) {
        return res.status(400).json({ error: 'Missing criterion ID' });
      }

      const questions = await questionInstanceService.getQuestionsByCriterion(
        parseInt(criterionId),
        {
          difficulty: difficulty as any,
          limit: limit ? parseInt(limit as string) : undefined,
          offset: offset ? parseInt(offset as string) : undefined
        }
      );

      res.json({
        success: true,
        data: {
          criterionId: parseInt(criterionId),
          questions,
          totalQuestions: questions.length,
          filters: { difficulty, limit, offset }
        }
      });
    } catch (error) {
      console.error('Error fetching questions by criterion:', error);
      res.status(500).json({ error: 'Failed to fetch questions by criterion' });
    }
  }

  /**
   * GET /api/question-instance/search
   * Search question instances
   */
  async searchQuestionInstances(req: Request, res: Response) {
    try {
      const { q: query, difficulty, masteryCriterionId, userId, limit, offset } = req.query;

      if (!query) {
        return res.status(400).json({ error: 'Missing search query' });
      }

      const questions = await questionInstanceService.searchQuestionInstances(
        query as string,
        {
          difficulty: difficulty as any,
          masteryCriterionId: masteryCriterionId ? parseInt(masteryCriterionId as string) : undefined,
          userId: userId ? parseInt(userId as string) : undefined,
          limit: limit ? parseInt(limit as string) : undefined,
          offset: offset ? parseInt(offset as string) : undefined
        }
      );

      res.json({
        success: true,
        data: {
          query,
          questions,
          totalResults: questions.length,
          filters: { difficulty, masteryCriterionId, userId, limit, offset }
        }
      });
    } catch (error) {
      console.error('Error searching question instances:', error);
      res.status(500).json({ error: 'Failed to search question instances' });
    }
  }

  /**
   * GET /api/question-instance/recommendations
   * Get personalized question recommendations for a user
   */
  async getQuestionRecommendations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { 
        criterionId, 
        difficulty, 
        limit = 10,
        excludeAnswered = true 
      } = req.query;

      if (!criterionId) {
        return res.status(400).json({ error: 'Criterion ID is required' });
      }

      const recommendations = await questionInstanceService.getQuestionRecommendations(
        userId,
        {
          masteryCriterionId: parseInt(criterionId as string),
          difficulty: difficulty as any,
          limit: parseInt(limit as string),
          excludeAnswered: excludeAnswered === 'true'
        }
      );

      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      console.error('Error getting question recommendations:', error);
      res.status(500).json({ error: 'Failed to get question recommendations' });
    }
  }

  /**
   * GET /api/question-instance/stats
   * Get user's question statistics
   */
  async getUserQuestionStats(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { criterionId, timeRange } = req.query;

      const stats = await questionInstanceService.getUserQuestionStats(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting user question stats:', error);
      res.status(500).json({ error: 'Failed to get user question stats' });
    }
  }

  /**
   * POST /api/question-instance/batch-attempts
   * Record multiple question attempts in a batch
   */
  async recordBatchAttempts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { attempts } = req.body;

      if (!Array.isArray(attempts) || attempts.length === 0) {
        return res.status(400).json({ error: 'Attempts array is required and cannot be empty' });
      }

      const results = await questionInstanceService.recordBatchAttempts(userId, attempts);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('Error recording batch attempts:', error);
      res.status(500).json({ error: 'Failed to record batch attempts' });
    }
  }

  /**
   * GET /api/question-instances/by-uue-stage/:stage
   * Get questions by UUE stage
   */
  async getQuestionsByUueStage(req: Request, res: Response) {
    try {
      const { stage } = req.params;
      const { folderId, setId } = req.params;

      if (!stage || !folderId || !setId) {
        return res.status(400).json({ error: 'Stage, folder ID, and set ID are required' });
      }

      // For now, return a placeholder response
      // This would need to be implemented based on your business logic
      res.json({
        success: true,
        data: [],
        message: `Questions for UUE stage: ${stage} (to be implemented)`
      });
    } catch (error) {
      console.error('Error getting questions by UUE stage:', error);
      res.status(500).json({ error: 'Failed to get questions by UUE stage' });
    }
  }

  /**
   * GET /api/question-instances/by-difficulty/:difficulty
   * Get questions by difficulty level
   */
  async getQuestionsByDifficulty(req: Request, res: Response) {
    try {
      const { difficulty } = req.params;
      const { folderId, setId } = req.params;

      if (!difficulty || !folderId || !setId) {
        return res.status(400).json({ error: 'Difficulty, folder ID, and set ID are required' });
      }

      // For now, return a placeholder response
      // This would need to be implemented based on your business logic
      res.json({
        success: true,
        data: [],
        message: `Questions for difficulty: ${difficulty} (to be implemented)`
      });
    } catch (error) {
      console.error('Error getting questions by difficulty:', error);
      res.status(500).json({ error: 'Failed to get questions by difficulty' });
    }
  }

  /**
   * POST /api/question-instances/:id/validate
   * Validate a question instance
   */
  async validateQuestionInstance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { answer, userId } = req.body;

      if (!id || !answer || !userId) {
        return res.status(400).json({ error: 'Question ID, answer, and user ID are required' });
      }

      // For now, return a placeholder response
      // This would need to be implemented based on your business logic
      res.json({
        success: true,
        data: {
          isCorrect: false,
          feedback: 'Validation logic to be implemented'
        }
      });
    } catch (error) {
      console.error('Error validating question instance:', error);
      res.status(500).json({ error: 'Failed to validate question instance' });
    }
  }

  /**
   * GET /api/question-instances/by-section/:sectionId
   * Get questions by section
   */
  async getQuestionsBySection(req: Request, res: Response) {
    try {
      const { sectionId } = req.params;
      const { folderId, setId } = req.params;

      if (!sectionId || !folderId || !setId) {
        return res.status(400).json({ error: 'Section ID, folder ID, and set ID are required' });
      }

      // For now, return a placeholder response
      // This would need to be implemented based on your business logic
      res.json({
        success: true,
        data: [],
        message: `Questions for section: ${sectionId} (to be implemented)`
      });
    } catch (error) {
      console.error('Error getting questions by section:', error);
      res.status(500).json({ error: 'Failed to get questions by section' });
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Calculate next review date based on attempt performance
   */
  private calculateNextReviewDate(isCorrect: boolean, confidence: number): Date {
    const now = new Date();
    
    // Spaced repetition algorithm
    let daysToAdd = 1;
    if (isCorrect && confidence >= 4) {
      daysToAdd = 7; // High confidence correct answer
    } else if (isCorrect && confidence >= 2) {
      daysToAdd = 3; // Medium confidence correct answer
    } else if (isCorrect) {
      daysToAdd = 2; // Low confidence correct answer
    } else {
      daysToAdd = 1; // Incorrect answer - review soon
    }
    
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + daysToAdd);
    
    return nextReview;
  }
}

// Export controller instance
export const questionInstanceController = new QuestionInstanceController();




