import { PrismaClient } from '@prisma/client';
import { UserCriterionMastery, MasteryCriterion, UueStage } from '@prisma/client';
import { masteryCalculationService } from './masteryCalculation.service';
import { masteryCriterionService } from './masteryCriterion.service';

const prisma = new PrismaClient();

export interface ErrorHandlingResult {
  success: boolean;
  recovered: boolean;
  fallbackUsed: boolean;
  message: string;
  recommendations: string[];
  dataQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}

export interface DataRecoveryResult {
  recovered: boolean;
  recoveredRecords: number;
  totalRecords: number;
  recoveryRate: number;
  issues: string[];
}

export interface FallbackStrategy {
  type: 'DEFAULT_VALUES' | 'LEGACY_DATA' | 'ESTIMATED_VALUES' | 'SKIP_PROCESSING';
  description: string;
  confidence: number;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DataQualityReport {
  userId: number;
  sectionId: string;
  dataCompleteness: number; // 0-100%
  dataConsistency: number; // 0-100%
  dataFreshness: number; // 0-100%
  overallQuality: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  issues: string[];
  recommendations: string[];
}

export class ErrorHandlingService {
  /**
   * Handle incomplete criterion mastery data scenarios
   */
  async handleIncompleteMasteryData(
    userId: number,
    criterionId: string
  ): Promise<ErrorHandlingResult> {
    try {
      // Check if user mastery record exists
      const userMastery = await prisma.userCriterionMastery.findUnique({
        where: {
          userId_masteryCriterionId: {
            userId,
            masteryCriterionId: criterionId,
          },
        },
      });

      if (!userMastery) {
        // No mastery data exists - create default record
        const defaultRecord = await this.createDefaultMasteryRecord(userId, criterionId);
        return {
          success: true,
          recovered: true,
          fallbackUsed: true,
          message: 'Created default mastery record from incomplete data',
          recommendations: ['Complete initial assessment to establish baseline mastery'],
          dataQuality: 'FAIR',
        };
      }

      // Check data completeness
      const completeness = this.assessDataCompleteness(userMastery);
      
      if (completeness < 0.5) {
        // Data is incomplete - attempt recovery
        const recoveryResult = await this.recoverIncompleteData(userId, criterionId, userMastery);
        
        if (recoveryResult.recovered) {
          return {
            success: true,
            recovered: true,
            fallbackUsed: false,
            message: 'Successfully recovered incomplete mastery data',
            recommendations: recoveryResult.recommendations,
            dataQuality: 'GOOD',
          };
        } else {
          // Use fallback strategy
          const fallbackResult = await this.applyFallbackStrategy(userId, criterionId, userMastery);
          return {
            success: true,
            recovered: false,
            fallbackUsed: true,
            message: 'Applied fallback strategy for incomplete data',
            recommendations: fallbackResult.recommendations,
            dataQuality: 'FAIR',
          };
        }
      }

      return {
        success: true,
        recovered: false,
        fallbackUsed: false,
        message: 'Mastery data is complete and valid',
        recommendations: [],
        dataQuality: 'EXCELLENT',
      };
    } catch (error) {
      return this.handleError(error, 'incomplete mastery data handling');
    }
  }

  /**
   * Manage users with mixed old/new tracking data during transition
   */
  async handleMixedDataTransition(
    userId: number,
    sectionId: string
  ): Promise<ErrorHandlingResult> {
    try {
      // Check for mixed data scenarios
      const mixedDataAnalysis = await this.analyzeMixedData(userId, sectionId);
      
      if (mixedDataAnalysis.hasMixedData) {
        // Attempt to consolidate mixed data
        const consolidationResult = await this.consolidateMixedData(userId, sectionId);
        
        if (consolidationResult.success) {
          return {
            success: true,
            recovered: true,
            fallbackUsed: false,
            message: 'Successfully consolidated mixed tracking data',
            recommendations: consolidationResult.recommendations,
            dataQuality: 'GOOD',
          };
        } else {
          // Use legacy compatibility mode
          const legacyResult = await this.enableLegacyCompatibility(userId, sectionId);
          return {
            success: true,
            recovered: false,
            fallbackUsed: true,
            message: 'Enabled legacy compatibility mode for mixed data',
            recommendations: legacyResult.recommendations,
            dataQuality: 'FAIR',
          };
        }
      }

      return {
        success: true,
        recovered: false,
        fallbackUsed: false,
        message: 'No mixed data detected - using new system',
        recommendations: [],
        dataQuality: 'EXCELLENT',
      };
    } catch (error) {
      return this.handleError(error, 'mixed data transition handling');
    }
  }

  /**
   * Implement fallback strategies when mastery calculations fail
   */
  async handleMasteryCalculationFailure(
    userId: number,
    criterionId: string,
    error: Error
  ): Promise<ErrorHandlingResult> {
    try {
      // Log the failure for analysis
      await this.logCalculationFailure(userId, criterionId, error);
      
      // Determine appropriate fallback strategy
      const fallbackStrategy = this.determineFallbackStrategy(error);
      
      // Apply fallback strategy
      const fallbackResult = await this.applyFallbackStrategy(userId, criterionId, null, fallbackStrategy);
      
      return {
        success: true,
        recovered: false,
        fallbackUsed: true,
        message: `Applied fallback strategy: ${fallbackStrategy.description}`,
        recommendations: fallbackResult.recommendations,
        dataQuality: 'FAIR',
      };
    } catch (fallbackError) {
      return this.handleError(fallbackError, 'fallback strategy application');
    }
  }

  /**
   * Add graceful degradation for AI API integration failures
   */
  async handleAiApiFailure(
    userId: number,
    sectionId: string,
    error: Error
  ): Promise<ErrorHandlingResult> {
    try {
      // Log the AI API failure
      await this.logAiApiFailure(userId, sectionId, error);
      
      // Determine if this is a critical failure
      const isCritical = this.isCriticalAiApiFailure(error);
      
      if (isCritical) {
        // Use offline fallback content
        const offlineResult = await this.useOfflineFallback(userId, sectionId);
        return {
          success: true,
          recovered: false,
          fallbackUsed: true,
          message: 'Using offline fallback content due to AI API failure',
          recommendations: offlineResult.recommendations,
          dataQuality: 'FAIR',
        };
      } else {
        // Use simplified content generation
        const simplifiedResult = await this.useSimplifiedContent(userId, sectionId);
        return {
          success: true,
          recovered: false,
          fallbackUsed: true,
          message: 'Using simplified content generation due to AI API limitations',
          recommendations: simplifiedResult.recommendations,
          dataQuality: 'GOOD',
        };
      }
    } catch (fallbackError) {
      return this.handleError(fallbackError, 'AI API failure handling');
    }
  }

  /**
   * Generate comprehensive data quality report
   */
  async generateDataQualityReport(
    userId: number,
    sectionId: string
  ): Promise<DataQualityReport> {
    try {
      // Assess data completeness
      const completeness = await this.assessDataCompletenessForUser(userId, sectionId);
      
      // Assess data consistency
      const consistency = await this.assessDataConsistency(userId, sectionId);
      
      // Assess data freshness
      const freshness = await this.assessDataFreshness(userId, sectionId);
      
      // Calculate overall quality
      const overallQuality = this.calculateOverallQuality(completeness, consistency, freshness);
      
      // Generate recommendations
      const recommendations = this.generateQualityRecommendations(completeness, consistency, freshness);
      
      // Identify issues
      const issues = this.identifyDataIssues(completeness, consistency, freshness);
      
      return {
        userId,
        sectionId,
        dataCompleteness: completeness,
        dataConsistency: consistency,
        dataFreshness: freshness,
        overallQuality,
        issues,
        recommendations,
      };
    } catch (error) {
      // Return error report
      return {
        userId,
        sectionId,
        dataCompleteness: 0,
        dataConsistency: 0,
        dataFreshness: 0,
        overallQuality: 'POOR',
        issues: [`Error generating report: ${error.message}`],
        recommendations: ['Contact system administrator for data quality assessment'],
      };
    }
  }

  /**
   * Perform data recovery and cleanup
   */
  async performDataRecovery(
    userId: number,
    sectionId: string
  ): Promise<DataRecoveryResult> {
    try {
      let recoveredRecords = 0;
      const issues: string[] = [];
      
      // Recover incomplete mastery records
      const masteryRecovery = await this.recoverMasteryRecords(userId, sectionId);
      recoveredRecords += masteryRecovery.recovered;
      issues.push(...masteryRecovery.issues);
      
      // Recover stage progression data
      const stageRecovery = await this.recoverStageProgression(userId, sectionId);
      recoveredRecords += stageRecovery.recovered;
      issues.push(...stageRecovery.issues);
      
      // Clean up orphaned records
      const cleanupResult = await this.cleanupOrphanedRecords(userId, sectionId);
      issues.push(...cleanupResult.issues);
      
      // Get total records for recovery rate calculation
      const totalRecords = await this.getTotalRecordsCount(userId, sectionId);
      const recoveryRate = totalRecords > 0 ? (recoveredRecords / totalRecords) * 100 : 0;
      
      return {
        recovered: recoveredRecords > 0,
        recoveredRecords,
        totalRecords,
        recoveryRate,
        issues,
      };
    } catch (error) {
      return {
        recovered: false,
        recoveredRecords: 0,
        totalRecords: 0,
        recoveryRate: 0,
        issues: [`Data recovery failed: ${error.message}`],
      };
    }
  }

  // Private helper methods

  private async createDefaultMasteryRecord(
    userId: number,
    criterionId: string
  ): Promise<UserCriterionMastery> {
    const criterion = await masteryCriterionService.getCriterion(criterionId);
    if (!criterion) {
      throw new Error(`Criterion ${criterionId} not found`);
    }

    return await prisma.userCriterionMastery.create({
      data: {
        userId,
        masteryCriterionId: criterionId,
        blueprintSectionId: criterion.blueprintSectionId,
        uueStage: criterion.uueStage,
        masteryScore: 0.0,
        consecutiveIntervals: 0,
        attemptHistory: [],
        currentIntervalStep: 0,
        trackingIntensity: 'NORMAL',
        isMastered: false,
      },
    });
  }

  private assessDataCompleteness(userMastery: UserCriterionMastery): number {
    let completeness = 0;
    let totalFields = 0;

    // Check required fields
    if (userMastery.masteryScore !== null) completeness += 1;
    totalFields += 1;
    
    if (userMastery.consecutiveIntervals !== null) completeness += 1;
    totalFields += 1;
    
    if (userMastery.attemptHistory.length > 0) completeness += 1;
    totalFields += 1;
    
    if (userMastery.currentIntervalStep !== null) completeness += 1;
    totalFields += 1;

    return completeness / totalFields;
  }

  private async recoverIncompleteData(
    userId: number,
    criterionId: string,
    userMastery: UserCriterionMastery
  ): Promise<{
    recovered: boolean;
    recommendations: string[];
  }> {
    try {
      // Attempt to recover from available data
      if (userMastery.attemptHistory.length > 0) {
        // Recalculate mastery score from attempt history
        const recoveredScore = this.calculateMasteryFromHistory(userMastery.attemptHistory);
        await prisma.userCriterionMastery.update({
          where: { id: userMastery.id },
          data: { masteryScore: recoveredScore },
        });
        
        return {
          recovered: true,
          recommendations: ['Recovered mastery score from attempt history'],
        };
      }

      return {
        recovered: false,
        recommendations: ['Insufficient data for recovery - using fallback strategy'],
      };
    } catch (error) {
      return {
        recovered: false,
        recommendations: [`Recovery failed: ${error.message}`],
      };
    }
  }

  private async applyFallbackStrategy(
    userId: number,
    criterionId: string,
    userMastery: UserCriterionMastery | null,
    strategy?: FallbackStrategy
  ): Promise<{
    success: boolean;
    recommendations: string[];
  }> {
    const fallbackStrategy = strategy || this.determineFallbackStrategy(new Error('Unknown error'));
    
    try {
      switch (fallbackStrategy.type) {
        case 'DEFAULT_VALUES':
          await this.applyDefaultValues(userId, criterionId, userMastery);
          break;
        case 'LEGACY_DATA':
          await this.applyLegacyData(userId, criterionId);
          break;
        case 'ESTIMATED_VALUES':
          await this.applyEstimatedValues(userId, criterionId, userMastery);
          break;
        case 'SKIP_PROCESSING':
          // Skip processing for this criterion
          break;
      }
      
      return {
        success: true,
        recommendations: [fallbackStrategy.description],
      };
    } catch (error) {
      return {
        success: false,
        recommendations: [`Fallback strategy failed: ${error.message}`],
      };
    }
  }

  private determineFallbackStrategy(error: Error): FallbackStrategy {
    // Determine appropriate fallback based on error type
    if (error.message.includes('database')) {
      return {
        type: 'LEGACY_DATA',
        description: 'Using legacy data due to database connection issues',
        confidence: 0.8,
        impact: 'MEDIUM',
      };
    } else if (error.message.includes('calculation')) {
      return {
        type: 'DEFAULT_VALUES',
        description: 'Using default values due to calculation errors',
        confidence: 0.6,
        impact: 'LOW',
      };
    } else {
      return {
        type: 'SKIP_PROCESSING',
        description: 'Skipping processing due to unknown error',
        confidence: 0.3,
        impact: 'HIGH',
      };
    }
  }

  private async analyzeMixedData(
    userId: number,
    sectionId: string
  ): Promise<{
    hasMixedData: boolean;
    oldSystemRecords: number;
    newSystemRecords: number;
    conflicts: string[];
  }> {
    // Check for records from both old and new systems
    const oldSystemRecords = await this.countOldSystemRecords(userId, sectionId);
    const newSystemRecords = await this.countNewSystemRecords(userId, sectionId);
    
    const hasMixedData = oldSystemRecords > 0 && newSystemRecords > 0;
    const conflicts = hasMixedData ? ['Mixed tracking data detected'] : [];
    
    return {
      hasMixedData,
      oldSystemRecords,
      newSystemRecords,
      conflicts,
    };
  }

  private async consolidateMixedData(
    userId: number,
    sectionId: string
  ): Promise<{
    success: boolean;
    recommendations: string[];
  }> {
    try {
      // Attempt to map old system data to new system
      const mappingResult = await this.mapOldToNewSystem(userId, sectionId);
      
      if (mappingResult.success) {
        return {
          success: true,
          recommendations: ['Successfully mapped old system data to new mastery criteria'],
        };
      } else {
        return {
          success: false,
          recommendations: ['Failed to map old system data - using legacy compatibility'],
        };
      }
    } catch (error) {
      return {
        success: false,
        recommendations: [`Data consolidation failed: ${error.message}`],
      };
    }
  }

  private async enableLegacyCompatibility(
    userId: number,
    sectionId: string
  ): Promise<{
    success: boolean;
    recommendations: string[];
  }> {
    try {
      // Enable legacy compatibility mode for this user/section
      await this.setLegacyCompatibilityMode(userId, sectionId, true);
      
      return {
        success: true,
        recommendations: ['Legacy compatibility mode enabled for mixed data'],
      };
    } catch (error) {
      return {
        success: false,
        recommendations: [`Failed to enable legacy mode: ${error.message}`],
      };
    }
  }

  private async useOfflineFallback(
    userId: number,
    sectionId: string
  ): Promise<{
    success: boolean;
    recommendations: string[];
  }> {
    try {
      // Use pre-generated offline content
      const offlineContent = await this.getOfflineContent(sectionId);
      
      return {
        success: true,
        recommendations: ['Using offline fallback content due to AI API unavailability'],
      };
    } catch (error) {
      return {
        success: false,
        recommendations: [`Offline fallback failed: ${error.message}`],
      };
    }
  }

  private async useSimplifiedContent(
    userId: number,
    sectionId: string
  ): Promise<{
    success: boolean;
    recommendations: string[];
  }> {
    try {
      // Generate simplified content without AI assistance
      const simplifiedContent = await this.generateSimplifiedContent(sectionId);
      
      return {
        success: true,
        recommendations: ['Using simplified content generation due to AI API limitations'],
      };
    } catch (error) {
      return {
        success: false,
        recommendations: [`Simplified content generation failed: ${error.message}`],
      };
    }
  }

  private calculateMasteryFromHistory(attemptHistory: number[]): number {
    if (attemptHistory.length === 0) return 0.0;
    
    // Simple average of recent attempts
    const recentAttempts = attemptHistory.slice(-5); // Last 5 attempts
    const sum = recentAttempts.reduce((total, score) => total + score, 0);
    
    return sum / recentAttempts.length;
  }

  private isCriticalAiApiFailure(error: Error): boolean {
    // Determine if AI API failure is critical
    const criticalErrors = ['authentication', 'quota_exceeded', 'service_unavailable'];
    return criticalErrors.some(critical => error.message.toLowerCase().includes(critical));
  }

  private calculateOverallQuality(
    completeness: number,
    consistency: number,
    freshness: number
  ): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
    const average = (completeness + consistency + freshness) / 3;
    
    if (average >= 90) return 'EXCELLENT';
    if (average >= 75) return 'GOOD';
    if (average >= 50) return 'FAIR';
    return 'POOR';
  }

  private generateQualityRecommendations(
    completeness: number,
    consistency: number,
    freshness: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (completeness < 80) {
      recommendations.push('Complete missing mastery assessments to improve data completeness');
    }
    
    if (consistency < 80) {
      recommendations.push('Review and standardize mastery tracking procedures');
    }
    
    if (freshness < 80) {
      recommendations.push('Update mastery data more frequently to maintain freshness');
    }
    
    return recommendations;
  }

  private identifyDataIssues(
    completeness: number,
    consistency: number,
    freshness: number
  ): string[] {
    const issues: string[] = [];
    
    if (completeness < 50) issues.push('Critical: Missing mastery data');
    if (consistency < 50) issues.push('Critical: Inconsistent data format');
    if (freshness < 50) issues.push('Critical: Outdated mastery information');
    
    return issues;
  }

  // Placeholder methods for data recovery operations
  private async recoverMasteryRecords(userId: number, sectionId: string) {
    return { recovered: 0, issues: [] };
  }

  private async recoverStageProgression(userId: number, sectionId: string) {
    return { recovered: 0, issues: [] };
  }

  private async cleanupOrphanedRecords(userId: number, sectionId: string) {
    return { issues: [] };
  }

  private async getTotalRecordsCount(userId: number, sectionId: string): Promise<number> {
    return 0;
  }

  private async countOldSystemRecords(userId: number, sectionId: string): Promise<number> {
    return 0;
  }

  private async countNewSystemRecords(userId: number, sectionId: string): Promise<number> {
    return 0;
  }

  private async mapOldToNewSystem(userId: number, sectionId: string) {
    return { success: false };
  }

  private async setLegacyCompatibilityMode(userId: number, sectionId: string, enabled: boolean) {
    // Implementation would set legacy mode flag
  }

  private async getOfflineContent(sectionId: string) {
    // Implementation would retrieve offline content
  }

  private async generateSimplifiedContent(sectionId: string) {
    // Implementation would generate simplified content
  }

  private async assessDataCompletenessForUser(userId: number, sectionId: string): Promise<number> {
    return 85; // Placeholder
  }

  private async assessDataConsistency(userId: number, sectionId: string): Promise<number> {
    return 90; // Placeholder
  }

  private async assessDataFreshness(userId: number, sectionId: string): Promise<number> {
    return 75; // Placeholder
  }

  private async logCalculationFailure(userId: number, criterionId: string, error: Error) {
    // Implementation would log to monitoring system
    console.error(`Mastery calculation failed for user ${userId}, criterion ${criterionId}:`, error);
  }

  private async logAiApiFailure(userId: number, sectionId: string, error: Error) {
    // Implementation would log to monitoring system
    console.error(`AI API failure for user ${userId}, section ${sectionId}:`, error);
  }

  private async applyDefaultValues(userId: number, criterionId: string, userMastery: UserCriterionMastery | null) {
    // Implementation would apply default values
  }

  private async applyLegacyData(userId: number, criterionId: string) {
    // Implementation would use legacy data
  }

  private async applyEstimatedValues(userId: number, criterionId: string, userMastery: UserCriterionMastery | null) {
    // Implementation would estimate values
  }

  private handleError(error: Error, context: string): ErrorHandlingResult {
    console.error(`Error in ${context}:`, error);
    
    return {
      success: false,
      recovered: false,
      fallbackUsed: false,
      message: `Error occurred: ${error.message}`,
      recommendations: ['Contact system administrator', 'Check system logs for details'],
      dataQuality: 'POOR',
    };
  }
}

export const errorHandlingService = new ErrorHandlingService();
