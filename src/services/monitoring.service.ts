import { PrismaClient } from '@prisma/client';
import { UserCriterionMastery, MasteryCriterion } from '@prisma/client';

const prisma = new PrismaClient();

export interface SystemMetrics {
  timestamp: Date;
  activeUsers: number;
  totalMasteryCalculations: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  databaseConnections: number;
}

export interface MasteryProgressionMetrics {
  userId: number;
  sectionId: number;
  criteriaMastered: number;
  totalCriteria: number;
  progressionRate: number;
  timeToMastery: number; // in days
  retentionRate: number;
  stageAdvancements: number;
}

export interface AlertConfig {
  responseTimeThreshold: number; // milliseconds
  errorRateThreshold: number; // percentage
  masteryCalculationThreshold: number; // percentage
  cacheMissThreshold: number; // percentage
}

export interface Alert {
  id: string;
  type: 'PERFORMANCE' | 'ERROR' | 'DATA_QUALITY' | 'SYSTEM_HEALTH';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: Date;
  userId?: number;
  sectionId?: string;
  recommendations: string[];
}

export class MonitoringService {
  private alertConfig: AlertConfig = {
    responseTimeThreshold: 2000, // 2 seconds
    errorRateThreshold: 5, // 5%
    masteryCalculationThreshold: 80, // 80%
    cacheMissThreshold: 20, // 20%
  };

  private metrics: SystemMetrics[] = [];
  private alerts: Alert[] = [];

  /**
   * Track system performance metrics
   */
  async trackSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date();
    
    try {
      const activeUsers = await this.getActiveUsersCount();
      const totalMasteryCalculations = await this.getMasteryCalculationsCount();
      const averageResponseTime = await this.calculateAverageResponseTime();
      const errorRate = await this.calculateErrorRate();
      const cacheHitRate = await this.calculateCacheHitRate();
      const databaseConnections = await this.getDatabaseConnectionsCount();

      const metrics: SystemMetrics = {
        timestamp,
        activeUsers,
        totalMasteryCalculations,
        averageResponseTime,
        errorRate,
        cacheHitRate,
        databaseConnections,
      };

      this.metrics.push(metrics);
      
      // Keep only last 1000 metrics
      if (this.metrics.length > 1000) {
        this.metrics = this.metrics.slice(-1000);
      }

      // Check for alerts
      await this.checkForAlerts(metrics);

      return metrics;
    } catch (error) {
      console.error('Error tracking system metrics:', error);
      throw error;
    }
  }

  /**
   * Track mastery progression effectiveness
   */
  async trackMasteryProgression(
    userId: number,
    sectionId: number
  ): Promise<MasteryProgressionMetrics> {
    try {
      // Now using the correct blueprint-centric fields
      const userMasteries = await prisma.userCriterionMastery.findMany({
        where: {
          userId,
          blueprintSectionId: sectionId,
        },
      });

      const criteriaMastered = userMasteries.filter(m => m.isMastered).length;
      const totalCriteria = userMasteries.length;
      const progressionRate = totalCriteria > 0 ? (criteriaMastered / totalCriteria) * 100 : 0;

      // Calculate time to mastery using available fields
      const timeToMastery = await this.calculateTimeToMastery(userId, sectionId);

      // Calculate retention rate using available fields
      const retentionRate = await this.calculateRetentionRate(userId, sectionId);

      // Calculate stage advancements (simplified since uueStage doesn't exist)
      const stageAdvancements = await this.calculateStageAdvancements(userId, sectionId);

      return {
        userId,
        sectionId,
        criteriaMastered,
        totalCriteria,
        progressionRate,
        timeToMastery,
        retentionRate,
        stageAdvancements,
      };
    } catch (error) {
      console.error('Error tracking mastery progression:', error);
      throw error;
    }
  }

  /**
   * Generate analytics dashboard data
   */
  async generateAnalyticsDashboard(): Promise<{
    systemHealth: SystemMetrics;
    userEngagement: {
      totalUsers: number;
      activeUsers: number;
      newUsers: number;
      retentionRate: number;
    };
    masteryProgress: {
      totalCriteria: number;
      masteredCriteria: number;
      averageProgressionRate: number;
      topPerformingSections: string[];
    };
    performanceMetrics: {
      averageResponseTime: number;
      errorRate: number;
      cacheEfficiency: number;
      databasePerformance: number;
    };
  }> {
    try {
      const systemHealth = this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : await this.trackSystemMetrics();

      // Calculate user engagement metrics
      const userEngagement = await this.calculateUserEngagement();
      const masteryProgress = await this.calculateMasteryProgress();
      const performanceMetrics = await this.calculatePerformanceMetrics();

      return {
        systemHealth,
        userEngagement,
        masteryProgress,
        performanceMetrics,
      };
    } catch (error) {
      console.error('Error generating analytics dashboard:', error);
      throw error;
    }
  }

  /**
   * Check for system alerts
   */
  async checkForAlerts(metrics: SystemMetrics): Promise<Alert[]> {
    const newAlerts: Alert[] = [];

    // Check response time
    if (metrics.averageResponseTime > this.alertConfig.responseTimeThreshold) {
      newAlerts.push({
        id: `alert_${Date.now()}_response_time`,
        type: 'PERFORMANCE',
        severity: metrics.averageResponseTime > this.alertConfig.responseTimeThreshold * 2 ? 'HIGH' : 'MEDIUM',
        message: `High response time detected: ${metrics.averageResponseTime}ms`,
        timestamp: new Date(),
        recommendations: [
          'Check database query performance',
          'Review caching strategies',
          'Monitor system resources',
        ],
      });
    }

    // Check error rate
    if (metrics.errorRate > this.alertConfig.errorRateThreshold) {
      newAlerts.push({
        id: `alert_${Date.now()}_error_rate`,
        type: 'ERROR',
        severity: metrics.errorRate > this.alertConfig.errorRateThreshold * 2 ? 'CRITICAL' : 'HIGH',
        message: `High error rate detected: ${metrics.errorRate}%`,
        timestamp: new Date(),
        recommendations: [
          'Review error logs for patterns',
          'Check system dependencies',
          'Verify data integrity',
        ],
      });
    }

    // Check mastery calculation success rate
    const masterySuccessRate = 100 - metrics.errorRate;
    if (masterySuccessRate < this.alertConfig.masteryCalculationThreshold) {
      newAlerts.push({
        id: `alert_${Date.now()}_mastery_calculation`,
        type: 'DATA_QUALITY',
        severity: 'HIGH',
        message: `Low mastery calculation success rate: ${masterySuccessRate}%`,
        timestamp: new Date(),
        recommendations: [
          'Review mastery calculation logic',
          'Check data quality issues',
          'Verify criterion definitions',
        ],
      });
    }

    // Check cache efficiency
    if (metrics.cacheHitRate < (100 - this.alertConfig.cacheMissThreshold)) {
      newAlerts.push({
        id: `alert_${Date.now()}_cache_efficiency`,
        type: 'PERFORMANCE',
        severity: 'MEDIUM',
        message: `Low cache hit rate: ${metrics.cacheHitRate}%`,
        timestamp: new Date(),
        recommendations: [
          'Review cache configuration',
          'Optimize cache key strategies',
          'Consider increasing cache size',
        ],
      });
    }

    // Add new alerts to the list
    this.alerts.push(...newAlerts);
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    return newAlerts;
  }

  /**
   * Get system alerts
   */
  async getAlerts(
    severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    type?: 'PERFORMANCE' | 'ERROR' | 'DATA_QUALITY' | 'SYSTEM_HEALTH'
  ): Promise<Alert[]> {
    let filteredAlerts = this.alerts;

    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }

    if (type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
    }

    return filteredAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate performance report
   */
  async generatePerformanceReport(
    startDate: Date,
    endDate: Date
  ): Promise<{
    period: { start: Date; end: Date };
    metrics: SystemMetrics[];
    trends: {
      responseTime: 'IMPROVING' | 'STABLE' | 'DEGRADING';
      errorRate: 'IMPROVING' | 'STABLE' | 'DEGRADING';
      userEngagement: 'IMPROVING' | 'STABLE' | 'DEGRADING';
    };
    recommendations: string[];
  }> {
    try {
      const periodMetrics = this.metrics.filter(
        m => m.timestamp >= startDate && m.timestamp <= endDate
      );

      if (periodMetrics.length === 0) {
        throw new Error('No metrics available for the specified period');
      }

      const trends = this.analyzeTrends(periodMetrics);
      const recommendations = this.generatePerformanceRecommendations(trends, periodMetrics);

      return {
        period: { start: startDate, end: endDate },
        metrics: periodMetrics,
        trends,
        recommendations,
      };
    } catch (error) {
      console.error('Error generating performance report:', error);
      throw error;
    }
  }

  // Private helper methods

  private async getActiveUsersCount(): Promise<number> {
    const activeThreshold = new Date();
    activeThreshold.setDate(activeThreshold.getDate() - 7); // Last 7 days

    // Get unique active users by counting distinct userIds
    const activeUsers = await prisma.userCriterionMastery.findMany({
      where: {
        lastReviewedAt: {
          gte: activeThreshold,
        },
      },
      select: {
        userId: true,
      },
    });

    // Count unique userIds
    const uniqueUserIds = new Set(activeUsers.map(u => u.userId));
    return uniqueUserIds.size;
  }

  private async getMasteryCalculationsCount(): Promise<number> {
    return await prisma.userCriterionMastery.count();
  }

  private async calculateAverageResponseTime(): Promise<number> {
    // This would calculate from actual request logs
    // For now, return a placeholder value
    return 150; // milliseconds
  }

  private async calculateErrorRate(): Promise<number> {
    // This would calculate from actual error logs
    // For now, return a placeholder value
    return 2.5; // percentage
  }

  private async calculateCacheHitRate(): Promise<number> {
    // This would calculate from cache statistics
    // For now, return a placeholder value
    return 85; // percentage
  }

  private async getDatabaseConnectionsCount(): Promise<number> {
    // This would get from database connection pool
    // For now, return a placeholder value
    return 15;
  }

  private async calculateTimeToMastery(
    userId: number,
    sectionId: number
  ): Promise<number> {
    const masteries = await prisma.userCriterionMastery.findMany({
      where: {
        userId,
        // Now using the correct blueprint-centric fields
        blueprintSectionId: sectionId,
        isMastered: true,
        // Now using lastReviewedAt for proper tracking
      },
              select: {
          lastReviewedAt: true,
          // Now using the correct field from the blueprint-centric schema
        },
    });

    if (masteries.length === 0) return 0;

    let totalDays = 0;
    for (const mastery of masteries) {
      if (mastery.lastReviewedAt) {
        // Now using the correct field from the blueprint-centric schema
        const days = Math.ceil(
          (new Date().getTime() - mastery.lastReviewedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDays += days;
      }
    }

    return Math.round(totalDays / masteries.length);
  }

  private async calculateRetentionRate(
    userId: number,
    sectionId: number
  ): Promise<number> {
    const masteries = await prisma.userCriterionMastery.findMany({
      where: {
        userId,
        // Now using the correct blueprint-centric fields
        blueprintSectionId: sectionId,
        isMastered: true,
      },
    });

    if (masteries.length === 0) return 0;

    // Check retention after 30 days
    const retentionThreshold = new Date();
    retentionThreshold.setDate(retentionThreshold.getDate() - 30);

    // Note: lastReviewedAt doesn't exist, using lastAttempt as fallback
    const retainedMasteries = masteries.filter(m => 
      m.lastReviewedAt && m.lastReviewedAt >= retentionThreshold
    );

    return (retainedMasteries.length / masteries.length) * 100;
  }

  private async calculateStageAdvancements(
    userId: number,
    sectionId: number
  ): Promise<number> {
    // Note: uueStage doesn't exist in the current schema
    // This is a simplified implementation that will need to be updated
    // when the schema is properly aligned with the blueprint-centric approach
    
    const stageTransitions = await prisma.userCriterionMastery.findMany({
      where: {
        userId,
        // Now using the correct blueprint-centric fields
        blueprintSectionId: sectionId,
      },
      // No select needed since we're not using any specific fields
    });

    // Since uueStage doesn't exist, return a simplified calculation
    // This will need to be updated when the schema includes stage tracking
    return stageTransitions.length > 0 ? 1 : 0; // Placeholder implementation
  }

  private async calculateUserEngagement(): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    retentionRate: number;
  }> {
    const totalUsers = await prisma.user.count();
    const activeUsers = await this.getActiveUsersCount();
    
    // Calculate new users in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await prisma.user.count({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Calculate retention rate
    const retentionRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    return {
      totalUsers,
      activeUsers,
      newUsers,
      retentionRate,
    };
  }

  private async calculateMasteryProgress(): Promise<{
    totalCriteria: number;
    masteredCriteria: number;
    averageProgressionRate: number;
    topPerformingSections: string[];
  }> {
    const totalCriteria = await prisma.masteryCriterion.count();
    const masteredCriteria = await prisma.userCriterionMastery.count({
      where: { isMastered: true },
    });

    const averageProgressionRate = totalCriteria > 0 ? (masteredCriteria / totalCriteria) * 100 : 0;

    // Note: The groupBy query with blueprintSectionId won't work since that field doesn't exist
    // This is a simplified implementation that will need to be updated
    // when the schema is properly aligned with the blueprint-centric approach
    
    // For now, return a placeholder for top performing sections
    const topPerformingSections: string[] = []; // Placeholder until schema is updated

    return {
      totalCriteria,
      masteredCriteria,
      averageProgressionRate,
      topPerformingSections,
    };
  }

  private async calculatePerformanceMetrics(): Promise<{
    averageResponseTime: number;
    errorRate: number;
    cacheEfficiency: number;
    databasePerformance: number;
  }> {
    const latestMetrics = this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;

    if (!latestMetrics) {
      return {
        averageResponseTime: 0,
        errorRate: 0,
        cacheEfficiency: 0,
        databasePerformance: 0,
      };
    }

    return {
      averageResponseTime: latestMetrics.averageResponseTime,
      errorRate: latestMetrics.errorRate,
      cacheEfficiency: latestMetrics.cacheHitRate,
      databasePerformance: latestMetrics.databaseConnections > 0 ? 100 : 0,
    };
  }

  private analyzeTrends(metrics: SystemMetrics[]): {
    responseTime: 'IMPROVING' | 'STABLE' | 'DEGRADING';
    errorRate: 'IMPROVING' | 'STABLE' | 'DEGRADING';
    userEngagement: 'IMPROVING' | 'STABLE' | 'DEGRADING';
  } {
    if (metrics.length < 2) {
      return {
        responseTime: 'STABLE',
        errorRate: 'STABLE',
        userEngagement: 'STABLE',
      };
    }

    const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2));
    const secondHalf = metrics.slice(Math.floor(metrics.length / 2));

    const avgResponseTime1 = firstHalf.reduce((sum, m) => sum + m.averageResponseTime, 0) / firstHalf.length;
    const avgResponseTime2 = secondHalf.reduce((sum, m) => sum + m.averageResponseTime, 0) / secondHalf.length;
    
    const avgErrorRate1 = firstHalf.reduce((sum, m) => sum + m.errorRate, 0) / firstHalf.length;
    const avgErrorRate2 = secondHalf.reduce((sum, m) => sum + m.errorRate, 0) / secondHalf.length;
    
    const avgActiveUsers1 = firstHalf.reduce((sum, m) => sum + m.activeUsers, 0) / firstHalf.length;
    const avgActiveUsers2 = secondHalf.reduce((sum, m) => sum + m.activeUsers, 0) / secondHalf.length;

    return {
      responseTime: avgResponseTime2 < avgResponseTime1 ? 'IMPROVING' : avgResponseTime2 > avgResponseTime1 * 1.1 ? 'DEGRADING' : 'STABLE',
      errorRate: avgErrorRate2 < avgErrorRate1 ? 'IMPROVING' : avgErrorRate2 > avgErrorRate1 * 1.2 ? 'DEGRADING' : 'STABLE',
      userEngagement: avgActiveUsers2 > avgActiveUsers1 ? 'IMPROVING' : avgActiveUsers2 < avgActiveUsers1 * 0.9 ? 'DEGRADING' : 'STABLE',
    };
  }

  private generatePerformanceRecommendations(
    trends: any,
    metrics: SystemMetrics[]
  ): string[] {
    const recommendations: string[] = [];

    if (trends.responseTime === 'DEGRADING') {
      recommendations.push('Investigate response time degradation - check database queries and caching');
    }

    if (trends.errorRate === 'DEGRADING') {
      recommendations.push('Review error logs and system stability - consider rolling back recent changes');
    }

    if (trends.userEngagement === 'DEGRADING') {
      recommendations.push('Analyze user engagement decline - review user experience and content quality');
    }

    if (recommendations.length === 0) {
      recommendations.push('System performance is stable - continue monitoring for any changes');
    }

    return recommendations;
  }
}

export const monitoringService = new MonitoringService();
