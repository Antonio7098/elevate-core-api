import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Protect all routes
router.use(protect);

// Temporarily disabled - legacy note routes being reworked
// TODO: Re-enable when note system is properly aligned with new architecture

// Placeholder route to prevent 404
router.get('/status', (req, res) => {
  res.json({ message: 'Note routes temporarily disabled - being reworked' });
});

export default router; 