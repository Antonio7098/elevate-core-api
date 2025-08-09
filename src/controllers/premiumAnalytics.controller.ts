import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PremiumAnalyticsController {
  async getLearningAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { startDate, endDate } = req.query;

      const whereClause: any = { userId };
      if (startDate && endDate) {
        whereClause.date = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }

      const analytics = await prisma.userLearningAnalytics.findMany({
        where: whereClause,
        orderBy: {
          date: 'desc',
        },
        take: 30, // Last 30 days
      });

      // Calculate summary statistics
      const totalStudyTime = analytics.reduce((sum, a) => sum + a.totalStudyTimeMinutes, 0);
      const totalConceptsReviewed = analytics.reduce((sum, a) => sum + a.conceptsReviewed, 0);
      const totalConceptsMastered = analytics.reduce((sum, a) => sum + a.conceptsMastered, 0);
      const averageEfficiency = analytics.length > 0 
        ? analytics.reduce((sum, a) => sum + (a.learningEfficiency || 0), 0) / analytics.length 
        : 0;

      const summary = {
        totalStudyTime,
        totalConceptsReviewed,
        totalConceptsMastered,
        averageEfficiency,
        dailyAnalytics: analytics,
      };

      res.status(200).json(summary);
    } catch (error) {
      console.error('Error getting learning analytics:', error);
      res.status(500).json({ error: 'Failed to get learning analytics' });
    }
  }

  async getMemoryInsights(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { insightType, confidenceThreshold } = req.query;

      const whereClause: any = { userId };
      if (insightType) {
        whereClause.insightType = insightType;
      }
      if (confidenceThreshold) {
        whereClause.confidenceScore = {
          gte: parseFloat(confidenceThreshold as string),
        };
      }

      const insights = await prisma.userMemoryInsight.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        take: 50,
      });

      // Group insights by type
      const insightsByType = insights.reduce((acc, insight) => {
        if (!acc[insight.insightType]) {
          acc[insight.insightType] = [];
        }
        acc[insight.insightType].push(insight);
        return acc;
      }, {} as Record<string, any[]>);

      res.status(200).json({
        insights,
        insightsByType,
        totalInsights: insights.length,
      });
    } catch (error) {
      console.error('Error getting memory insights:', error);
      res.status(500).json({ error: 'Failed to get memory insights' });
    }
  }

  async getKnowledgeGraph(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;

      const knowledgePrimitives = await prisma.knowledgePrimitive.findMany({
        where: { userId },
        include: {
          userPrimitiveProgresses: {
            where: { userId },
          },
          masteryCriteria: true,
        },
      });

      // Build knowledge graph structure
      const nodes = knowledgePrimitives.map(kp => ({
        id: kp.primitiveId,
        title: kp.title,
        type: kp.primitiveType,
        difficulty: kp.difficultyLevel,
        complexity: kp.complexityScore,
        isCore: kp.isCoreConcept,
        masteryLevel: kp.userPrimitiveProgresses[0]?.masteryLevel || 'NOT_STARTED',
        conceptTags: kp.conceptTags,
        prerequisiteIds: kp.prerequisiteIds,
        relatedConceptIds: kp.relatedConceptIds,
      }));

      // Build edges for relationships
      const edges = [];
      for (const kp of knowledgePrimitives) {
        // Prerequisites
        for (const prereqId of kp.prerequisiteIds) {
          edges.push({
            source: prereqId,
            target: kp.primitiveId,
            type: 'prerequisite',
          });
        }
        // Related concepts
        for (const relatedId of kp.relatedConceptIds) {
          edges.push({
            source: kp.primitiveId,
            target: relatedId,
            type: 'related',
          });
        }
      }

      res.status(200).json({
        nodes,
        edges,
        totalNodes: nodes.length,
        totalEdges: edges.length,
      });
    } catch (error) {
      console.error('Error getting knowledge graph:', error);
      res.status(500).json({ error: 'Failed to get knowledge graph' });
    }
  }

  async createMemoryInsight(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { insightType, title, content, relatedPrimitiveIds, confidenceScore, isActionable } = req.body;

      const insight = await prisma.userMemoryInsight.create({
        data: {
          userId,
          insightType,
          title,
          content,
          relatedPrimitiveIds: relatedPrimitiveIds || [],
          confidenceScore: confidenceScore || 0.5,
          isActionable: isActionable !== undefined ? isActionable : true,
        },
      });

      res.status(201).json(insight);
    } catch (error) {
      console.error('Error creating memory insight:', error);
      res.status(500).json({ error: 'Failed to create memory insight' });
    }
  }

  async updateDailyAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { 
        totalStudyTimeMinutes, 
        conceptsReviewed, 
        conceptsMastered, 
        averageMasteryScore,
        learningEfficiency,
        focusAreas,
        achievements 
      } = req.body;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Validate and sanitize input data
      const sanitizedTotalStudyTime = typeof totalStudyTimeMinutes === 'number' && totalStudyTimeMinutes >= 0 
        ? totalStudyTimeMinutes : 0;
      const sanitizedConceptsReviewed = typeof conceptsReviewed === 'number' && conceptsReviewed >= 0 
        ? conceptsReviewed : 0;
      const sanitizedConceptsMastered = typeof conceptsMastered === 'number' && conceptsMastered >= 0 
        ? conceptsMastered : 0;
      const sanitizedAverageMasteryScore = typeof averageMasteryScore === 'number' && averageMasteryScore >= 0 
        ? averageMasteryScore : 0;
      const sanitizedLearningEfficiency = typeof learningEfficiency === 'number' 
        ? learningEfficiency : null;
      const sanitizedFocusAreas = Array.isArray(focusAreas) ? focusAreas : [];
      const sanitizedAchievements = Array.isArray(achievements) ? achievements : [];

      const analytics = await prisma.userLearningAnalytics.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        update: {
          totalStudyTimeMinutes: sanitizedTotalStudyTime,
          conceptsReviewed: sanitizedConceptsReviewed,
          conceptsMastered: sanitizedConceptsMastered,
          averageMasteryScore: sanitizedAverageMasteryScore,
          learningEfficiency: sanitizedLearningEfficiency,
          focusAreas: sanitizedFocusAreas,
          achievements: sanitizedAchievements,
        },
        create: {
          userId,
          date: today,
          totalStudyTimeMinutes: sanitizedTotalStudyTime,
          conceptsReviewed: sanitizedConceptsReviewed,
          conceptsMastered: sanitizedConceptsMastered,
          averageMasteryScore: sanitizedAverageMasteryScore,
          learningEfficiency: sanitizedLearningEfficiency,
          focusAreas: sanitizedFocusAreas,
          achievements: sanitizedAchievements,
        },
      });

      res.status(200).json(analytics);
    } catch (error) {
      console.error('Error updating daily analytics:', error);
      res.status(500).json({ error: 'Failed to update daily analytics' });
    }
  }
}
