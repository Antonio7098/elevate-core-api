import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrimitiveAIService } from '../services/primitiveAI.service';
import { getAIAPIClient } from '../services/ai-api-client.service';
import prisma from '../lib/prisma';

// Initialize services
const aiApiClient = getAIAPIClient();
const primitiveAIService = new PrimitiveAIService(aiApiClient);

interface CreatePrimitivesFromSourceRequest {
  sourceText: string;
  title?: string;
  description?: string;
  subjectArea?: string;
}

interface GeneratePrimitivesFromBlueprintRequest {
  blueprintId: number;
  maxPrimitives?: number;
  focusAreas?: string[];
}

interface EnhancePrimitiveRequest {
  enhancementType?: 'criteria' | 'questions' | 'both';
}

/**
 * Primitive-centric AI controller for generating knowledge primitives and mastery criteria
 * This replaces the old question set-based AI generation with primitive-focused endpoints
 */
class PrimitiveAIController {
  
  /**
   * Create knowledge primitives directly from source text
   * POST /api/ai/primitives/from-source
   * 
   * This replaces the old two-step process of creating a blueprint then generating questions.
   * Now we directly create primitives with criteria and questions in one step.
   */
  async createPrimitivesFromSource(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { sourceText, title, description, subjectArea }: CreatePrimitivesFromSourceRequest = req.body;

      // Validate required fields
      if (!sourceText || sourceText.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Source text is required and cannot be empty'
        });
        return;
      }

      if (sourceText.length > 50000) {
        res.status(400).json({
          success: false,
          error: 'Source text is too long (maximum 50,000 characters)'
        });
        return;
      }

      console.log(`Creating primitives from source for user ${userId}`);
      const startTime = Date.now();

      const result = await primitiveAIService.createPrimitivesFromSource(userId, {
        sourceText,
        title,
        description,
        subjectArea
      });

      const processingTime = Date.now() - startTime;

      res.status(201).json({
        success: true,
        data: {
          primitives: result.primitives,
          totalPrimitives: result.primitives.length,
          totalCriteria: result.primitives.reduce((sum, p) => sum + (p.criteria?.length || 0), 0),
          totalQuestions: result.primitives.reduce((sum, p) => sum + (p.questions?.length || 0), 0),
          processingTimeMs: processingTime
        }
      });
    } catch (error: any) {
      console.error('Error creating primitives from source:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create primitives from source text',
        details: error.message
      });
    }
  }

  /**
   * Generate primitives from an existing learning blueprint
   * POST /api/ai/primitives/from-blueprint
   * 
   * This refactors the old generateQuestionsFromBlueprint to create primitives instead
   */
  async generatePrimitivesFromBlueprint(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { blueprintId, maxPrimitives, focusAreas }: GeneratePrimitivesFromBlueprintRequest = req.body;

      // Validate required fields
      if (!blueprintId || typeof blueprintId !== 'number') {
        res.status(400).json({
          success: false,
          error: 'Valid blueprint ID is required'
        });
        return;
      }

      if (maxPrimitives && (maxPrimitives < 1 || maxPrimitives > 10)) {
        res.status(400).json({
          success: false,
          error: 'Maximum primitives must be between 1 and 10'
        });
        return;
      }

      console.log(`Generating primitives from blueprint ${blueprintId} for user ${userId}`);
      const startTime = Date.now();

      const result = await primitiveAIService.generatePrimitivesFromBlueprint(userId, {
        blueprintId,
        maxPrimitives,
        focusAreas
      });

      const processingTime = Date.now() - startTime;

      res.status(201).json({
        success: true,
        data: {
          primitives: result.primitives,
          totalPrimitives: result.primitives.length,
          totalCriteria: result.primitives.reduce((sum, p) => sum + (p.criteria?.length || 0), 0),
          totalQuestions: result.primitives.reduce((sum, p) => sum + (p.questions?.length || 0), 0),
          blueprintId,
          processingTimeMs: processingTime
        }
      });
    } catch (error: any) {
      console.error('Error generating primitives from blueprint:', error);
      
      if (error.message.includes('not found or access denied')) {
        res.status(404).json({
          success: false,
          error: 'Learning blueprint not found or access denied'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to generate primitives from blueprint',
        details: error.message
      });
    }
  }

  /**
   * Enhance an existing primitive with additional criteria or questions
   * POST /api/ai/primitives/:primitiveId/enhance
   * 
   * This allows iterative improvement of primitive content
   */
  async enhancePrimitive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const primitiveId = req.params.primitiveId;
      const { enhancementType = 'both' }: EnhancePrimitiveRequest = req.body;

      // Validate primitive ID
      if (!primitiveId || typeof primitiveId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Valid primitive ID is required'
        });
        return;
      }

      // Validate enhancement type
      if (!['criteria', 'questions', 'both'].includes(enhancementType)) {
        res.status(400).json({
          success: false,
          error: 'Enhancement type must be "criteria", "questions", or "both"'
        });
        return;
      }

      console.log(`Enhancing primitive ${primitiveId} for user ${userId}`);
      const startTime = Date.now();

      const result = await primitiveAIService.enhancePrimitive(userId, primitiveId, enhancementType);

      const processingTime = Date.now() - startTime;

      res.status(200).json({
        success: true,
        data: {
          primitive: result.primitive,
          enhancementType,
          totalCriteria: result.primitive?.criteria?.length || 0,
          totalQuestions: result.primitive?.questions?.length || 0,
          processingTimeMs: processingTime
        }
      });
    } catch (error: any) {
      console.error('Error enhancing primitive:', error);
      
      if (error.message.includes('not found or access denied')) {
        res.status(404).json({
          success: false,
          error: 'Primitive not found or access denied'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Failed to enhance primitive',
        details: error.message
      });
    }
  }

  /**
   * Get AI generation statistics for a user
   * GET /api/ai/primitives/stats
   * 
   * Returns statistics about AI-generated primitives for the authenticated user
   */
  async getGenerationStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;

      // Get statistics about user's AI-generated primitives
      const stats = await prisma.knowledgePrimitive.groupBy({
        by: ['primitiveType'],
        where: {
          userId: userId
        },
        _count: {
          id: true
        }
      });

      const totalPrimitives = await prisma.knowledgePrimitive.count({
        where: { userId: userId }
      });

      const totalCriteria = await prisma.masteryCriterion.count({
        where: {
          knowledgePrimitive: {
            userId: userId
          }
        }
      });

      // Note: Questions are not directly linked to primitives in current schema
      const totalQuestions = 0; // TODO: Update when schema supports primitive questions

      const recentPrimitives = await prisma.knowledgePrimitive.findMany({
        where: { userId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          primitiveId: true,
          title: true,
          primitiveType: true,
          createdAt: true,
          _count: {
            select: {
              masteryCriteria: true,
            }
          }
        }
      });

      res.status(200).json({
        success: true,
        data: {
          totalPrimitives,
          totalCriteria,
          totalQuestions,
          primitiveTypeDistribution: stats.map(s => ({
            primitiveType: s.primitiveType,
            count: s._count.id
          })),
          recentPrimitives,
          averageCriteriaPerPrimitive: totalPrimitives > 0 ? (totalCriteria / totalPrimitives).toFixed(2) : 0,
          averageQuestionsPerPrimitive: totalPrimitives > 0 ? (totalQuestions / totalPrimitives).toFixed(2) : 0
        }
      });
    } catch (error: any) {
      console.error('Error getting generation stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve generation statistics',
        details: error.message
      });
    }
  }

  /**
   * Batch create primitives from multiple sources
   * POST /api/ai/primitives/batch-create
   * 
   * Allows creating multiple primitives from different source texts in one request
   */
  async batchCreatePrimitives(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { sources }: { sources: CreatePrimitivesFromSourceRequest[] } = req.body;

      // Validate batch request
      if (!Array.isArray(sources) || sources.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Sources array is required and cannot be empty'
        });
        return;
      }

      if (sources.length > 5) {
        res.status(400).json({
          success: false,
          error: 'Maximum 5 sources allowed per batch request'
        });
        return;
      }

      // Validate each source
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        if (!source.sourceText || source.sourceText.trim().length === 0) {
          res.status(400).json({
            success: false,
            error: `Source ${i + 1}: Source text is required and cannot be empty`
          });
          return;
        }
      }

      console.log(`Batch creating primitives from ${sources.length} sources for user ${userId}`);
      const startTime = Date.now();

      const results = [];
      let totalPrimitives = 0;
      let totalCriteria = 0;
      let totalQuestions = 0;

      // Process each source sequentially to avoid overwhelming the AI service
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        try {
          const result = await primitiveAIService.createPrimitivesFromSource(userId, source);
          results.push({
            sourceIndex: i,
            success: true,
            primitives: result.primitives,
            primitiveCount: result.primitives.length
          });
          
          totalPrimitives += result.primitives.length;
          totalCriteria += result.primitives.reduce((sum, p) => sum + (p.criteria?.length || 0), 0);
          totalQuestions += result.primitives.reduce((sum, p) => sum + (p.questions?.length || 0), 0);
        } catch (error: any) {
          console.error(`Error processing source ${i}:`, error);
          results.push({
            sourceIndex: i,
            success: false,
            error: error.message
          });
        }
      }

      const processingTime = Date.now() - startTime;
      const successCount = results.filter(r => r.success).length;

      res.status(201).json({
        success: true,
        data: {
          results,
          summary: {
            totalSources: sources.length,
            successfulSources: successCount,
            failedSources: sources.length - successCount,
            totalPrimitives,
            totalCriteria,
            totalQuestions,
            processingTimeMs: processingTime
          }
        }
      });
    } catch (error: any) {
      console.error('Error in batch create primitives:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to batch create primitives',
        details: error.message
      });
    }
  }
}

export default new PrimitiveAIController();
