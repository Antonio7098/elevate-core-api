import { Router } from 'express';
import { UserMemoryController } from '../controllers/userMemory.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// GET /api/user/memory - Get user's memory
router.get('/', UserMemoryController.getUserMemory);

// PUT /api/user/memory - Update user's memory
router.put('/', UserMemoryController.updateUserMemory);

export default router; 