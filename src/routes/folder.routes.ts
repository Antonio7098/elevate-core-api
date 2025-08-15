// src/routes/folder.routes.ts - Updated for blueprint-centric architecture
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { validateFolderCreate, validateFolderUpdate, validateSectionCreate, validateSectionUpdate, validateSectionMove } from '../middleware/validation';
import { blueprintSectionController } from '../controllers/blueprint-centric/blueprintSection.controller';
import { createFolder, getFolders, getFolderById, updateFolder, deleteFolder, pinFolder } from '../controllers/folder.controller'; 
import { getAllQuestionsInFolder, getAllNotesInFolder } from '../controllers/recursiveFolder.controller';
import questionsetRouter from './questionset.routes';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// Legacy folder routes (maintained for backward compatibility)
// POST /api/folders - Create a new folder
router.post('/', ...validateFolderCreate, createFolder);

// GET /api/folders - Get all folders for the authenticated user
router.get('/', getFolders);

// GET /api/folders/tree - Get folders in tree structure (alias for GET / with tree=true)
router.get('/tree', getFolders);

// GET /api/folders/:id - Get a single folder by ID
router.get('/:id', getFolderById);

// PUT /api/folders/:id - Update a folder by ID
router.put('/:id', ...validateFolderUpdate, updateFolder);

// DELETE /api/folders/:id - Delete a folder by ID
router.delete('/:id', deleteFolder);

// GET /api/folders/:folderId/all-questions - Get all questions in folder tree
router.get('/:folderId/all-questions', getAllQuestionsInFolder);

// GET /api/folders/:folderId/all-notes - Get all notes in folder tree
router.get('/:folderId/all-notes', getAllNotesInFolder);

// Mount the questionset router for paths like /api/folders/:folderId/questionsets
router.use('/:folderId/questionsets', questionsetRouter);

// PUT /api/folders/:folderId/pin - Pin/unpin a folder
router.put('/:folderId/pin', pinFolder);

// Blueprint section routes (new blueprint-centric functionality)
// POST /api/folders/section - Create a new blueprint section
router.post('/section', ...validateSectionCreate, blueprintSectionController.createSection);

// GET /api/folders/section/:id - Get a blueprint section by ID
router.get('/section/:id', blueprintSectionController.getSection);

// PUT /api/folders/section/:id - Update a blueprint section
router.put('/section/:id', ...validateSectionUpdate, blueprintSectionController.updateSection);

// DELETE /api/folders/section/:id - Delete a blueprint section
router.delete('/section/:id', blueprintSectionController.deleteSection);

// GET /api/folders/section-tree/:blueprintId - Get section tree for a blueprint
router.get('/section-tree/:blueprintId', blueprintSectionController.getSectionTree);

// POST /api/folders/section/:id/move - Move a section within the hierarchy
router.post('/section/:id/move', ...validateSectionMove, blueprintSectionController.moveSection);

// GET /api/folders/section/:id/stats - Get statistics for a section
router.get('/section/:id/stats', blueprintSectionController.getSectionStats);

// POST /api/folders/section/:id/reorder - Reorder sections within the same level
router.post('/section/:id/reorder', ...validateSectionMove, blueprintSectionController.reorderSections);

// GET /api/folders/section/:id/content - Get content for a section
router.get('/section/:id/content', blueprintSectionController.getSectionContent);

// GET /api/folders/section/:id/uue-progress - Get UUE stage progress for a section
router.get('/section/:id/uue-progress', blueprintSectionController.getUueStageProgress);

export default router;
