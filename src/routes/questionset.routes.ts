import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import questionRouter from './question.routes';
import { 
  getQuestionSetsByFolder, 
  getQuestionSetById, 
  createQuestionSet, 
  updateQuestionSet, 
  deleteQuestionSet, 
  pinQuestionSet 
} from '../controllers/questionset.controller';
import { validateQuestionSetCreate, validateQuestionSetUpdate } from '../middleware/validation';

const router = Router({ mergeParams: true }); // mergeParams is crucial for :folderId

// Protect all routes related to question sets (and their questions)
router.use(protect);

// GET /api/folders/:folderId/questionsets - Get all question sets in a folder
router.get('/', getQuestionSetsByFolder);

// GET /api/folders/:folderId/questionsets/:id - Get a specific question set
router.get('/:id', getQuestionSetById);

// POST /api/folders/:folderId/questionsets - Create a new question set
router.post('/', validateQuestionSetCreate, createQuestionSet);

// PUT /api/folders/:folderId/questionsets/:id - Update a question set
router.put('/:id', validateQuestionSetUpdate, updateQuestionSet);

// DELETE /api/folders/:folderId/questionsets/:id - Delete a question set
router.delete('/:id', deleteQuestionSet);

// PUT /api/folders/:folderId/questionsets/:setId/pin - Pin/unpin a question set
router.put('/:setId/pin', pinQuestionSet);

// Mount the questionRouter for paths like /api/folders/:folderId/questionsets/:setId/questions
router.use('/:setId/questions', questionRouter);

export default router;
