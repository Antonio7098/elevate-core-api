import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/uue-stage-progression:
 *   tags: [UUE Stage Progression]
 *   description: UUE stage progression management endpoints
 */

// Temporarily disabled - UUE stage methods not implemented yet
// TODO: Re-enable when UUE stage progression is properly implemented

// Placeholder route to prevent 404
router.get('/status', (req, res) => {
  res.json({ message: 'UUE stage progression routes temporarily disabled - being implemented' });
});

export default router;
