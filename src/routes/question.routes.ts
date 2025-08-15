import { Router } from 'express';
import { getQuestionsBySet, createQuestion, getQuestionById, updateQuestion, deleteQuestion } from '../controllers/question.controller';
import { questionInstanceController } from '../controllers/blueprint-centric/questionInstance.controller';
import { validateSetIdParams, validateQuestionCreate, validateQuestionId, validateQuestionUpdate, validateQuestionInstance, validateQuestionInstanceParams } from '../middleware/validation';
import { protect } from '../middleware/auth.middleware';

// This router will be mounted under /:setId/questions,
// so mergeParams is true to get :setId from the parent (questionsetRouter)
// and :folderId from its parent (folderRouter)
const router = Router({ mergeParams: true });

// Apply authentication middleware to all routes
router.use(protect);

// Legacy question routes (maintained for backward compatibility)
// GET /api/folders/:folderId/questionsets/:setId/questions
router.get('/', validateSetIdParams, getQuestionsBySet);

// POST /api/folders/:folderId/questionsets/:setId/questions
router.post('/', validateSetIdParams, validateQuestionCreate, createQuestion);

// GET /api/folders/:folderId/questionsets/:setId/questions/:id
router.get('/:id', validateSetIdParams, validateQuestionId, getQuestionById);

// PUT /api/folders/:folderId/questionsets/:setId/questions/:id
router.put('/:id', validateSetIdParams, validateQuestionId, validateQuestionUpdate, updateQuestion);

// DELETE /api/folders/:folderId/questionsets/:setId/questions/:id
router.delete('/:id', validateSetIdParams, validateQuestionId, deleteQuestion);

// Question instance routes (new blueprint-centric functionality)
// GET /api/folders/:folderId/questionsets/:setId/questions/instances/by-criterion/:criterionId
router.get('/instances/by-criterion/:criterionId', validateQuestionInstanceParams, questionInstanceController.getQuestionsByCriterion);

// GET /api/folders/:folderId/questionsets/:setId/questions/instances/by-uue-stage/:stage
router.get('/instances/by-uue-stage/:stage', validateQuestionInstanceParams, questionInstanceController.getQuestionsByUueStage);

// GET /api/folders/:folderId/questionsets/:setId/questions/instances/by-difficulty/:difficulty
router.get('/instances/by-difficulty/:difficulty', validateQuestionInstanceParams, questionInstanceController.getQuestionsByDifficulty);

// POST /api/folders/:folderId/questionsets/:setId/questions/instances/:id/validate
router.post('/instances/:id/validate', questionInstanceController.validateQuestionInstance);

// GET /api/folders/:folderId/questionsets/:setId/questions/instances/search
router.get('/instances/search', questionInstanceController.searchQuestionInstances);

// GET /api/folders/:folderId/questionsets/:setId/questions/instances/by-section/:sectionId
router.get('/instances/by-section/:sectionId', validateQuestionInstanceParams, questionInstanceController.getQuestionsBySection);

// GET /api/folders/:folderId/questionsets/:setId/questions/instances/stats
router.get('/instances/stats', questionInstanceController.getUserQuestionStats);

export default router;
