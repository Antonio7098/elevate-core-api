import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { getQuestionSetQuestions } from '../../controllers/temp/question-set-questions.controller';

const router = Router();

// Protect all routes
router.use(protect);

// GET /api/questionsets/:id/questions - Get all questions for a specific question set
router.get('/:id/questions', getQuestionSetQuestions);

export default router;
