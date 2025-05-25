/**
 * Evaluation Routes
 * 
 * These routes handle AI-powered evaluation of user answers to questions.
 */

import express from 'express';
import { evaluateAnswer } from '../controllers/evaluation.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// All evaluation routes require authentication
router.use(protect);

// POST /api/ai/evaluate-answer - Evaluate a user's answer to a question using AI
router.post('/evaluate-answer', evaluateAnswer);

export default router;
