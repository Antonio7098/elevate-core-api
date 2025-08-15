// ============================================================================
// SERVICES INDEX
// ============================================================================
// 
// This module exports all services from the elevate-core-api
// Organized by functionality and architecture
//
// ============================================================================

// Blueprint-Centric Services (New Architecture)
export * from './blueprint-centric';

// AI Integration Services
export { default as AIBlueprintGenerator } from './aiBlueprintGenerator.service';
export { AiApiIntegrationService } from './aiApiIntegration.service';
export { LearningPathwaysService } from './learningPathways.service';

// Mastery System Services
export { MasteryCalculationService } from './masteryCalculation.service';
export { MasteryConfigurationService } from './masteryConfiguration.service';
export { MasteryCriterionService } from './masteryCriterion.service';
export { MasterySystemOrchestratorService } from './masterySystemOrchestrator.service';
export { MasteryTrackingService } from './masteryTracking.service';

// Performance & Optimization Services
export { PerformanceOptimizationService } from './performanceOptimization.service';
export { default as PerformanceTestingService } from './blueprint-centric/performanceTesting.service';
export { default as MasteryPerformanceTestingService } from './blueprint-centric/masteryPerformanceTesting.service';

// Enhanced Services
export { EnhancedBatchReviewService } from './enhancedBatchReview.service';
export { EnhancedSpacedRepetitionService } from './enhancedSpacedRepetition.service';
export { EnhancedTodaysTasksService } from './enhancedTodaysTasks.service';

// Core Services
export { default as DashboardService } from './dashboard.service';
export { ErrorHandlingService } from './errorHandling.service';
export { MonitoringService } from './monitoring.service';
export { scheduledTasksService } from './scheduledTasks.service';

// Stats and Task Services (function-based exports)
export * from './stats.service';
export * from './todaysTasks.service';

// Legacy Services (for backward compatibility)
export { UserExperienceService } from './userExperience.service';
export { UserMemoryService } from './userMemory.service';

// ============================================================================
// SERVICE CATEGORIES
// ============================================================================
//
// BLUEPRINT-CENTRIC: New architecture replacing legacy folder/question set system
// MASTERY SYSTEM: New criterion-based mastery tracking
// PERFORMANCE: Testing and optimization services
// ENHANCED: Improved versions of existing services
// CORE: Essential system services
// LEGACY: Backward compatibility services
//
// ============================================================================
