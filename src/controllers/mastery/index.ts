// ============================================================================
// MASTERY CONTROLLERS INDEX
// ============================================================================
// 
// This module exports all mastery-related controllers for easy importing
// ============================================================================

// Core Mastery Controllers - Export specific functions to avoid conflicts
export { 
  setPrismaClient, 
  resetPrismaClient, 
  submitReview as submitPrimitiveReview, 
  toggleTracking, 
  listPrimitives 
} from './primitive.controller';

export { 
  submitReview as submitReviewReview, 
  getTodayReviews,
  getReviewQuestions,
  getReviewStats,
  startReview
} from './review.controller';

export * from './primitiveSR.controller';
