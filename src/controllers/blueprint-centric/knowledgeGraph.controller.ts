import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import KnowledgeGraphTraversal from '../../services/blueprint-centric/knowledgeGraphTraversal.service';
import ContextAssemblyService from '../../services/blueprint-centric/contextAssembly.service';
import RAGResponseGenerator from '../../services/blueprint-centric/ragResponseGenerator.service';
import VectorStoreService from '../../services/blueprint-centric/vectorStore.service';

const prisma = new PrismaClient();

export default class KnowledgeGraphController {
  
  private graphTraversal: KnowledgeGraphTraversal;
  private contextAssembly: ContextAssemblyService;
  private ragGenerator: RAGResponseGenerator;
  private vectorStore: VectorStoreService;
  
  constructor() {
    this.graphTraversal = new KnowledgeGraphTraversal();
    this.contextAssembly = new ContextAssemblyService();
    this.ragGenerator = new RAGResponseGenerator();
    this.vectorStore = new VectorStoreService();
  }
  
  /**
   * GET /api/knowledge-graph/:blueprintId
   * Get knowledge graph for a specific blueprint
   */
  async getKnowledgeGraph(req: Request, res: Response): Promise<void> {
    try {
      const { blueprintId } = req.params;
      const { maxDepth = 3 } = req.query;
      
      // For now, use placeholder data since new models aren't in current Prisma client
      const sections = [];
      const primitives = [];
      const relationships = [];
      
      // TODO: Uncomment when new schema is deployed
      /*
      const sections = await prisma.blueprintSection.findMany({
        where: { blueprintId: parseInt(blueprintId) },
        include: { notes: true, knowledgePrimitives: true, masteryCriteria: true }
      });
      
      const primitives = await prisma.knowledgePrimitive.findMany({
        where: { blueprintId: parseInt(blueprintId) },
        include: { prerequisiteForRelations: true, requiresPrerequisites: true }
      });
      
      const relationships = await prisma.knowledgeRelationship.findMany({
        where: {
          OR: [
            { sourcePrimitive: { blueprintId: parseInt(blueprintId) } },
            { targetPrimitive: { blueprintId: parseInt(blueprintId) } }
          ]
        }
      });
      */
      
      const graph = {
        blueprintId: parseInt(blueprintId),
        sections,
        primitives,
        relationships,
        metadata: {
          totalSections: sections.length,
          totalPrimitives: primitives.length,
          totalRelationships: relationships.length,
          maxDepth: parseInt(maxDepth as string)
        }
      };
      
      res.json({ success: true, data: graph });
      
    } catch (error) {
      console.error('Failed to get knowledge graph:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve knowledge graph'
      });
    }
  }
  
  /**
   * POST /api/knowledge-graph/traverse
   * Traverse knowledge graph from a starting node
   */
  async traverseGraph(req: Request, res: Response): Promise<void> {
    try {
      const { startNodeId, maxDepth = 3, relationshipTypes } = req.body;
      
      if (!startNodeId) {
        res.status(400).json({
          success: false,
          error: 'startNodeId is required'
        });
        return;
      }
      
      const traversalResult = await this.graphTraversal.traverseGraph(
        startNodeId,
        maxDepth,
        relationshipTypes || ['PREREQUISITE', 'RELATED', 'ADVANCES_TO']
      );
      
      res.json({ success: true, data: traversalResult });
      
    } catch (error) {
      console.error('Graph traversal failed:', error);
      res.status(500).json({
        success: false,
        error: 'Graph traversal failed'
      });
    }
  }
  
  /**
   * POST /api/knowledge-graph/rag/generate
   * Generate RAG response with context
   */
  async generateRAGResponse(req: Request, res: Response): Promise<void> {
    try {
      const { query, options = {} } = req.body;
      const userId = (req as any).user?.id || 1;
      
      if (!query) {
        res.status(400).json({
          success: false,
          error: 'Query is required'
        });
        return;
      }
      
      const ragResponse = await this.ragGenerator.generateRAGResponse(
        query,
        userId,
        options
      );
      
      res.json({ success: true, data: ragResponse });
      
    } catch (error) {
      console.error('RAG response generation failed:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate RAG response'
      });
    }
  }
  
  /**
   * POST /api/knowledge-graph/vector/search
   * Perform vector search
   */
  async vectorSearch(req: Request, res: Response): Promise<void> {
    try {
      const { query, filters = {} } = req.body;
      
      if (!query) {
        res.status(400).json({
          success: false,
          error: 'Query is required'
        });
        return;
      }
      
      const searchResults = await this.vectorStore.searchVectorStore(query, filters);
      
      res.json({ success: true, data: searchResults });
      
    } catch (error) {
      console.error('Vector search failed:', error);
      res.status(500).json({
        success: false,
        error: 'Vector search failed'
      });
    }
  }
  
  /**
   * POST /api/knowledge-graph/vector/index-blueprint/:blueprintId
   * Index all content for a blueprint
   */
  async indexBlueprintContent(req: Request, res: Response): Promise<void> {
    try {
      const { blueprintId } = req.params;
      
      const indexingResult = await this.vectorStore.indexBlueprintContent(
        parseInt(blueprintId)
      );
      
      res.json({ success: true, data: indexingResult });
      
    } catch (error) {
      console.error('Blueprint indexing failed:', error);
      res.status(500).json({
        success: false,
        error: 'Blueprint indexing failed'
      });
    }
  }
}

export { KnowledgeGraphController };
