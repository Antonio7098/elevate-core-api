import express, { Request, Response } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  startReview,
  submitReview,
  getTodayReviews,
  getReviewStats,
  getReviewQuestions
} from '../controllers/review.controller';
import {
  scheduleNewReview,
  getScheduledReviewsList,
  updateScheduledReviewById,
  cancelScheduledReviewById,
  getUpcomingReviewsList
} from '../controllers/reviewScheduling.controller';

const router = express.Router();

// All review routes require authentication
router.use(protect);

// GET /api/reviews/today - Get question sets due for review today
router.get('/today', getTodayReviews);

// GET /api/reviews/question-set/:id - Get questions for a specific review session
router.get('/question-set/:questionSetId', getReviewQuestions);

// POST /api/reviews - Submit a review for a question set
router.post('/', submitReview);

// GET /api/reviews/stats - Get review statistics and progress summary
router.get('/stats', getReviewStats);

// New scheduling endpoints
router.post('/schedule', scheduleNewReview);
router.get('/scheduled', getScheduledReviewsList);
router.put('/scheduled/:id', updateScheduledReviewById);
router.delete('/scheduled/:id', cancelScheduledReviewById);
router.get('/upcoming', getUpcomingReviewsList);

export default router;
