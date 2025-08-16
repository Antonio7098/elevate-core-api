// ============================================================================
// LEGACY ROUTES INDEX
// ============================================================================
// 
// This module exports all legacy routes for compatibility during transition
// ============================================================================

// Legacy Routes
export { default as folderRoutes } from './folder.routes';
export { default as questionSetRoutes } from './questionset.routes';
export { default as standaloneQuestionSetRoutes } from './standalone-questionset.routes';

// Default export for convenience
export * from './folder.routes';
export * from './questionset.routes';
export * from './standalone-questionset.routes';
