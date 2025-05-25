import { Router } from 'express';
import { generateQuestionsFromSource, chatWithAI } from '../controllers/ai.controller';
import { protect } from '../middleware/auth.middleware';
import { validateGenerateFromSource, validateChatWithAI } from '../middleware/validation';

const router = Router();

// All AI routes require authentication
router.use(protect);

// POST /api/ai/generate-from-source - Generate questions from source text
router.post('/generate-from-source', validateGenerateFromSource, generateQuestionsFromSource);

// POST /api/ai/chat - Chat with AI about study materials
router.post('/chat', validateChatWithAI, chatWithAI);

export default router;
