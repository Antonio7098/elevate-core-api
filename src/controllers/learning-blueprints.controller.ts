import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import prisma from '../lib/prisma';
import { AiRAGService } from '../ai-rag/ai-rag.service';
import { MindmapService } from '../services/mindmap.service';
import { getAIAPIClient } from '../services/ai-api-client.service';

export class LearningBlueprintsController {
  private mindmapService: MindmapService;
  private aiRagService: AiRAGService;

  constructor() {
    this.mindmapService = new MindmapService();
    this.aiRagService = new AiRAGService(prisma);
  }

  private getAiRagService(): AiRAGService {
    return this.aiRagService;
  }

  private getMindmapService(): MindmapService {
    return this.mindmapService;
  }

  createLearningBlueprint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    console.log('🔵 createLearningBlueprint called with body:', req.body);
    console.log('🔵 User info:', req.user);
    try {
      if (!req.user) {
        console.log('❌ User not authenticated');
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      // Use AI RAG service for intelligent blueprint generation
      const { sourceText, title, description } = req.body;
      if (!sourceText) {
        res.status(400).json({ message: 'sourceText is required' });
        return;
      }

      const blueprint = await this.getAiRagService().createLearningBlueprint(
        sourceText,
        req.user.userId,
        title,
        description
      );

      console.log('✅ Blueprint created successfully:', blueprint.id);
      res.status(201).json(blueprint);
    } catch (error) {
      console.log('❌ Error in createLearningBlueprint:', error);
      if (error instanceof Error) {
        console.log('❌ Error message:', error.message);
        res.status(500).json({ message: error.message });
      } else {
        console.log('❌ Unknown error type:', typeof error, error);
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  /**
   * GET /api/blueprints/:id/mindmap
   * Returns mindmap nodes/edges for a blueprint, dynamically generated from blueprint data.
   */
  async getBlueprintMindmap(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log(`🚀 [Mindmap] Starting getBlueprintMindmap for blueprint ${req.params.id}`);
    try {
      if (!req.user) {
        console.log(`❌ [Mindmap] User not authenticated`);
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const blueprintId = parseInt(req.params.id, 10);
      if (isNaN(blueprintId)) {
        console.log(`❌ [Mindmap] Invalid blueprint ID: ${req.params.id}`);
        res.status(400).json({ message: 'Invalid blueprint ID' });
        return;
      }

      console.log(`🔍 [Mindmap] Building mindmap for blueprint ${blueprintId} for user ${req.user.userId}`);

      console.log(`📊 [Mindmap] About to query database...`);
      const blueprint = await prisma.learningBlueprint.findFirst({
        where: { id: blueprintId, userId: req.user.userId },
      });
      console.log(`📊 [Mindmap] Database query completed, blueprint found: ${!!blueprint}`);
      
      if (!blueprint) {
        console.log(`❌ [Mindmap] Blueprint not found for ID ${blueprintId}`);
        res.status(404).json({ message: 'Blueprint not found' });
        return;
      }

      const bpJson: any = blueprint.blueprintJson || {};
      console.log(`📋 [Mindmap] Blueprint JSON structure:`, {
        hasSections: !!bpJson.sections,
        sectionsCount: bpJson.sections?.length || 0,
        hasKnowledgePrimitives: !!bpJson.knowledge_primitives,
        hasMetadata: !!bpJson.mindmap_metadata
      });
      
      // Generate mindmap dynamically from blueprint data using the service
      console.log(`🔄 [Mindmap] About to call buildMindmapFromBlueprint...`);
      const mindmap = this.getMindmapService().buildMindmapFromBlueprint(bpJson);
      console.log(`✅ [Mindmap] Mindmap generated successfully:`, {
        nodesCount: mindmap.nodes.length,
        edgesCount: mindmap.edges.length
      });
      
      console.log(`🔄 [Mindmap] About to call getDefaultColorScheme...`);
      const colorScheme = this.getMindmapService().getDefaultColorScheme();
      console.log(`✅ [Mindmap] Color scheme retrieved:`, colorScheme);
      
      console.log(`🔄 [Mindmap] About to call getDefaultLayoutHints...`);
      const layoutHints = this.getMindmapService().getDefaultLayoutHints();
      console.log(`✅ [Mindmap] Layout hints retrieved:`, layoutHints);
      
      const payload = {
        blueprintId: String(blueprintId),
        version: 1,
        nodes: mindmap.nodes,
        edges: mindmap.edges,
        metadata: {
          createdAt: blueprint.createdAt.toISOString(),
          updatedAt: blueprint.updatedAt.toISOString(),
          centralConcept: bpJson.mindmap_metadata?.central_concept || bpJson.title || 'Learning Blueprint',
          colorScheme: bpJson.mindmap_metadata?.color_scheme || colorScheme,
          layoutHints: bpJson.mindmap_metadata?.layout_hints || layoutHints
        },
      };
      
      console.log(`🔄 [Mindmap] About to send response...`);
      res.status(200).json(payload);
      console.log(`✅ [Mindmap] Response sent successfully`);
    } catch (error) {
      console.error(`❌ [Mindmap] Error building mindmap for blueprint ${req.params.id}:`, error);
      if (error instanceof Error) {
        res.status(500).json({ message: error.message, stack: error.stack });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  /**
   * PUT /api/blueprints/:id/mindmap
   * Updates blueprint data with new mindmap positions and metadata.
   * Note: This now updates the blueprint structure rather than storing separate mindmap data.
   */
  async updateBlueprintMindmap(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const blueprintId = parseInt(req.params.id, 10);
      if (isNaN(blueprintId)) {
        res.status(400).json({ message: 'Invalid blueprint ID' });
        return;
      }

      console.log(`🔄 [Mindmap] Updating mindmap for blueprint ${blueprintId} for user ${req.user.userId}`);

      const { nodes, edges, metadata } = req.body || {};
      if (!Array.isArray(nodes) || !Array.isArray(edges)) {
        res.status(400).json({ message: 'Invalid payload: nodes and edges must be arrays' });
        return;
      }

      console.log(`📋 [Mindmap] Received payload:`, {
        nodesCount: nodes.length,
        edgesCount: edges.length,
        hasMetadata: !!metadata
      });

      // Basic validation: unique ids, references integrity
      const nodeIds = new Set(nodes.map((n: any) => n.id));
      if (nodeIds.size !== nodes.length) {
        res.status(400).json({ message: 'Duplicate node ids are not allowed' });
        return;
      }
      for (const e of edges) {
        if (!nodeIds.has(e.source) || !nodeIds.has(e.target)) {
          res.status(400).json({ message: `Edge references unknown nodes: ${e.id || `${e.source}->${e.target}`}` });
          return;
        }
      }

      const blueprint = await prisma.learningBlueprint.findFirst({
        where: { id: blueprintId, userId: req.user.userId },
      });
      if (!blueprint) {
        res.status(404).json({ message: 'Blueprint not found' });
        return;
      }

      const bpJson: any = blueprint.blueprintJson || {};
      
      // Use the mindmap service to update the blueprint
      console.log(`🔄 [Mindmap] Calling updateBlueprintWithMindmap...`);
      const updatedJson = this.getMindmapService().updateBlueprintWithMindmap(bpJson, nodes, edges, metadata);
      console.log(`✅ [Mindmap] Blueprint updated successfully`);

      const updated = await prisma.learningBlueprint.update({
        where: { id: blueprintId },
        data: { blueprintJson: updatedJson },
      });

      // Return the updated mindmap
      console.log(`🔄 [Mindmap] Building updated mindmap...`);
      const updatedMindmap = this.getMindmapService().buildMindmapFromBlueprint(updatedJson);
      console.log(`✅ [Mindmap] Updated mindmap built successfully:`, {
        nodesCount: updatedMindmap.nodes.length,
        edgesCount: updatedMindmap.edges.length
      });
      
      res.status(200).json({
        blueprintId: String(blueprintId),
        version: 1,
        nodes: updatedMindmap.nodes,
        edges: updatedMindmap.edges,
        metadata: {
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
          centralConcept: updatedJson.mindmap_metadata?.central_concept || updatedJson.title || 'Learning Blueprint',
          colorScheme: updatedJson.mindmap_metadata?.color_scheme || this.getMindmapService().getDefaultColorScheme(),
          layoutHints: updatedJson.mindmap_metadata?.layout_hints || this.getMindmapService().getDefaultLayoutHints()
        },
      });
    } catch (error) {
      console.error(`❌ [Mindmap] Error updating mindmap for blueprint ${req.params.id}:`, error);
      if (error instanceof Error) {
        res.status(500).json({ message: error.message, stack: error.stack });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  /**
   * GET /api/blueprints/:id/mindmap/stats
   * Returns mindmap statistics for a specific blueprint
   */
  async getMindmapStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const blueprintId = parseInt(req.params.id, 10);
      if (isNaN(blueprintId)) {
        res.status(400).json({ message: 'Invalid blueprint ID' });
        return;
      }

      const blueprint = await prisma.learningBlueprint.findFirst({
        where: { id: blueprintId, userId: req.user.userId },
      });
      if (!blueprint) {
        res.status(404).json({ message: 'Blueprint not found' });
        return;
      }

      const bpJson: any = blueprint.blueprintJson || {};
      
      // Get blueprint-specific mindmap statistics
      const blueprintStats = this.getMindmapService().getBlueprintMindmapStats(bpJson);
      const serviceMetrics = this.getMindmapService().getPerformanceMetrics();
      const cacheStats = this.getMindmapService().getCacheStats();
      
      res.status(200).json({
        blueprintId: String(blueprintId),
        blueprintStats,
        serviceMetrics,
        cache: cacheStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  /**
   * DELETE /api/blueprints/:id/mindmap/cache
   * Clears the mindmap service cache for a specific blueprint
   */
  async clearMindmapCache(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const blueprintId = parseInt(req.params.id, 10);
      if (isNaN(blueprintId)) {
        res.status(400).json({ message: 'Invalid blueprint ID' });
        return;
      }

      // Clear the specific blueprint from cache if it exists
      const blueprint = await prisma.learningBlueprint.findFirst({
        where: { id: blueprintId, userId: req.user.userId },
      });
      if (!blueprint) {
        res.status(404).json({ message: 'Blueprint not found' });
        return;
      }

      // Clear the entire cache for now (could be optimized to clear specific blueprint)
      this.getMindmapService().clearCache();
      
      res.status(200).json({
        message: 'Mindmap cache cleared successfully',
        blueprintId: String(blueprintId),
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  /**
   * GET /api/blueprints/mindmap/service-stats
   * Returns general mindmap service performance metrics and statistics
   */
  async getMindmapServiceStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const performanceMetrics = this.getMindmapService().getPerformanceMetrics();
      const cacheStats = this.getMindmapService().getCacheStats();
      
      res.status(200).json({
        serviceMetrics: performanceMetrics,
        cache: cacheStats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  generateQuestionsFromBlueprint = async (
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const blueprintId = parseInt(req.params.blueprintId, 10);
      if (isNaN(blueprintId)) {
        res.status(400).json({ message: 'Invalid blueprint ID' });
        return;
      }

      // Use AI RAG service for intelligent question generation
      const { name, count } = req.body;
      if (!name) {
        res.status(400).json({ message: 'name is required' });
        return;
      }

      const questionSet = await this.getAiRagService().generateQuestionsFromBlueprint(
        req.user.userId,
        blueprintId,
        { name, count }
      );

      console.log('✅ Question set generated successfully:', questionSet.id);
      res.status(201).json(questionSet);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  generateNoteFromBlueprint = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const blueprintId = parseInt(req.params.blueprintId, 10);
      if (isNaN(blueprintId)) {
        res.status(400).json({ message: 'Invalid blueprint ID' });
        return;
      }

      // Use AI RAG service for intelligent note generation
      const { title } = req.body;
      if (!title) {
        res.status(400).json({ message: 'title is required' });
        return;
      }

      const note = await this.getAiRagService().generateNoteFromBlueprint(
        req.user.userId,
        blueprintId,
        { title }
      );

      console.log('✅ Note generated successfully:', note.id);
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  // CRUD Operations with AI API Integration
  async getAllLearningBlueprints(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      // Use Prisma directly since this method doesn't exist on AiRAGService
      const result = await prisma.learningBlueprint.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  async getLearningBlueprintById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const blueprintId = parseInt(req.params.id, 10);
      if (isNaN(blueprintId)) {
        res.status(400).json({ message: 'Invalid blueprint ID' });
        return;
      }
      // Use Prisma directly since this method doesn't exist on AiRAGService
      const result = await prisma.learningBlueprint.findFirst({
        where: { id: blueprintId, userId: req.user.userId },
      });
      if (!result) {
        res.status(404).json({ message: 'Blueprint not found' });
        return;
      }
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  async updateLearningBlueprint(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const blueprintId = parseInt(req.params.id, 10);
      if (isNaN(blueprintId)) {
        res.status(400).json({ message: 'Invalid blueprint ID' });
        return;
      }
      // Use Prisma directly since this method doesn't exist on AiRAGService
      const result = await prisma.learningBlueprint.update({
        where: { id: blueprintId, userId: req.user.userId },
        data: req.body,
      });
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  async deleteLearningBlueprint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const blueprintId = parseInt(req.params.id, 10);
      if (isNaN(blueprintId)) {
        res.status(400).json({ message: 'Invalid blueprint ID' });
        return;
      }
      // Use Prisma directly since this method doesn't exist on AiRAGService
      const success = await prisma.learningBlueprint.delete({
        where: { id: blueprintId, userId: req.user.userId },
      });
      res.status(200).json({ message: 'Blueprint deleted successfully', deletedBlueprint: success });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  // AI API Status Management
  async getBlueprintIndexingStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const blueprintId = parseInt(req.params.id, 10);
      if (isNaN(blueprintId)) {
        res.status(400).json({ message: 'Invalid blueprint ID' });
        return;
      }
      // Use the AIAPIClientService directly for this functionality
      try {
        const aiClient = getAIAPIClient();
        const result = await aiClient.getBlueprintStatus(blueprintId.toString());
        res.status(200).json(result);
      } catch (error) {
        if (error instanceof Error && error.message.includes('AI API client not initialized')) {
          res.status(503).json({ message: 'AI service is not available at the moment. Please try again later.' });
        } else {
          throw error; // Re-throw other errors to be handled by the outer catch block
        }
        return;
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  async reindexBlueprint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const blueprintId = parseInt(req.params.id, 10);
      if (isNaN(blueprintId)) {
        res.status(400).json({ message: 'Invalid blueprint ID' });
        return;
      }
      // Use the AIAPIClientService directly for this functionality
      try {
        const aiClient = getAIAPIClient();
        const result = await aiClient.indexBlueprint({
          blueprint_id: blueprintId.toString(),
          blueprint_json: {},
          force_reindex: true
        });
        res.status(200).json(result);
      } catch (error) {
        if (error instanceof Error && error.message.includes('AI API client not initialized')) {
          res.status(503).json({ message: 'AI service is not available at the moment. Please try again later.' });
        } else {
          throw error; // Re-throw other errors to be handled by the outer catch block
        }
        return;
      }
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }
}

// Export the class instead of an instance to avoid immediate instantiation
export default LearningBlueprintsController;
