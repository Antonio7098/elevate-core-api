// ============================================================================
// AI ROUTES INDEX
// ============================================================================
// 
// This module exports all AI-related routes for easy importing
// ============================================================================

// Core AI Routes
export { default as aiRoutes } from './ai.routes';
export { default as aiBlueprintGeneratorRoutes } from './aiBlueprintGenerator.routes';
export { default as chatRoutes } from './chat.routes';
export { default as primitiveAIRoutes } from './primitiveAI.routes';

// Default export for convenience
export * from './ai.routes';
export * from './aiBlueprintGenerator.routes';
export * from './chat.routes';
export * from './primitiveAI.routes';
