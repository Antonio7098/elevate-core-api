import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { getQuestionsBySetId } from '../../controllers/question.controller';

const router = Router();

// Protect all routes
router.use(protect);

// GET /api/questions?questionSetId=:id - Get all questions for a specific question set
router.get('/', getQuestionsBySetId);

export default router;
