import { Router } from 'express';
import * as userBucketPreferencesController from '../controllers/userBucketPreferences.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// Bucket preferences management
router.get('/bucket-preferences', userBucketPreferencesController.getBucketPreferences);
router.patch('/bucket-preferences', userBucketPreferencesController.updateBucketPreferences);

export default router;
