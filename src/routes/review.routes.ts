import { Router } from 'express';
import { getTodayReviews, submitReview, getReviewStats } from '../controllers/review.controller';
import { protect } from '../middleware/auth.middleware';
import { validateSubmitReview } from '../middleware/validation';

const router = Router();

// All review routes require authentication
router.use(protect);

// GET /api/reviews/today - Get questions due for review today
router.get('/today', getTodayReviews);

// POST /api/reviews - Submit a review for a question
router.post('/', validateSubmitReview, submitReview);

// GET /api/reviews/stats - Get review statistics
router.get('/stats', getReviewStats);

export default router;
