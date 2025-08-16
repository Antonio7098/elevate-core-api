// ============================================================================
// USER ROUTES INDEX
// ============================================================================
// 
// This module exports all user-related routes for easy importing
// ============================================================================

// User Management Routes
export { default as authRoutes } from './auth';
export { default as userRoutes } from './user.routes';
export { default as paymentRoutes } from './payment.routes';
export { default as userMemoryRoutes } from './userMemory.routes';

// Default export for convenience
export * from './auth';
export * from './user.routes';
export * from './payment.routes';
export * from './userMemory.routes';
