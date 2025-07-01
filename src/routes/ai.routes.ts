import { Router } from 'express';
import { generateQuestionsFromSource, generateNoteFromSource, chatWithAI, evaluateAnswer } from '../controllers/ai.controller';
import { protect } from '../middleware/auth.middleware';
import { validateGenerateFromSource, validateGenerateNote, validateChatWithAI } from '../middleware/validation';

const router = Router();

// All AI routes require authentication
router.use(protect);

// POST /api/ai/generate-questions-from-source - Generate questions from source text
router.post('/generate-questions-from-source', validateGenerateFromSource, generateQuestionsFromSource);

// POST /api/ai/chat - Chat with AI about study materials
router.post('/chat', validateChatWithAI, chatWithAI);

// POST /api/ai/generate-note - Generate note from source text
router.post('/generate-note', validateGenerateNote, generateNoteFromSource);

// POST /api/ai/evaluate-answer - Evaluate a user's answer
router.post('/evaluate-answer', evaluateAnswer);


export default router;