import { Response } from 'express';
import { AiRAGService } from '../ai-rag/ai-rag.service';
import prisma from '../lib/prisma';
const aiRagService = new AiRAGService(prisma);
import { AuthenticatedRequest } from '../types/express';

class LearningBlueprintsController {
  async createLearningBlueprint(req: AuthenticatedRequest, res: Response): Promise<void> {
    console.log('🔵 createLearningBlueprint called with body:', req.body);
    console.log('🔵 User info:', req.user);
    try {
      if (!req.user) {
        console.log('❌ User not authenticated');
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      console.log('✅ User authenticated, calling aiRagService...');
      const result = await aiRagService.createLearningBlueprint(
        req.body,
        req.user.userId,
      );
      console.log('✅ aiRagService successful, returning result');
      res.status(201).json(result);
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
   * Returns mindmap nodes/edges for a blueprint. If mindmap not present, derives a basic one from blueprintJson.
   */
  async getBlueprintMindmap(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const existingMindmap = bpJson.mindmap;
      if (existingMindmap && Array.isArray(existingMindmap.nodes) && Array.isArray(existingMindmap.edges)) {
        const payload = {
          blueprintId: String(blueprintId),
          version: typeof existingMindmap.version === 'number' ? existingMindmap.version : 1,
          nodes: existingMindmap.nodes,
          edges: existingMindmap.edges,
          metadata: {
            createdAt: blueprint.createdAt.toISOString(),
            updatedAt: blueprint.updatedAt.toISOString(),
          },
        };
        res.status(200).json(payload);
        return;
      }

      // Derive a naive mindmap from blueprintJson when none exists
      const derived = this.deriveMindmapFromBlueprintJson(bpJson);
      const payload = {
        blueprintId: String(blueprintId),
        version: 1,
        nodes: derived.nodes,
        edges: derived.edges,
        metadata: {
          createdAt: blueprint.createdAt.toISOString(),
          updatedAt: blueprint.updatedAt.toISOString(),
        },
      };
      res.status(200).json(payload);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  /**
   * PUT /api/blueprints/:id/mindmap
   * Accepts mindmap nodes/edges and persists them into blueprintJson.mindmap
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

      const { version, nodes, edges } = req.body || {};
      if (!Array.isArray(nodes) || !Array.isArray(edges)) {
        res.status(400).json({ message: 'Invalid payload: nodes and edges must be arrays' });
        return;
      }

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
      const seenEdges = new Set<string>();
      for (const e of edges) {
        const key = `${e.source}->${e.target}|${e.data?.relationType || ''}`;
        if (seenEdges.has(key)) {
          res.status(400).json({ message: 'Duplicate edges are not allowed' });
          return;
        }
        seenEdges.add(key);
      }

      const blueprint = await prisma.learningBlueprint.findFirst({
        where: { id: blueprintId, userId: req.user.userId },
      });
      if (!blueprint) {
        res.status(404).json({ message: 'Blueprint not found' });
        return;
      }

      const bpJson: any = blueprint.blueprintJson || {};
      bpJson.mindmap = {
        version: typeof version === 'number' ? version : 1,
        nodes,
        edges,
      };

      const updated = await prisma.learningBlueprint.update({
        where: { id: blueprintId },
        data: { blueprintJson: bpJson },
      });

      res.status(200).json({
        blueprintId: String(blueprintId),
        version: bpJson.mindmap.version,
        nodes,
        edges,
        metadata: {
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  // Helper to derive a basic mindmap when not present
  private deriveMindmapFromBlueprintJson(bpJson: any): { nodes: any[]; edges: any[] } {
    const nodes: any[] = [];
    const edges: any[] = [];

    try {
      const sections = bpJson?.sections ?? [];
      for (const s of sections) {
        if (s?.section_id) {
          nodes.push({
            id: String(s.section_id),
            type: 'section',
            data: { title: s.section_name || String(s.section_id), description: s.description || null },
            position: { x: 0, y: 0 },
            parentId: s.parent_section_id ? String(s.parent_section_id) : null,
          });
        }
      }

      const kp = bpJson?.knowledge_primitives ?? {};
      const addPrimitiveNodes = (arr: any[], type: string, getTitle: (p: any) => string, getDesc?: (p: any) => string | null) => {
        for (const p of arr ?? []) {
          const id = p?.id || p?.primitiveId;
          if (!id) continue;
          nodes.push({
            id: String(id),
            type,
            data: {
              title: getTitle(p),
              description: getDesc ? getDesc(p) : null,
              primitiveType: p?.primitiveType ?? undefined,
            },
            position: { x: 0, y: 0 },
          });
        }
      };

      addPrimitiveNodes(kp.key_propositions_and_facts, 'proposition', (p) => p.statement || p.title || String(p.id), (p) => (Array.isArray(p.supporting_evidence) ? p.supporting_evidence[0] : null));
      addPrimitiveNodes(kp.key_entities_and_definitions, 'entity', (p) => p.entity || p.title || String(p.id), (p) => p.definition || null);
      addPrimitiveNodes(kp.described_processes_and_steps, 'process', (p) => p.process_name || p.title || String(p.id), (p) => Array.isArray(p.steps) ? p.steps.join(' → ') : null);

      const rels: any[] = kp.identified_relationships ?? [];
      for (const r of rels) {
        const src = r?.source_primitive_id;
        const tgt = r?.target_primitive_id;
        if (!src || !tgt) continue;
        const id = r?.id || `${src}->${tgt}`;
        edges.push({ id: String(id), source: String(src), target: String(tgt), type: 'default', data: { relationType: r?.relationship_type || 'custom' } });
      }
    } catch (e) {
      // If derivation fails, return empty arrays
      return { nodes: [], edges: [] };
    }

    return { nodes, edges };
  }

  async generateQuestionsFromBlueprint(
    req: AuthenticatedRequest,
    res: Response,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const blueprintId = parseInt(req.params.blueprintId, 10);
      const result = await aiRagService.generateQuestionsFromBlueprint(
        blueprintId,
        req.body,
        req.user.userId,
      );
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }

  async generateNoteFromBlueprint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const blueprintId = parseInt(req.params.blueprintId, 10);
      const result = await aiRagService.generateNoteFromBlueprint(
        blueprintId,
        req.body,
        req.user.userId,
      );
      res.status(201).json(result);
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
      const result = await aiRagService.getAllLearningBlueprintsForUser(req.user.userId);
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
      const result = await aiRagService.getLearningBlueprintById(blueprintId, req.user.userId);
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

  async updateLearningBlueprint(req: AuthenticatedRequest, res: Response): Promise<void> {
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
      const result = await aiRagService.updateLearningBlueprint(
        blueprintId,
        req.body,
        req.user.userId,
      );
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
      const success = await aiRagService.deleteLearningBlueprint(blueprintId, req.user.userId);
      if (!success) {
        res.status(404).json({ message: 'Blueprint not found' });
        return;
      }
      res.status(204).send();
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
      const result = await aiRagService.getBlueprintIndexingStatus(blueprintId, req.user.userId);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('access denied')) {
          res.status(404).json({ message: error.message });
        } else {
          res.status(500).json({ message: error.message });
        }
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
      const result = await aiRagService.reindexBlueprint(blueprintId, req.user.userId);
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('access denied')) {
          res.status(404).json({ message: error.message });
        } else {
          res.status(500).json({ message: error.message });
        }
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }
}

export default new LearningBlueprintsController();
