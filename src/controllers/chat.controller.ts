import { Response } from 'express';
// import { AiRAGService } from '../ai-rag/ai-rag.service';
import prisma from '../lib/prisma';
// const aiRagService = new AiRAGService(prisma);
import { AuthenticatedRequest } from '../types/express';

class ChatController {
  async handleChatMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }
      // const result = await aiRagService.handleChatMessage(
      //   req.body,
      //   req.user.userId,
      // );
      // res.status(200).json(result);
      res.status(200).json({ message: 'Chat functionality temporarily disabled' });
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
