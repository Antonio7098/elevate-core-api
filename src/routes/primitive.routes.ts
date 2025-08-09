import { Router } from 'express';
import * as primitiveController from '../controllers/primitive.controller';
import { getDailyTasksPrimitive } from '../controllers/primitive.controller.fast-tasks';
import { protect } from '../middleware/auth.middleware';
import { cacheMiddleware, userSpecificKeyGenerator, primitiveSpecificKeyGenerator } from '../middleware/cache.middleware';

const router = Router();

// POST /api/primitives/review - Process review outcomes for primitives
router.post('/review', protect, primitiveController.submitReview);

// POST /api/primitives/:id/tracking - Toggle tracking for a primitive
router.post('/:id/tracking', protect, primitiveController.toggleTracking);

// GET /api/primitives/due - Fast daily tasks endpoint using cached denormalized data
router.get('/due', protect, cacheMiddleware({ 
  ttl: 300, // 5 minutes cache for daily tasks
  keyGenerator: userSpecificKeyGenerator 
}), getDailyTasksPrimitive);

// GET /api/primitives - List all primitives for a user
router.get('/', protect, cacheMiddleware({ 
  ttl: 180, // 3 minutes cache for primitive listing
  keyGenerator: userSpecificKeyGenerator 
}), primitiveController.listPrimitives);

// GET /api/primitives/:id/details - Get detailed information for a single primitive
router.get('/:id/details', protect, cacheMiddleware({ 
  ttl: 600, // 10 minutes cache for primitive details
  keyGenerator: primitiveSpecificKeyGenerator 
}), primitiveController.getPrimitiveDetails);

// POST /api/primitives/:id/tracking-intensity - Set tracking intensity for a primitive
router.post('/:id/tracking-intensity', protect, primitiveController.setTrackingIntensity);

// GET /api/primitives/:id/tracking-intensity - Get tracking intensity for a primitive
router.get('/:id/tracking-intensity', protect, primitiveController.getTrackingIntensity);

// DELETE /api/primitives/:id/tracking-intensity - Reset tracking intensity to default (NORMAL)
router.delete('/:id/tracking-intensity', protect, primitiveController.deleteTrackingIntensity);

export default router;
