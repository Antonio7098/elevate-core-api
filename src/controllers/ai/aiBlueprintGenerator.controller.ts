// AI Blueprint Generator Controller
// Sprint 53: Blueprint-Centric Overhaul - Phase 4
//
// This controller handles API endpoints for automatic generation of learning blueprints
// from user content using advanced AI capabilities.

import { Request, Response } from 'express';
import { AIBlueprintGeneratorService } from '../../services/ai/aiBlueprintGenerator.service';
import { LearningPathwaysService } from '../../services/mastery/learningPathways.service';
import { 
  AIBlueprintGenerationRequest,
  GenerationInstructions,
  GenerationStyle,
  GenerationFocus,
  GenerationDifficulty,
  NoteFormat
} from '../../types/aiGeneration.types';
import { PathwayDiscoveryRequest, PathwayDifficulty } from '../../types/learningPathways.types';

export class AIBlueprintGeneratorController {
  private aiBlueprintGeneratorService: AIBlueprintGeneratorService;
  private learningPathwaysService: LearningPathwaysService;

  constructor() {
    this.aiBlueprintGeneratorService = new AIBlueprintGeneratorService();
    this.learningPathwaysService = new LearningPathwaysService();
  }

  /**
   * Generate a complete learning blueprint from user content
   * POST /api/v1/ai/blueprint/generate
   */
  async generateBlueprint(req: Request, res: Response): Promise<void> {
    try {
      const { content, instructions, sourceId, existingBlueprintId } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!content || !instructions) {
        res.status(400).json({ 
          error: 'Missing required fields: content and instructions are required' 
        });
        return;
      }

      // Validate instructions
      const validationError = this.validateInstructions(instructions);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      // Create generation request
      const request: AIBlueprintGenerationRequest = {
        content,
        instructions,
        userId: userId.toString(),
        sourceId,
        existingBlueprintId
      };

      // Generate blueprint
      const result = await this.aiBlueprintGeneratorService.generateFromContent(request);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Blueprint generated successfully'
      });

    } catch (error: any) {
      console.error('Error generating blueprint:', error);
      res.status(500).json({
        error: 'Failed to generate blueprint',
        details: error.message
      });
    }
  }

  /**
   * Generate blueprint with default instructions
   * POST /api/v1/ai/blueprint/generate-simple
   */
  async generateBlueprintSimple(req: Request, res: Response): Promise<void> {
    try {
      const { content, difficulty = 'intermediate', style = 'thorough' } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!content) {
        res.status(400).json({ error: 'Content is required' });
        return;
      }

      // Create default instructions
      const instructions: GenerationInstructions = {
        style: this.mapStyle(style),
        focus: GenerationFocus.UNDERSTAND,
        difficulty: this.mapDifficulty(difficulty),
        targetAudience: 'general learner',
        customPrompts: [],
        includeExamples: true,
        noteFormat: NoteFormat.BULLET
      };

      // Create generation request
      const request: AIBlueprintGenerationRequest = {
        content,
        instructions,
        userId: userId.toString()
      };

      // Generate blueprint
      const result = await this.aiBlueprintGeneratorService.generateFromContent(request);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Blueprint generated successfully with default settings'
      });

    } catch (error: any) {
      console.error('Error generating blueprint:', error);
      res.status(500).json({
        error: 'Failed to generate blueprint',
        details: error.message
      });
    }
  }

  /**
   * Discover learning pathways
   * POST /api/v1/ai/pathways/discover
   */
  async discoverPathways(req: Request, res: Response): Promise<void> {
    try {
      const { interests, targetSkills, timeAvailable, difficulty } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!interests || !targetSkills) {
        res.status(400).json({ 
          error: 'Missing required fields: interests and targetSkills are required' 
        });
        return;
      }

      // Create discovery request
      const request: PathwayDiscoveryRequest = {
        userId: userId.toString(),
        interests: Array.isArray(interests) ? interests : [interests],
        targetSkills: Array.isArray(targetSkills) ? targetSkills : [targetSkills],
        currentKnowledge: [],
        timeAvailable: timeAvailable || 60,
        difficulty: this.mapPathwayDifficulty(difficulty)
      };

      // Discover pathways
      const recommendations = await this.learningPathwaysService.discoverPathways(request);

      res.status(200).json({
        success: true,
        data: recommendations,
        message: `Found ${recommendations.length} pathway recommendations`
      });

    } catch (error: any) {
      console.error('Error discovering pathways:', error);
      res.status(500).json({
        error: 'Failed to discover pathways',
        details: error.message
      });
    }
  }

  /**
   * Get pathway visualization
   * GET /api/v1/ai/pathways/:pathwayId/visualization
   */
  async getPathwayVisualization(req: Request, res: Response): Promise<void> {
    try {
      const { pathwayId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!pathwayId) {
        res.status(400).json({ error: 'Pathway ID is required' });
        return;
      }

      // Get visualization data
      const visualization = await this.learningPathwaysService.getPathwayVisualization(
        pathwayId,
        userId
      );

      res.status(200).json({
        success: true,
        data: visualization,
        message: 'Pathway visualization retrieved successfully'
      });

    } catch (error: any) {
      console.error('Error getting pathway visualization:', error);
      res.status(500).json({
        error: 'Failed to get pathway visualization',
        details: error.message
      });
    }
  }

  /**
   * Get pathway analytics
   * GET /api/v1/ai/pathways/:pathwayId/analytics
   */
  async getPathwayAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { pathwayId } = req.params;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!pathwayId) {
        res.status(400).json({ error: 'Pathway ID is required' });
        return;
      }

      // Get analytics
      const analytics = await this.learningPathwaysService.getPathwayAnalytics(
        pathwayId,
        userId
      );

      res.status(200).json({
        success: true,
        data: analytics,
        message: 'Pathway analytics retrieved successfully'
      });

    } catch (error: any) {
      console.error('Error getting pathway analytics:', error);
      res.status(500).json({
        error: 'Failed to get pathway analytics',
        details: error.message
      });
    }
  }

  /**
   * Update pathway progress
   * POST /api/v1/ai/pathways/:pathwayId/progress
   */
  async updatePathwayProgress(req: Request, res: Response): Promise<void> {
    try {
      const { pathwayId } = req.params;
      const { stepId, action, metadata } = req.body;
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!pathwayId || !stepId || !action) {
        res.status(400).json({ 
          error: 'Missing required fields: pathwayId, stepId, and action are required' 
        });
        return;
      }

      // Update progress
      await this.learningPathwaysService.updateProgress({
        pathwayId,
        stepId,
        userId: userId.toString(),
        action,
        timestamp: new Date(),
        metadata: metadata || {}
      });

      res.status(200).json({
        success: true,
        message: 'Pathway progress updated successfully'
      });

    } catch (error: any) {
      console.error('Error updating pathway progress:', error);
      res.status(500).json({
        error: 'Failed to update pathway progress',
        details: error.message
      });
    }
  }

  /**
   * Get available generation styles and options
   * GET /api/v1/ai/blueprint/options
   */
  async getGenerationOptions(req: Request, res: Response): Promise<void> {
    try {
      const options = {
        styles: Object.values(GenerationStyle),
        focuses: Object.values(GenerationFocus),
        difficulties: Object.values(GenerationDifficulty),
        noteFormats: Object.values(NoteFormat),
        examples: {
          concise: 'Brief, focused content with key points',
          thorough: 'Comprehensive coverage with detailed explanations',
          explorative: 'Creative exploration with multiple perspectives'
        },
        focusDescriptions: {
          understand: 'Focus on comprehension and basic knowledge',
          use: 'Focus on practical application and skills',
          explore: 'Focus on creative exploration and advanced concepts'
        }
      };

      res.status(200).json({
        success: true,
        data: options,
        message: 'Generation options retrieved successfully'
      });

    } catch (error: any) {
      console.error('Error getting generation options:', error);
      res.status(500).json({
        error: 'Failed to get generation options',
        details: error.message
      });
    }
  }

  // Helper methods
  private validateInstructions(instructions: any): string | null {
    if (!instructions.style || !Object.values(GenerationStyle).includes(instructions.style)) {
      return 'Invalid style. Must be one of: concise, thorough, explorative';
    }

    if (!instructions.focus || !Object.values(GenerationFocus).includes(instructions.focus)) {
      return 'Invalid focus. Must be one of: understand, use, explore';
    }

    if (!instructions.difficulty || !Object.values(GenerationDifficulty).includes(instructions.difficulty)) {
      return 'Invalid difficulty. Must be one of: beginner, intermediate, advanced';
    }

    if (!instructions.targetAudience || typeof instructions.targetAudience !== 'string') {
      return 'targetAudience must be a string';
    }

    if (!Array.isArray(instructions.customPrompts)) {
      return 'customPrompts must be an array';
    }

    if (typeof instructions.includeExamples !== 'boolean') {
      return 'includeExamples must be a boolean';
    }

    if (!instructions.noteFormat || !Object.values(NoteFormat).includes(instructions.noteFormat)) {
      return 'Invalid noteFormat. Must be one of: bullet, paragraph, mindmap';
    }

    return null;
  }

  private mapStyle(style: string): GenerationStyle {
    const styleMap: Record<string, GenerationStyle> = {
      'concise': GenerationStyle.CONCISE,
      'thorough': GenerationStyle.THOROUGH,
      'explorative': GenerationStyle.EXPLORATIVE
    };
    return styleMap[style.toLowerCase()] || GenerationStyle.THOROUGH;
  }

  private mapDifficulty(difficulty: string): GenerationDifficulty {
    const difficultyMap: Record<string, GenerationDifficulty> = {
      'beginner': GenerationDifficulty.BEGINNER,
      'intermediate': GenerationDifficulty.INTERMEDIATE,
      'advanced': GenerationDifficulty.ADVANCED
    };
    return difficultyMap[difficulty.toLowerCase()] || GenerationDifficulty.INTERMEDIATE;
  }

  private mapPathwayDifficulty(difficulty: string): PathwayDifficulty {
    const difficultyMap: Record<string, PathwayDifficulty> = {
      'beginner': PathwayDifficulty.BEGINNER,
      'intermediate': PathwayDifficulty.INTERMEDIATE,
      'advanced': PathwayDifficulty.ADVANCED
    };
    return difficultyMap[difficulty.toLowerCase()] || PathwayDifficulty.INTERMEDIATE;
  }
}

export default new AIBlueprintGeneratorController();


