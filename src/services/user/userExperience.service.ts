import { PrismaClient } from '@prisma/client';
import { UserCriterionMastery, MasteryCriterion, UueStage } from '@prisma/client';
import { masteryCalculationService } from '../mastery/masteryCalculation.service';
import { uueStageProgressionService } from '../mastery/uueStageProgression.service';
import { masteryConfigurationService } from '../mastery/masteryConfiguration.service';

const prisma = new PrismaClient();

export interface PersonalizedLearningPath {
  userId: number;
  sectionId: string;
  currentStage: UueStage;
  nextMilestone: string;
  estimatedCompletion: Date;
  recommendedFocus: string[];
  learningStyle: 'VISUAL' | 'AUDITORY' | 'KINESTHETIC' | 'READING_WRITING';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  progress: {
    overall: number;
    currentStage: number;
    nextStage: number;
  };
}

export interface AdaptiveDifficultyAdjustment {
  criterionId: string;
  currentDifficulty: number;
  adjustedDifficulty: number;
  reasoning: string;
  confidence: number;
  userPerformance: {
    successRate: number;
    averageTime: number;
    attempts: number;
  };
}

export interface UserFeedback {
  userId: number;
  criterionId: string;
  feedbackType: 'DIFFICULTY' | 'CONTENT_QUALITY' | 'LEARNING_PACE' | 'INTERFACE';
  rating: number; // 1-5 scale
  comment?: string;
  timestamp: Date;
  actionTaken?: string;
}

export interface LearningRecommendations {
  userId: number;
  sectionId: string;
  immediate: string[];
  shortTerm: string[];
  longTerm: string[];
  basedOn: {
    performance: boolean;
    preferences: boolean;
    learningStyle: boolean;
    timeAvailable: boolean;
  };
}

export interface ProgressVisualization {
  userId: number;
  sectionId: string;
  stageProgress: {
    stage: UueStage;
    progress: number;
    criteria: {
      id: string;
      name: string;
      progress: number;
      status: 'NOT_STARTED' | 'IN_PROGRESS' | 'MASTERED';
    }[];
  }[];
  overallProgress: number;
  nextMilestone: string;
  estimatedTimeToCompletion: number;
  achievements: string[];
}

export class UserExperienceService {
  /**
   * Generate personalized learning paths based on user preferences and performance
   */
  async generatePersonalizedLearningPath(
    userId: number,
    sectionId: string
  ): Promise<PersonalizedLearningPath> {
    try {
      // Get user's current stage and progress
      const currentStage = await uueStageProgressionService.getCurrentStage(userId, sectionId);
      const stageStats = await uueStageProgressionService.getStageCompletionStats(userId, sectionId);
      
      // Get user preferences and learning style
      const userConfig = await masteryConfigurationService.getUserMasteryConfiguration(userId);
      
      // Get next milestone
      const nextMilestone = stageStats.nextMilestone;
      
      // Calculate estimated completion
      const estimatedCompletion = this.calculateEstimatedCompletion(
        stageStats.estimatedTimeToCompletion,
        userConfig.globalDefaults
      );
      
      // Generate recommended focus areas
      const recommendedFocus = await this.generateRecommendedFocus(userId, sectionId, currentStage);
      
      // Determine learning style preference
      const learningStyle = this.determineLearningStyle(userConfig);
      
      // Determine appropriate difficulty level
      const difficulty = await this.determineUserDifficulty(userId, sectionId);
      
      // Calculate progress
      const progress = await this.calculateDetailedProgress(userId, sectionId, currentStage);
      
      return {
        userId,
        sectionId,
        currentStage,
        nextMilestone,
        estimatedCompletion,
        recommendedFocus,
        learningStyle,
        difficulty,
        progress,
      };
    } catch (error) {
      console.error('Error generating personalized learning path:', error);
      throw error;
    }
  }

  /**
   * Implement adaptive difficulty adjustment based on user performance
   */
  async adjustDifficultyAdaptively(
    userId: number,
    criterionId: string
  ): Promise<AdaptiveDifficultyAdjustment> {
    try {
      // Get current difficulty and user performance
      const currentDifficulty = await this.getCurrentDifficulty(criterionId);
      const userPerformance = await this.getUserPerformance(userId, criterionId);
      
      // Calculate adjusted difficulty
      const adjustedDifficulty = this.calculateAdjustedDifficulty(
        currentDifficulty,
        userPerformance
      );
      
      // Generate reasoning for adjustment
      const reasoning = this.generateDifficultyReasoning(userPerformance, adjustedDifficulty);
      
      // Calculate confidence in adjustment
      const confidence = this.calculateAdjustmentConfidence(userPerformance);
      
      return {
        criterionId,
        currentDifficulty,
        adjustedDifficulty,
        reasoning,
        confidence,
        userPerformance,
      };
    } catch (error) {
      console.error('Error adjusting difficulty adaptively:', error);
      throw error;
    }
  }

  /**
   * Collect and process user feedback for continuous improvement
   */
  async processUserFeedback(feedback: UserFeedback): Promise<{
    processed: boolean;
    actionRequired: boolean;
    actionType?: string;
    response?: string;
  }> {
    try {
      // Store feedback
      await this.storeUserFeedback(feedback);
      
      // Analyze feedback for patterns
      const feedbackAnalysis = await this.analyzeFeedbackPatterns(feedback);
      
      // Determine if action is required
      const actionRequired = this.determineActionRequired(feedback, feedbackAnalysis);
      
      let actionType: string | undefined;
      let response: string | undefined;
      
      if (actionRequired) {
        actionType = this.determineActionType(feedback, feedbackAnalysis);
        response = await this.generateActionResponse(feedback, actionType);
      }
      
      return {
        processed: true,
        actionRequired,
        actionType,
        response,
      };
    } catch (error) {
      console.error('Error processing user feedback:', error);
      throw error;
    }
  }

  /**
   * Generate personalized learning recommendations
   */
  async generateLearningRecommendations(
    userId: number,
    sectionId: string
  ): Promise<LearningRecommendations> {
    try {
      // Get user's current progress and preferences
      const currentProgress = await this.getCurrentProgress(userId, sectionId);
      const userPreferences = await masteryConfigurationService.getUserMasteryConfiguration(userId);
      
      // Generate immediate recommendations (next 1-2 sessions)
      const immediate = await this.generateImmediateRecommendations(userId, sectionId, currentProgress);
      
      // Generate short-term recommendations (next week)
      const shortTerm = await this.generateShortTermRecommendations(userId, sectionId, currentProgress);
      
      // Generate long-term recommendations (next month)
      const longTerm = await this.generateLongTermRecommendations(userId, sectionId, currentProgress);
      
      // Determine what the recommendations are based on
      const basedOn = {
        performance: true,
        preferences: true,
        learningStyle: true,
        timeAvailable: true,
      };
      
      return {
        userId,
        sectionId,
        immediate,
        shortTerm,
        longTerm,
        basedOn,
      };
    } catch (error) {
      console.error('Error generating learning recommendations:', error);
      throw error;
    }
  }

  /**
   * Create progress visualization for enhanced user understanding
   */
  async createProgressVisualization(
    userId: number,
    sectionId: string
  ): Promise<ProgressVisualization> {
    try {
      // Get detailed stage progress
      const learningPath = await uueStageProgressionService.getLearningPath(userId, sectionId);
      
      // Get current stage details
      const currentStage = await uueStageProgressionService.getCurrentStage(userId, sectionId);
      
      // Get next milestone
      const stageStats = await uueStageProgressionService.getStageCompletionStats(userId, sectionId);
      const nextMilestone = stageStats.nextMilestone;
      
      // Calculate estimated time to completion
      const estimatedTimeToCompletion = stageStats.estimatedTimeToCompletion;
      
      // Get user achievements
      const achievements = await this.getUserAchievements(userId, sectionId);
      
      // Create stage progress visualization
      const stageProgress = learningPath.stages.map(stage => ({
        stage: stage.stage,
        progress: stage.progress,
        criteria: stage.criteria.map(criterion => ({
          id: criterion.id,
          name: criterion.description,
          progress: criterion.masteryScore * 100,
          status: criterion.status,
        })),
      }));
      
      return {
        userId,
        sectionId,
        stageProgress,
        overallProgress: learningPath.overallProgress,
        nextMilestone,
        estimatedTimeToCompletion,
        achievements,
      };
    } catch (error) {
      console.error('Error creating progress visualization:', error);
      throw error;
    }
  }

  /**
   * Implement gamification elements for enhanced engagement
   */
  async implementGamification(
    userId: number,
    sectionId: string
  ): Promise<{
    points: number;
    level: number;
    badges: string[];
    streaks: {
      current: number;
      longest: number;
      type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
    };
    challenges: {
      active: string[];
      completed: string[];
      upcoming: string[];
    };
  }> {
    try {
      // Calculate user points based on mastery achievements
      const points = await this.calculateUserPoints(userId, sectionId);
      
      // Determine user level
      const level = this.calculateUserLevel(points);
      
      // Get earned badges
      const badges = await this.getUserBadges(userId, sectionId);
      
      // Calculate learning streaks
      const streaks = await this.calculateLearningStreaks(userId, sectionId);
      
      // Get active and available challenges
      const challenges = await this.getUserChallenges(userId, sectionId);
      
      return {
        points,
        level,
        badges,
        streaks,
        challenges,
      };
    } catch (error) {
      console.error('Error implementing gamification:', error);
      throw error;
    }
  }

  // Private helper methods

  private calculateEstimatedCompletion(
    estimatedMinutes: number,
    userConfig: any
  ): Date {
    const completionDate = new Date();
    const dailyStudyTime = userConfig.dailyStudyTime || 60; // minutes
    const daysToComplete = Math.ceil(estimatedMinutes / dailyStudyTime);
    
    completionDate.setDate(completionDate.getDate() + daysToComplete);
    return completionDate;
  }

  private async generateRecommendedFocus(
    userId: number,
    sectionId: string,
    currentStage: UueStage
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    // Get criteria that need attention
    const userMasteries = await prisma.userCriterionMastery.findMany({
      where: {
        userId,
        blueprintSectionId: sectionId,
        uueStage: currentStage,
        isMastered: false,
      },
      orderBy: {
        masteryScore: 'asc',
      },
      take: 3,
    });
    
    for (const mastery of userMasteries) {
      const criterion = await masteryCalculationService.getCriterion(mastery.masteryCriterionId);
      if (criterion) {
        recommendations.push(`Focus on: ${criterion.description}`);
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('All current stage criteria mastered - ready for next stage');
    }
    
    return recommendations;
  }

  private determineLearningStyle(userConfig: any): 'VISUAL' | 'AUDITORY' | 'KINESTHETIC' | 'READING_WRITING' {
    // This would analyze user behavior and preferences
    // For now, return a default based on configuration
    if (userConfig.globalDefaults.advancedAnalytics) {
      return 'VISUAL';
    } else if (userConfig.globalDefaults.personalizedThresholds) {
      return 'READING_WRITING';
    } else {
      return 'KINESTHETIC';
    }
  }

  private async determineUserDifficulty(
    userId: number,
    sectionId: string
  ): Promise<'EASY' | 'MEDIUM' | 'HARD'> {
    // Analyze user performance to determine appropriate difficulty
    const userPerformance = await this.getOverallUserPerformance(userId, sectionId);
    
    if (userPerformance.successRate > 0.8) {
      return 'HARD';
    } else if (userPerformance.successRate > 0.6) {
      return 'MEDIUM';
    } else {
      return 'EASY';
    }
  }

  private async calculateDetailedProgress(
    userId: number,
    sectionId: string,
    currentStage: UueStage
  ): Promise<{
    overall: number;
    currentStage: number;
    nextStage: number;
  }> {
    const learningPath = await uueStageProgressionService.getLearningPath(userId, sectionId);
    
    const currentStageProgress = learningPath.stages.find(s => s.stage === currentStage)?.progress || 0;
    
    const nextStage = this.getNextStage(currentStage);
    const nextStageProgress = nextStage ? 
      learningPath.stages.find(s => s.stage === nextStage)?.progress || 0 : 0;
    
    return {
      overall: learningPath.overallProgress,
      currentStage: currentStageProgress,
      nextStage: nextStageProgress,
    };
  }

  private async getCurrentDifficulty(criterionId: string): Promise<number> {
    // Get criterion difficulty from database
    const criterion = await prisma.masteryCriterion.findUnique({
      where: { id: criterionId },
      select: { difficulty: true },
    });
    
    return criterion?.difficulty || 0.5;
  }

  private async getUserPerformance(
    userId: number,
    criterionId: string
  ): Promise<{
    successRate: number;
    averageTime: number;
    attempts: number;
  }> {
    const userMastery = await prisma.userCriterionMastery.findUnique({
      where: {
        userId_masteryCriterionId: {
          userId,
          masteryCriterionId: criterionId,
        },
      },
    });
    
    if (!userMastery) {
      return {
        successRate: 0,
        averageTime: 0,
        attempts: 0,
      };
    }
    
    return {
      successRate: userMastery.masteryScore,
      averageTime: 0, // This would be calculated from actual attempt data
      attempts: userMastery.reviewCount,
    };
  }

  private calculateAdjustedDifficulty(
    currentDifficulty: number,
    userPerformance: any
  ): number {
    let adjustment = 0;
    
    if (userPerformance.successRate > 0.8) {
      adjustment = 0.1; // Increase difficulty
    } else if (userPerformance.successRate < 0.4) {
      adjustment = -0.1; // Decrease difficulty
    }
    
    return Math.max(0.1, Math.min(1.0, currentDifficulty + adjustment));
  }

  private generateDifficultyReasoning(
    userPerformance: any,
    adjustedDifficulty: number
  ): string {
    if (userPerformance.successRate > 0.8) {
      return 'High success rate indicates readiness for increased challenge';
    } else if (userPerformance.successRate < 0.4) {
      return 'Low success rate suggests need for reduced difficulty';
    } else {
      return 'Performance within optimal range - maintaining current difficulty';
    }
  }

  private calculateAdjustmentConfidence(userPerformance: any): number {
    // Higher confidence with more attempts
    const attemptConfidence = Math.min(1.0, userPerformance.attempts / 10);
    
    // Higher confidence with consistent performance
    const consistencyConfidence = 1.0 - Math.abs(userPerformance.successRate - 0.6);
    
    return (attemptConfidence + consistencyConfidence) / 2;
  }

  private async storeUserFeedback(feedback: UserFeedback): Promise<void> {
    // Store feedback in database
    await prisma.userFeedback.create({
      data: {
        userId: feedback.userId,
        criterionId: feedback.criterionId,
        feedbackType: feedback.feedbackType,
        rating: feedback.rating,
        comment: feedback.comment,
        timestamp: feedback.timestamp,
      },
    });
  }

  private async analyzeFeedbackPatterns(feedback: UserFeedback): Promise<any> {
    // Analyze feedback patterns for this user and criterion
    const userFeedback = await prisma.userFeedback.findMany({
      where: {
        userId: feedback.userId,
        criterionId: feedback.criterionId,
      },
    });
    
    return {
      totalFeedback: userFeedback.length,
      averageRating: userFeedback.reduce((sum, f) => sum + f.rating, 0) / userFeedback.length,
      commonIssues: this.identifyCommonIssues(userFeedback),
    };
  }

  private determineActionRequired(
    feedback: UserFeedback,
    feedbackAnalysis: any
  ): boolean {
    // Determine if action is required based on feedback
    return feedback.rating < 3 || feedbackAnalysis.averageRating < 3;
  }

  private determineActionType(
    feedback: UserFeedback,
    feedbackAnalysis: any
  ): string {
    if (feedback.feedbackType === 'DIFFICULTY') {
      return 'ADJUST_DIFFICULTY';
    } else if (feedback.feedbackType === 'CONTENT_QUALITY') {
      return 'IMPROVE_CONTENT';
    } else if (feedback.feedbackType === 'LEARNING_PACE') {
      return 'ADJUST_PACE';
    } else {
      return 'GENERAL_IMPROVEMENT';
    }
  }

  private async generateActionResponse(
    feedback: UserFeedback,
    actionType: string
  ): Promise<string> {
    const responses = {
      ADJUST_DIFFICULTY: 'We\'ll adjust the difficulty level based on your feedback',
      IMPROVE_CONTENT: 'Thank you for the feedback - we\'ll work on improving the content quality',
      ADJUST_PACE: 'We\'ll adjust the learning pace to better suit your needs',
      GENERAL_IMPROVEMENT: 'We appreciate your feedback and will use it to improve the learning experience',
    };
    
    return responses[actionType as keyof typeof responses] || 'Thank you for your feedback';
  }

  private async getCurrentProgress(
    userId: number,
    sectionId: string
  ): Promise<any> {
    const learningPath = await uueStageProgressionService.getLearningPath(userId, sectionId);
    return {
      overallProgress: learningPath.overallProgress,
      currentStage: learningPath.stages.find(s => s.status === 'IN_PROGRESS')?.stage,
      completedStages: learningPath.stages.filter(s => s.status === 'MASTERED').length,
    };
  }

  private async generateImmediateRecommendations(
    userId: number,
    sectionId: string,
    currentProgress: any
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (currentProgress.overallProgress < 30) {
      recommendations.push('Focus on understanding basic concepts before moving forward');
    } else if (currentProgress.overallProgress < 70) {
      recommendations.push('Practice applying concepts in different contexts');
    } else {
      recommendations.push('Review and reinforce mastered concepts');
    }
    
    return recommendations;
  }

  private async generateShortTermRecommendations(
    userId: number,
    sectionId: string,
    currentProgress: any
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    recommendations.push('Complete current stage within the next week');
    recommendations.push('Review previous stage concepts for retention');
    recommendations.push('Prepare for next stage advancement');
    
    return recommendations;
  }

  private async generateLongTermRecommendations(
    userId: number,
    sectionId: string,
    currentProgress: any
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    recommendations.push('Complete section mastery within the next month');
    recommendations.push('Apply learned concepts to real-world scenarios');
    recommendations.push('Consider advanced topics in related areas');
    
    return recommendations;
  }

  private async getUserAchievements(
    userId: number,
    sectionId: string
  ): Promise<string[]> {
    const achievements: string[] = [];
    
    // Get user's mastery achievements
    const masteredCriteria = await prisma.userCriterionMastery.count({
      where: {
        userId,
        blueprintSectionId: sectionId,
        isMastered: true,
      },
    });
    
    if (masteredCriteria > 0) {
      achievements.push(`Mastered ${masteredCriteria} criteria`);
    }
    
    if (masteredCriteria > 5) {
      achievements.push('Consistent learner');
    }
    
    if (masteredCriteria > 10) {
      achievements.push('Mastery champion');
    }
    
    return achievements;
  }

  private async calculateUserPoints(
    userId: number,
    sectionId: string
  ): Promise<number> {
    const userMasteries = await prisma.userCriterionMastery.findMany({
      where: {
        userId,
        blueprintSectionId: sectionId,
      },
    });
    
    let points = 0;
    
    for (const mastery of userMasteries) {
      if (mastery.isMastered) {
        points += 100; // Base points for mastery
        points += mastery.consecutiveIntervals * 10; // Bonus for consecutive intervals
        points += mastery.successfulReviews * 5; // Bonus for successful reviews
      } else {
        points += Math.floor(mastery.masteryScore * 50); // Partial points for progress
      }
    }
    
    return points;
  }

  private calculateUserLevel(points: number): number {
    return Math.floor(points / 100) + 1;
  }

  private async getUserBadges(
    userId: number,
    sectionId: string
  ): Promise<string[]> {
    const badges: string[] = [];
    
    // Get user's achievements
    const masteredCriteria = await prisma.userCriterionMastery.count({
      where: {
        userId,
        blueprintSectionId: sectionId,
        isMastered: true,
      },
    });
    
    if (masteredCriteria >= 1) badges.push('First Steps');
    if (masteredCriteria >= 5) badges.push('Dedicated Learner');
    if (masteredCriteria >= 10) badges.push('Knowledge Seeker');
    if (masteredCriteria >= 20) badges.push('Mastery Expert');
    
    return badges;
  }

  private async calculateLearningStreaks(
    userId: number,
    sectionId: string
  ): Promise<{
    current: number;
    longest: number;
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  }> {
    // This would calculate actual learning streaks from user activity
    // For now, return placeholder values
    return {
      current: 3,
      longest: 7,
      type: 'DAILY',
    };
  }

  private async getUserChallenges(
    userId: number,
    sectionId: string
  ): Promise<{
    active: string[];
    completed: string[];
    upcoming: string[];
  }> {
    // This would get actual challenges from the system
    // For now, return placeholder values
    return {
      active: ['Complete 5 criteria this week'],
      completed: ['Master first stage'],
      upcoming: ['Advanced exploration challenge'],
    };
  }

  private async getOverallUserPerformance(
    userId: number,
    sectionId: string
  ): Promise<{
    successRate: number;
    averageTime: number;
    attempts: number;
  }> {
    const userMasteries = await prisma.userCriterionMastery.findMany({
      where: {
        userId,
        blueprintSectionId: sectionId,
      },
    });
    
    if (userMasteries.length === 0) {
      return {
        successRate: 0,
        averageTime: 0,
        attempts: 0,
      };
    }
    
    const totalSuccessRate = userMasteries.reduce((sum, m) => sum + m.masteryScore, 0);
    const averageSuccessRate = totalSuccessRate / userMasteries.length;
    
    const totalAttempts = userMasteries.reduce((sum, m) => sum + m.reviewCount, 0);
    
    return {
      successRate: averageSuccessRate,
      averageTime: 0, // This would be calculated from actual data
      attempts: totalAttempts,
    };
  }

  private getNextStage(currentStage: UueStage): UueStage | null {
    const stageOrder: UueStage[] = ['UNDERSTAND', 'USE', 'EXPLORE'];
    const currentIndex = stageOrder.indexOf(currentStage);
    
    if (currentIndex < stageOrder.length - 1) {
      return stageOrder[currentIndex + 1];
    }
    
    return null;
  }

  private identifyCommonIssues(feedback: any[]): string[] {
    // This would analyze feedback to identify common issues
    // For now, return placeholder
    return ['Difficulty level', 'Content clarity'];
  }
}

export const userExperienceService = new UserExperienceService();

