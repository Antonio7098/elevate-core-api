import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { masteryCriterionController } from '../controllers/blueprint-centric/masteryCriterion.controller';
import { enhancedSpacedRepetitionController } from '../controllers/blueprint-centric/enhancedSpacedRepetition.controller';
import { cacheMiddleware, userSpecificKeyGenerator } from '../middleware/cache.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// Mastery criterion management
router.post('/criterion', masteryCriterionController.createCriterion);
router.get('/criterion/:id', masteryCriterionController.getCriterion);
router.put('/criterion/:id', masteryCriterionController.updateCriterion);
router.delete('/criterion/:id', masteryCriterionController.deleteCriterion);

// Criterion queries by section and UUE stage
router.get('/criteria-by-section/:sectionId', masteryCriterionController.getCriteriaBySection);
router.get('/criteria-by-uue-stage/:stage', masteryCriterionController.getCriteriaByUueStage);

// Criterion review processing
router.post('/criterion-review', masteryCriterionController.processCriterionReview);

// Mastery progress tracking
router.get('/criterion-mastery-progress/:criterionId', masteryCriterionController.getCriterionMasteryProgress);

// Mastery threshold management
router.put('/mastery-threshold/:criterionId', masteryCriterionController.updateMasteryThreshold);

// Section UUE progress
router.get('/section-uue-progress/:sectionId', masteryCriterionController.getSectionUueProgress);

// User mastery statistics
router.get('/user-mastery-stats', masteryCriterionController.getUserMasteryStats);

// ============================================================================
// BACKWARD COMPATIBILITY ROUTES
// These routes maintain compatibility with existing frontend integrations
// ============================================================================

// Primitive review processing (backward compatibility)
router.post('/review', enhancedSpacedRepetitionController.processBatchReviewOutcomes);

// Primitive tracking management (backward compatibility)
router.post('/:id/tracking', enhancedSpacedRepetitionController.togglePrimitiveTracking);

// Primitive listing and details (backward compatibility)
router.get('/', enhancedSpacedRepetitionController.getUserPrimitives);
router.get('/:id/details', enhancedSpacedRepetitionController.getPrimitiveDetails);

// Tracking intensity management (backward compatibility)
router.post('/:id/tracking-intensity', enhancedSpacedRepetitionController.setTrackingIntensity);
router.get('/:id/tracking-intensity', enhancedSpacedRepetitionController.getTrackingIntensity);
router.delete('/:id/tracking-intensity', enhancedSpacedRepetitionController.resetTrackingIntensity);

export default router;
