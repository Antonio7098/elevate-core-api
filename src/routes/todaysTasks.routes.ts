import { Router } from 'express';
import { getTodaysTasksController } from '../controllers/todaysTasks.controller';
import { protect } from '../middleware/auth.middleware'; // Corrected import name

const router = Router();

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
router.get('/', protect, getTodaysTasksController); // Used correct middleware name

export default router;
