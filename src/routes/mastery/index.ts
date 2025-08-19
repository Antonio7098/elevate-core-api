// ============================================================================
// MASTERY ROUTES INDEX
// ============================================================================
// 
// This module exports all mastery-related routes for easy importing
// ============================================================================

// Core Mastery Routes
export { default as primitiveRoutes } from './primitive.routes';
export { default as reviewRoutes } from './review.routes';
export { default as studySessionsRoutes } from './studySessions.routes';
export { default as primitiveSRRoutes } from './primitiveSR.routes';
export { default as uueStageProgressionRoutes } from './uueStageProgression.routes';

// Default export for convenience
export * from './primitive.routes';
export * from './review.routes';
export * from './studySessions.routes';
export * from './primitiveSR.routes';
export * from './uueStageProgression.routes';
