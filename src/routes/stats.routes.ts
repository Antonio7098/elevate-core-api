import { Router } from 'express';
import * as statsController from '../controllers/stats.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /stats/questionsets/{setId}/details:
 *   get:
 *     summary: Get mastery history and spaced repetition details for a specific question set.
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: setId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the question set.
 *     responses:
 *       200:
 *         description: Successfully retrieved question set statistics details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 masteryHistory: 
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp: { type: string, format: date-time }
 *                       totalMasteryScore: { type: number }
 *                       understandScore: { type: number }
 *                       useScore: { type: number }
 *                       exploreScore: { type: number }
 *                       intervalDays: { type: number, nullable: true }
 *                 reviewCount: { type: integer }
 *                 reviewDates: { type: array, items: { type: string, format: date-time } }
 *                 currentSRStatus:
 *                   type: object
 *                   properties:
 *                     lastReviewedAt: { type: string, format: date-time, nullable: true }
 *                     nextReviewAt: { type: string, format: date-time, nullable: true }
 *                     currentIntervalDays: { type: number, nullable: true }
 *                     currentForgottenPercentage: { type: number, nullable: true }
 *                     forgettingCurveParams: { type: object, nullable: true, description: 'Structure depends on implementation' }
 *       400:
 *         description: Invalid QuestionSet ID format.
 *       401:
 *         description: User not authenticated.
 *       403:
 *         description: User does not have access to this QuestionSet.
 *       404:
 *         description: QuestionSet not found.
 */
router.get('/questionsets/:setId/details', protect, statsController.getQuestionSetStatsDetails);

/**
 * @swagger
 * /stats/folders/{folderId}/details:
 *   get:
 *     summary: Get mastery history and other statistics for a specific folder.
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: folderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the folder.
 *     responses:
 *       200:
 *         description: Successfully retrieved folder statistics details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 masteryHistory: 
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       timestamp: { type: string, format: date-time }
 *                       aggregatedScore: { type: number }
 *                 totalReviewSessionsInFolder: { type: integer }
 *                 questionSetSummaries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       name: { type: string }
 *                       currentTotalMasteryScore: { type: number, nullable: true }
 *                       nextReviewAt: { type: string, format: date-time, nullable: true }
 *       400:
 *         description: Invalid Folder ID format.
 *       401:
 *         description: User not authenticated.
 *       403:
 *         description: User does not have access to this Folder.
 *       404:
 *         description: Folder not found.
 */
router.get('/folders/:folderId/details', protect, statsController.getFolderStatsDetails);

export default router;
