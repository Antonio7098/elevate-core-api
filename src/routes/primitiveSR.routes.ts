import { Router } from 'express';
import { enhancedSpacedRepetitionController } from '../controllers/blueprint-centric/enhancedSpacedRepetition.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// Daily task generation
router.get('/daily-tasks', enhancedSpacedRepetitionController.getDailyTasks);

// Daily summary (pre-computed criterion summaries)
router.get('/daily-summary', enhancedSpacedRepetitionController.getDailySummary);

// Review outcome processing
router.post('/review-outcome', enhancedSpacedRepetitionController.submitReviewOutcome);
router.post('/batch-review', enhancedSpacedRepetitionController.submitBatchReviewOutcomes);

// Mastery progress tracking
router.get('/mastery-progress/:criterionId', enhancedSpacedRepetitionController.getMasteryProgress);

// Mastery statistics
router.get('/mastery-stats', enhancedSpacedRepetitionController.getMasteryStats);

// Tracking intensity management
router.put('/tracking-intensity/:criterionId', enhancedSpacedRepetitionController.updateTrackingIntensity);

// Enhanced UUE stage progression (new blueprint-centric functionality)
// Note: Additional UUE stage methods will be added as they are implemented

export default router;
