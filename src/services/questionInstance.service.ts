import { PrismaClient, QuestionInstance, UserQuestionAnswer, QuestionDifficulty } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================================================
// QUESTION INSTANCE SERVICE
// ============================================================================
// 🆕 NEW ARCHITECTURE - Provides comprehensive question management
// ============================================================================

export interface CreateQuestionInstanceData {
  questionText: string;
  answer: string;
  explanation?: string;
  context?: string;
  difficulty?: QuestionDifficulty;
  masteryCriterionId: number;
  userId: number;
  tags?: string[];
  options?: string[];
  correctAnswer?: string;
  hints?: string[];
  timeLimit?: number;
  points?: number;
}

export interface UpdateQuestionInstanceData {
  questionText?: string;
  answer?: string;
  explanation?: string;
  context?: string;
  difficulty?: QuestionDifficulty;
  tags?: string[];
  options?: string[];
  correctAnswer?: string;
  hints?: string[];
  timeLimit?: number;
  points?: number;
}

export interface QuestionAttemptData {
  questionInstanceId: number;
  userId: number;
  userAnswer: string;
  timeSpent?: number;
  confidence?: number;
  isCorrect: boolean;
  score?: number;
  feedback?: string;
}

export interface QuestionRecommendationFilters {
  difficulty?: QuestionDifficulty;
  masteryCriterionId?: number;
  tags?: string[];
  excludeAnswered?: boolean;
  limit?: number;
}

export interface QuestionAnalytics {
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  averageTimeSpent: number;
  successRate: number;
  difficultyBreakdown: Record<QuestionDifficulty, number>;
  masteryCriterionBreakdown: Record<number, number>;
  recentPerformance: {
    lastWeek: number;
    lastMonth: number;
    lastQuarter: number;
  };
}

export class QuestionInstanceService {
  private readonly logger = console;

  /**
   * Create a new question instance
   */
  async createQuestionInstance(data: CreateQuestionInstanceData): Promise<QuestionInstance> {
    try {
      this.logger.log(`Creating question instance for user ${data.userId}`);

      const questionInstance = await prisma.questionInstance.create({
        data: {
          questionText: data.questionText,
          answer: data.answer,
          explanation: data.explanation,
          context: data.context,
          difficulty: data.difficulty || 'MEDIUM',
          masteryCriterionId: data.masteryCriterionId,
          userId: data.userId
        }
      });

      this.logger.log(`Question instance created with ID: ${questionInstance.id}`);
      return questionInstance;
    } catch (error) {
      this.logger.error(`Error creating question instance: ${error.message}`, error.stack);
      throw new Error('Failed to create question instance');
    }
  }

  /**
   * Get a question instance by ID
   */
  async getQuestionInstance(id: number): Promise<QuestionInstance | null> {
    try {
      this.logger.log(`Fetching question instance with ID: ${id}`);

      const questionInstance = await prisma.questionInstance.findUnique({
        where: { id },
        include: {
          masteryCriterion: true,
          user: {
            select: {
              id: true,
              email: true
            }
          }
        }
      });

      return questionInstance;
    } catch (error) {
      this.logger.error(`Error fetching question instance: ${error.message}`, error.stack);
      throw new Error('Failed to fetch question instance');
    }
  }

  /**
   * Update a question instance
   */
  async updateQuestionInstance(id: number, data: UpdateQuestionInstanceData): Promise<QuestionInstance> {
    try {
      this.logger.log(`Updating question instance with ID: ${id}`);

      const questionInstance = await prisma.questionInstance.update({
        where: { id },
        data: {
          questionText: data.questionText,
          answer: data.answer,
          explanation: data.explanation,
          context: data.context,
          difficulty: data.difficulty,
          updatedAt: new Date()
        }
      });

      this.logger.log(`Question instance updated successfully`);
      return questionInstance;
    } catch (error) {
      this.logger.error(`Error updating question instance: ${error.message}`, error.stack);
      throw new Error('Failed to update question instance');
    }
  }

  /**
   * Delete a question instance
   */
  async deleteQuestionInstance(id: number): Promise<void> {
    try {
      this.logger.log(`Deleting question instance with ID: ${id}`);

      await prisma.questionInstance.delete({
        where: { id }
      });

      this.logger.log(`Question instance deleted successfully`);
    } catch (error) {
      this.logger.error(`Error deleting question instance: ${error.message}`, error.stack);
      throw new Error('Failed to delete question instance');
    }
  }

  /**
   * Get questions by mastery criterion
   */
  async getQuestionsByCriterion(
    masteryCriterionId: number,
    filters?: {
      difficulty?: QuestionDifficulty;
      limit?: number;
      offset?: number;
    }
  ): Promise<QuestionInstance[]> {
    try {
      this.logger.log(`Fetching questions for criterion: ${masteryCriterionId}`);

      const questions = await prisma.questionInstance.findMany({
        where: {
          masteryCriterionId,
          difficulty: filters?.difficulty
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return questions;
    } catch (error) {
      this.logger.error(`Error fetching questions by criterion: ${error.message}`, error.stack);
      throw new Error('Failed to fetch questions by criterion');
    }
  }

  /**
   * Search question instances
   */
  async searchQuestionInstances(
    query: string,
    filters?: {
      difficulty?: QuestionDifficulty;
      masteryCriterionId?: number;
      userId?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<QuestionInstance[]> {
    try {
      this.logger.log(`Searching questions with query: ${query}`);

      const questions = await prisma.questionInstance.findMany({
        where: {
          OR: [
            { questionText: { contains: query, mode: 'insensitive' } },
            { answer: { contains: query, mode: 'insensitive' } },
            { explanation: { contains: query, mode: 'insensitive' } }
          ],
          difficulty: filters?.difficulty,
          masteryCriterionId: filters?.masteryCriterionId,
          userId: filters?.userId
        },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return questions;
    } catch (error) {
      this.logger.error(`Error searching questions: ${error.message}`, error.stack);
      throw new Error('Failed to search questions');
    }
  }

  /**
   * Record a question attempt
   */
  async recordQuestionAttempt(data: QuestionAttemptData): Promise<UserQuestionAnswer> {
    try {
      this.logger.log(`Recording attempt for question: ${data.questionInstanceId}`);

      const attempt = await prisma.userQuestionAnswer.create({
        data: {
          userId: data.userId,
          questionId: data.questionInstanceId,
          isCorrect: data.isCorrect,
          answerText: data.userAnswer,
          timeSpentSeconds: data.timeSpent || 0
        }
      });

      // Update question instance statistics
      await this.updateQuestionStatistics(data.questionInstanceId, data.isCorrect, data.timeSpent || 0);

      this.logger.log(`Question attempt recorded successfully`);
      return attempt;
    } catch (error) {
      this.logger.error(`Error recording question attempt: ${error.message}`, error.stack);
      throw new Error('Failed to record question attempt');
    }
  }

  /**
   * Get question recommendations for a user
   */
  async getQuestionRecommendations(
    userId: number,
    filters?: QuestionRecommendationFilters
  ): Promise<QuestionInstance[]> {
    try {
      this.logger.log(`Getting question recommendations for user: ${userId}`);

      // Get user's answered questions to exclude them
      const answeredQuestionIds = filters?.excludeAnswered ? 
        (await this.getUserAnsweredQuestionIds(userId)) : [];

      const questions = await prisma.questionInstance.findMany({
        where: {
          id: { notIn: answeredQuestionIds },
          difficulty: filters?.difficulty,
          masteryCriterionId: filters?.masteryCriterionId
        },
        take: filters?.limit || 10,
        orderBy: [
          { createdAt: 'desc' },
          { difficulty: 'asc' }
        ]
      });

      return questions;
    } catch (error) {
      this.logger.error(`Error getting question recommendations: ${error.message}`, error.stack);
      throw new Error('Failed to get question recommendations');
    }
  }

  /**
   * Get user question statistics
   */
  async getUserQuestionStats(userId: number): Promise<QuestionAnalytics> {
    try {
      this.logger.log(`Getting question stats for user: ${userId}`);

      // Get total questions answered
      const totalAnswered = await prisma.userQuestionAnswer.count({
        where: { userId }
      });

      // Get correct answers
      const correctAnswers = await prisma.userQuestionAnswer.count({
        where: { 
          userId,
          isCorrect: true
        }
      });

      // Get average time spent
      const timeStats = await prisma.userQuestionAnswer.aggregate({
        where: { userId },
        _avg: {
          timeSpentSeconds: true
        }
      });

      // Calculate recent performance
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const lastQuarter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const lastWeekStats = await this.getPerformanceInPeriod(userId, lastWeek, now);
      const lastMonthStats = await this.getPerformanceInPeriod(userId, lastMonth, now);
      const lastQuarterStats = await this.getPerformanceInPeriod(userId, lastQuarter, now);

      return {
        totalQuestions: totalAnswered,
        answeredQuestions: totalAnswered,
        correctAnswers,
        averageTimeSpent: timeStats._avg.timeSpentSeconds || 0,
        successRate: totalAnswered > 0 ? (correctAnswers / totalAnswered) * 100 : 0,
        difficultyBreakdown: this.calculateDifficultyBreakdown([]),
        masteryCriterionBreakdown: {},
        recentPerformance: {
          lastWeek: lastWeekStats.successRate,
          lastMonth: lastMonthStats.successRate,
          lastQuarter: lastQuarterStats.successRate
        }
      };
    } catch (error) {
      this.logger.error(`Error getting user question stats: ${error.message}`, error.stack);
      throw new Error('Failed to get user question stats');
    }
  }

  /**
   * Record multiple question attempts in batch
   */
  async recordBatchAttempts(
    userId: number,
    attempts: Omit<QuestionAttemptData, 'userId'>[]
  ): Promise<{
    processed: number;
    errors: number;
    results: UserQuestionAnswer[];
    errorDetails: Array<{ questionInstanceId: number; error: string }>;
  }> {
    try {
      this.logger.log(`Recording ${attempts.length} batch attempts for user: ${userId}`);

      const results: UserQuestionAnswer[] = [];
      const errorDetails: Array<{ questionInstanceId: number; error: string }> = [];

      for (const attempt of attempts) {
        try {
          const result = await this.recordQuestionAttempt({
            ...attempt,
            userId
          });
          results.push(result);
        } catch (error) {
          errorDetails.push({
            questionInstanceId: attempt.questionInstanceId,
            error: error.message
          });
        }
      }

      return {
        processed: results.length,
        errors: errorDetails.length,
        results,
        errorDetails
      };
    } catch (error) {
      this.logger.error(`Error recording batch attempts: ${error.message}`, error.stack);
      throw new Error('Failed to record batch attempts');
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Update question instance statistics
   */
  private async updateQuestionStatistics(
    questionId: number,
    isCorrect: boolean,
    timeSpent: number
  ): Promise<void> {
    try {
      // This would update question-level statistics
      // For now, we'll implement basic tracking
      const question = await prisma.questionInstance.findUnique({
        where: { id: questionId }
      });

      if (question) {
        // Update basic stats (this could be enhanced with more sophisticated tracking)
        await prisma.questionInstance.update({
          where: { id: questionId },
          data: {
            updatedAt: new Date()
          }
        });
      }
    } catch (error) {
      this.logger.warn(`Could not update question statistics: ${error.message}`);
    }
  }

  /**
   * Get user's answered question IDs
   */
  private async getUserAnsweredQuestionIds(userId: number): Promise<number[]> {
    try {
      const answers = await prisma.userQuestionAnswer.findMany({
        where: { userId },
        select: { questionId: true }
      });

      return answers.map(a => a.questionId);
    } catch (error) {
      this.logger.warn(`Could not get user answered question IDs: ${error.message}`);
      return [];
    }
  }

  /**
   * Get performance statistics for a specific time period
   */
  private async getPerformanceInPeriod(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<{ successRate: number }> {
    try {
      const total = await prisma.userQuestionAnswer.count({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      if (total === 0) {
        return { successRate: 0 };
      }

      const correct = await prisma.userQuestionAnswer.count({
        where: {
          userId,
          isCorrect: true,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      return {
        successRate: (correct / total) * 100
      };
    } catch (error) {
      this.logger.warn(`Could not get performance in period: ${error.message}`);
      return { successRate: 0 };
    }
  }

  /**
   * Calculate difficulty breakdown from question statistics
   */
  private calculateDifficultyBreakdown(stats: any[]): Record<QuestionDifficulty, number> {
    const breakdown: Record<QuestionDifficulty, number> = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0
    };

    // This is a simplified calculation - in a real implementation,
    // you'd want to aggregate by difficulty level
    return breakdown;
  }
}

// Export service instance
export const questionInstanceService = new QuestionInstanceService();
