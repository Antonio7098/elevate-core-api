// src/routes/user.routes.ts
import { Router } from 'express';
import { getMyProfile } from '../controllers/user.controller'; // Ensure this path is correct
import { protect } from '../middleware/auth.middleware';

const router = Router();

// This route is protected by our 'protect' middleware
router.get('/profile', protect, getMyProfile);

export default router;
