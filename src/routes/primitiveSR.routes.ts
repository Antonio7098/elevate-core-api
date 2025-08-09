import { Router } from 'express';
import * as primitiveSRController from '../controllers/primitiveSR.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// Daily task generation
router.get('/daily-tasks', primitiveSRController.getDailyTasks);

// Daily summary (pre-computed primitive summaries)
router.get('/daily-summary', primitiveSRController.getDailySummary);

// Review outcome processing
router.post('/review-outcome', primitiveSRController.submitReviewOutcome);
router.post('/batch-review', primitiveSRController.submitBatchReviewOutcomes);
router.post('/additional-tasks', primitiveSRController.getAdditionalTasks);

// UEE progression
router.get('/progression/:primitiveId/:blueprintId', primitiveSRController.checkProgression);
router.post('/progress/:primitiveId/:blueprintId', primitiveSRController.progressToNextLevel);

// Pinned reviews
router.post('/pin-review/:primitiveId', primitiveSRController.pinReview);
router.delete('/pin-review/:primitiveId', primitiveSRController.unpinReview);
router.get('/pinned-reviews', primitiveSRController.getPinnedReviews);

export default router;
