// AI Blueprint Generator Routes
// Sprint 53: Blueprint-Centric Overhaul - Phase 4
//
// This file defines the API routes for automatic generation of learning blueprints
// from user content using advanced AI capabilities.

import { Router } from 'express';
import aiBlueprintGeneratorController from '../controllers/aiBlueprintGenerator.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ============================================================================
// BLUEPRINT GENERATION ROUTES
// ============================================================================

/**
 * POST /api/v1/ai/blueprint/generate
 * Generate a complete learning blueprint from user content with custom instructions
 * 
 * Request Body:
 * {
 *   "content": "string - The content to generate a blueprint from",
 *   "instructions": {
 *     "style": "concise|thorough|explorative",
 *     "focus": "understand|use|explore", 
 *     "difficulty": "beginner|intermediate|advanced",
 *     "targetAudience": "string - Target audience description",
 *     "customPrompts": ["array of custom prompts"],
 *     "includeExamples": boolean,
 *     "noteFormat": "bullet|paragraph|mindmap"
 *   },
 *   "sourceId": "string - Optional source identifier",
 *   "existingBlueprintId": "string - Optional existing blueprint to enhance"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "blueprint": { ... },
 *     "sections": [ ... ],
 *     "primitives": [ ... ],
 *     "questionFamilies": [ ... ],
 *     "generationMetadata": { ... }
 *   },
 *   "message": "Blueprint generated successfully"
 * }
 */
router.post('/generate', aiBlueprintGeneratorController.generateBlueprint);

/**
 * POST /api/v1/ai/blueprint/generate-simple
 * Generate a blueprint with simplified parameters
 * 
 * Request Body:
 * {
 *   "content": "string - The content to generate a blueprint from",
 *   "difficulty": "beginner|intermediate|advanced",
 *   "style": "concise|thorough|explorative"
 * }
 */
router.post('/generate-simple', aiBlueprintGeneratorController.generateBlueprintSimple);

/**
 * GET /api/v1/ai/blueprint/options
 * Get available generation options and their descriptions
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "styles": ["concise", "thorough", "explorative"],
 *     "focuses": ["understand", "use", "explore"],
 *     "difficulties": ["beginner", "intermediate", "advanced"],
 *     "noteFormats": ["bullet", "paragraph", "mindmap"],
 *     "examples": { ... },
 *     "focusDescriptions": { ... }
 *   }
 * }
 */
router.get('/options', aiBlueprintGeneratorController.getGenerationOptions);

// ============================================================================
// LEARNING PATHWAYS ROUTES
// ============================================================================

/**
 * POST /api/v1/ai/pathways/discover
 * Discover learning pathways based on user interests and goals
 * 
 * Request Body:
 * {
 *   "interests": ["array of user interests"],
 *   "targetSkills": ["array of target skills"],
 *   "timeAvailable": number - minutes available for learning,
 *   "difficulty": "beginner|intermediate|advanced"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "pathway": { ... },
 *       "relevanceScore": number,
 *       "estimatedTimeToComplete": number,
 *       "prerequisitesMet": number,
 *       "prerequisitesTotal": number,
 *       "skillGap": [ ... ],
 *       "confidence": number
 *     }
 *   ]
 * }
 */
router.post('/pathways/discover', aiBlueprintGeneratorController.discoverPathways);

/**
 * GET /api/v1/ai/pathways/:pathwayId/visualization
 * Get pathway visualization data for frontend rendering
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "nodes": [ ... ],
 *     "edges": [ ... ],
 *     "metadata": {
 *       "totalSteps": number,
 *       "estimatedTime": number,
 *       "difficulty": "beginner|intermediate|advanced",
 *       "progress": number
 *     }
 *   }
 * }
 */
router.get('/pathways/:pathwayId/visualization', aiBlueprintGeneratorController.getPathwayVisualization);

/**
 * GET /api/v1/ai/pathways/:pathwayId/analytics
 * Get detailed analytics for a learning pathway
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "pathwayId": "string",
 *     "userId": "string",
 *     "overallProgress": number,
 *     "timeSpent": number,
 *     "averageStepTime": number,
 *     "difficultyProgression": [ ... ],
 *     "learningEfficiency": { ... },
 *     "recommendations": { ... }
 *   }
 * }
 */
router.get('/pathways/:pathwayId/analytics', aiBlueprintGeneratorController.getPathwayAnalytics);

/**
 * POST /api/v1/ai/pathways/:pathwayId/progress
 * Update pathway progress for a specific step
 * 
 * Request Body:
 * {
 *   "stepId": "string - ID of the step to update",
 *   "action": "started|completed|paused|resumed",
 *   "metadata": {
 *     "timeSpent": number - minutes spent,
 *     "questionsAnswered": number,
 *     "notesReviewed": number,
 *     "difficulty": "string - perceived difficulty",
 *     "userFeedback": "string - optional user feedback"
 *   }
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "Pathway progress updated successfully"
 * }
 */
router.post('/pathways/:pathwayId/progress', aiBlueprintGeneratorController.updatePathwayProgress);

// ============================================================================
// ROUTE METADATA
// ============================================================================

/**
 * GET /api/v1/ai/blueprint
 * Get API information and available endpoints
 */
router.get('/', (req, res) => {
  res.json({
    name: 'AI Blueprint Generator API',
    version: '1.0.0',
    description: 'Automatic generation of learning blueprints using advanced AI',
    endpoints: {
      'POST /generate': 'Generate blueprint with custom instructions',
      'POST /generate-simple': 'Generate blueprint with simplified parameters',
      'GET /options': 'Get available generation options',
      'POST /pathways/discover': 'Discover learning pathways',
      'GET /pathways/:id/visualization': 'Get pathway visualization data',
      'GET /pathways/:id/analytics': 'Get pathway analytics',
      'POST /pathways/:id/progress': 'Update pathway progress'
    },
    features: [
      'AI-powered blueprint generation from content',
      'Comprehensive instruction system',
      'Learning pathway discovery and optimization',
      'Interactive pathway visualization',
      'Progress tracking and analytics',
      'Question family generation',
      'Adaptive difficulty adjustment'
    ],
    documentation: '/docs/ai-blueprint-generator'
  });
});

export default router;


