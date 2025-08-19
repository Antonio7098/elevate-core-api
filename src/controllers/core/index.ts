// ============================================================================
// CORE CONTROLLERS INDEX
// ============================================================================
// 
// This module exports all core system controllers for easy importing
// ============================================================================

// Export individual functions from cache management
export { 
  getCacheStats, 
  clearCache, 
  refreshSummaries, 
  performMaintenance 
} from './cacheManagement.controller';
