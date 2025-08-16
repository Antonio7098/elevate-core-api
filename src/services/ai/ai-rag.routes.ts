import express, { Router, Request, Response, NextFunction } from 'express';
import { AiRAGService } from './ai-rag.service';
import prisma from '../../lib/prisma';
import { CreateLearningBlueprintDto } from './dtos/create-learning-blueprint.dto';
import { validationMiddleware } from '../../middlewares/validation.middleware';
import { GenerateQuestionsFromBlueprintDto } from './dtos/generate-questions-from-blueprint.dto';
import { GenerateNoteFromBlueprintDto } from './dtos/generate-note-from-blueprint.dto';
import { UpdateLearningBlueprintDto } from './dtos/update-learning-blueprint.dto';
import { ChatMessageDto } from './dtos/chat-message.dto';

// Interface for authenticated requests
interface RequestWithUser extends Request {
  user?: {
    userId: number;
  };
}

const aiRagRouter = Router();
const aiRagService = new AiRAGService(prisma);

console.log('🚀 AI RAG ROUTER: Loading aiRagRouter module (ENABLED)');
console.log('🚀 AI RAG ROUTER: aiRagService instance created successfully');

// Add logging middleware to trace all requests to this router
aiRagRouter.use((req, res, next) => {
  console.log(`🔍 AI RAG ROUTER: Incoming request - ${req.method} ${req.originalUrl}`);
  console.log(`🔍 AI RAG ROUTER: Request path: ${req.path}`);
  next();
});

// List all Learning Blueprints for the authenticated user
aiRagRouter.get('/learning-blueprints', async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const blueprints = await prisma.learningBlueprint.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json(blueprints);
  } catch (error) {
    next(error);
  }
});

// Get a specific Learning Blueprint by ID
aiRagRouter.get('/learning-blueprints/:blueprintId', async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
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

    const blueprint = await prisma.learningBlueprint.findFirst({
      where: { id: blueprintId, userId: req.user.userId }
    });

    if (!blueprint) {
      res.status(404).json({ message: 'Blueprint not found' });
      return;
    }

    res.status(200).json(blueprint);
  } catch (error) {
    next(error);
  }
});

// Create a new Learning Blueprint
aiRagRouter.post(
  '/learning-blueprints',
  validationMiddleware(CreateLearningBlueprintDto),
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const { sourceText, title, description } = req.body;
      const blueprint = await aiRagService.createLearningBlueprint(
        sourceText,
        req.user.userId,
        title,
        description
      );

      res.status(201).json(blueprint);
    } catch (error) {
      next(error);
    }
  });

// Update a Learning Blueprint
aiRagRouter.put(
  '/learning-blueprints/:blueprintId',
  async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
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

      const { title, description } = req.body;
      const blueprint = await prisma.learningBlueprint.updateMany({
        where: { id: blueprintId, userId: req.user.userId },
        data: { title, description, updatedAt: new Date() }
      });

      if (blueprint.count === 0) {
        res.status(404).json({ message: 'Blueprint not found or access denied' });
        return;
      }

      res.status(200).json({ message: 'Blueprint updated successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Delete a Learning Blueprint
aiRagRouter.delete('/learning-blueprints/:blueprintId', async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
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

    const result = await prisma.learningBlueprint.deleteMany({
      where: { id: blueprintId, userId: req.user.userId }
    });

    if (result.count === 0) {
      res.status(404).json({ message: 'Blueprint not found or access denied' });
      return;
    }

    res.status(200).json({ message: 'Blueprint deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Generate a new Question Set from a Learning Blueprint
aiRagRouter.post('/learning-blueprints/:blueprintId/question-sets', validationMiddleware(GenerateQuestionsFromBlueprintDto), async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
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

    const questionSet = await aiRagService.generateQuestionsFromBlueprint(
      req.user.userId,
      blueprintId,
      req.body
    );

    res.status(201).json(questionSet);
  } catch (error) {
    next(error);
  }
});

// Generate a new Note from a Learning Blueprint
aiRagRouter.post('/learning-blueprints/:blueprintId/notes', validationMiddleware(GenerateNoteFromBlueprintDto), async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
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

    const note = await aiRagService.generateNoteFromBlueprint(
      req.user.userId,
      blueprintId,
      req.body
    );

    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

// Handle a chat message
aiRagRouter.post('/chat/message', async (req: RequestWithUser, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'User not authenticated' });
      return;
    }

    const { message } = req.body;
    
    // Simple chat response for now
    const response = {
      id: Date.now(),
      message: `I received your message: "${message}". This is a basic chat response.`,
      timestamp: new Date(),
      userId: req.user.userId
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

export { aiRagRouter };
