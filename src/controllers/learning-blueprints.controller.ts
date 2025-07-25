import { Response } from 'express';
import { AiRAGService } from '../ai-rag/ai-rag.service';
import prisma from '../lib/prisma';
const aiRagService = new AiRAGService(prisma);
import { AuthenticatedRequest } from '../types/express';

class LearningBlueprintsController {
  async createLearningBlueprint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const result = await aiRagService.createLearningBlueprint(
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
