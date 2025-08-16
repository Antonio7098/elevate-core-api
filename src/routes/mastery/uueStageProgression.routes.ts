import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { masteryCriterionController } from '../../controllers/blueprint-centric/masteryCriterion.controller';
import { enhancedSpacedRepetitionController } from '../../controllers/blueprint-centric/enhancedSpacedRepetition.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/uue-stage-progression:
 *   tags: [UUE Stage Progression]
 *   description: UUE stage progression management endpoints
 */

// UUE stage progression tracking
// GET /api/uue-stage-progression/progress/:criterionId - Get UUE stage progress for a criterion
router.get('/progress/:criterionId', enhancedSpacedRepetitionController.getUueStageProgress);

// POST /api/uue-stage-progression/advance/:criterionId - Advance to next UUE stage
router.post('/advance/:criterionId', enhancedSpacedRepetitionController.progressToNextUueLevel);

// GET /api/uue-stage-progression/stage/:stage - Get all criteria at a specific UUE stage
router.get('/stage/:stage', masteryCriterionController.getCriteriaByUueStage);

// GET /api/uue-stage-progression/user/:userId - Get user's overall UUE stage progress
router.get('/user/:userId', enhancedSpacedRepetitionController.getUserUueStageProgress);

// GET /api/uue-stage-progression/section/:sectionId - Get UUE stage progress for a section
router.get('/section/:sectionId', masteryCriterionController.getSectionUueProgress);

// POST /api/uue-stage-progression/reset/:criterionId - Reset UUE stage for a criterion
router.post('/reset/:criterionId', enhancedSpacedRepetitionController.resetUueStage);

// GET /api/uue-stage-progression/analytics/:userId - Get UUE stage analytics for user
router.get('/analytics/:userId', enhancedSpacedRepetitionController.getUueStageAnalytics);

// POST /api/uue-stage-progression/batch-advance - Batch advance multiple criteria
router.post('/batch-advance', enhancedSpacedRepetitionController.batchAdvanceUueStages);

// GET /api/uue-stage-progression/next-review/:criterionId - Get next review time for UUE stage
router.get('/next-review/:criterionId', enhancedSpacedRepetitionController.getNextUueStageReview);

export default router;
