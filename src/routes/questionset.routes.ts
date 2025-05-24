import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  createQuestionSet,
  getQuestionSetsByFolder,
  getQuestionSetById,
  updateQuestionSet,
  deleteQuestionSet,
} from '../controllers/questionset.controller';
import {
  validateQuestionSetCreate,
  validateIdParam,
  validateQuestionSetUpdate,
} from '../middleware/validation';

const router = Router({ mergeParams: true });

// POST /api/folders/:folderId/questionsets
router.post('/', protect, validateQuestionSetCreate, createQuestionSet);

// GET /api/folders/:folderId/questionsets
router.get('/', protect, getQuestionSetsByFolder);

// GET /api/folders/:folderId/questionsets/:id
router.get('/:id', protect, validateIdParam, getQuestionSetById);

// PUT /api/folders/:folderId/questionsets/:id
router.put(
  '/:id',
  protect,
  validateIdParam, // Validates req.params.id (questionSetId)
  validateQuestionSetUpdate, // Validates req.body
  updateQuestionSet
);

// DELETE /api/folders/:folderId/questionsets/:id
router.delete('/:id', protect, validateIdParam, deleteQuestionSet);

export default router;
