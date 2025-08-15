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
import { noteSectionController } from '../controllers/blueprint-centric/noteSection.controller';

const router = Router();

// Protect all routes
router.use(protect);

// Legacy note routes (maintained for backward compatibility)
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

// Note section routes (new blueprint-centric functionality)
// GET /api/notes/by-section/:sectionId - Get notes by section
router.get('/by-section/:sectionId', noteSectionController.getNotesBySection);

// GET /api/notes/by-uue-stage/:stage - Get notes by UUE stage
router.get('/by-uue-stage/:stage', noteSectionController.getNotesByUueStage);

// POST /api/notes/:id/move-to-section/:sectionId - Move note to different section
router.post('/:id/move-to-section/:sectionId', noteSectionController.moveNoteToSection);

// GET /api/notes/section-hierarchy/:sectionId - Get note hierarchy within section
router.get('/section-hierarchy/:sectionId', noteSectionController.getNoteHierarchy);

// GET /api/notes/section-aggregation/:sectionId - Get aggregated notes for section
router.get('/section-aggregation/:sectionId', noteSectionController.getSectionAggregation);

// POST /api/notes/:id/update-section-position - Update note position within section
router.post('/:id/update-section-position', noteSectionController.updateNotePosition);

// GET /api/notes/section-statistics/:sectionId - Get statistics for notes in section
router.get('/section-statistics/:sectionId', noteSectionController.getSectionStatistics);

export default router; 