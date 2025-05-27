import { Router } from 'express';
import { getTodayReviews, submitReview, getReviewStats, getReviewQuestions } from '../controllers/review.controller';
import { protect } from '../middleware/auth.middleware';
import { validateSubmitReview } from '../middleware/validation';

const router = Router();

// All review routes require authentication
router.use(protect);

// GET /api/reviews/today - Get question sets due for review today
router.get('/today', getTodayReviews);

// GET /api/reviews/question-set/:id - Get questions for a specific question set review
router.get('/question-set/:id', getReviewQuestions);

// POST /api/reviews - Submit a review for a question set
router.post('/', validateSubmitReview, submitReview);

// GET /api/reviews/stats - Get review statistics and progress summary
router.get('/stats', getReviewStats);

export default router;
