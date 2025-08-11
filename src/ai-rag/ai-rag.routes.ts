import express, { Router, Request, Response, NextFunction } from 'express';
// // import { AiRAGService } from './ai-rag.service';
import prisma from '../lib/prisma'; // Import Prisma client (default export)
import { CreateLearningBlueprintDto } from './dtos/create-learning-blueprint.dto';
import { validationMiddleware } from '../middlewares/validation.middleware';
import { GenerateQuestionsFromBlueprintDto } from './dtos/generate-questions-from-blueprint.dto';
import { GenerateNoteFromBlueprintDto } from './dtos/generate-note-from-blueprint.dto';
import { UpdateLearningBlueprintDto } from './dtos/update-learning-blueprint.dto';
import { ChatMessageDto } from './dtos/chat-message.dto';
import { HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger'; // Swagger imports

// Interface for authenticated requests (matches the main app's AuthRequest)
interface RequestWithUser extends Request {
  user?: {
    userId: number;
  };
}

const aiRagRouter = Router();
console.log('🚀 AI RAG ROUTER: Loading aiRagRouter module (TEMPORARILY DISABLED)');
// // const aiRagService = new AiRAGService(prisma);
console.log('🚀 AI RAG ROUTER: aiRagService instance creation skipped (TEMPORARILY DISABLED)');

// Add logging middleware to trace all requests to this router
aiRagRouter.use((req, res, next) => {
  console.log(`🔍 AI RAG ROUTER: Incoming request - ${req.method} ${req.originalUrl}`);
  console.log(`🔍 AI RAG ROUTER: Request path: ${req.path}`);
  next();
});

// List all Learning Blueprints for the authenticated user
aiRagRouter.get('/learning-blueprints', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  res.status(501).json({ message: 'Learning blueprints functionality temporarily disabled' });
});

// Get a specific Learning Blueprint by ID
aiRagRouter.get('/learning-blueprints/:blueprintId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  res.status(501).json({ message: 'Learning blueprint retrieval temporarily disabled' });
});

// Create a new Learning Blueprint
aiRagRouter.post(
  '/learning-blueprints',
  validationMiddleware(CreateLearningBlueprintDto),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.status(501).json({ message: 'Learning blueprint creation temporarily disabled' });
  });

// Update a Learning Blueprint
aiRagRouter.put(
  '/learning-blueprints/:blueprintId',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.status(501).json({ message: 'Learning blueprint update temporarily disabled' });
  }
);

// Delete a Learning Blueprint
aiRagRouter.delete('/learning-blueprints/:blueprintId', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  res.status(501).json({ message: 'Learning blueprint deletion temporarily disabled' });
});

// Generate a new Question Set from a Learning Blueprint
aiRagRouter.post('/learning-blueprints/:blueprintId/question-sets', validationMiddleware(GenerateQuestionsFromBlueprintDto), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.status(501).json({ message: 'Question generation temporarily disabled' });
});

// Generate a new Note from a Learning Blueprint
aiRagRouter.post('/learning-blueprints/:blueprintId/notes', validationMiddleware(GenerateNoteFromBlueprintDto), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.status(501).json({ message: 'Note generation temporarily disabled' });
});

// Handle a chat message
aiRagRouter.post('/chat/message', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    res.status(501).json({ message: 'Chat functionality temporarily disabled' });
});

export { aiRagRouter };
