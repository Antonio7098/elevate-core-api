import { Router } from 'express';
import learningBlueprintsController from '../controllers/learning-blueprints.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Mindmap Endpoints (alias path expected by frontend)
router.get('/:id/mindmap', protect, learningBlueprintsController.getBlueprintMindmap);
router.put('/:id/mindmap', protect, learningBlueprintsController.updateBlueprintMindmap);

export default router;


