import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import { createPrimitivesFromSource, generatePrimitivesFromBlueprint, enhancePrimitive } from '../../controllers/ai/primitiveAI.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// ============================================================================
// PRIMITIVE GENERATION ROUTES
// ============================================================================

/**
 * POST /api/ai/primitives/from-source
 * Create knowledge primitives directly from source text
 */
router.post('/from-source', createPrimitivesFromSource);

/**
 * POST /api/ai/primitives/from-blueprint
 * Generate primitives from an existing learning blueprint
 */
router.post('/from-blueprint', generatePrimitivesFromBlueprint);

/**
 * POST /api/ai/primitives/:primitiveId/enhance
 * Enhance an existing primitive with additional criteria or questions
 */
router.post('/:primitiveId/enhance', enhancePrimitive);

/**
 * GET /api/ai/primitives/stats
 * Get AI generation statistics for the authenticated user
 */
router.get('/stats', createPrimitivesFromSource);

/**
 * POST /api/ai/primitives/batch-create
 * Batch create primitives from multiple sources
 */
router.post('/batch-create', createPrimitivesFromSource);

export default router;
