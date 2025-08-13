import { PrismaClient } from '@prisma/client';
import { UserCriterionMastery, BlueprintSection, UueStage, TrackingIntensity } from '@prisma/client';
import { enhancedSpacedRepetitionService } from './enhancedSpacedRepetition.service';
import { masteryCalculationService } from './masteryCalculation.service';

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

export interface UserPreferences {
  dailyStudyTime: number; // in minutes
  preferredUueStages: UueStage[];
  trackingIntensity: TrackingIntensity;
  masteryThreshold: 'SURVEY' | 'PROFICIENT' | 'EXPERT';
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
    // Get user preferences and capacity
    const userPrefs = await this.getUserPreferences(userId);
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
  async getDueSectionsForUser(userId: number): Promise<BlueprintSection[]> {
    // Get sections that have due criteria
    const dueCriteria = await enhancedSpacedRepetitionService.getDueCriteria(userId);
    const sectionIds = [...new Set(dueCriteria.map(c => c.blueprintSectionId))];

    return await prisma.blueprintSection.findMany({
      where: {
        id: { in: sectionIds },
      },
    });
  }

  /**
   * Get due criteria for a user
   */
  async getDueCriteriaForUser(userId: number): Promise<UserCriterionMastery[]> {
    const dueCriteria = await enhancedSpacedRepetitionService.getDueCriteria(userId);
    const overdueCriteria = await enhancedSpacedRepetitionService.getOverdueCriteria(userId);

    // Combine and deduplicate
    const allDue = [...dueCriteria, ...overdueCriteria];
    const uniqueDue = new Map<string, UserCriterionMastery>();

    for (const criterion of allDue) {
      uniqueDue.set(criterion.masteryCriterionId, criterion);
    }

    return Array.from(uniqueDue.values());
  }

  /**
   * Categorize tasks by priority
   */
  categorizeTasksByPriority(
    dueCriteria: UserCriterionMastery[],
    sections: BlueprintSection[]
  ): TaskBuckets {
    const critical: DailyTask[] = [];
    const core: DailyTask[] = [];
    const plus: DailyTask[] = [];

    for (const criterion of dueCriteria) {
      const section = sections.find(s => s.id === criterion.blueprintSectionId);
      if (!section) continue;

      const task = this.createDailyTask(criterion, section);
      const priority = this.determineTaskPriority(criterion);

      switch (priority) {
        case 'CRITICAL':
          critical.push(task);
          break;
        case 'CORE':
          core.push(task);
          break;
        case 'PLUS':
          plus.push(task);
          break;
      }
    }

    return { critical, core, plus };
  }

  /**
   * Balance UUE stages in daily tasks
   */
  async balanceUueStages(
    taskBuckets: TaskBuckets,
    userPrefs: UserPreferences,
    userCapacity: number
  ): Promise<BalancedTasks> {
    const { critical, core, plus } = taskBuckets;
    
    // Start with critical tasks (always included)
    const balancedCritical = critical.slice();
    let remainingCapacity = userCapacity - this.calculateEstimatedTime({ critical: balancedCritical, core: [], plus: [] });

    // Add core tasks until capacity is filled
    const balancedCore: DailyTask[] = [];
    for (const task of core) {
      if (remainingCapacity >= this.defaultTaskTimes.CORE) {
        balancedCore.push(task);
        remainingCapacity -= this.defaultTaskTimes.CORE;
      } else {
        break;
      }
    }

    // Add plus tasks (UUE stage progression previews)
    const balancedPlus: DailyTask[] = [];
    const overflow: DailyTask[] = [];

    // Add next stage previews for mastered criteria
    for (const task of plus) {
      if (remainingCapacity >= this.defaultTaskTimes.PLUS) {
        balancedPlus.push(task);
        remainingCapacity -= this.defaultTaskTimes.PLUS;
      } else {
        overflow.push(task);
      }
    }

    // Add overflow from critical and core if they didn't fit
    const criticalOverflow = critical.slice(balancedCritical.length);
    const coreOverflow = core.slice(balancedCore.length);

    return {
      critical: balancedCritical,
      core: balancedCore,
      plus: balancedPlus,
      overflow: [...criticalOverflow, ...coreOverflow, ...overflow],
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

  private async getUserPreferences(userId: number): Promise<UserPreferences> {
    // Get user preferences from database or use defaults
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        dailyStudyTime: true,
        preferredUueStages: true,
        trackingIntensity: true,
        masteryThreshold: true,
      },
    });

    return {
      dailyStudyTime: user?.dailyStudyTime ?? 60, // Default 60 minutes
      preferredUueStages: user?.preferredUueStages ?? ['UNDERSTAND', 'USE', 'EXPLORE'],
      trackingIntensity: user?.trackingIntensity ?? 'NORMAL',
      masteryThreshold: user?.masteryThreshold ?? 'PROFICIENT',
    };
  }

  private createDailyTask(
    criterion: UserCriterionMastery,
    section: BlueprintSection
  ): DailyTask {
    const daysOverdue = criterion.nextReviewAt
      ? this.getDaysDifference(criterion.nextReviewAt, new Date())
      : 0;

    return {
      id: `task-${criterion.id}`,
      criterionId: criterion.masteryCriterionId,
      sectionId: section.id,
      sectionName: section.name,
      uueStage: criterion.uueStage,
      description: 'Practice criterion mastery', // This would come from the criterion
      priority: this.determineTaskPriority(criterion),
      estimatedTime: this.defaultTaskTimes[this.determineTaskPriority(criterion)],
      masteryScore: criterion.masteryScore,
      daysOverdue: Math.max(0, daysOverdue),
      questionTypes: [], // This would come from the criterion
    };
  }

  private determineTaskPriority(criterion: UserCriterionMastery): 'CRITICAL' | 'CORE' | 'PLUS' {
    // Critical: overdue by 3+ days or failed multiple times
    if (criterion.consecutiveFailures >= 2) return 'CRITICAL';
    
    if (criterion.nextReviewAt) {
      const daysOverdue = this.getDaysDifference(criterion.nextReviewAt, new Date());
      if (daysOverdue >= 3) return 'CRITICAL';
    }

    // Core: due today/tomorrow or new content
    if (criterion.nextReviewAt) {
      const daysUntilDue = this.getDaysDifference(new Date(), criterion.nextReviewAt);
      if (daysUntilDue <= 1) return 'CORE';
    }

    // Plus: everything else (preview, reinforcement)
    return 'PLUS';
  }

  private calculateEstimatedTime(tasks: { critical: DailyTask[]; core: DailyTask[]; plus: DailyTask[] }): number {
    return (
      tasks.critical.length * this.defaultTaskTimes.CRITICAL +
      tasks.core.length * this.defaultTaskTimes.CORE +
      tasks.plus.length * this.defaultTaskTimes.PLUS
    );
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
          { lastReviewedAt: null },
          { lastReviewedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, // Not reviewed in 7 days
          { masteryScore: { lt: 0.7 } }, // Low mastery scores
        ],
      },
      include: {
        masteryCriterion: true,
      },
      take: count,
      orderBy: [
        { lastReviewedAt: 'asc' },
        { masteryScore: 'asc' },
        { consecutiveFailures: 'desc' },
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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        dailyStudyTime: true,
        preferredUueStages: true,
        defaultTrackingIntensity: true,
        defaultMasteryThreshold: true,
      },
    });

    return {
      dailyStudyTime: user?.dailyStudyTime ?? 60,
      preferredUueStages: user?.preferredUueStages ?? ['UNDERSTAND', 'USE', 'EXPLORE'],
      trackingIntensity: user?.defaultTrackingIntensity ?? 'NORMAL',
      masteryThreshold: (user?.defaultMasteryThreshold as 'SURVEY' | 'PROFICIENT' | 'EXPERT') ?? 'PROFICIENT',
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
}

export const enhancedTodaysTasksService = new EnhancedTodaysTasksService();
