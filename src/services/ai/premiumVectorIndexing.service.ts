import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface SearchResult {
  id: string;
  title: string;
  similarityScore: number;
  masteryLevel: string;
  complexityScore?: number;
  isCoreConcept: boolean;
  conceptTags: string[];
}

export class PremiumVectorIndexingService {
  async indexBlueprintWithPremiumFields(blueprintId: number): Promise<void> {
    try {
      const blueprint = await prisma.learningBlueprint.findUnique({
        where: { id: blueprintId },
        include: {
          generatedNotes: true,
          generatedQuestionSets: {
            include: {
              questions: true,
            },
          },
        },
      });

      if (!blueprint) {
        throw new Error('Blueprint not found');
      }

      // Extract knowledge primitives from blueprint JSON
      const blueprintData = blueprint.blueprintJson as any;
      const knowledgePrimitives = blueprintData.knowledge_primitives || {};

      // Index each knowledge primitive with premium fields
      for (const [category, primitives] of Object.entries(knowledgePrimitives)) {
        if (Array.isArray(primitives)) {
          for (const primitive of primitives) {
            await this.indexKnowledgePrimitiveWithRelations(primitive.id || primitive.title);
          }
        }
      }

      console.log(`✅ Indexed blueprint ${blueprintId} with premium fields`);
    } catch (error) {
      console.error('Error indexing blueprint with premium fields:', error);
      throw error;
    }
  }

  async indexKnowledgePrimitiveWithRelations(primitiveId: string): Promise<void> {
    try {
      const primitive = await prisma.knowledgePrimitive.findUnique({
        where: { primitiveId },
        include: {
          masteryCriteria: true,
          userPrimitiveProgresses: true,
        },
      });

      if (!primitive) {
        console.warn(`Knowledge primitive ${primitiveId} not found for indexing`);
        return;
      }

      // Update premium fields based on relationships and content analysis
      const updatedFields = await this.calculatePremiumFields(primitive);

      await prisma.knowledgePrimitive.update({
        where: { primitiveId },
        data: updatedFields,
      });

      console.log(`✅ Indexed knowledge primitive ${primitiveId} with premium fields`);
    } catch (error) {
      console.error('Error indexing knowledge primitive with relations:', error);
      throw error;
    }
  }

  private async calculatePremiumFields(primitive: any): Promise<any> {
    const updatedFields: any = {};

    // Calculate complexity score based on criteria count and difficulty
    const criteriaCount = primitive.masteryCriteria?.length || 0;
    const difficultyMultiplier = this.getDifficultyMultiplier(primitive.difficultyLevel);
    updatedFields.complexityScore = Math.min(10, Math.max(1, criteriaCount * difficultyMultiplier));

    // Determine if it's a core concept based on criteria count and importance
    updatedFields.isCoreConcept = criteriaCount >= 3 || primitive.primitiveType === 'concept';

    // Generate concept tags based on title and description
    updatedFields.conceptTags = this.generateConceptTags(primitive.title, primitive.description);

    // Calculate estimated prerequisites based on complexity
    updatedFields.estimatedPrerequisites = Math.ceil(updatedFields.complexityScore / 2);

    return updatedFields;
  }

  private getDifficultyMultiplier(difficultyLevel: string): number {
    switch (difficultyLevel) {
      case 'beginner':
        return 1.0;
      case 'intermediate':
        return 1.5;
      case 'advanced':
        return 2.0;
      default:
        return 1.0;
    }
  }

  private generateConceptTags(title: string, description?: string): string[] {
    const tags: string[] = [];
    
    // Extract key terms from title
    const titleWords = title.toLowerCase().split(/\s+/);
    tags.push(...titleWords.filter(word => word.length > 3));

    // Extract key terms from description
    if (description) {
      const descWords = description.toLowerCase().split(/\s+/);
      tags.push(...descWords.filter(word => word.length > 3));
    }

    // Remove duplicates and limit to 10 tags
    return [...new Set(tags)].slice(0, 10);
  }

  async searchSimilarConceptsWithContext(query: string, userId: number): Promise<SearchResult[]> {
    try {
      const searchResults = await prisma.knowledgePrimitive.findMany({
        where: {
          userId,
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              conceptTags: {
                has: query,
              },
            },
            {
              description: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
        include: {
          userPrimitiveProgresses: {
            where: { userId },
          },
        },
        take: 20,
        orderBy: [
          { isCoreConcept: 'desc' },
          { complexityScore: 'asc' },
        ],
      });

      return searchResults.map(result => ({
        id: result.primitiveId,
        title: result.title,
        similarityScore: this.calculateSimilarityScore(query, result),
        masteryLevel: result.userPrimitiveProgresses[0]?.masteryLevel || 'NOT_STARTED',
        complexityScore: result.complexityScore || 0,
        isCoreConcept: result.isCoreConcept,
        conceptTags: result.conceptTags,
      }));
    } catch (error) {
      console.error('Error searching similar concepts with context:', error);
      throw error;
    }
  }

  async searchByComplexityLevel(query: string, complexityRange: [number, number]): Promise<SearchResult[]> {
    try {
      const [minComplexity, maxComplexity] = complexityRange;

      const searchResults = await prisma.knowledgePrimitive.findMany({
        where: {
          complexityScore: {
            gte: minComplexity,
            lte: maxComplexity,
          },
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              conceptTags: {
                has: query,
              },
            },
          ],
        },
        include: {
          userPrimitiveProgresses: true,
        },
        take: 20,
        orderBy: [
          { isCoreConcept: 'desc' },
          { complexityScore: 'asc' },
        ],
      });

      return searchResults.map(result => ({
        id: result.primitiveId,
        title: result.title,
        similarityScore: this.calculateSimilarityScore(query, result),
        masteryLevel: result.userPrimitiveProgresses[0]?.masteryLevel || 'NOT_STARTED',
        complexityScore: result.complexityScore || 0,
        isCoreConcept: result.isCoreConcept,
        conceptTags: result.conceptTags,
      }));
    } catch (error) {
      console.error('Error searching by complexity level:', error);
      throw error;
    }
  }

  private calculateSimilarityScore(query: string, result: any): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Title match (highest weight)
    if (result.title.toLowerCase().includes(queryLower)) {
      score += 0.8;
    }

    // Tag match (medium weight)
    if (result.conceptTags.some((tag: string) => tag.toLowerCase().includes(queryLower))) {
      score += 0.6;
    }

    // Description match (lower weight)
    if (result.description?.toLowerCase().includes(queryLower)) {
      score += 0.4;
    }

    // Core concept bonus
    if (result.isCoreConcept) {
      score += 0.2;
    }

    return Math.min(1.0, score);
  }

  async updateConceptRelationships(primitiveId: string, prerequisiteIds: string[], relatedConceptIds: string[]): Promise<void> {
    try {
      await prisma.knowledgePrimitive.update({
        where: { primitiveId },
        data: {
          prerequisiteIds,
          relatedConceptIds,
        },
      });

      console.log(`✅ Updated relationships for concept ${primitiveId}`);
    } catch (error) {
      console.error('Error updating concept relationships:', error);
      throw error;
    }
  }
}
