// ============================================================================
// MAIN CONTROLLERS INDEX
// ============================================================================
// 
// This module exports all controllers organized by domain
// ============================================================================

// Blueprint-Centric Controllers (already organized)
export * from './blueprint-centric';

// Domain-Specific Controllers
export * from './mastery';
export * from './ai';
export * from './user';
export * from './legacy';
export * from './core';

// Legacy Direct Exports (for backward compatibility during transition)
// These will be removed once all imports are updated
// Export mastery controllers through the index to avoid conflicts
export * from './mastery';
export * from './mastery/primitive.controller.fast-tasks';
export * from './mastery/reviewScheduling.controller';

export * from './ai/ai.controller';
export * from './ai/aiBlueprintGenerator.controller';
export * from './ai/chat.controller';
export * from './ai/primitiveAI.controller';

export * from './user/auth.controller';
export * from './user/user.controller';
export * from './user/payment.controller';
export * from './user/userMemory.controller';

export * from './legacy/folder.controller';
export * from './legacy/questionset.controller';
export * from './legacy/recursiveFolder.controller';

export * from './core/cacheManagement.controller';
export * from './core/dashboard.controller';
