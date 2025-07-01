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
}

export default new LearningBlueprintsController();
