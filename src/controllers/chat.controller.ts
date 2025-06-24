import { Response } from 'express';
import aiRagService from '../services/ai-rag.service';
import { AuthenticatedRequest } from '../types/express';

class ChatController {
  async handleChatMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      const result = await aiRagService.handleChatMessage(
        req.user.userId,
        req.body,
      );
      res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An unknown error occurred' });
      }
    }
  }
}

export default new ChatController();
