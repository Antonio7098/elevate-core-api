import { Router } from 'express';
import { evaluateAnswer } from '../controllers/evaluation.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// POST /api/ai/evaluate-answer - Evaluate a user's answer to a question using AI
router.post('/evaluate-answer', protect, evaluateAnswer);

export default router;