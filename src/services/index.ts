// ============================================================================
// MAIN SERVICES INDEX
// ============================================================================
// 
// This module exports all services organized by domain
// ============================================================================

// Blueprint-Centric Services (already organized)
export * from './blueprint-centric';

// Domain-Specific Services
export * from './mastery';
export * from './ai';
export * from './user';
export * from './legacy';
export * from './core';

// Legacy Direct Exports (for backward compatibility during transition)
// These will be removed once all imports are updated
export * from './mastery/enhancedSpacedRepetition.service';
export * from './mastery/enhancedTodaysTasks.service';
export * from './mastery/enhancedBatchReview.service';
export * from './mastery/masteryCriterion.service';
export * from './mastery/masteryTracking.service';
export * from './mastery/masteryCalculation.service';
export * from './mastery/masteryConfiguration.service';
export * from './mastery/masterySystemOrchestrator.service';
export * from './mastery/uueStageProgression.service';
export * from './mastery/advancedSpacedRepetition.service';
export * from './mastery/batchReviewProcessing.service';
export * from './mastery/cachedPrimitiveSR.service';
export * from './mastery/learningPathways.service';
export * from './mastery/insightCatalyst.service';
export * from './mastery/primitiveReviewScheduling.service';
export * from './mastery/primitiveStats.service';
export * from './mastery/stats.service';
export * from './mastery/todaysTasks.service';
export * from './mastery/primitiveSR.service';
export * from './mastery/questionInstance.service';

export * from './ai/aiBlueprintGenerator.service';
export * from './ai/aiApiIntegration.service';
export * from './ai/ai-api-client.service';
export * from './ai/aiService';
export * from './ai/primitiveAI.service';
export * from './ai/mindmap.service';
export * from './ai/premiumVectorIndexing.service';

export * from './user/userExperience.service';
export * from './user/userMemory.service';
export * from './user/payment.service';

export * from './legacy/recursiveFolder.service';
export * from './legacy/legacyCompatibility.service';

export * from './core/dashboard.service';
export * from './core/errorHandling.service';
export * from './core/monitoring.service';
export * from './core/performanceOptimization.service';
export * from './core/scheduledTasks.service';
export * from './core/summaryMaintenance.service';

// Note Content Service
export * from './blueprint-centric/note-content.service';
