import { PrismaClient } from '@prisma/client';
import KnowledgeGraphTraversal from '../../services/blueprint-centric/knowledgeGraphTraversal.service';
import { RelationshipType, CriterionRelationshipType } from '../../services/blueprint-centric/knowledgeGraphTraversal.service';

// Mock Prisma client
const mockPrisma = {
  knowledgeRelationship: {
    findMany: jest.fn(),
  },
  masteryCriterionRelationship: {
    findMany: jest.fn(),
  },
  knowledgePrimitive: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  masteryCriterion: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

// Mock the service with mocked Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
}));

describe('KnowledgeGraphTraversal', () => {
  let service: KnowledgeGraphTraversal;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = new KnowledgeGraphTraversal();
    // Inject mocked Prisma
    (service as any).prisma = mockPrisma;
  });

  describe('traverseGraph', () => {
    it('should traverse knowledge graph with breadth-first search', async () => {
      const startNodeId = 'node-1';
      const maxDepth = 2;
      const relationshipTypes: RelationshipType[] = ['PREREQUISITE', 'RELATED'];

      const relationships = [
        { sourcePrimitiveId: 'node-1', targetPrimitiveId: 'node-2', relationshipType: 'RELATED' },
        { sourcePrimitiveId: 'node-2', targetPrimitiveId: 'node-3', relationshipType: 'PREREQUISITE' },
        { sourcePrimitiveId: 'node-1', targetPrimitiveId: 'node-4', relationshipType: 'RELATED' }
      ];

      const nodes = [
        { id: 'node-1', title: 'Node 1' },
        { id: 'node-2', title: 'Node 2' },
        { id: 'node-3', title: 'Node 3' },
        { id: 'node-4', title: 'Node 4' }
      ];

      // Mock findMany to return relationships based on the source node
      mockPrisma.knowledgeRelationship.findMany.mockImplementation((args) => {
        const sourceId = args.where.sourcePrimitiveId;
        return Promise.resolve(relationships.filter(rel => rel.sourcePrimitiveId === sourceId));
      });
      mockPrisma.knowledgePrimitive.findUnique
        .mockResolvedValueOnce(nodes[0])
        .mockResolvedValueOnce(nodes[1])
        .mockResolvedValueOnce(nodes[2])
        .mockResolvedValueOnce(nodes[3]);

      const result = await service.traverseGraph(startNodeId, maxDepth, relationshipTypes);

      expect(result.nodes).toHaveLength(4);
      expect(result.edges).toHaveLength(3);
      expect(result.metadata.maxDepth).toBe(maxDepth);
      expect(result.metadata.totalNodes).toBe(4);
      expect(result.metadata.totalEdges).toBe(3);
    });

    it('should respect maxDepth constraint', async () => {
      const startNodeId = 'node-1';
      const maxDepth = 1;

      const relationships = [
        { sourcePrimitiveId: 'node-1', targetPrimitiveId: 'node-2', relationshipType: 'RELATED' },
        { sourcePrimitiveId: 'node-2', targetPrimitiveId: 'node-3', relationshipType: 'RELATED' }
      ];

      const nodes = [
        { id: 'node-1', title: 'Node 1' },
        { id: 'node-2', title: 'Node 2' }
      ];

      // Mock findMany to return relationships based on the source node
      mockPrisma.knowledgeRelationship.findMany.mockImplementation((args) => {
        const sourceId = args.where.sourcePrimitiveId;
        return Promise.resolve(relationships.filter(rel => rel.sourcePrimitiveId === sourceId));
      });
      mockPrisma.knowledgePrimitive.findUnique
        .mockResolvedValueOnce(nodes[0])
        .mockResolvedValueOnce(nodes[1]);

      const result = await service.traverseGraph(startNodeId, maxDepth);

      expect(result.nodes).toHaveLength(2); // Only depth 0 and 1
      expect(result.metadata.maxDepth).toBe(maxDepth);
    });

    it('should handle empty relationships gracefully', async () => {
      const startNodeId = 'node-1';
      mockPrisma.knowledgeRelationship.findMany.mockResolvedValue([]);
      mockPrisma.knowledgePrimitive.findUnique.mockResolvedValue({ id: 'node-1', title: 'Node 1' });

      const result = await service.traverseGraph(startNodeId);

      expect(result.nodes).toHaveLength(1);
      expect(result.edges).toHaveLength(0);
      expect(result.metadata.totalNodes).toBe(1);
      expect(result.metadata.totalEdges).toBe(0);
    });

    it('should prevent infinite loops with visited set', async () => {
      const startNodeId = 'node-1';
      
      // Create circular relationship
      const relationships = [
        { sourcePrimitiveId: 'node-1', targetPrimitiveId: 'node-2', relationshipType: 'RELATED' },
        { sourcePrimitiveId: 'node-2', targetPrimitiveId: 'node-1', relationshipType: 'RELATED' }
      ];

      const nodes = [
        { id: 'node-1', title: 'Node 1' },
        { id: 'node-2', title: 'Node 2' }
      ];

      // Mock findMany to return relationships based on the source node
      mockPrisma.knowledgeRelationship.findMany.mockImplementation((args) => {
        const sourceId = args.where.sourcePrimitiveId;
        return Promise.resolve(relationships.filter(rel => rel.sourcePrimitiveId === sourceId));
      });
      mockPrisma.knowledgePrimitive.findUnique
        .mockResolvedValueOnce(nodes[0])
        .mockResolvedValueOnce(nodes[1]);

      const result = await service.traverseGraph(startNodeId);

      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(2);
      // Should not get stuck in infinite loop
    });
  });

  describe('findPrerequisiteChain', () => {
    it('should find complete prerequisite chain', async () => {
      const targetNodeId = 'target-node';
      
      const relationships = [
        { sourcePrimitiveId: 'target-node', targetPrimitiveId: 'prereq-1', relationshipType: 'PREREQUISITE' },
        { sourcePrimitiveId: 'prereq-1', targetPrimitiveId: 'prereq-2', relationshipType: 'PREREQUISITE' }
      ];

      const nodes = [
        { id: 'target-node', title: 'Target Node', complexityScore: 3 },
        { id: 'prereq-1', title: 'Prerequisite 1', complexityScore: 2 },
        { id: 'prereq-2', title: 'Prerequisite 2', complexityScore: 1 }
      ];

      // Mock findMany to return relationships based on the source node
      mockPrisma.knowledgeRelationship.findMany.mockImplementation((args) => {
        const sourceId = args.where.sourcePrimitiveId;
        return Promise.resolve(relationships.filter(rel => rel.sourcePrimitiveId === sourceId));
      });
      // Mock findUnique to return nodes based on the ID
      mockPrisma.knowledgePrimitive.findUnique.mockImplementation((args) => {
        const id = args.where.primitiveId;
        const node = nodes.find(n => n.id === id);
        return Promise.resolve(node || null);
      });

      const result = await service.findPrerequisiteChain(targetNodeId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('prereq-2'); // Lowest complexity first
      expect(result[1].id).toBe('prereq-1');
    });

    it('should handle nodes without prerequisites', async () => {
      const targetNodeId = 'simple-node';
      mockPrisma.knowledgeRelationship.findMany.mockResolvedValue([]);
      mockPrisma.knowledgePrimitive.findUnique.mockResolvedValue({ id: 'simple-node', title: 'Simple Node' });

      const result = await service.findPrerequisiteChain(targetNodeId);

      expect(result).toHaveLength(0);
    });

    it('should sort prerequisites by complexity score', async () => {
      const targetNodeId = 'target-node';
      
      const relationships = [
        { sourcePrimitiveId: 'target-node', targetPrimitiveId: 'prereq-1', relationshipType: 'PREREQUISITE' },
        { sourcePrimitiveId: 'target-node', targetPrimitiveId: 'prereq-2', relationshipType: 'PREREQUISITE' }
      ];

      const nodes = [
        { id: 'target-node', title: 'Target Node', complexityScore: 3 },
        { id: 'prereq-1', title: 'Prerequisite 1', complexityScore: 2 },
        { id: 'prereq-2', title: 'Prerequisite 2', complexityScore: 1 }
      ];

      // Mock findMany to return relationships based on the source node
      mockPrisma.knowledgeRelationship.findMany.mockImplementation((args) => {
        const sourceId = args.where.sourcePrimitiveId;
        return Promise.resolve(relationships.filter(rel => rel.sourcePrimitiveId === sourceId));
      });
      // Mock findUnique to return nodes based on the ID
      mockPrisma.knowledgePrimitive.findUnique.mockImplementation((args) => {
        const id = args.where.primitiveId;
        const node = nodes.find(n => n.id === id);
        return Promise.resolve(node || null);
      });

      const result = await service.findPrerequisiteChain(targetNodeId);

      expect(result).toHaveLength(2);
      expect(result[0].complexityScore).toBeLessThan(result[1].complexityScore);
    });
  });

  describe('findLearningPath', () => {
    it('should find optimal learning path between concepts', async () => {
      const startNodeId = 'start-node';
      const endNodeId = 'end-node';
      const maxPathLength = 5;

      const relationships = [
        { sourcePrimitiveId: 'start-node', targetPrimitiveId: 'intermediate-1', relationshipType: 'ADVANCES_TO', strength: 0.8 },
        { sourcePrimitiveId: 'intermediate-1', targetPrimitiveId: 'end-node', relationshipType: 'ADVANCES_TO', strength: 0.7 },
        { sourcePrimitiveId: 'start-node', targetPrimitiveId: 'alternative-path', relationshipType: 'RELATED', strength: 0.6 }
      ];

      const nodes = [
        { id: 'start-node', title: 'Start Node' },
        { id: 'intermediate-1', title: 'Intermediate 1' },
        { id: 'end-node', title: 'End Node' }
      ];

      // Mock findMany to return relationships based on the source node
      mockPrisma.knowledgeRelationship.findMany.mockImplementation((args) => {
        const sourceId = args.where.sourcePrimitiveId;
        return Promise.resolve(relationships.filter(rel => rel.sourcePrimitiveId === sourceId));
      });
      // Mock findUnique to return nodes based on the ID
      mockPrisma.knowledgePrimitive.findUnique.mockImplementation((args) => {
        const id = args.where.primitiveId;
        const node = nodes.find(n => n.id === id);
        return Promise.resolve(node || null);
      });

      const result = await service.findLearningPath(startNodeId, endNodeId, maxPathLength);

      console.log('Result path:', result.path.map(n => n.id));
      console.log('Result cost:', result.cost);
      
      expect(result.path).toHaveLength(3);
      expect(result.path[0].id).toBe('start-node');
      expect(result.path[1].id).toBe('intermediate-1');
      expect(result.path[2].id).toBe('end-node');
      expect(result.cost).toBeGreaterThan(0);
    });

    it('should handle no path found scenario', async () => {
      const startNodeId = 'start-node';
      const endNodeId = 'unreachable-node';
      
      mockPrisma.knowledgeRelationship.findMany.mockResolvedValue([]);

      await expect(service.findLearningPath(startNodeId, endNodeId)).rejects.toThrow(
        'No learning path found between start-node and unreachable-node'
      );
    });

    it('should respect maxPathLength constraint', async () => {
      const startNodeId = 'start-node';
      const endNodeId = 'end-node';
      const maxPathLength = 2;

      const relationships = [
        { sourcePrimitiveId: 'start-node', targetPrimitiveId: 'intermediate-1', relationshipType: 'ADVANCES_TO' },
        { sourcePrimitiveId: 'intermediate-1', targetPrimitiveId: 'intermediate-2', relationshipType: 'ADVANCES_TO' },
        { sourcePrimitiveId: 'intermediate-2', targetPrimitiveId: 'end-node', relationshipType: 'ADVANCES_TO' }
      ];

      // Mock findMany to return relationships based on the source node
      mockPrisma.knowledgeRelationship.findMany.mockImplementation((args) => {
        const sourceId = args.where.sourcePrimitiveId;
        return Promise.resolve(relationships.filter(rel => rel.sourcePrimitiveId === sourceId));
      });

      await expect(service.findLearningPath(startNodeId, endNodeId, maxPathLength)).rejects.toThrow(
        'No learning path found between start-node and end-node'
      );
    });

    it('should calculate path cost based on relationship strength', async () => {
      const startNodeId = 'start-node';
      const endNodeId = 'end-node';

      const relationships = [
        { 
          sourcePrimitiveId: 'start-node', 
          targetPrimitiveId: 'end-node', 
          relationshipType: 'ADVANCES_TO',
          strength: 0.8
        }
      ];

      const nodes = [
        { id: 'start-node', title: 'Start Node' },
        { id: 'end-node', title: 'End Node' }
      ];

      // Mock findMany to return relationships based on the source node
      mockPrisma.knowledgeRelationship.findMany.mockImplementation((args) => {
        const sourceId = args.where.sourcePrimitiveId;
        return Promise.resolve(relationships.filter(rel => rel.sourcePrimitiveId === sourceId));
      });
      mockPrisma.knowledgePrimitive.findUnique
        .mockResolvedValueOnce(nodes[0])
        .mockResolvedValueOnce(nodes[1]);

      const result = await service.findLearningPath(startNodeId, endNodeId);

      expect(result.cost).toBe(0.2); // 1 - 0.8 = 0.2
    });
  });

  describe('findCriterionLearningPath', () => {
    it('should find learning path between mastery criteria', async () => {
      const startCriterionId = 1;
      const endCriterionId = 3;
      const maxPathLength = 5;

      const relationships = [
        { sourceCriterionId: 1, targetCriterionId: 2, relationshipType: 'ADVANCES_TO', strength: 0.9 },
        { sourceCriterionId: 2, targetCriterionId: 3, relationshipType: 'ADVANCES_TO', strength: 0.8 }
      ];

      const criteria = [
        { id: 1, title: 'Criterion 1', uueStage: 'UNDERSTAND' },
        { id: 2, title: 'Criterion 2', uueStage: 'USE' },
        { id: 3, title: 'Criterion 3', uueStage: 'EXPLORE' }
      ];

      // Mock findMany to return relationships based on the source criterion
      mockPrisma.masteryCriterionRelationship.findMany.mockImplementation((args) => {
        const sourceId = args.where.sourceCriterionId;
        return Promise.resolve(relationships.filter(rel => rel.sourceCriterionId === sourceId));
      });
      mockPrisma.masteryCriterion.findUnique
        .mockResolvedValueOnce(criteria[0])
        .mockResolvedValueOnce(criteria[1])
        .mockResolvedValueOnce(criteria[2]);

      const result = await service.findCriterionLearningPath(startCriterionId, endCriterionId, maxPathLength);

      expect(result.path).toHaveLength(3);
      expect(result.path[0].id).toBe('1');
      expect(result.path[1].id).toBe('2');
      expect(result.path[2].id).toBe('3');
      expect(result.ueeProgression).toBeDefined();
    });

    it('should analyze UUE progression correctly', async () => {
      const startCriterionId = 1;
      const endCriterionId = 3;

      const relationships = [
        { sourceCriterionId: 1, targetCriterionId: 2, relationshipType: 'ADVANCES_TO' },
        { sourceCriterionId: 2, targetCriterionId: 3, relationshipType: 'ADVANCES_TO' }
      ];

      const criteria = [
        { id: 1, title: 'Criterion 1', uueStage: 'UNDERSTAND' },
        { id: 2, title: 'Criterion 2', uueStage: 'USE' },
        { id: 3, title: 'Criterion 3', uueStage: 'EXPLORE' }
      ];

      // Mock findMany to return relationships based on the source criterion
      mockPrisma.masteryCriterionRelationship.findMany.mockImplementation((args) => {
        const sourceId = args.where.sourceCriterionId;
        return Promise.resolve(relationships.filter(rel => rel.sourceCriterionId === sourceId));
      });
      mockPrisma.masteryCriterion.findUnique
        .mockResolvedValueOnce(criteria[0])
        .mockResolvedValueOnce(criteria[1])
        .mockResolvedValueOnce(criteria[2]);

      const result = await service.findCriterionLearningPath(startCriterionId, endCriterionId);

      expect(result.ueeProgression.understandCount).toBe(1);
      expect(result.ueeProgression.useCount).toBe(1);
      expect(result.ueeProgression.exploreCount).toBe(1);
      expect(result.ueeProgression.progressionOrder).toEqual(['UNDERSTAND', 'USE', 'EXPLORE']);
      expect(result.ueeProgression.isOptimal).toBe(true);
    });

    it('should handle non-optimal UUE progression', async () => {
      const startCriterionId = 1;
      const endCriterionId = 3;

      const relationships = [
        { sourceCriterionId: 1, targetCriterionId: 3, relationshipType: 'ADVANCES_TO' }
      ];

      const criteria = [
        { id: 1, title: 'Criterion 1', uueStage: 'UNDERSTAND' },
        { id: 3, title: 'Criterion 3', uueStage: 'EXPLORE' }
      ];

      // Mock findMany to return relationships based on the source criterion
      mockPrisma.masteryCriterionRelationship.findMany.mockImplementation((args) => {
        const sourceId = args.where.sourceCriterionId;
        return Promise.resolve(relationships.filter(rel => rel.sourceCriterionId === sourceId));
      });
      mockPrisma.masteryCriterion.findUnique
        .mockResolvedValueOnce(criteria[0])
        .mockResolvedValueOnce(criteria[1]);

      const result = await service.findCriterionLearningPath(startCriterionId, endCriterionId);

      expect(result.ueeProgression.isOptimal).toBe(false);
      expect(result.ueeProgression.progressionOrder).toEqual(['UNDERSTAND', 'EXPLORE']);
    });
  });

  describe('utility methods', () => {
    it('should get relationships by type correctly', async () => {
      const nodeId = 'node-1';
      const relationshipTypes: RelationshipType[] = ['PREREQUISITE', 'RELATED'];

      const relationships = [
        { sourcePrimitiveId: 'node-1', targetPrimitiveId: 'node-2', relationshipType: 'PREREQUISITE' },
        { sourcePrimitiveId: 'node-1', targetPrimitiveId: 'node-3', relationshipType: 'RELATED' },
        { sourcePrimitiveId: 'node-1', targetPrimitiveId: 'node-4', relationshipType: 'ADVANCES_TO' }
      ];

      // Mock findMany to return relationships based on the source node
      mockPrisma.knowledgeRelationship.findMany.mockImplementation((args) => {
        const sourceId = args.where.sourcePrimitiveId;
        return Promise.resolve(relationships.filter(rel => rel.sourcePrimitiveId === sourceId));
      });

      const result = await (service as any).getRelationships(nodeId, relationshipTypes);

      expect(result).toHaveLength(3);
      expect(result[0].relationshipType).toBe('PREREQUISITE');
      expect(result[1].relationshipType).toBe('RELATED');
      expect(result[2].relationshipType).toBe('ADVANCES_TO');
    });

    it('should get criterion relationships by type correctly', async () => {
      const criterionId = 1;
      const relationshipTypes: CriterionRelationshipType[] = ['ADVANCES_TO', 'RELATED'];

      const relationships = [
        { sourceCriterionId: 1, targetCriterionId: 2, relationshipType: 'ADVANCES_TO' },
        { sourceCriterionId: 1, targetCriterionId: 3, relationshipType: 'RELATED' }
      ];

      // Mock findMany to return relationships based on the source criterion
      mockPrisma.masteryCriterionRelationship.findMany.mockImplementation((args) => {
        const sourceId = args.where.sourceCriterionId;
        return Promise.resolve(relationships.filter(rel => rel.sourceCriterionId === sourceId));
      });

      const result = await (service as any).getCriterionRelationships(criterionId, relationshipTypes);

      expect(result).toHaveLength(2);
      expect(result[0].relationshipType).toBe('ADVANCES_TO');
      expect(result[1].relationshipType).toBe('RELATED');
    });
  });

  describe('performance considerations', () => {
    it('should handle large graphs efficiently', async () => {
      const startNodeId = 'node-1';
      const maxDepth = 3;

      // Create a large graph with 1000 nodes
      const largeRelationships = Array.from({ length: 1000 }, (_, i) => ({
        sourcePrimitiveId: `node-${i}`,
        targetPrimitiveId: `node-${i + 1}`,
        relationshipType: 'RELATED'
      }));

      const largeNodes = Array.from({ length: 1000 }, (_, i) => ({
        id: `node-${i}`,
        title: `Node ${i}`
      }));

      // Mock findMany to return relationships based on the source node
      mockPrisma.knowledgeRelationship.findMany.mockImplementation((args) => {
        const sourceId = args.where.sourcePrimitiveId;
        return Promise.resolve(largeRelationships.filter(rel => rel.sourcePrimitiveId === sourceId));
      });
      mockPrisma.knowledgePrimitive.findUnique.mockImplementation((args) => {
        const id = args.where.primitiveId;
        const index = parseInt(id.split('-')[1]);
        return Promise.resolve(largeNodes[index] || null);
      });

      const startTime = Date.now();
      const result = await service.traverseGraph(startNodeId, maxDepth);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle deep graphs efficiently', async () => {
      const startNodeId = 'node-1';
      const maxDepth = 10;

      // Create a deep chain of relationships
      const deepRelationships = Array.from({ length: 20 }, (_, i) => ({
        sourcePrimitiveId: `node-${i}`,
        targetPrimitiveId: `node-${i + 1}`,
        relationshipType: 'PREREQUISITE'
      }));

      const deepNodes = Array.from({ length: 21 }, (_, i) => ({
        id: `node-${i}`,
        title: `Node ${i}`
      }));

      // Mock findMany to return relationships based on the source node
      mockPrisma.knowledgeRelationship.findMany.mockImplementation((args) => {
        const sourceId = args.where.sourcePrimitiveId;
        return Promise.resolve(deepRelationships.filter(rel => rel.sourcePrimitiveId === sourceId));
      });
      mockPrisma.knowledgePrimitive.findUnique.mockImplementation((args) => {
        const id = args.where.primitiveId;
        const index = parseInt(id.split('-')[1]);
        return Promise.resolve(deepNodes[index] || null);
      });

      const startTime = Date.now();
      const result = await service.traverseGraph(startNodeId, maxDepth);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      const startNodeId = 'node-1';
      
      mockPrisma.knowledgeRelationship.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.traverseGraph(startNodeId)).rejects.toThrow('Database connection failed');
    });

    it('should handle invalid node IDs gracefully', async () => {
      const startNodeId = 'invalid-node';
      
      mockPrisma.knowledgeRelationship.findMany.mockResolvedValue([]);
      mockPrisma.knowledgePrimitive.findUnique.mockResolvedValue(null);

      const result = await service.traverseGraph(startNodeId);

      expect(result.nodes).toHaveLength(0);
      expect(result.edges).toHaveLength(0);
    });
  });
});
