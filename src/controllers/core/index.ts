// ============================================================================
// CORE CONTROLLERS INDEX
// ============================================================================
// 
// This module exports all core system controllers for easy importing
// ============================================================================

// Core System Controllers
export { default as DashboardController } from './dashboard.controller';

// Export individual functions from cache management
export { 
  getCacheStats, 
  clearCache, 
  refreshSummaries, 
  performMaintenance 
} from './cacheManagement.controller';

// Export all from dashboard controller
export * from './dashboard.controller';
