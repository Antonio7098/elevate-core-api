import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import {
  createInsightCatalyst,
  getInsightCatalysts,
  getInsightCatalystById,
  updateInsightCatalyst,
  deleteInsightCatalyst,
} from '../controllers/insightCatalyst.controller';

const router = Router();

// Protect all routes
router.use(protect);

// POST /api/insight-catalysts - Create a new insight catalyst
router.post('/', createInsightCatalyst);

// GET /api/insight-catalysts - Get all insight catalysts (optionally filtered by noteId or questionId)
router.get('/', getInsightCatalysts);

// GET /api/insight-catalysts/:id - Get a specific insight catalyst
router.get('/:id', getInsightCatalystById);

// PUT /api/insight-catalysts/:id - Update an insight catalyst
router.put('/:id', updateInsightCatalyst);

// DELETE /api/insight-catalysts/:id - Delete an insight catalyst
router.delete('/:id', deleteInsightCatalyst);

export default router; 