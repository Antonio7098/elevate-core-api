import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getQuestionSetById } from '../controllers/questionset.controller';

const router = Router();

// Protect all routes
router.use(protect);

// GET /api/questionsets/:id - Get a specific question set
router.get('/:id', getQuestionSetById);

// Mount questions routes for /api/questionsets/:setId/questions
router.use('/:setId/questions', (req: any, res, next) => {
  // Set folderId to -1 to indicate this is a direct access without folder context
  // Using type assertion to avoid TypeScript errors
  req.params = { ...req.params, folderId: '-1' };
  next();
}, require('./question.routes').default);

export default router;
