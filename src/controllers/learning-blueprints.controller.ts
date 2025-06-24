import { Response } from 'express';
import aiRagService from '../services/ai-rag.service';
import { AuthenticatedRequest } from '../types/express';

class LearningBlueprintsController {
  async createLearningBlueprint(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const result = await aiRagService.createLearningBlueprint(
        req.user.userId,
        req.body,
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
        req.user.userId,
        blueprintId,
        req.body,
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
        req.user.userId,
        blueprintId,
        req.body,
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
