import express from 'express';
import dashboardController from '../../controllers/core/dashboard.controller';
import { protect } from '../../middleware/auth.middleware'; // Assuming 'protect' middleware is here

const router = express.Router();

// GET /api/dashboard - Protected route
router.get('/', protect, dashboardController.getDashboardData);

export default router;
