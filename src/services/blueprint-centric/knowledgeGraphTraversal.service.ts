import { PrismaClient, KnowledgePrimitive, MasteryCriterion } from '@prisma/client';

// ============================================================================
// INTERFACES
// ============================================================================

export interface GraphNode {
  id: string;
  title: string;
  description?: string;
  type: 'concept' | 'fact' | 'process';
  difficulty: string;
  estimatedTime: number;
  complexityScore?: number;
  uueStage?: string; // UUE stage for mastery criteria
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  strength: number;
}

export interface TraversalResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    maxDepth: number;
    totalNodes: number;
    totalEdges: number;
  };
}

export interface LearningPathResult {
  path: GraphNode[];
  cost: number;
  ueeProgression?: {
    understandCount: number;
    useCount: number;
    exploreCount: number;
    progressionOrder: string[];
    isOptimal: boolean;
  };
}

export type RelationshipType = 'PREREQUISITE' | 'RELATED' | 'SIMILAR' | 'ADVANCES_TO' | 'DEMONSTRATES' | 'CONTRADICTS' | 'SYNONYMOUS' | 'PART_OF';
export type CriterionRelationshipType = 'PREREQUISITE' | 'ADVANCES_TO' | 'RELATED' | 'SIMILAR' | 'PART_OF' | 'DEMONSTRATES' | 'SYNONYMOUS';

// ============================================================================
// SERVICE CLASS
// ============================================================================

export default class KnowledgeGraphTraversal {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Traverses the knowledge graph starting from a given node
   */
  async traverseGraph(
    startNodeId: string,
    maxDepth: number = 3,
    relationshipTypes: RelationshipType[] = ['PREREQUISITE', 'RELATED', 'ADVANCES_TO']
  ): Promise<TraversalResult> {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const visited = new Set<string>();
    const queue: { nodeId: string; depth: number }[] = [{ nodeId: startNodeId, depth: 0 }];

    while (queue.length > 0) {
      const { nodeId, depth } = queue.shift()!;
      
      if (visited.has(nodeId) || depth > maxDepth) {
        continue;
      }
      
      visited.add(nodeId);

      // Get node details
      const node = await this.prisma.knowledgePrimitive.findUnique({
        where: { primitiveId: nodeId }
      });

      if (node) {
        nodes.push(this.mapToGraphNode(node));
      }

      if (depth < maxDepth) {
        // Get relationships FROM the current node (not TO it)
        const relationships = await this.getRelationships(nodeId, relationshipTypes);
        
        for (const rel of relationships) {
          const targetId = rel.targetPrimitiveId;
          
          // Add edge even if target is visited (for circular relationships)
          edges.push({
            source: nodeId,
            target: targetId,
            type: rel.relationshipType,
            strength: rel.strength || 1.0
          });
          
          // Only add to queue if not visited
          if (!visited.has(targetId)) {
            queue.push({ nodeId: targetId, depth: depth + 1 });
          }
        }
      }
    }

    return {
      nodes,
      edges,
      metadata: {
        maxDepth,
        totalNodes: nodes.length,
        totalEdges: edges.length
      }
    };
  }

  /**
   * Finds the prerequisite chain for a given node
   */
  async findPrerequisiteChain(targetNodeId: string): Promise<GraphNode[]> {
    const prerequisites: GraphNode[] = [];
    const visited = new Set<string>();
    const queue: string[] = [targetNodeId];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      
      if (visited.has(nodeId)) {
        continue;
      }
      
      visited.add(nodeId);

      // Get prerequisite relationships
      const relationships = await this.getRelationships(nodeId, ['PREREQUISITE']);
      
      for (const rel of relationships) {
        const prereqId = rel.targetPrimitiveId;
        
        if (!visited.has(prereqId)) {
          const prereqNode = await this.prisma.knowledgePrimitive.findUnique({
            where: { primitiveId: prereqId }
          });
          
          if (prereqNode) {
            prerequisites.push(this.mapToGraphNode(prereqNode));
            queue.push(prereqId);
          }
        }
      }
    }

    // Sort by complexity score (lowest first) and exclude the target node itself
    return prerequisites
      .filter(node => node.id !== targetNodeId)
      .sort((a, b) => (a.complexityScore || 0) - (b.complexityScore || 0));
  }

  /**
   * Finds the optimal learning path between two concepts
   */
  async findLearningPath(
    startNodeId: string,
    endNodeId: string,
    maxPathLength: number = 10
  ): Promise<LearningPathResult> {
    const visited = new Set<string>();
    const queue: { nodeId: string; path: string[]; cost: number }[] = [
      { nodeId: startNodeId, path: [startNodeId], cost: 0 }
    ];

    while (queue.length > 0) {
      const { nodeId, path, cost } = queue.shift()!;
      
      if (nodeId === endNodeId) {
        // Found the path, get all nodes
        const pathNodes: GraphNode[] = [];
        for (const id of path) {
          const node = await this.prisma.knowledgePrimitive.findUnique({
            where: { primitiveId: id }
          });
          if (node) {
            pathNodes.push(this.mapToGraphNode(node));
          }
        }
        
        return { path: pathNodes, cost };
      }
      
      if (path.length >= maxPathLength) {
        // Skip this path but continue processing other paths
        continue;
      }
      
      if (visited.has(nodeId)) {
        continue;
      }
      
      visited.add(nodeId);

      // Get all relationships
      const relationships = await this.getRelationships(nodeId, ['PREREQUISITE', 'RELATED', 'ADVANCES_TO']);
      
      for (const rel of relationships) {
        const targetId = rel.targetPrimitiveId;
        
        if (!visited.has(targetId)) {
          const newCost = Math.round((cost + (1 - (rel.strength || 1.0))) * 1000) / 1000; // Higher strength = lower cost, round to 3 decimal places
          queue.push({
            nodeId: targetId,
            path: [...path, targetId],
            cost: newCost
          });
        }
      }
    }

    // If we get here, no path was found
    throw new Error(`No learning path found between ${startNodeId} and ${endNodeId}`);
  }

  /**
   * Finds the learning path between mastery criteria
   */
  async findCriterionLearningPath(
    startCriterionId: number,
    endCriterionId: number,
    maxPathLength: number = 10
  ): Promise<LearningPathResult> {
    const visited = new Set<number>();
    const queue: { criterionId: number; path: number[]; cost: number }[] = [
      { criterionId: startCriterionId, path: [startCriterionId], cost: 0 }
    ];

    while (queue.length > 0) {
      const { criterionId, path, cost } = queue.shift()!;
      
      if (criterionId === endCriterionId) {
        // Found the path, get all criteria
        const pathCriteria: GraphNode[] = [];
        for (const id of path) {
          const criterion = await this.prisma.masteryCriterion.findUnique({
            where: { id }
          });
          if (criterion) {
            pathCriteria.push(this.mapCriterionToGraphNode(criterion));
          }
        }
        
        // Analyze UUE progression
        const ueeProgression = this.analyzeUUEProgression(pathCriteria);
        
        return { path: pathCriteria, cost, ueeProgression };
      }
      
      if (path.length >= maxPathLength) {
        continue;
      }
      
      if (visited.has(criterionId)) {
        continue;
      }
      
      visited.add(criterionId);

      // Get criterion relationships
      const relationships = await this.getCriterionRelationships(criterionId, ['PREREQUISITE', 'ADVANCES_TO', 'RELATED']);
      
      for (const rel of relationships) {
        const targetId = rel.targetCriterionId;
        
        if (!visited.has(targetId)) {
          const newCost = cost + (1 - (rel.strength || 1.0));
          queue.push({
            criterionId: targetId,
            path: [...path, targetId],
            cost: newCost
          });
        }
      }
    }

    throw new Error(`No learning path found between criteria ${startCriterionId} and ${endCriterionId}`);
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Gets relationships for a knowledge primitive
   */
  async getRelationships(
    nodeId: string,
    relationshipTypes: RelationshipType[]
  ): Promise<any[]> {
    // Handle both string and integer IDs for testing
    const sourceId = isNaN(parseInt(nodeId)) ? nodeId : parseInt(nodeId);
    
    return this.prisma.knowledgeRelationship.findMany({
      where: {
        sourcePrimitiveId: sourceId,
        relationshipType: { in: relationshipTypes }
      }
    });
  }

  /**
   * Gets relationships for a mastery criterion
   */
  async getCriterionRelationships(
    criterionId: number,
    relationshipTypes: CriterionRelationshipType[]
  ): Promise<any[]> {
    return this.prisma.masteryCriterionRelationship.findMany({
      where: {
        sourceCriterionId: criterionId,
        relationshipType: { in: relationshipTypes }
      }
    });
  }

  /**
   * Maps a Prisma KnowledgePrimitive to a GraphNode
   */
  private mapToGraphNode(primitive: any): GraphNode {
    return {
      id: primitive.primitiveId || primitive.id, // Handle both Prisma and test data formats
      title: primitive.title,
      description: primitive.description,
      type: primitive.primitiveType as 'concept' | 'fact' | 'process',
      difficulty: primitive.difficultyLevel,
      estimatedTime: primitive.estimatedTimeMinutes || 0,
      complexityScore: primitive.complexityScore
    };
  }

  /**
   * Maps a Prisma MasteryCriterion to a GraphNode
   */
  private mapCriterionToGraphNode(criterion: any): GraphNode {
    return {
      id: criterion.id.toString(),
      title: criterion.title,
      description: criterion.description,
      type: 'concept',
      difficulty: 'intermediate',
      estimatedTime: 30,
      complexityScore: criterion.complexityScore,
      uueStage: criterion.uueStage // Add UUE stage for progression analysis
    };
  }

  /**
   * Analyzes UUE progression in a learning path
   */
  private analyzeUUEProgression(path: GraphNode[]): {
    understandCount: number;
    useCount: number;
    exploreCount: number;
    progressionOrder: string[];
    isOptimal: boolean;
  } {
    const stageCounts = {
      UNDERSTAND: 0,
      USE: 0,
      EXPLORE: 0
    };
    
    // Count actual UUE stages from the criteria
    path.forEach((node) => {
      if (node.uueStage) {
        const stage = node.uueStage.toUpperCase();
        if (stage in stageCounts) {
          stageCounts[stage as keyof typeof stageCounts]++;
        }
      }
    });

    const stages = ['UNDERSTAND', 'USE', 'EXPLORE'];
    const progressionOrder = stages.filter(stage => stageCounts[stage as keyof typeof stageCounts] > 0);
    const isOptimal = progressionOrder.length === stages.length && 
                      progressionOrder.every((stage, index) => stage === stages[index]);

    return {
      understandCount: stageCounts.UNDERSTAND,
      useCount: stageCounts.USE,
      exploreCount: stageCounts.EXPLORE,
      progressionOrder,
      isOptimal
    };
  }
}
