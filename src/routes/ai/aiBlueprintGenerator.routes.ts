// AI Blueprint Generator Routes
// Sprint 53: Blueprint-Centric Overhaul - Phase 4
//
// This file defines the API routes for automatic generation of learning blueprints
// from user content using advanced AI capabilities.

import { Router } from 'express';
import { generateBlueprint, generateQuestions, generateNotes } from '../../controllers/ai/aiBlueprintGenerator.controller';
import { protect } from '../../middleware/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// ============================================================================
// BLUEPRINT GENERATION ROUTES
// ============================================================================

/**
 * POST /api/v1/ai/blueprint/generate
 * Generate a complete learning blueprint from user content with custom instructions
 */
router.post('/generate', generateBlueprint);

/**
 * POST /api/v1/ai/blueprint/generate-simple
 * Generate a blueprint with simplified parameters
 */
router.post('/generate-simple', generateBlueprint);

/**
 * GET /api/v1/ai/blueprint/options
 * Get available generation options and their descriptions
 */
router.get('/options', generateBlueprint);

// ============================================================================
// LEARNING PATHWAYS ROUTES
// ============================================================================

/**
 * POST /api/v1/ai/pathways/discover
 * Discover learning pathways based on user interests and goals
 */
router.post('/pathways/discover', generateBlueprint);

/**
 * GET /api/v1/ai/pathways/:pathwayId/visualization
 * Get pathway visualization data
 */
router.get('/pathways/:pathwayId/visualization', generateBlueprint);

/**
 * GET /api/v1/ai/pathways/:pathwayId/analytics
 * Get pathway analytics and progress data
 */
router.get('/pathways/:pathwayId/analytics', generateBlueprint);

/**
 * POST /api/v1/ai/pathways/:pathwayId/progress
 * Update pathway progress
 */
router.post('/pathways/:pathwayId/progress', generateBlueprint);

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


