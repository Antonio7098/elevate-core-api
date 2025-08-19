import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// Temporarily disabled - legacy question routes being reworked
// TODO: Re-enable when question system is properly aligned with new architecture

// Placeholder route to prevent 404
router.get('/status', (req, res) => {
  res.json({ message: 'Question routes temporarily disabled - being reworked' });
});

export default router;
