import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { masteryCriterionController } from '../../controllers/blueprint-centric/masteryCriterion.controller';
import { enhancedSpacedRepetitionController } from '../../controllers/blueprint-centric/enhancedSpacedRepetition.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/mastery-thresholds:
 *   tags: [Mastery Thresholds]
 *   description: Mastery threshold customization and management endpoints
 *   
 *   NOTE: This endpoint is temporarily disabled while primitive-based 
 *   spaced repetition is being redone.
 */

// ============================================================================
// MASTERY THRESHOLD ROUTES - TEMPORARILY DISABLED
// ============================================================================
// These routes are disabled while primitive-based spaced repetition is being redone
// They will be reimplemented with the new primitive-based approach

// Mastery threshold management - TEMPORARILY DISABLED
// router.get('/user/:userId', enhancedSpacedRepetitionController.getUserMasteryThresholds);
// router.get('/section/:sectionId', enhancedSpacedRepetitionController.getSectionMasteryThresholds);
// router.get('/criterion/:criterionId', enhancedSpacedRepetitionController.getCriterionMasteryThreshold);
// router.post('/criterion/:criterionId', enhancedSpacedRepetitionController.setCriterionMasteryThreshold);
// router.put('/criterion/:criterionId', enhancedSpacedRepetitionController.setCriterionMasteryThreshold);
// router.delete('/criterion/:criterionId', enhancedSpacedRepetitionController.setCriterionMasteryThreshold);

// Mastery threshold templates - TEMPORARILY DISABLED
// router.get('/templates', enhancedSpacedRepetitionController.getMasteryThresholdTemplates);
// router.post('/templates/apply/:templateId', (req, res) => {
//   res.json({ message: 'Template application not yet implemented' });
// });
// router.post('/templates/create', (req, res) => {
//   res.json({ message: 'Template creation not yet implemented' });
// });

// Mastery threshold analysis - TEMPORARILY DISABLED
// router.get('/analysis/user/:userId', enhancedSpacedRepetitionController.getUserMasteryThresholdAnalysis);
// router.get('/analysis/section/:sectionId', enhancedSpacedRepetitionController.getSectionMasteryThresholdAnalysis);
// router.get('/recommendations/:userId', enhancedSpacedRepetitionController.getMasteryThresholdRecommendations);

// Mastery threshold bulk operations - TEMPORARILY DISABLED
// router.post('/bulk-update', enhancedSpacedRepetitionController.bulkUpdateMasteryThresholds);
// router.post('/bulk-reset', enhancedSpacedRepetitionController.bulkResetMasteryThresholds);
// router.post('/import', enhancedSpacedRepetitionController.importMasteryThresholds);
// router.get('/export/:userId', enhancedSpacedRepetitionController.exportMasteryThresholds);

// Temporary placeholder route
router.get('/', (req, res) => {
  res.json({ 
    message: 'Mastery thresholds endpoint temporarily disabled',
    note: 'This endpoint is being reimplemented with the new primitive-based spaced repetition system'
  });
});

export default router;
