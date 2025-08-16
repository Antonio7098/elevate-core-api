import { Router } from 'express';
import { protect } from '../../middleware/auth.middleware';
import primitiveAIController from '../../controllers/ai/primitiveAI.controller';

const router = Router();

/**
 * @swagger
 * /api/ai/primitives/from-source:
 *   post:
 *     summary: Create knowledge primitives directly from source text
 *     tags: [AI, Primitives]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sourceText
 *             properties:
 *               sourceText:
 *                 type: string
 *                 description: The source text to generate primitives from
 *                 maxLength: 50000
 *               title:
 *                 type: string
 *                 description: Optional title for the content
 *               description:
 *                 type: string
 *                 description: Optional description of the content
 *               subjectArea:
 *                 type: string
 *                 description: Subject area classification
 *     responses:
 *       201:
 *         description: Successfully created primitives from source text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     primitives:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalPrimitives:
 *                       type: number
 *                     totalCriteria:
 *                       type: number
 *                     totalQuestions:
 *                       type: number
 *                     processingTimeMs:
 *                       type: number
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Failed to create primitives
 */
router.post('/from-source', protect, primitiveAIController.createPrimitivesFromSource);

/**
 * @swagger
 * /api/ai/primitives/from-blueprint:
 *   post:
 *     summary: Generate primitives from an existing learning blueprint
 *     tags: [AI, Primitives]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - blueprintId
 *             properties:
 *               blueprintId:
 *                 type: number
 *                 description: ID of the learning blueprint
 *               maxPrimitives:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 5
 *                 description: Maximum number of primitives to generate
 *               focusAreas:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Specific areas to focus on
 *     responses:
 *       201:
 *         description: Successfully generated primitives from blueprint
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Blueprint not found or access denied
 *       500:
 *         description: Failed to generate primitives
 */
router.post('/from-blueprint', protect, primitiveAIController.generatePrimitivesFromBlueprint);

/**
 * @swagger
 * /api/ai/primitives/{primitiveId}/enhance:
 *   post:
 *     summary: Enhance an existing primitive with additional criteria or questions
 *     tags: [AI, Primitives]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: primitiveId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the primitive to enhance
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enhancementType:
 *                 type: string
 *                 enum: [criteria, questions, both]
 *                 default: both
 *                 description: Type of enhancement to perform
 *     responses:
 *       200:
 *         description: Successfully enhanced primitive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     primitive:
 *                       type: object
 *                     enhancementType:
 *                       type: string
 *                     totalCriteria:
 *                       type: number
 *                     totalQuestions:
 *                       type: number
 *                     processingTimeMs:
 *                       type: number
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Primitive not found or access denied
 *       500:
 *         description: Failed to enhance primitive
 */
router.post('/:primitiveId/enhance', protect, primitiveAIController.enhancePrimitive);

/**
 * @swagger
 * /api/ai/primitives/stats:
 *   get:
 *     summary: Get AI generation statistics for the authenticated user
 *     tags: [AI, Primitives, Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved generation statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalPrimitives:
 *                       type: number
 *                     totalCriteria:
 *                       type: number
 *                     totalQuestions:
 *                       type: number
 *                     subjectAreaDistribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           subjectArea:
 *                             type: string
 *                           count:
 *                             type: number
 *                     recentPrimitives:
 *                       type: array
 *                       items:
 *                         type: object
 *                     averageCriteriaPerPrimitive:
 *                       type: string
 *                     averageQuestionsPerPrimitive:
 *                       type: string
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Failed to retrieve statistics
 */
router.get('/stats', protect, primitiveAIController.getGenerationStats);

/**
 * @swagger
 * /api/ai/primitives/batch-create:
 *   post:
 *     summary: Batch create primitives from multiple source texts
 *     tags: [AI, Primitives]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sources
 *             properties:
 *               sources:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: object
 *                   required:
 *                     - sourceText
 *                   properties:
 *                     sourceText:
 *                       type: string
 *                       maxLength: 50000
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     subjectArea:
 *                       type: string
 *     responses:
 *       201:
 *         description: Successfully processed batch creation request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalSources:
 *                           type: number
 *                         successfulSources:
 *                           type: number
 *                         failedSources:
 *                           type: number
 *                         totalPrimitives:
 *                           type: number
 *                         totalCriteria:
 *                           type: number
 *                         totalQuestions:
 *                           type: number
 *                         processingTimeMs:
 *                           type: number
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: User not authenticated
 *       500:
 *         description: Failed to batch create primitives
 */
router.post('/batch-create', protect, primitiveAIController.batchCreatePrimitives);

export default router;
