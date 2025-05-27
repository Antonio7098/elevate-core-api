import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { 
  getStandaloneQuestionSetById,
  getStandaloneQuestionSetQuestions 
} from '../controllers/standalone-questionset.controller';

const router = Router();

// Protect all routes
router.use(protect);

// GET /api/questionsets/:id - Get a specific question set directly
router.get('/:id', getStandaloneQuestionSetById);

// GET /api/questionsets/:id/questions - Get questions for a specific question set directly
router.get('/:id/questions', getStandaloneQuestionSetQuestions);

export default router;
