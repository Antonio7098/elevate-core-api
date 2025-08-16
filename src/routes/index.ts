// ============================================================================
// MAIN ROUTES INDEX
// ============================================================================
// 
// This module exports all routes organized by domain
// ============================================================================

// Domain-Specific Routes
export * from './mastery';
export * from './ai';
export * from './user';
export * from './legacy';
export * from './core';

// Legacy Direct Exports (for backward compatibility during transition)
// These will be removed once all imports are updated
export * from './mastery/primitive.routes';
export * from './mastery/review.routes';
export * from './mastery/insightCatalyst.routes';
export * from './mastery/studySessions.routes';
export * from './mastery/primitiveSR.routes';
export * from './mastery/uueStageProgression.routes';

export * from './ai/ai.routes';
export * from './ai/aiBlueprintGenerator.routes';
export * from './ai/chat.routes';
export * from './ai/primitiveAI.routes';

export * from './user/auth';
export * from './user/user.routes';
export * from './user/payment.routes';
export * from './user/userMemory.routes';

export * from './legacy/folder.routes';
export * from './legacy/questionset.routes';
export * from './legacy/standalone-questionset.routes';

export * from './core/cacheManagement.routes';
export * from './core/dashboard.routes';
