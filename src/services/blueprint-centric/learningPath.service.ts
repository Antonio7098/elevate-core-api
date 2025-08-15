import { PrismaClient } from '@prisma/client';
import KnowledgeGraphTraversal from './knowledgeGraphTraversal.service';

const prisma = new PrismaClient();

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  path: Array<{
    id: number;
    title: string;
    type: 'criterion' | 'primitive';
    difficulty: number;
    estimatedTime: number;
    ueeStage: string;
    masteryLevel?: number;
    isCompleted?: boolean;
  }>;
  metadata: {
    totalSteps: number;
    estimatedTime: number;
    difficulty: number;
    ueeProgression: string[];
    prerequisites: string[];
    learningObjectives: string[];
    tags: string[];
  };
}

export default class LearningPathService {
  
  private graphTraversal: KnowledgeGraphTraversal;
  
  constructor() {
    this.graphTraversal = new KnowledgeGraphTraversal();
  }
  
  /**
   * Discovers learning paths from a starting criterion
   */
  async discoverLearningPaths(
    startCriterionId: number,
    maxPathLength: number = 10
  ): Promise<LearningPath[]> {
    try {
      const path = await this.graphTraversal.findCriterionLearningPath(
        startCriterionId,
        maxPathLength,
        50
      );
      
      if (!path) return [];
      
      const learningPath = await this.convertToLearningPath(path);
      return learningPath ? [learningPath] : [];
      
    } catch (error) {
      console.error('Learning path discovery failed:', error);
      return [];
    }
  }
  
  /**
   * Finds optimal learning path between two criteria
   */
  async findOptimalPath(
    startCriterionId: number,
    endCriterionId: number,
    maxPathLength: number = 15
  ): Promise<LearningPath | null> {
    try {
      const path = await this.graphTraversal.findCriterionLearningPath(
        startCriterionId,
        endCriterionId,
        maxPathLength
      );
      
      if (!path) return null;
      
      return await this.convertToLearningPath(path);
      
    } catch (error) {
      console.error('Optimal path finding failed:', error);
      return null;
    }
  }


  
  /**
   * Converts graph traversal result to LearningPath
   */
  private async convertToLearningPath(path: any): Promise<LearningPath | null> {
    try {
      const pathSteps = await this.getPathSteps(path.path);
      
      if (pathSteps.length === 0) return null;
      
      const metadata = this.calculatePathMetadata(pathSteps);
      
      return {
        id: path.id || `path_${Date.now()}`,
        title: `Learning Path (${pathSteps.length} steps)`,
        description: `Progressive learning sequence from ${pathSteps[0].title} to ${pathSteps[pathSteps.length - 1].title}`,
        path: pathSteps,
        metadata
      };
      
    } catch (error) {
      console.error('Path conversion failed:', error);
      return null;
    }
  }
  
  /**
   * Gets detailed information for path steps
   */
  private async getPathSteps(stepIds: number[]): Promise<any[]> {
    const steps: any[] = [];
    
    for (const stepId of stepIds) {
      try {
        // For now, use placeholder data since new models aren't in current Prisma client
        const step = {
          id: stepId,
          title: `Step ${stepId}`,
          type: 'criterion' as const,
          difficulty: 5,
          estimatedTime: 20,
          ueeStage: 'UNDERSTAND',
          complexityScore: 5
        };
        
        steps.push(step);
        
        // TODO: Uncomment when new schema is deployed
        /*
        let step = await prisma.masteryCriterion.findUnique({
          where: { id: stepId },
          select: { id: true, title: true, uueStage: true, complexityScore: true }
        });
        
        if (step) {
          step.type = 'criterion';
          step.estimatedTime = this.estimateCriterionTime(step);
          steps.push(step);
        } else {
          step = await prisma.knowledgePrimitive.findUnique({
            where: { id: stepId },
            select: { id: true, title: true, ueeLevel: true, complexityScore: true }
          });
          
          if (step) {
            step.type = 'primitive';
            step.ueeStage = step.ueeLevel;
            step.estimatedTime = this.estimatePrimitiveTime(step);
            steps.push(step);
          }
        }
        */
      } catch (error) {
        console.error(`Failed to get step ${stepId}:`, error);
      }
    }
    
    return steps;
  }
  
  /**
   * Calculates path metadata
   */
  private calculatePathMetadata(steps: any[]) {
    const totalSteps = steps.length;
    const estimatedTime = steps.reduce((sum, step) => sum + step.estimatedTime, 0);
    const difficulty = steps.reduce((sum, step) => sum + step.complexityScore, 0) / totalSteps;
    
    const ueeStages = Array.from(new Set(steps.map(step => step.ueeStage)));
    const ueeProgression = this.orderUeeStages(ueeStages);
    
    const prerequisites = steps.slice(0, Math.ceil(totalSteps * 0.3)).map(s => s.title);
    const learningObjectives = steps.slice(-Math.ceil(totalSteps * 0.3)).map(s => s.title);
    
    return {
      totalSteps,
      estimatedTime,
      difficulty,
      ueeProgression,
      prerequisites,
      learningObjectives,
      tags: ueeStages
    };
  }
  
  /**
   * Orders UEE stages correctly
   */
  private orderUeeStages(stages: string[]): string[] {
    const order = ['UNDERSTAND', 'USE', 'EXPLORE'];
    return order.filter(stage => stages.includes(stage));
  }
  
  /**
   * Estimates time for criterion completion
   */
  private estimateCriterionTime(criterion: any): number {
    const baseTime = 20;
    const complexityMultiplier = (criterion.complexityScore || 5) / 5;
    const stageMultiplier = this.getStageTimeMultiplier(criterion.uueStage);
    
    return Math.round(baseTime * complexityMultiplier * stageMultiplier);
  }
  
  /**
   * Estimates time for primitive completion
   */
  private estimatePrimitiveTime(primitive: any): number {
    const baseTime = 15;
    const complexityMultiplier = (primitive.complexityScore || 5) / 5;
    const stageMultiplier = this.getStageTimeMultiplier(primitive.ueeLevel);
    
    return Math.round(baseTime * complexityMultiplier * stageMultiplier);
  }
  
  /**
   * Gets time multiplier for UEE stage
   */
  private getStageTimeMultiplier(stage: string): number {
    switch (stage) {
      case 'UNDERSTAND': return 0.8;
      case 'USE': return 1.0;
      case 'EXPLORE': return 1.3;
      default: return 1.0;
    }
  }
}

export { LearningPathService };
