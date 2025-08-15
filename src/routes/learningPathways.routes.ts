import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { masteryCriterionController } from '../controllers/blueprint-centric/masteryCriterion.controller';
import { knowledgeGraphController } from '../controllers/blueprint-centric/knowledgeGraph.controller';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/learning-pathways:
 *   tags: [Learning Pathways]
 *   description: Learning pathway discovery and management endpoints
 */

// Learning pathway discovery
// GET /api/learning-pathways/discover/:userId - Discover learning pathways for user
router.get('/discover/:userId', knowledgeGraphController.discoverLearningPathways);

// GET /api/learning-pathways/recommended/:userId - Get recommended learning paths
router.get('/recommended/:userId', knowledgeGraphController.getRecommendedPathways);

// GET /api/learning-pathways/from-criterion/:criterionId - Get pathways starting from a criterion
router.get('/from-criterion/:criterionId', knowledgeGraphController.getPathwaysFromCriterion);

// GET /api/learning-pathways/to-criterion/:criterionId - Get pathways leading to a criterion
router.get('/to-criterion/:criterionId', knowledgeGraphController.getPathwaysToCriterion);

// GET /api/learning-pathways/optimal/:userId/:targetCriterionId - Get optimal path to target
router.get('/optimal/:userId/:targetCriterionId', knowledgeGraphController.getOptimalPathway);

// Learning pathway analysis
// GET /api/learning-pathways/analysis/:pathwayId - Analyze a specific learning pathway
router.get('/analysis/:pathwayId', knowledgeGraphController.analyzePathway);

// GET /api/learning-pathways/complexity/:pathwayId - Get complexity analysis for pathway
router.get('/complexity/:pathwayId', knowledgeGraphController.getPathwayComplexity);

// GET /api/learning-pathways/prerequisites/:criterionId - Get prerequisite analysis
router.get('/prerequisites/:criterionId', knowledgeGraphController.getPrerequisites);

// Learning pathway management
// POST /api/learning-pathways/create - Create a custom learning pathway
router.post('/create', knowledgeGraphController.createCustomPathway);

// PUT /api/learning-pathways/:pathwayId - Update a learning pathway
router.put('/:pathwayId', knowledgeGraphController.updatePathway);

// DELETE /api/learning-pathways/:pathwayId - Delete a learning pathway
router.delete('/:pathwayId', knowledgeGraphController.deletePathway);

// GET /api/learning-pathways/user/:userId - Get user's custom pathways
router.get('/user/:userId', knowledgeGraphController.getUserPathways);

// Learning pathway progress tracking
// GET /api/learning-pathways/progress/:pathwayId/:userId - Get progress on a pathway
router.get('/progress/:pathwayId/:userId', knowledgeGraphController.getPathwayProgress);

// POST /api/learning-pathways/:pathwayId/start/:userId - Start a learning pathway
router.post('/:pathwayId/start/:userId', knowledgeGraphController.startPathway);

// POST /api/learning-pathways/:pathwayId/complete/:userId - Mark pathway as complete
router.post('/:pathwayId/complete/:userId', knowledgeGraphController.completePathway);

export default router;
