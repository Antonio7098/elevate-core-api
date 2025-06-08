import { Router } from 'express';
import * as statsController from '../controllers/stats.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /reviews/stats:
 *   get:
 *     summary: Get overall study statistics for the authenticated user.
 *     tags: [Stats, Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved overall statistics.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OverallStats'
 *       401:
 *         description: User not authenticated.
 *       404:
 *         description: User not found.
 */
router.get('/reviews/stats', protect, statsController.getOverallStats);

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

/**
 * @swagger
 * components:
 *   schemas:
 *     OverallStats:
 *       type: object
 *       properties:
 *         masteryScore: { type: number, description: "Overall average mastery score (0-100)" }
 *         understandScore: { type: number, description: "Overall average Understand Score (0-100)" }
 *         useScore: { type: number, description: "Overall average Use Score (0-100)" }
 *         exploreScore: { type: number, description: "Overall average Explore Score (0-100)" }
 *         totalSets: { type: integer, description: "Total number of question sets" }
 *         masteredSets: { type: integer, description: "Number of sets with mastery >= 90%" }
 *         inProgressSets: { type: integer, description: "Number of sets with 0% < mastery < 90%" }
 *         notStartedSets: { type: integer, description: "Number of sets with 0% mastery" }
 *         dueSets: { type: integer, description: "Number of sets currently due for review" }
 *         masteryHistory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               timestamp: { type: string, format: date-time }
 *               score: { type: number }
 *           description: "Aggregated mastery history (currently returns empty array)"
 */
export default router;
