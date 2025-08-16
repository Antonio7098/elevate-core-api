import { Router } from 'express';
import { enhancedTodaysTasksController } from '../../controllers/blueprint-centric/enhancedTodaysTasks.controller';
import { protect } from '../../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/todays-tasks:
 *   get:
 *     summary: Get today's prioritized tasks for the authenticated user.
 *     tags: [Today's Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mockToday
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Optional. A specific date to simulate as 'today' for testing purposes (ISO 8601 format).
 *     responses:
 *       200:
 *         description: A list of prioritized tasks for the user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TodaysTasksResponse'
 *       401:
 *         description: Unauthorized - User not authenticated.
 *       500:
 *         description: Internal server error.
 */
router.get('/', enhancedTodaysTasksController.getTodaysTasks);

// Enhanced task generation routes
router.get('/capacity-analysis', enhancedTodaysTasksController.getCapacityAnalysis);
router.post('/generate-more', enhancedTodaysTasksController.generateMoreTasks);
router.get('/tasks-for-section/:sectionId', enhancedTodaysTasksController.getTasksForSection);
router.get('/tasks-for-uue-stage/:stage', enhancedTodaysTasksController.getTasksForUueStage);
router.post('/complete-task/:taskId', enhancedTodaysTasksController.completeTask);

export default router;
