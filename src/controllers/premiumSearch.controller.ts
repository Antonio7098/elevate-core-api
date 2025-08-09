import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PremiumSearchController {
  async searchSimilarConcepts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { query, complexityRange, limit = 10 } = req.query;

      if (!query) {
        res.status(400).json({ error: 'Query parameter is required' });
        return;
      }

      // Build search conditions
      const whereClause: any = { userId };
      
      if (complexityRange) {
        const [min, max] = (complexityRange as string).split(',').map(Number);
        whereClause.complexityScore = {
          gte: min,
          lte: max,
        };
      }

      // Search by concept tags and title similarity
      const searchResults = await prisma.knowledgePrimitive.findMany({
        where: {
          ...whereClause,
          OR: [
            {
              title: {
                contains: query as string,
                mode: 'insensitive',
              },
            },
            {
              conceptTags: {
                has: query as string,
              },
            },
            {
              description: {
                contains: query as string,
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          userPrimitiveProgresses: {
            where: { userId },
          },
          masteryCriteria: true,
        },
        take: parseInt(limit as string),
        orderBy: [
          { isCoreConcept: 'desc' },
          { complexityScore: 'asc' },
        ],
      });

      // Calculate similarity scores (simplified for now)
      const resultsWithScores = searchResults.map(result => {
        const titleMatch = result.title.toLowerCase().includes((query as string).toLowerCase()) ? 0.8 : 0;
        const tagMatch = result.conceptTags.some(tag => 
          tag.toLowerCase().includes((query as string).toLowerCase())
        ) ? 0.6 : 0;
        const descriptionMatch = result.description?.toLowerCase().includes((query as string).toLowerCase()) ? 0.4 : 0;
        
        const similarityScore = Math.max(titleMatch, tagMatch, descriptionMatch);
        
        return {
          ...result,
          similarityScore,
          masteryLevel: result.userPrimitiveProgresses[0]?.masteryLevel || 'NOT_STARTED',
        };
      });

      // Sort by similarity score
      resultsWithScores.sort((a, b) => b.similarityScore - a.similarityScore);

      res.status(200).json({
        query: query as string,
        results: resultsWithScores,
        totalResults: resultsWithScores.length,
      });
    } catch (error) {
      console.error('Error searching similar concepts:', error);
      res.status(500).json({ error: 'Failed to search similar concepts' });
    }
  }

  async searchByComplexityLevel(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { minComplexity, maxComplexity, isCoreOnly, limit = 20 } = req.query;

      const whereClause: any = { userId };

      if (minComplexity && maxComplexity) {
        whereClause.complexityScore = {
          gte: parseFloat(minComplexity as string),
          lte: parseFloat(maxComplexity as string),
        };
      }

      if (isCoreOnly === 'true') {
        whereClause.isCoreConcept = true;
      }

      const results = await prisma.knowledgePrimitive.findMany({
        where: whereClause,
        include: {
          userPrimitiveProgresses: {
            where: { userId },
          },
          masteryCriteria: true,
        },
        take: parseInt(limit as string),
        orderBy: [
          { isCoreConcept: 'desc' },
          { complexityScore: 'asc' },
        ],
      });

      const resultsWithMastery = results.map(result => ({
        ...result,
        masteryLevel: result.userPrimitiveProgresses[0]?.masteryLevel || 'NOT_STARTED',
      }));

      res.status(200).json({
        results: resultsWithMastery,
        totalResults: resultsWithMastery.length,
        complexityRange: {
          min: minComplexity,
          max: maxComplexity,
        },
      });
    } catch (error) {
      console.error('Error searching by complexity level:', error);
      res.status(500).json({ error: 'Failed to search by complexity level' });
    }
  }

  async getPrerequisitesForConcept(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { primitiveId } = req.params;

      const concept = await prisma.knowledgePrimitive.findFirst({
        where: {
          primitiveId,
          userId,
        },
        include: {
          userPrimitiveProgresses: {
            where: { userId },
          },
        },
      });

      if (!concept) {
        res.status(404).json({ error: 'Concept not found' });
        return;
      }

      // Get prerequisite concepts
      const prerequisites = await prisma.knowledgePrimitive.findMany({
        where: {
          primitiveId: {
            in: concept.prerequisiteIds,
          },
          userId,
        },
        include: {
          userPrimitiveProgresses: {
            where: { userId },
          },
        },
      });

      const prerequisitesWithMastery = prerequisites.map(prereq => ({
        ...prereq,
        masteryLevel: prereq.userPrimitiveProgresses[0]?.masteryLevel || 'NOT_STARTED',
        isCompleted: prereq.userPrimitiveProgresses[0]?.masteryLevel === 'EXPLORE',
      }));

      res.status(200).json({
        concept: {
          ...concept,
          id: concept.primitiveId,
          masteryLevel: concept.userPrimitiveProgresses[0]?.masteryLevel || 'NOT_STARTED',
        },
        prerequisites: prerequisitesWithMastery,
        totalPrerequisites: prerequisitesWithMastery.length,
        completedPrerequisites: prerequisitesWithMastery.filter(p => p.isCompleted).length,
      });
    } catch (error) {
      console.error('Error getting prerequisites for concept:', error);
      res.status(500).json({ error: 'Failed to get prerequisites' });
    }
  }

  async getRelatedConcepts(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;
      const { primitiveId } = req.params;

      const concept = await prisma.knowledgePrimitive.findFirst({
        where: {
          primitiveId,
          userId,
        },
        include: {
          userPrimitiveProgresses: {
            where: { userId },
          },
        },
      });

      if (!concept) {
        res.status(404).json({ error: 'Concept not found' });
        return;
      }

      // Get related concepts
      const relatedConcepts = await prisma.knowledgePrimitive.findMany({
        where: {
          primitiveId: {
            in: concept.relatedConceptIds,
          },
          userId,
        },
        include: {
          userPrimitiveProgresses: {
            where: { userId },
          },
        },
      });

      const relatedWithMastery = relatedConcepts.map(related => ({
        ...related,
        masteryLevel: related.userPrimitiveProgresses[0]?.masteryLevel || 'NOT_STARTED',
      }));

      res.status(200).json({
        concept: {
          ...concept,
          id: concept.primitiveId,
          masteryLevel: concept.userPrimitiveProgresses[0]?.masteryLevel || 'NOT_STARTED',
        },
        relatedConcepts: relatedWithMastery,
        totalRelated: relatedWithMastery.length,
      });
    } catch (error) {
      console.error('Error getting related concepts:', error);
      res.status(500).json({ error: 'Failed to get related concepts' });
    }
  }
}
