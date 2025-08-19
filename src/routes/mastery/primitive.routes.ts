import { Router } from 'express';
import { submitReview, toggleTracking, listPrimitives } from '../../controllers/mastery/primitive.controller';

const router = Router();

// Temporarily disabled - primitive-based SR is being redone
// TODO: Re-enable when new primitive-based SR is implemented

// Placeholder route to prevent 404
router.get('/status', (req, res) => {
  res.json({ message: 'Primitive routes temporarily disabled - being redone' });
});

export default router;
