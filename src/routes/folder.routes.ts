// src/routes/folder.routes.ts
import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { validateFolderCreate, validateFolderUpdate } from '../middleware/validation';
import { createFolder, getFolders, getFolderById, updateFolder, deleteFolder } from '../controllers/folder.controller.ts'; 
import questionSetRoutes from './questionset.routes';

const router = Router();

// POST /api/folders - Create a new folder
router.post('/', protect, ...validateFolderCreate, createFolder);

// GET /api/folders - Get all folders for the authenticated user
router.get('/', protect, getFolders);

// GET /api/folders/:id - Get a single folder by ID
router.get('/:id', protect, getFolderById);

// PUT /api/folders/:id - Update a folder by ID
router.put('/:id', protect, ...validateFolderUpdate, updateFolder);

// DELETE /api/folders/:id - Delete a folder by ID
router.delete('/:id', protect, deleteFolder);

// Nested routes for question sets within a folder
router.use('/:folderId/questionsets', questionSetRoutes);

export default router;
