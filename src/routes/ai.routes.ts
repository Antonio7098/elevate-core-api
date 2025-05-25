import { Router } from 'express';
import { generateQuestionsFromSource } from '../controllers/ai.controller';
import { protect } from '../middleware/auth.middleware';
import { validateGenerateFromSource } from '../middleware/validation';

const router = Router();

// All AI routes require authentication
router.use(protect);

// POST /api/ai/generate-from-source - Generate questions from source text
router.post('/generate-from-source', validateGenerateFromSource, generateQuestionsFromSource);

export default router;
