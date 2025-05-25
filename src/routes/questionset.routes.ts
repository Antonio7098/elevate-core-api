import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import questionRouter from './question.routes';

const router = Router({ mergeParams: true }); // mergeParams is crucial for :folderId

// Protect all routes related to question sets (and their questions)
router.use(protect);

// Mount the questionRouter for paths like /api/folders/:folderId/questionsets/:setId/questions
router.use('/:setId/questions', questionRouter);

export default router;
