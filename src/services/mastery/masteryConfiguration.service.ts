import { PrismaClient } from '@prisma/client';
import { User, BlueprintSection } from '@prisma/client';

const prisma = new PrismaClient();

export interface MasteryOptions {
  minGapDays?: number;                    // Default: 1 day minimum between attempts
  customThreshold?: number;                // Default: criterion.masteryThreshold
  requireDifferentTimeSlots?: boolean;     // Default: false
  maxAttemptsForMastery?: number;         // Default: unlimited
  allowRetrySameDay?: boolean;            // Default: false
  masteryDecayRate?: number;              // Default: system default
  strictMode?: boolean;                   // Default: false (more lenient for beginners)
  adaptiveIntervals?: boolean;            // Default: false (use simple intervals)
  personalizedThresholds?: boolean;       // Default: false (use global thresholds)
  advancedAnalytics?: boolean;            // Default: false (basic progress tracking)

  // User learning preferences
  learningStyle?: string;                 // Default: "VISUAL"
  experienceLevel?: string;               // Default: "BEGINNER"
  autoAdjustment?: boolean;               // Default: true
}

export interface UserMasteryPreferences {
  userId: number;
  globalDefaults: MasteryOptions;
  sectionSpecific: Map<number, MasteryOptions>;
  learningStyle: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE';
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  autoAdjustment: boolean;
  lastUpdated: Date;
}

export interface MasteryThresholds {
  SURVEY: number;      // Basic familiarity
  PROFICIENT: number;  // Solid understanding
  EXPERT: number;      // Deep mastery
}

export interface LearningStyleConfig {
  CONSERVATIVE: MasteryOptions;
  BALANCED: MasteryOptions;
  AGGRESSIVE: MasteryOptions;
}

export class MasteryConfigurationService {
  // Default mastery thresholds
  private readonly defaultThresholds: MasteryThresholds = {
    SURVEY: 0.6,      // 60% - Basic familiarity
    PROFICIENT: 0.8,  // 80% - Solid understanding
    EXPERT: 0.95,     // 95% - Deep mastery
  };

  // Learning style configurations
  private readonly learningStyleConfigs: LearningStyleConfig = {
    CONSERVATIVE: {
      minGapDays: 2,
      masteryDecayRate: 0.05,
      strictMode: true,
      adaptiveIntervals: false,
      personalizedThresholds: false,
      advancedAnalytics: false,
    },
    BALANCED: {
      minGapDays: 1,
      masteryDecayRate: 0.1,
      strictMode: false,
      adaptiveIntervals: false,
      personalizedThresholds: true,
      advancedAnalytics: false,
    },
    AGGRESSIVE: {
      minGapDays: 0,
      masteryDecayRate: 0.15,
      strictMode: false,
      adaptiveIntervals: true,
      personalizedThresholds: true,
      advancedAnalytics: true,
    },
  };

  // Experience level adjustments
  private readonly experienceLevelAdjustments = {
    BEGINNER: {
      strictMode: false,
      masteryDecayRate: 0.05,
      minGapDays: 2,
    },
    INTERMEDIATE: {
      strictMode: false,
      masteryDecayRate: 0.1,
      minGapDays: 1,
    },
    ADVANCED: {
      strictMode: true,
      masteryDecayRate: 0.15,
      minGapDays: 1,
    },
    EXPERT: {
      strictMode: true,
      masteryDecayRate: 0.2,
      minGapDays: 0,
    },
  };

  /**
   * Get user's mastery configuration with defaults
   */
  async getUserMasteryConfiguration(userId: number): Promise<UserMasteryPreferences> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        learningStyle: true,
        experienceLevel: true,
        autoAdjustment: true,
        lastUpdated: true,
      },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // Get global defaults based on learning style and experience
    const globalDefaults = this.getGlobalDefaults(user.learningStyle, user.experienceLevel);
    
    // Get section-specific overrides
    const sectionSpecific = await this.getSectionSpecificConfigurations(userId);

    return {
      userId,
      globalDefaults,
      sectionSpecific,
      learningStyle: user.learningStyle as any,
      experienceLevel: user.experienceLevel as any,
      autoAdjustment: user.autoAdjustment ?? false,
      lastUpdated: user.lastUpdated ?? new Date(),
    };
  }

  /**
   * Get mastery options for a specific criterion
   */
  async getMasteryOptionsForCriterion(
    userId: number,
    criterionId: number,
    sectionId: number
  ): Promise<MasteryOptions> {
    const userConfig = await this.getUserMasteryConfiguration(userId);
    
    // Start with global defaults
    let options = { ...userConfig.globalDefaults };
    
    // Apply section-specific overrides
    const sectionConfig = userConfig.sectionSpecific.get(sectionId);
    if (sectionConfig) {
      options = { ...options, ...sectionConfig };
    }
    
    // Apply criterion-specific overrides if they exist
    const criterionConfig = await this.getCriterionSpecificConfig(userId, criterionId);
    if (criterionConfig) {
      options = { ...options, ...criterionConfig };
    }
    
    return options;
  }

  /**
   * Update user's global mastery configuration
   */
  async updateGlobalConfiguration(
    userId: number,
    options: Partial<MasteryOptions>
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        // Update user preferences
        learningStyle: options.learningStyle as any,
        experienceLevel: options.experienceLevel as any,
        autoAdjustment: options.autoAdjustment,
        lastUpdated: new Date(),
      },
    });

    // Store detailed configuration in user preferences
    await this.storeUserConfiguration(userId, 'global', options);
  }

  /**
   * Update section-specific mastery configuration
   */
  async updateSectionConfiguration(
    userId: number,
    sectionId: number,
    options: Partial<MasteryOptions>
  ): Promise<void> {
    await this.storeUserConfiguration(userId, sectionId, options);
  }

  /**
   * Get recommended configuration based on user performance
   */
  async getRecommendedConfiguration(userId: number): Promise<{
    currentConfig: MasteryOptions;
    recommendedConfig: MasteryOptions;
    reasoning: string[];
    performanceMetrics: {
      successRate: number;
      averageMasteryScore: number;
      completionRate: number;
      retentionRate: number;
    };
  }> {
    const currentConfig = await this.getUserMasteryConfiguration(userId);
    const performanceMetrics = await this.calculatePerformanceMetrics(userId);
    
    const recommendedConfig = this.generateRecommendedConfiguration(
      performanceMetrics,
      currentConfig.learningStyle,
      currentConfig.experienceLevel
    );
    
    const reasoning = this.generateRecommendationReasoning(
      currentConfig.globalDefaults,
      recommendedConfig,
      performanceMetrics
    );
    
    return {
      currentConfig: currentConfig.globalDefaults,
      recommendedConfig,
      reasoning,
      performanceMetrics,
    };
  }

  /**
   * Auto-adjust configuration based on performance
   */
  async autoAdjustConfiguration(userId: number): Promise<{
    adjusted: boolean;
    changes: string[];
    newConfig: MasteryOptions;
  }> {
    const userConfig = await this.getUserMasteryConfiguration(userId);
    
    if (!userConfig.autoAdjustment) {
      return {
        adjusted: false,
        changes: ['Auto-adjustment is disabled'],
        newConfig: userConfig.globalDefaults,
      };
    }
    
    const performanceMetrics = await this.calculatePerformanceMetrics(userId);
    const recommendedConfig = this.generateRecommendedConfiguration(
      performanceMetrics,
      userConfig.learningStyle,
      userConfig.experienceLevel
    );
    
    // Only adjust if significant changes are recommended
    const changes = this.calculateConfigurationChanges(
      userConfig.globalDefaults,
      recommendedConfig
    );
    
    if (changes.length === 0) {
      return {
        adjusted: false,
        changes: ['No adjustments needed'],
        newConfig: userConfig.globalDefaults,
      };
    }
    
    // Apply recommended changes
    await this.updateGlobalConfiguration(userId, recommendedConfig);
    
    return {
      adjusted: true,
      changes,
      newConfig: recommendedConfig,
    };
  }

  /**
   * Get mastery thresholds for a user
   */
  async getMasteryThresholds(
    userId: number,
    sectionId?: string
  ): Promise<MasteryThresholds> {
    const userConfig = await this.getUserMasteryConfiguration(userId);
    
    if (userConfig.globalDefaults.personalizedThresholds) {
      // Get user-specific thresholds
      return await this.getPersonalizedThresholds(userId, sectionId);
    }
    
    return this.defaultThresholds;
  }

  /**
   * Reset user configuration to defaults
   */
  async resetToDefaults(userId: number, sectionId?: number): Promise<void> {
    if (sectionId) {
      // Reset section-specific configuration
      await this.removeSectionConfiguration(userId, sectionId);
    } else {
      // Reset global configuration
      const defaultConfig = this.getGlobalDefaults('BALANCED', 'INTERMEDIATE');
      await this.updateGlobalConfiguration(userId, defaultConfig);
    }
  }

  // Private helper methods

  private getGlobalDefaults(
    learningStyle: string,
    experienceLevel: string
  ): MasteryOptions {
    const baseConfig = this.learningStyleConfigs[learningStyle as keyof LearningStyleConfig] ?? 
                      this.learningStyleConfigs.BALANCED;
    
    const experienceAdjustments = this.experienceLevelAdjustments[experienceLevel as keyof typeof this.experienceLevelAdjustments] ?? 
                                 this.experienceLevelAdjustments.INTERMEDIATE;
    
    return { ...baseConfig, ...experienceAdjustments };
  }

  private async getSectionSpecificConfigurations(userId: number): Promise<Map<number, MasteryOptions>> {
    const sectionConfigs = await prisma.userSectionPreferences.findMany({
      where: { userId },
      select: {
        sectionId: true,
        masteryOptions: true,
      },
    });
    
    const configMap = new Map<number, MasteryOptions>();
    
    for (const config of sectionConfigs) {
      if (config.masteryOptions) {
        configMap.set(config.sectionId, config.masteryOptions as MasteryOptions);
      }
    }
    
    return configMap;
  }

  private async getCriterionSpecificConfig(
    userId: number,
    criterionId: number
  ): Promise<MasteryOptions | null> {
    const config = await prisma.userCriterionPreferences.findUnique({
      where: {
        userId_criterionId: {
          userId,
          criterionId,
        },
      },
      select: { masteryOptions: true },
    });
    
    return config?.masteryOptions as MasteryOptions ?? null;
  }

  private async storeUserConfiguration(
    userId: number,
    configType: number | 'global',
    options: Partial<MasteryOptions>
  ): Promise<void> {
    if (configType === 'global') {
      await prisma.userPreferences.upsert({
        where: { userId },
        update: { masteryOptions: options },
        create: { userId, masteryOptions: options },
      });
    } else {
      // Section-specific configuration
      const sectionId = configType as number;
      await prisma.userSectionPreferences.upsert({
        where: {
          userId_sectionId: {
            userId,
            sectionId,
          },
        },
        update: { masteryOptions: options },
        create: {
          userId,
          sectionId,
          masteryOptions: options,
        },
      });
    }
  }

  private async calculatePerformanceMetrics(userId: number): Promise<{
    successRate: number;
    averageMasteryScore: number;
    completionRate: number;
    retentionRate: number;
  }> {
    // This would calculate actual performance metrics from user data
    // For now, return placeholder values
    return {
      successRate: 0.75,
      averageMasteryScore: 0.65,
      completionRate: 0.8,
      retentionRate: 0.7,
    };
  }

  private generateRecommendedConfiguration(
    metrics: any,
    learningStyle: string,
    experienceLevel: string
  ): MasteryOptions {
    const baseConfig = this.getGlobalDefaults(learningStyle, experienceLevel);
    
    // Adjust based on performance metrics
    if (metrics.successRate < 0.6) {
      baseConfig.strictMode = false;
      baseConfig.minGapDays = Math.max(1, (baseConfig.minGapDays ?? 1) + 1);
    } else if (metrics.successRate > 0.9) {
      baseConfig.strictMode = true;
      baseConfig.minGapDays = Math.max(0, (baseConfig.minGapDays ?? 1) - 1);
    }
    
    if (metrics.retentionRate < 0.6) {
      baseConfig.masteryDecayRate = (baseConfig.masteryDecayRate ?? 0.1) * 0.8;
    }
    
    return baseConfig;
  }

  private generateRecommendationReasoning(
    current: MasteryOptions,
    recommended: MasteryOptions,
    metrics: any
  ): string[] {
    const reasoning: string[] = [];
    
    if (metrics.successRate < 0.6) {
      reasoning.push('Low success rate detected - recommending more lenient settings');
    }
    
    if (metrics.retentionRate < 0.6) {
      reasoning.push('Low retention rate - suggesting slower progression');
    }
    
    if (metrics.completionRate > 0.9) {
      reasoning.push('High completion rate - can increase difficulty');
    }
    
    return reasoning;
  }

  private calculateConfigurationChanges(
    current: MasteryOptions,
    recommended: MasteryOptions
  ): string[] {
    const changes: string[] = [];
    
    if (current.strictMode !== recommended.strictMode) {
      changes.push(`Strict mode: ${current.strictMode} → ${recommended.strictMode}`);
    }
    
    if (current.minGapDays !== recommended.minGapDays) {
      changes.push(`Min gap days: ${current.minGapDays} → ${recommended.minGapDays}`);
    }
    
    if (current.masteryDecayRate !== recommended.masteryDecayRate) {
      changes.push(`Mastery decay rate: ${current.masteryDecayRate} → ${recommended.masteryDecayRate}`);
    }
    
    return changes;
  }

  private async getPersonalizedThresholds(
    userId: number,
    sectionId?: string
  ): Promise<MasteryThresholds> {
    // Get user's personalized thresholds based on their learning history
    // For now, return slightly adjusted defaults
    return {
      SURVEY: 0.65,     // Slightly higher than default
      PROFICIENT: 0.82, // Slightly higher than default
      EXPERT: 0.97,     // Slightly higher than default
    };
  }

  private async removeSectionConfiguration(userId: number, sectionId: number): Promise<void> {
    await prisma.userSectionPreferences.deleteMany({
      where: {
        userId,
        sectionId,
      },
    });
  }
}

export const masteryConfigurationService = new MasteryConfigurationService();

