import { Router } from 'express';
import * as statsController from '../controllers/stats.controller';
import { protect } from '../middleware/auth.middleware';
import { blueprintSectionController } from '../controllers/blueprint-centric/blueprintSection.controller';
import { masteryCriterionController } from '../controllers/blueprint-centric/masteryCriterion.controller';

const router = Router();

/**
 * @swagger
 * /stats/overview:
 *   get:
 *     summary: Get overall user progress statistics (primitive-centric).
 *     tags: [Stats, Primitives]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved overall statistics.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProgressStats'
 *       401:
 *         description: User not authenticated.
 */
router.get('/overview', protect, statsController.getOverallStats);

/**
 * @swagger
 * /stats/mastery:
 *   get:
 *     summary: Get primitive mastery distribution statistics.
 *     tags: [Stats, Primitives]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved mastery statistics.
 *       401:
 *         description: User not authenticated.
 */
router.get('/mastery', protect, statsController.getMasteryStats);

/**
 * @swagger
 * /stats/activity:
 *   get:
 *     summary: Get review activity statistics.
 *     tags: [Stats, Primitives]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved activity statistics.
 *       401:
 *         description: User not authenticated.
 */
router.get('/activity', protect, statsController.getActivityStats);

/**
 * @swagger
 * /stats/daily-completion:
 *   get:
 *     summary: Get daily task completion statistics.
 *     tags: [Stats, Primitives]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved daily completion statistics.
 *       401:
 *         description: User not authenticated.
 */
router.get('/daily-completion', protect, statsController.getDailyCompletionStats);

/**
 * @swagger
 * /stats/primitives/{primitiveId}:
 *   get:
 *     summary: Get detailed statistics for a specific primitive.
 *     tags: [Stats, Primitives]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: primitiveId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the primitive.
 *     responses:
 *       200:
 *         description: Successfully retrieved primitive statistics details.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 primitive:
 *                   type: object
 *                   description: Basic primitive information
 *                 mastery:
 *                   type: object
 *                   properties:
 *                     weightedScore: { type: number }
 *                     totalCriteria: { type: number }
 *                     masteredCriteria: { type: number }
 *                     criteriaBreakdown: { type: array }
 *                 reviewHistory:
 *                   type: object
 *                   properties:
 *                     totalReviews: { type: number }
 *                     successfulReviews: { type: number }
 *                     lastReviewedAt: { type: string, format: date-time, nullable: true }
 *                     nextReviewAt: { type: string, format: date-time, nullable: true }
 *                     currentInterval: { type: number }
 *       400:
 *         description: Invalid Primitive ID format.
 *       401:
 *         description: User not authenticated.
 *       404:
 *         description: Primitive not found.
 */
router.get('/primitives/:primitiveId', protect, statsController.getPrimitiveStatsDetails);

// DEPRECATED: Folder-based stats endpoint - returns 410 Gone
/**
 * @swagger
 * /stats/folders/{folderId}/details:
 *   get:
 *     summary: '[DEPRECATED] Folder statistics have been replaced with primitive-centric stats'
 *     tags: [Stats, Deprecated]
 *     deprecated: true
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
 *       410:
 *         description: This endpoint has been deprecated. Use primitive-centric stats instead.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string, example: 'This endpoint has been deprecated' }
 *                 message: { type: string }
 *                 alternatives: { type: array, items: { type: string } }
 */
router.get('/folders/:folderId/details', protect, statsController.getFolderStatsDetails);

// Section-based stats routes (new blueprint-centric functionality)
/**
 * @swagger
 * /stats/sections/{sectionId}:
 *   get:
 *     summary: Get detailed statistics for a specific blueprint section
 *     tags: [Stats, Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the section
 *     responses:
 *       200:
 *         description: Successfully retrieved section statistics
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Section not found
 */
router.get('/sections/:sectionId', blueprintSectionController.getSectionStats);

/**
 * @swagger
 * /stats/sections/{sectionId}/uue-progress:
 *   get:
 *     summary: Get UUE stage progression statistics for a specific section
 *     tags: [Stats, Sections, UUE]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the section
 *     responses:
 *       200:
 *         description: Successfully retrieved section UUE progress statistics
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Section not found
 */
router.get('/sections/:sectionId/uue-progress', masteryCriterionController.getSectionUueProgress);

/**
 * @swagger
 * /stats/blueprints/{blueprintId}/sections:
 *   get:
 *     summary: Get aggregated statistics for all sections in a blueprint
 *     tags: [Stats, Blueprints, Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: blueprintId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the blueprint
 *     responses:
 *       200:
 *         description: Successfully retrieved blueprint section statistics
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Blueprint not found
 */
router.get('/blueprints/:blueprintId/sections', blueprintSectionController.getUserContentStats);

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
