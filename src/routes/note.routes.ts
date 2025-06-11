import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { validateNoteCreate, validateNoteUpdate } from '../middleware/validation';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} from '../controllers/note.controller';

const router = Router();

// Protect all routes
router.use(protect);

// POST /api/notes - Create a new note
router.post('/', validateNoteCreate, createNote);

// GET /api/notes - Get all notes (optionally filtered by folderId or questionSetId)
router.get('/', getNotes);

// GET /api/notes/:id - Get a specific note
router.get('/:id', getNoteById);

// PUT /api/notes/:id - Update a note
router.put('/:id', validateNoteUpdate, updateNote);

// DELETE /api/notes/:id - Delete a note
router.delete('/:id', deleteNote);

export default router; 