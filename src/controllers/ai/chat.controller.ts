import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../../types/express';

const prisma = new PrismaClient();

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
