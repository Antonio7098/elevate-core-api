import { Router } from 'express';
import learningBlueprintsController from '../controllers/learning-blueprints.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/', protect, learningBlueprintsController.createLearningBlueprint);

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
