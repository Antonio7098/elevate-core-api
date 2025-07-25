import { Router } from 'express';
import learningBlueprintsController from '../controllers/learning-blueprints.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// CRUD Operations
router.get('/', protect, learningBlueprintsController.getAllLearningBlueprints);
router.post('/', protect, learningBlueprintsController.createLearningBlueprint);
router.get('/:id', protect, learningBlueprintsController.getLearningBlueprintById);
router.put('/:id', protect, learningBlueprintsController.updateLearningBlueprint);
router.delete('/:id', protect, learningBlueprintsController.deleteLearningBlueprint);

// AI API Status Management
router.get('/:id/status', protect, learningBlueprintsController.getBlueprintIndexingStatus);
router.post('/:id/reindex', protect, learningBlueprintsController.reindexBlueprint);

// Content Generation from Blueprints
router.post(
  '/:blueprintId/question-sets',
  protect,
  learningBlueprintsController.generateQuestionsFromBlueprint,
);

router.post(
  '/:blueprintId/notes',
  protect,
  learningBlueprintsController.generateNoteFromBlueprint,
);

export default router;
