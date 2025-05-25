import { Router } from 'express';
import { getQuestionsBySet, createQuestion, getQuestionById, updateQuestion, deleteQuestion } from '../controllers/question.controller';
import { validateSetIdParams, validateQuestionCreate, validateQuestionId, validateQuestionUpdate } from '../middleware/validation';
import { protect } from '../middleware/auth.middleware';

// This router will be mounted under /:setId/questions,
// so mergeParams is true to get :setId from the parent (questionsetRouter)
// and :folderId from its parent (folderRouter)
const router = Router({ mergeParams: true });

// GET /api/folders/:folderId/questionsets/:setId/questions
router.get('/', protect, validateSetIdParams, getQuestionsBySet);

// POST /api/folders/:folderId/questionsets/:setId/questions
router.post('/', protect, validateSetIdParams, validateQuestionCreate, createQuestion);

// GET /api/folders/:folderId/questionsets/:setId/questions/:id
router.get('/:id', protect, validateSetIdParams, validateQuestionId, getQuestionById);

// PUT /api/folders/:folderId/questionsets/:setId/questions/:id
router.put('/:id', protect, validateSetIdParams, validateQuestionId, validateQuestionUpdate, updateQuestion);

// DELETE /api/folders/:folderId/questionsets/:setId/questions/:id
router.delete('/:id', protect, validateSetIdParams, validateQuestionId, deleteQuestion);

export default router;
