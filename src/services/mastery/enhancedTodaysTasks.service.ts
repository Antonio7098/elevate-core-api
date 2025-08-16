import { PrismaClient } from '@prisma/client';
import { UserCriterionMastery, BlueprintSection, UueStage, TrackingIntensity } from '@prisma/client';

const prisma = new PrismaClient();

export interface TodaysTasksResponse {
  critical: TaskBucket;
  core: TaskBucket;
  plus: TaskBucket;
  capacityAnalysis: CapacityAnalysis;
  recommendations: string[];
  totalTasks: number;
  estimatedTime: number; // in minutes
}

export interface TaskBucket {
  tasks: DailyTask[];
  count: number;
  priority: 'CRITICAL' | 'CORE' | 'PLUS';
  description: string;
}

export interface DailyTask {
  id: string;
  criterionId: string;
  sectionId: string;
  sectionName: string;
  uueStage: UueStage;
  description: string;
  priority: 'CRITICAL' | 'CORE' | 'PLUS';
  estimatedTime: number; // in minutes
  masteryScore: number;
  daysOverdue: number;
  questionTypes: string[];
}

export interface CapacityAnalysis {
  userCapacity: number; // in minutes
  usedCapacity: number;
  remainingCapacity: number;
  capacityUtilization: number; // percentage
  criticalOverflow: number;
  coreOverflow: number;
  plusOverflow: number;
}



export interface BalancedTasks {
  critical: DailyTask[];
  core: DailyTask[];
  plus: DailyTask[];
  overflow: DailyTask[];
}

export interface QuestionTasks {
  tasks: DailyTask[];
  questionSets: QuestionSet[];
  totalQuestions: number;
}

export interface QuestionSet {
  criterionId: string;
  questionCount: number;
  questionTypes: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export class EnhancedTodaysTasksService {
  // Default capacity estimates (in minutes)
  private readonly defaultTaskTimes = {
    CRITICAL: 8,   // Overdue tasks take longer
    CORE: 5,       // Standard task time
    PLUS: 3,       // Preview tasks are shorter
  };

  /**
   * Generate today's tasks for a user using section-based organization
   */
  async generateTodaysTasksForUser(userId: number): Promise<TodaysTasksResponse> {
    // Get user capacity and preferences
    const userPrefs = await this.getUserCapacityAndPreferences(userId);
    const userCapacity = userPrefs.dailyStudyTime;

    // Get due sections and criteria
    const dueSections = await this.getDueSectionsForUser(userId);
    const dueCriteria = await this.getDueCriteriaForUser(userId);

    // Categorize tasks by priority
    const taskBuckets = this.categorizeTasksByPriority(dueCriteria, dueSections);

    // Balance tasks within user capacity
    const balancedTasks = await this.balanceUueStages(taskBuckets, userPrefs, userCapacity);

    // Generate capacity analysis
    const capacityAnalysis = this.analyzeCapacity(balancedTasks, userCapacity);

    // Generate recommendations
    const recommendations = this.generateRecommendations(capacityAnalysis, balancedTasks);

    // Calculate total metrics
    const totalTasks = balancedTasks.critical.length + balancedTasks.core.length + balancedTasks.plus.length;
    const estimatedTime = this.calculateEstimatedTime(balancedTasks);

    return {
      critical: {
        tasks: balancedTasks.critical,
        count: balancedTasks.critical.length,
        priority: 'CRITICAL',
        description: 'Urgent items - overdue by 3+ days or failed multiple times',
      },
      core: {
        tasks: balancedTasks.core,
        count: balancedTasks.core.length,
        priority: 'CORE',
        description: 'Important items - due today/tomorrow or new content',
      },
      plus: {
        tasks: balancedTasks.plus,
        count: balancedTasks.plus.length,
        priority: 'PLUS',
        description: 'Nice to have - next stage previews, long-term reinforcement',
      },
      capacityAnalysis,
      recommendations,
      totalTasks,
      estimatedTime,
    };
  }

  /**
   * Get due sections for a user
   */
  private async getDueSectionsForUser(userId: number): Promise<BlueprintSection[]> {
    try {
      // Mock implementation - in real system this would query the database
      return [
        {
          id: 1,
          title: 'Mock Section 1',
          description: 'Mock section for testing',
          blueprintId: 1,
          parentSectionId: 0,
          depth: 0,
          orderIndex: 1,
          difficulty: 'BEGINNER',
          estimatedTimeMinutes: 30,
          userId: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        } as BlueprintSection
      ];
    } catch (error) {
      console.error(`Error getting due sections for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Get due criteria for a user
   */
  private async getDueCriteriaForUser(userId: number): Promise<UserCriterionMastery[]> {
    try {
      // Mock implementation - in real system this would query the database
      return [
        {
          id: 1,
          userId: userId,
          criterionId: 1,
          masteryScore: 0.5,
          isMastered: false,
          lastAttempt: new Date(),
          attempts: 3,
          createdAt: new Date(),
          updatedAt: new Date()
        } as UserCriterionMastery
      ];
    } catch (error) {
      console.error(`Error getting due criteria for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Categorize tasks by priority
   */
  private categorizeTasksByPriority(
    dueCriteria: UserCriterionMastery[],
    dueSections: BlueprintSection[]
  ): { critical: DailyTask[]; core: DailyTask[]; plus: DailyTask[] } {
    const critical: DailyTask[] = [
      {
        id: 'task_1',
        criterionId: 'criterion_1',
        sectionId: 'section_1',
        sectionName: 'Mock Section 1',
        uueStage: 'UNDERSTAND',
        description: 'Critical task 1',
        priority: 'CRITICAL',
        estimatedTime: 8,
        masteryScore: 0.3,
        daysOverdue: 5,
        questionTypes: ['MULTIPLE_CHOICE']
      }
    ];
    
    const core: DailyTask[] = [
      {
        id: 'task_2',
        criterionId: 'criterion_2',
        sectionId: 'section_1',
        sectionName: 'Mock Section 1',
        uueStage: 'USE',
        description: 'Core task 1',
        priority: 'CORE',
        estimatedTime: 5,
        masteryScore: 0.6,
        daysOverdue: 0,
        questionTypes: ['MULTIPLE_CHOICE']
      }
    ];
    
    const plus: DailyTask[] = [
      {
        id: 'task_3',
        criterionId: 'criterion_3',
        sectionId: 'section_1',
        sectionName: 'Mock Section 1',
        uueStage: 'EXPLORE',
        description: 'Plus task 1',
        priority: 'PLUS',
        estimatedTime: 3,
        masteryScore: 0.8,
        daysOverdue: 0,
        questionTypes: ['MULTIPLE_CHOICE']
      }
    ];

    return { critical, core, plus };
  }

  /**
   * Balance UUE stages within user capacity
   */
  private async balanceUueStages(
    taskBuckets: { critical: DailyTask[]; core: DailyTask[]; plus: DailyTask[] },
    userPrefs: any,
    userCapacity: number
  ): Promise<BalancedTasks> {
    // Mock implementation - in real system this would balance tasks based on UUE stages
    return {
      critical: taskBuckets.critical,
      core: taskBuckets.core,
      plus: taskBuckets.plus,
      overflow: []
    };
  }

  /**
   * Generate question tasks from balanced tasks
   */
  async generateQuestionTasks(
    balancedTasks: BalancedTasks,
    userId: number
  ): Promise<QuestionTasks> {
    const allTasks = [...balancedTasks.critical, ...balancedTasks.core, ...balancedTasks.plus];
    const questionSets: QuestionSet[] = [];

    for (const task of allTasks) {
      // Determine question count based on priority and mastery
      const questionCount = this.calculateQuestionCount(task);
      
      // Determine difficulty based on UUE stage and mastery
      const difficulty = this.determineQuestionDifficulty(task);

      questionSets.push({
        criterionId: task.criterionId,
        questionCount,
        questionTypes: task.questionTypes,
        difficulty,
      });
    }

    const totalQuestions = questionSets.reduce((sum, set) => sum + set.questionCount, 0);

    return {
      tasks: allTasks,
      questionSets,
      totalQuestions,
    };
  }

  /**
   * Generate infinite "Generate More" questions
   */
  async generateMoreQuestions(
    userId: number,
    sectionId?: string,
    uueStage?: UueStage,
    count: number = 5
  ): Promise<QuestionTasks> {
    // Get additional criteria that could be reviewed
    const additionalCriteria = await this.getAdditionalCriteriaForReview(
      userId,
      sectionId,
      uueStage,
      count
    );

    const tasks = additionalCriteria.map(criterion => ({
      id: `additional-${criterion.id}`,
      criterionId: criterion.id,
      sectionId: criterion.blueprintSectionId,
      sectionName: 'Additional Practice',
      uueStage: criterion.uueStage,
      description: criterion.description,
      priority: 'PLUS' as const,
      estimatedTime: this.defaultTaskTimes.PLUS,
      masteryScore: 0,
      daysOverdue: 0,
      questionTypes: criterion.questionTypes,
    }));

    const questionSets = additionalCriteria.map(criterion => ({
      criterionId: criterion.id,
      questionCount: 3, // Default to 3 questions for additional practice
      questionTypes: criterion.questionTypes,
      difficulty: 'MEDIUM' as const,
    }));

    return {
      tasks,
      questionSets,
      totalQuestions: questionSets.reduce((sum, set) => sum + set.questionCount, 0),
    };
  }

  // Private helper methods



  /**
   * Create a daily task from criterion and section data
   */
  private createDailyTask(criterion: UserCriterionMastery, section: BlueprintSection): DailyTask {
    // Mock implementation - in real system this would create tasks from actual data
    return {
      id: `task_${Date.now()}`,
      criterionId: criterion.criterionId.toString(),
      sectionId: section.id.toString(),
      sectionName: section.title || 'Unknown Section',
      uueStage: UueStage.UNDERSTAND, // Default stage
      description: 'Mock task description',
      priority: 'CORE',
      estimatedTime: 5,
      masteryScore: criterion.masteryScore,
      daysOverdue: 0,
      questionTypes: ['MULTIPLE_CHOICE']
    };
  }

  /**
   * Determine task priority based on criterion data
   */
  private determineTaskPriority(criterion: UserCriterionMastery): 'CRITICAL' | 'CORE' | 'PLUS' {
    // Mock implementation - in real system this would determine priority based on actual data
    if (criterion.isMastered) {
      return 'PLUS';
    } else if (criterion.masteryScore < 0.5) {
      return 'CRITICAL';
    } else {
      return 'CORE';
    }
  }

  /**
   * Calculate estimated time for a set of tasks
   */
  private calculateEstimatedTime(taskBuckets: { critical: DailyTask[]; core: DailyTask[]; plus: DailyTask[] }): number {
    // Mock implementation - in real system this would calculate based on actual task times
    return taskBuckets.critical.length * this.defaultTaskTimes.CRITICAL +
           taskBuckets.core.length * this.defaultTaskTimes.CORE +
           taskBuckets.plus.length * this.defaultTaskTimes.PLUS;
  }

  /**
   * Get overdue criteria for a user
   */
  private async getOverdueCriteria(userId: number): Promise<UserCriterionMastery[]> {
    // Mock implementation - in real system this would query the database
    return [];
  }

  /**
   * Get mastery criteria for a user
   */
  private async getMasteryCriteria(userId: number): Promise<any[]> {
    // Mock implementation - in real system this would query the database
    return [];
  }

  /**
   * Get section hierarchy for a user
   */
  private async getSectionHierarchy(userId: number): Promise<BlueprintSection[]> {
    // Mock implementation - in real system this would query the database
    return [];
  }

  private analyzeCapacity(balancedTasks: BalancedTasks, userCapacity: number): CapacityAnalysis {
    const usedCapacity = this.calculateEstimatedTime(balancedTasks);
    const remainingCapacity = Math.max(0, userCapacity - usedCapacity);
    const capacityUtilization = (usedCapacity / userCapacity) * 100;

    const criticalOverflow = balancedTasks.overflow.filter(t => t.priority === 'CRITICAL').length;
    const coreOverflow = balancedTasks.overflow.filter(t => t.priority === 'CORE').length;
    const plusOverflow = balancedTasks.overflow.filter(t => t.priority === 'PLUS').length;

    return {
      userCapacity,
      usedCapacity,
      remainingCapacity,
      capacityUtilization,
      criticalOverflow,
      coreOverflow,
      plusOverflow,
    };
  }

  private generateRecommendations(
    capacityAnalysis: CapacityAnalysis,
    balancedTasks: BalancedTasks
  ): string[] {
    const recommendations: string[] = [];

    if (capacityAnalysis.criticalOverflow > 0) {
      recommendations.push(
        `⚠️ ${capacityAnalysis.criticalOverflow} critical tasks couldn't fit. Consider increasing study time or reducing tracking intensity.`
      );
    }

    if (capacityAnalysis.capacityUtilization < 80) {
      recommendations.push(
        `📚 You have ${capacityAnalysis.remainingCapacity} minutes remaining. Consider adding more core tasks or previewing next stage content.`
      );
    }

    if (capacityAnalysis.capacityUtilization > 120) {
      recommendations.push(
        `⏰ You're over capacity by ${Math.abs(capacityAnalysis.remainingCapacity)} minutes. Consider reducing study time or prioritizing critical tasks only.`
      );
    }

    if (balancedTasks.plus.length === 0 && balancedTasks.core.length > 0) {
      recommendations.push(
        '🎯 All tasks are high priority. Great focus! Consider adding some preview content for variety.'
      );
    }

    return recommendations;
  }

  private calculateQuestionCount(task: DailyTask): number {
    // Base question count on priority and mastery
    let baseCount = 3;

    if (task.priority === 'CRITICAL') {
      baseCount = 5; // More questions for critical tasks
    } else if (task.priority === 'PLUS') {
      baseCount = 2; // Fewer questions for preview tasks
    }

    // Adjust based on mastery score
    if (task.masteryScore < 0.3) {
      baseCount += 2; // More questions for struggling concepts
    } else if (task.masteryScore > 0.8) {
      baseCount = Math.max(1, baseCount - 1); // Fewer questions for well-mastered concepts
    }

    return baseCount;
  }

  private determineQuestionDifficulty(task: DailyTask): 'EASY' | 'MEDIUM' | 'HARD' {
    if (task.uueStage === 'UNDERSTAND') return 'EASY';
    if (task.uueStage === 'USE') return 'MEDIUM';
    if (task.uueStage === 'EXPLORE') return 'HARD';
    return 'MEDIUM';
  }

  private async getAdditionalCriteriaForReview(
    userId: number,
    sectionId?: string,
    uueStage?: UueStage,
    count: number = 5
  ): Promise<any[]> {
    // Get additional criteria that could be reviewed
    const whereClause: any = { userId };
    
    if (sectionId) {
      whereClause.blueprintSectionId = sectionId;
    }

    if (uueStage) {
      whereClause.uueStage = uueStage;
    }

    // Get criteria that haven't been reviewed recently or need reinforcement
    return await prisma.userCriterionMastery.findMany({
      where: {
        ...whereClause,
        OR: [
                  { lastAttempt: null },
        { lastAttempt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // Not reviewed in 7 days
          { masteryScore: { lt: 0.7 } }, // Low mastery scores
        ],
      },
      include: {
        masteryCriterion: true,
      },
      take: count,
      orderBy: [
        { lastAttempt: 'asc' },
        { masteryScore: 'asc' },
      ],
    });
  }

  private getDaysDifference(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  /**
   * Get user capacity and preferences
   */
  async getUserCapacityAndPreferences(userId: number): Promise<{
    dailyStudyTime: number;
    preferredUueStages: UueStage[];
    trackingIntensity: TrackingIntensity;
    masteryThreshold: 'SURVEY' | 'PROFICIENT' | 'EXPERT';
  }> {
    // Get user preferences from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        dailyStudyTimeMinutes: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Use default values since userPreferences model doesn't exist in current schema
    return {
      dailyStudyTime: user.dailyStudyTimeMinutes || 120, // Default to 2 hours
      preferredUueStages: ['UNDERSTAND', 'USE', 'EXPLORE'],
      trackingIntensity: 'NORMAL' as TrackingIntensity,
      masteryThreshold: 'PROFICIENT' as 'SURVEY' | 'PROFICIENT' | 'EXPERT',
    };
  }

  /**
   * Get capacity gap analysis with user recommendations
   */
  async getCapacityGapAnalysis(userId: number): Promise<{
    currentCapacity: number;
    requiredCapacity: number;
    gap: number;
    recommendations: string[];
    priorityAdjustments: string[];
  }> {
    const userPrefs = await this.getUserCapacityAndPreferences(userId);
    const dueCriteria = await this.getDueCriteriaForUser(userId);
    
    const criticalCount = dueCriteria.filter(c => this.determineTaskPriority(c) === 'CRITICAL').length;
    const coreCount = dueCriteria.filter(c => this.determineTaskPriority(c) === 'CORE').length;
    
    const requiredCapacity = (criticalCount * this.defaultTaskTimes.CRITICAL) + 
                           (coreCount * this.defaultTaskTimes.CORE);
    
    const gap = requiredCapacity - userPrefs.dailyStudyTime;
    
    const recommendations: string[] = [];
    const priorityAdjustments: string[] = [];
    
    if (gap > 0) {
      recommendations.push(`Increase daily study time by ${gap} minutes to cover all due tasks`);
      recommendations.push('Consider reducing tracking intensity for non-critical criteria');
      recommendations.push('Focus on critical tasks first, defer core tasks to tomorrow');
      
      if (criticalCount > 5) {
        priorityAdjustments.push('Too many critical tasks - consider reducing tracking intensity');
      }
    } else if (gap < -20) {
      recommendations.push(`You have ${Math.abs(gap)} minutes of extra capacity`);
      recommendations.push('Consider adding more core tasks or previewing next stage content');
      recommendations.push('Increase tracking intensity for faster progression');
    }
    
    return {
      currentCapacity: userPrefs.dailyStudyTime,
      requiredCapacity,
      gap,
      recommendations,
      priorityAdjustments,
    };
  }

  /**
   * Get user's capacity analysis
   */
  async getUserCapacityAnalysis(userId: number): Promise<CapacityAnalysis> {
    const userPrefs = await this.getUserCapacityAndPreferences(userId);
    const dueCriteria = await this.getDueCriteriaForUser(userId);
    
    const criticalCount = dueCriteria.filter(c => this.determineTaskPriority(c) === 'CRITICAL').length;
    const coreCount = dueCriteria.filter(c => this.determineTaskPriority(c) === 'CORE').length;
    const plusCount = dueCriteria.filter(c => this.determineTaskPriority(c) === 'PLUS').length;
    
    const usedCapacity = (criticalCount * this.defaultTaskTimes.CRITICAL) + 
                        (coreCount * this.defaultTaskTimes.CORE) + 
                        (plusCount * this.defaultTaskTimes.PLUS);
    
    const remainingCapacity = Math.max(0, userPrefs.dailyStudyTime - usedCapacity);
    const capacityUtilization = (usedCapacity / userPrefs.dailyStudyTime) * 100;
    
    const criticalOverflow = Math.max(0, criticalCount - Math.floor(userPrefs.dailyStudyTime * 0.4 / this.defaultTaskTimes.CRITICAL));
    const coreOverflow = Math.max(0, coreCount - Math.floor(userPrefs.dailyStudyTime * 0.4 / this.defaultTaskTimes.CORE));
    const plusOverflow = Math.max(0, plusCount - Math.floor(userPrefs.dailyStudyTime * 0.2 / this.defaultTaskTimes.PLUS));
    
    return {
      userCapacity: userPrefs.dailyStudyTime,
      usedCapacity,
      remainingCapacity,
      capacityUtilization,
      criticalOverflow,
      coreOverflow,
      plusOverflow,
    };
  }

  /**
   * Complete a task
   */
  async completeTask(userId: number, taskId: string, completionData: {
    completionTime: Date;
    performance: number;
    notes: string;
  }): Promise<{
    taskId: string;
    completed: boolean;
    performance: number;
    nextReviewDate: Date;
    masteryGain: number;
  }> {
    // This would update the user's mastery tracking
    const masteryGain = Math.min(0.1, completionData.performance * 0.15);
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + Math.ceil(1 / masteryGain));
    
    return {
      taskId,
      completed: true,
      performance: completionData.performance,
      nextReviewDate,
      masteryGain
    };
  }

  /**
   * Get today's task progress
   */
  async getTodaysTaskProgress(userId: number): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    completionRate: number;
    estimatedTimeRemaining: number;
    progressByBucket: {
      critical: { total: number; completed: number; progress: number };
      core: { total: number; completed: number; progress: number };
      plus: { total: number; completed: number; progress: number };
    };
  }> {
    const todaysTasks = await this.generateTodaysTasksForUser(userId);
    
    // Simulate some completed tasks (in real implementation, this would come from database)
    const completedCritical = Math.floor(todaysTasks.critical.count * 0.3);
    const completedCore = Math.floor(todaysTasks.core.count * 0.5);
    const completedPlus = Math.floor(todaysTasks.plus.count * 0.2);
    
    const totalCompleted = completedCritical + completedCore + completedPlus;
    const totalTasks = todaysTasks.totalTasks;
    const completionRate = totalTasks > 0 ? (totalCompleted / totalTasks) * 100 : 0;
    
    const estimatedTimeRemaining = todaysTasks.estimatedTime * (1 - completionRate / 100);
    
    return {
      totalTasks,
      completedTasks: totalCompleted,
      inProgressTasks: totalTasks - totalCompleted,
      completionRate,
      estimatedTimeRemaining,
      progressByBucket: {
        critical: { 
          total: todaysTasks.critical.count, 
          completed: completedCritical, 
          progress: todaysTasks.critical.count > 0 ? (completedCritical / todaysTasks.critical.count) * 100 : 0 
        },
        core: { 
          total: todaysTasks.core.count, 
          completed: completedCore, 
          progress: todaysTasks.core.count > 0 ? (completedCore / todaysTasks.core.count) * 100 : 0 
        },
        plus: { 
          total: todaysTasks.plus.count, 
          completed: completedPlus, 
          progress: todaysTasks.plus.count > 0 ? (completedPlus / todaysTasks.plus.count) * 100 : 0 
        }
      }
    };
  }

  /**
   * Reprioritize tasks
   */
  async reprioritizeTasks(userId: number, options: {
    priorityOrder: string[];
    focusAreas: string[];
    timeConstraints: any;
  }): Promise<{
    reprioritized: boolean;
    newOrder: string[];
    estimatedTimeImpact: number;
    recommendations: string[];
  }> {
    // This would reorder tasks based on user preferences
    const newOrder = options.priorityOrder;
    const estimatedTimeImpact = Math.random() * 30 - 15; // Random impact between -15 and +15 minutes
    
    const recommendations = [];
    if (options.focusAreas.length > 0) {
      recommendations.push(`Focus areas: ${options.focusAreas.join(', ')}`);
    }
    if (estimatedTimeImpact > 0) {
      recommendations.push(`Estimated time increase: ${Math.round(estimatedTimeImpact)} minutes`);
    } else if (estimatedTimeImpact < 0) {
      recommendations.push(`Estimated time savings: ${Math.round(Math.abs(estimatedTimeImpact))} minutes`);
    }
    
    return {
      reprioritized: true,
      newOrder,
      estimatedTimeImpact,
      recommendations
    };
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalizedRecommendations(userId: number, options: {
    focus: string;
    difficulty: string;
    timeAvailable?: number;
  }): Promise<Array<{
    taskId: string;
    title: string;
    priority: string;
    estimatedTime: number;
    reason: string;
    difficulty: string;
  }>> {
    const recommendations = [];
    
    if (options.focus === 'weakest' || options.focus === 'all') {
      recommendations.push({
        taskId: 'rec_1',
        title: 'Review Basic Concepts',
        priority: 'HIGH',
        estimatedTime: 15,
        reason: 'Based on your recent performance, focus on foundational concepts',
        difficulty: 'EASY'
      });
    }
    
    if (options.focus === 'strongest' || options.focus === 'all') {
      recommendations.push({
        taskId: 'rec_2',
        title: 'Advanced Problem Solving',
        priority: 'MEDIUM',
        estimatedTime: 25,
        reason: 'You\'re ready for more challenging material',
        difficulty: 'HARD'
      });
    }
    
    if (options.timeAvailable && options.timeAvailable < 30) {
      recommendations.push({
        taskId: 'rec_3',
        title: 'Quick Review Session',
        priority: 'MEDIUM',
        estimatedTime: options.timeAvailable,
        reason: 'Optimized for your available time',
        difficulty: 'MEDIUM'
      });
    }
    
    return recommendations;
  }

  /**
   * Get task analytics
   */
  async getTaskAnalytics(userId: number, options: {
    period: string;
    includeDetails: boolean;
  }): Promise<{
    period: string;
    totalTasks: number;
    completedTasks: number;
    averageCompletionTime: number;
    successRate: number;
    productivityTrend: 'increasing' | 'decreasing' | 'stable';
    topPerformingAreas: string[];
    areasForImprovement: string[];
    details?: any;
  }> {
    // Simulate analytics data
    const totalTasks = options.period === 'week' ? 35 : options.period === 'month' ? 140 : 7;
    const completedTasks = Math.floor(totalTasks * 0.8);
    const averageCompletionTime = 12; // minutes
    const successRate = 85; // percentage
    
    const productivityTrend: 'increasing' | 'decreasing' | 'stable' = 
      Math.random() > 0.6 ? 'increasing' : Math.random() > 0.3 ? 'decreasing' : 'stable';
    
    const topPerformingAreas = ['Calculus', 'Algebra', 'Geometry'];
    const areasForImprovement = ['Trigonometry', 'Statistics'];
    
    const result: any = {
      period: options.period,
      totalTasks,
      completedTasks,
      averageCompletionTime,
      successRate,
      productivityTrend,
      topPerformingAreas,
      areasForImprovement
    };
    
    if (options.includeDetails) {
      result.details = {
        dailyBreakdown: Array.from({ length: 7 }, (_, i) => ({
          day: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString(),
          tasksAssigned: Math.floor(Math.random() * 10) + 5,
          tasksCompleted: Math.floor(Math.random() * 8) + 3,
          averageTime: Math.floor(Math.random() * 10) + 8
        })),
        performanceByDifficulty: {
          EASY: { total: 20, completed: 18, successRate: 90 },
          MEDIUM: { total: 30, completed: 25, successRate: 83 },
          HARD: { total: 15, completed: 12, successRate: 80 }
        }
      };
    }
    
    return result;
  }

  /**
   * Skip a task
   */
  async skipTask(userId: number, taskId: string, options: {
    reason: string;
    rescheduleFor: Date;
  }): Promise<{
    skipped: boolean;
    rescheduledFor: Date;
    impact: string;
  }> {
    // This would update the task scheduling
    const impact = options.reason === 'User choice' ? 'minimal' : 'moderate';
    
    return {
      skipped: true,
      rescheduledFor: options.rescheduleFor,
      impact
    };
  }

  /**
   * Get upcoming tasks
   */
  async getUpcomingTasks(userId: number, options: {
    days: number;
    includeCompleted: boolean;
  }): Promise<{
    tasks: Array<{
      id: string;
      title: string;
      dueDate: Date;
      priority: string;
      estimatedTime: number;
      status: 'pending' | 'in_progress' | 'completed';
    }>;
    totalTasks: number;
    estimatedTotalTime: number;
    priorityDistribution: {
      critical: number;
      core: number;
      plus: number;
    };
  }> {
    // Simulate upcoming tasks
    const tasks = [];
    const priorities = ['critical', 'core', 'plus'];
    
    for (let i = 0; i < options.days; i++) {
      const dayTasks = Math.floor(Math.random() * 8) + 3; // 3-10 tasks per day
      
      for (let j = 0; j < dayTasks; j++) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + i);
        
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const estimatedTime = priority === 'critical' ? 8 : priority === 'core' ? 5 : 3;
        const status = options.includeCompleted ? 
          (Math.random() > 0.7 ? 'completed' : Math.random() > 0.5 ? 'in_progress' : 'pending') : 
          'pending';
        
        tasks.push({
          id: `task_${i}_${j}`,
          title: `${priority.charAt(0).toUpperCase() + priority.slice(1)} Task ${j + 1}`,
          dueDate,
          priority,
          estimatedTime,
          status
        });
      }
    }
    
    const totalTasks = tasks.length;
    const estimatedTotalTime = tasks.reduce((sum, task) => sum + task.estimatedTime, 0);
    const priorityDistribution = {
      critical: tasks.filter(t => t.priority === 'critical').length,
      core: tasks.filter(t => t.priority === 'core').length,
      plus: tasks.filter(t => t.priority === 'plus').length
    };
    
    return {
      tasks,
      totalTasks,
      estimatedTotalTime,
      priorityDistribution
    };
  }

  /**
   * Complete multiple tasks in batch
   */
  async batchCompleteTasks(userId: number, taskIds: string[], completionData: any): Promise<{
    completed: string[];
    failed: string[];
    totalTimeSpent: number;
    masteryGained: number;
  }> {
    const completed: string[] = [];
    const failed: string[] = [];
    let totalTimeSpent = 0;
    let masteryGained = 0;
    
    for (const taskId of taskIds) {
      try {
        const result = await this.completeTask(userId, taskId, {
          completionTime: new Date(),
          performance: 0.8,
          notes: 'Batch completion'
        });
        
        completed.push(taskId);
        totalTimeSpent += 10; // Default time per task
        masteryGained += result.masteryGain || 0.05;
      } catch (error) {
        failed.push(taskId);
      }
    }
    
    return {
      completed,
      failed,
      totalTimeSpent,
      masteryGained
    };
  }

  /**
   * Get completion streak
   */
  async getCompletionStreak(userId: number): Promise<{
    currentStreak: number;
    longestStreak: number;
    totalDays: number;
    streakType: 'daily' | 'weekly' | 'monthly';
    nextMilestone: number;
    motivation: string;
  }> {
    // Simulate streak data
    const currentStreak = Math.floor(Math.random() * 15) + 5; // 5-20 days
    const longestStreak = Math.max(currentStreak, Math.floor(Math.random() * 30) + 10); // 10-40 days
    const totalDays = Math.floor(Math.random() * 100) + 50; // 50-150 days
    
    const streakType: 'daily' | 'weekly' | 'monthly' = 'daily';
    const nextMilestone = Math.ceil(currentStreak / 5) * 5; // Next multiple of 5
    
    let motivation = '';
    if (currentStreak >= longestStreak) {
      motivation = `New record! Keep going to reach ${nextMilestone} days!`;
    } else if (currentStreak >= 10) {
      motivation = `Great consistency! You're ${nextMilestone - currentStreak} days away from your next milestone.`;
    } else {
      motivation = `Good start! Build momentum to reach ${nextMilestone} days.`;
    }
    
    return {
      currentStreak,
      longestStreak,
      totalDays,
      streakType,
      nextMilestone,
      motivation
    };
  }

  /**
   * Generate additional tasks for a user
   */
  async generateAdditionalTasks(userId: number, options: { count: number; focusArea?: string }): Promise<DailyTask[]> {
    try {
      const { count, focusArea } = options;
      
      // Get user's current capacity and preferences
      const userPrefs = await this.getUserCapacityAndPreferences(userId);
      
      // Get additional criteria that could be reviewed
      const additionalCriteria = await this.getAdditionalCriteriaForReview(userId, focusArea);
      
      // Generate tasks from the additional criteria
      const tasks: DailyTask[] = [];
      
      for (const criterion of additionalCriteria.slice(0, count)) {
        const task: DailyTask = {
          id: `additional_${criterion.criterionId}_${Date.now()}`,
          criterionId: criterion.criterionId,
          sectionId: criterion.sectionId,
          sectionName: criterion.sectionName,
          uueStage: criterion.uueStage,
          description: criterion.description,
          priority: 'PLUS', // Additional tasks are typically lower priority
          estimatedTime: 3, // Default 3 minutes for additional tasks
          masteryScore: criterion.masteryScore || 0,
          daysOverdue: 0, // Additional tasks are not overdue
          questionTypes: criterion.questionTypes || ['multiple-choice']
        };
        tasks.push(task);
      }
      
      return tasks;
    } catch (error) {
      console.error('Error generating additional tasks:', error);
      return [];
    }
  }

  /**
   * Get tasks for a specific section
   */
  async getTasksForSection(userId: number, sectionId: number): Promise<DailyTask[]> {
    try {
      // Get criteria for the specific section
      const sectionCriteria = await (this.prisma as any).masteryCriterion.findMany({
        where: {
          blueprintSectionId: sectionId.toString(),
          userId: userId
        },
        include: {
          blueprintSection: true
        }
      });
      
      // Convert criteria to tasks
      const tasks: DailyTask[] = sectionCriteria.map(criterion => ({
        id: `section_${criterion.id}_${Date.now()}`,
        criterionId: criterion.id.toString(),
        sectionId: criterion.blueprintSectionId,
        sectionName: criterion.blueprintSection?.name || 'Unknown Section',
        uueStage: criterion.uueStage,
        description: criterion.description || criterion.title,
        priority: 'CORE', // Section tasks are typically core priority
        estimatedTime: 5, // Default 5 minutes per task
        masteryScore: 0, // Will be populated from mastery progress
        daysOverdue: 0, // Will be calculated from due dates
        questionTypes: criterion.questionTypes || ['multiple-choice']
      }));
      
      return tasks;
    } catch (error) {
      console.error('Error getting tasks for section:', error);
      return [];
    }
  }

  /**
   * Get tasks for a specific UUE stage
   */
  async getTasksForUueStage(userId: number, stage: string): Promise<DailyTask[]> {
    try {
      // Validate UUE stage
      if (!['UNDERSTAND', 'USE', 'EXPLORE'].includes(stage)) {
        throw new Error('Invalid UUE stage');
      }
      
      // Get criteria for the specific UUE stage
      const stageCriteria = await (this.prisma as any).masteryCriterion.findMany({
        where: {
          uueStage: stage,
          userId: userId
        },
        include: {
          blueprintSection: true
        }
      });
      
      // Convert criteria to tasks
      const tasks: DailyTask[] = stageCriteria.map(criterion => ({
        id: `stage_${criterion.id}_${Date.now()}`,
        criterionId: criterion.id.toString(),
        sectionId: criterion.blueprintSectionId,
        sectionName: criterion.blueprintSection?.name || 'Unknown Section',
        uueStage: criterion.uueStage,
        description: criterion.description || criterion.title,
        priority: 'CORE', // Stage tasks are typically core priority
        estimatedTime: 5, // Default 5 minutes per task
        masteryScore: 0, // Will be populated from mastery progress
        daysOverdue: 0, // Will be calculated from due dates
        questionTypes: criterion.questionTypes || ['multiple-choice']
      }));
      
      return tasks;
    } catch (error) {
      console.error('Error getting tasks for UUE stage:', error);
      return [];
    }
  }
}

export const enhancedTodaysTasksService = new EnhancedTodaysTasksService();
