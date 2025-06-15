import { Router } from 'express';
import { generateQuestionsFromSource, generateNoteFromSource } from '../controllers/ai.controller';
import { evaluateAnswer } from '../controllers/evaluation.controller';
import { protect } from '../middleware/auth.middleware';
import { validateGenerateFromSource, validateGenerateNote } from '../middleware/validation';  // Ensure validateGenerateNote is defined in validation.ts and returns void or Promise<void> for Express compatibility

const router = Router();

// All AI routes require authentication
router.use(protect);

// POST /api/ai/generate-questions-from-source - Generate questions from source text
router.post('/generate-questions-from-source', validateGenerateFromSource, generateQuestionsFromSource);

// POST /api/ai/chat - Chat with AI about study materials
// router.post('/chat', validateChatWithAI, chatWithAI);

// POST /api/ai/generate-note - Generate note from source text
router.post('/generate-note', protect, validateGenerateNote, generateNoteFromSource);

// POST /api/ai/evaluate-answer - Evaluate a user's answer to a question using AI
router.post('/evaluate-answer', protect, evaluateAnswer);

export default router;