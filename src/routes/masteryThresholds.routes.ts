import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { masteryCriterionController } from '../controllers/blueprint-centric/masteryCriterion.controller';
import { enhancedSpacedRepetitionController } from '../controllers/blueprint-centric/enhancedSpacedRepetition.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/mastery-thresholds:
 *   tags: [Mastery Thresholds]
 *   description: Mastery threshold customization and management endpoints
 */

// Mastery threshold management
// GET /api/mastery-thresholds/user/:userId - Get user's mastery thresholds
router.get('/user/:userId', enhancedSpacedRepetitionController.getUserMasteryThresholds);

// GET /api/mastery-thresholds/section/:sectionId - Get mastery thresholds for a section
router.get('/section/:sectionId', enhancedSpacedRepetitionController.getSectionMasteryThresholds);

// GET /api/mastery-thresholds/criterion/:criterionId - Get mastery threshold for a criterion
router.get('/criterion/:criterionId', enhancedSpacedRepetitionController.getCriterionMasteryThreshold);

// POST /api/mastery-thresholds/criterion/:criterionId - Set mastery threshold for a criterion
router.post('/criterion/:criterionId', enhancedSpacedRepetitionController.setCriterionMasteryThreshold);

// PUT /api/mastery-thresholds/criterion/:criterionId - Update mastery threshold for a criterion (using setCriterionMasteryThreshold)
router.put('/criterion/:criterionId', enhancedSpacedRepetitionController.setCriterionMasteryThreshold);

// DELETE /api/mastery-thresholds/criterion/:criterionId - Reset mastery threshold to default (using setCriterionMasteryThreshold with default values)
router.delete('/criterion/:criterionId', enhancedSpacedRepetitionController.setCriterionMasteryThreshold);

// Mastery threshold templates
// GET /api/mastery-thresholds/templates - Get available mastery threshold templates
router.get('/templates', enhancedSpacedRepetitionController.getMasteryThresholdTemplates);

// POST /api/mastery-thresholds/templates/apply/:templateId - Apply a mastery threshold template (placeholder)
router.post('/templates/apply/:templateId', (req, res) => {
  res.json({ message: 'Template application not yet implemented' });
});

// POST /api/mastery-thresholds/templates/create - Create a custom mastery threshold template (placeholder)
router.post('/templates/create', (req, res) => {
  res.json({ message: 'Template creation not yet implemented' });
});

// Mastery threshold analysis
// GET /api/mastery-thresholds/analysis/user/:userId - Analyze user's mastery threshold effectiveness
router.get('/analysis/user/:userId', enhancedSpacedRepetitionController.getUserMasteryThresholdAnalysis);

// GET /api/mastery-thresholds/analysis/section/:sectionId - Analyze section mastery threshold effectiveness
router.get('/analysis/section/:sectionId', enhancedSpacedRepetitionController.getSectionMasteryThresholdAnalysis);

// GET /api/mastery-thresholds/recommendations/:userId - Get mastery threshold recommendations
router.get('/recommendations/:userId', enhancedSpacedRepetitionController.getMasteryThresholdRecommendations);

// Mastery threshold bulk operations
// POST /api/mastery-thresholds/bulk-update - Bulk update mastery thresholds
router.post('/bulk-update', enhancedSpacedRepetitionController.bulkUpdateMasteryThresholds);

// POST /api/mastery-thresholds/bulk-reset - Bulk reset mastery thresholds to defaults
router.post('/bulk-reset', enhancedSpacedRepetitionController.bulkResetMasteryThresholds);

// POST /api/mastery-thresholds/import - Import mastery thresholds from external source
router.post('/import', enhancedSpacedRepetitionController.importMasteryThresholds);

// GET /api/mastery-thresholds/export/:userId - Export user's mastery thresholds
router.get('/export/:userId', enhancedSpacedRepetitionController.exportMasteryThresholds);

export default router;
