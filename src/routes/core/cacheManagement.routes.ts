import { Router } from 'express';
import * as cacheManagementController from '../../controllers/core/cacheManagement.controller';
import { protect } from '../../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// Cache statistics and management
router.get('/stats', cacheManagementController.getCacheStats);
router.post('/clear', cacheManagementController.clearCache);
router.post('/refresh-summaries', cacheManagementController.refreshSummaries);
router.post('/maintenance', cacheManagementController.performMaintenance);

export default router;
