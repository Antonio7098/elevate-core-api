// src/routes/review-minimal.ts - Minimal review router for testing
import express, { Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

// All review routes require authentication
router.use(protect);

// GET /api/reviews/today - Simple test endpoint
router.get('/today', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Review endpoint working',
    count: 0,
    questionSets: []
  });
});

// GET /api/reviews/stats - Simple test endpoint
router.get('/stats', (req: Request, res: Response) => {
  res.status(200).json({ 
    message: 'Stats endpoint working',
    totalSets: 0,
    totalQuestions: 0,
    masteredSets: 0,
    avgOverallScore: 0,
    dueSets: 0,
    streak: 0
  });
});

export default router;
