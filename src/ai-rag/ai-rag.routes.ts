import express, { Router, Request, Response, NextFunction } from 'express';
import { AiRAGService } from './ai-rag.service';
import prisma from '../lib/prisma'; // Import Prisma client (default export)
import { CreateLearningBlueprintDto } from './dtos/create-learning-blueprint.dto';
import { validationMiddleware } from '../middlewares/validation.middleware';
import { GenerateQuestionsFromBlueprintDto } from './dtos/generate-questions-from-blueprint.dto';
import { GenerateNoteFromBlueprintDto } from './dtos/generate-note-from-blueprint.dto';
import { UpdateLearningBlueprintDto } from './dtos/update-learning-blueprint.dto';
import { ChatMessageDto } from './dtos/chat-message.dto';
import { HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger'; // Swagger imports
// Assuming your auth middleware adds a 'user' object to the Request
interface RequestWithUser extends Request {
  user?: {
    userId: number; // Changed from id to userId
    // other user properties
  };
}

const aiRagRouter = Router();
const aiRagService = new AiRAGService(prisma);

// Instantiate the service

// Middleware to check for authenticated user (basic example)
// You'll likely have a more robust auth middleware already in use via app.ts
const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const requestWithUser = req as RequestWithUser;
  // Standardize on req.user.userId as defined in RequestWithUser interface
  if (requestWithUser.user && typeof requestWithUser.user.userId === 'number') { 
    next();
  } else {
    console.warn('AiRAG Routes: req.user or req.user.userId is missing or invalid. Ensure auth middleware runs before these routes and populates req.user correctly.');
    res.status(401).json({ message: 'User not authenticated' });
    // Do NOT call next() here, as the request should be terminated.
  }
};

aiRagRouter.use(ensureAuthenticated); // Apply to all RAG routes

// List all Learning Blueprints for the authenticated user
aiRagRouter.get('/learning-blueprints', ensureAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = (req.user as RequestWithUser['user'])!.userId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }

  try {
    const blueprints = await aiRagService.getAllLearningBlueprintsForUser(userId);
    res.status(200).json(blueprints);
  } catch (error: any) {
    console.error('Error in GET /learning-blueprints route:', error.message);
    res.status(500).json({ message: error.message || 'Failed to retrieve learning blueprints.' });
  }
});

// Get a specific Learning Blueprint by ID
aiRagRouter.get('/learning-blueprints/:blueprintId', ensureAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const blueprintId = parseInt(req.params.blueprintId, 10);
  const userId = (req.user as RequestWithUser['user'])!.userId;

  if (isNaN(blueprintId)) {
    res.status(400).json({ message: 'Invalid blueprint ID.' });
    return;
  }
  if (!userId) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }

  try {
    const blueprint = await aiRagService.getLearningBlueprintById(blueprintId, userId);
    if (!blueprint) {
      res.status(404).json({ message: 'Learning Blueprint not found or access denied.' });
      return;
    }
    res.status(200).json(blueprint);
  } catch (error: any) {
    console.error(`Error in GET /learning-blueprints/${blueprintId} route:`, error.message);
    res.status(500).json({ message: error.message || 'Failed to retrieve learning blueprint.' });
  }
});

// Create a new Learning Blueprint
aiRagRouter.post(
  '/learning-blueprints',
  validationMiddleware(CreateLearningBlueprintDto),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const createDto = req.body as CreateLearningBlueprintDto; // req.body is now validated and transformed
      const requestWithUser = req as RequestWithUser;

      if (!requestWithUser.user || typeof requestWithUser.user.userId !== 'number') {
        // This check should ideally be fully handled by ensureAuthenticated
        // If ensureAuthenticated guarantees user.userId, this block can be simplified or removed.
        res.status(401).json({ message: 'User not authenticated or user ID missing.' });
        return; // Explicitly return to satisfy Promise<void>
      }
      const userId = requestWithUser.user.userId;
      const result = await aiRagService.createLearningBlueprint(createDto, userId);
      res.status(201).json(result);
    } catch (error) {
      next(error); // Pass errors to the global error handler
    }
  });

// Update a Learning Blueprint
aiRagRouter.put(
  '/learning-blueprints/:blueprintId',
  ensureAuthenticated,
  validationMiddleware(UpdateLearningBlueprintDto, true), // skipMissingProperties = true for partial updates
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const blueprintId = parseInt(req.params.blueprintId, 10);
    const userId = (req.user as RequestWithUser['user'])!.userId;
    const dto = req.body as UpdateLearningBlueprintDto;

    if (isNaN(blueprintId)) {
      res.status(400).json({ message: 'Invalid blueprint ID.' });
      return;
    }
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    try {
      const updatedBlueprint = await aiRagService.updateLearningBlueprint(blueprintId, dto, userId);
      if (!updatedBlueprint) {
        res.status(404).json({ message: 'Learning Blueprint not found or access denied.' });
        return;
      }
      res.status(200).json(updatedBlueprint);
    } catch (error: any) {
      console.error(`Error in PUT /learning-blueprints/${blueprintId} route:`, error.message);
      if (error.message.includes('Failed to re-deconstruct text via AI service')) {
        res.status(502).json({ message: 'Failed to update blueprint due to AI service error.' });
      } else {
        res.status(500).json({ message: error.message || 'Failed to update learning blueprint.' });
      }
    }
  }
);

// Delete a Learning Blueprint
aiRagRouter.delete('/learning-blueprints/:blueprintId', ensureAuthenticated, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const blueprintId = parseInt(req.params.blueprintId, 10);
  const userId = (req.user as RequestWithUser['user'])!.userId;

  if (isNaN(blueprintId)) {
    res.status(400).json({ message: 'Invalid blueprint ID.' });
    return;
  }
  if (!userId) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }

  try {
    const success = await aiRagService.deleteLearningBlueprint(blueprintId, userId);
    if (!success) {
      res.status(404).json({ message: 'Learning Blueprint not found or access denied.' });
      return;
    }
    res.status(204).send(); // No content on successful deletion
  } catch (error: any) {
    console.error(`Error in DELETE /learning-blueprints/${blueprintId} route:`, error.message);
    res.status(500).json({ message: error.message || 'Failed to delete learning blueprint.' });
  }
});

// Generate a new Question Set from a Learning Blueprint
aiRagRouter.post('/learning-blueprints/:blueprintId/question-sets', validationMiddleware(GenerateQuestionsFromBlueprintDto), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const blueprintId = parseInt(req.params.blueprintId, 10);
    const dto = req.body as GenerateQuestionsFromBlueprintDto;
    const userId = (req.user as RequestWithUser['user'])!.userId; // Assuming user is attached by ensureAuthenticated

    if (isNaN(blueprintId)) {
      res.status(400).json({ message: 'Invalid blueprint ID.' });
      return;
    }
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    try {
      const result = await aiRagService.generateQuestionsFromBlueprint(blueprintId, dto, userId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in generateQuestionsFromBlueprint route:', error.message);
      // Consider more specific error handling based on error type
      res.status(500).json({ message: error.message || 'Failed to generate questions.' });
    }
});

// Generate a new Note from a Learning Blueprint
aiRagRouter.post('/learning-blueprints/:blueprintId/notes', validationMiddleware(GenerateNoteFromBlueprintDto), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const blueprintId = parseInt(req.params.blueprintId, 10);
    const dto = req.body as GenerateNoteFromBlueprintDto;
    const userId = (req.user as RequestWithUser['user'])!.userId;

    if (isNaN(blueprintId)) {
      res.status(400).json({ message: 'Invalid blueprint ID.' });
      return;
    }
    if (!userId) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    try {
      const result = await aiRagService.generateNoteFromBlueprint(blueprintId, dto, userId);
      res.status(200).json(result);
    } catch (error: any) {
      console.error('Error in generateNoteFromBlueprint route:', error.message);
      res.status(500).json({ message: error.message || 'Failed to generate note.' });
    }
});

// Handle a chat message
aiRagRouter.post('/chat/message', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const dto = req.body as ChatMessageDto;
    const userId = (req.user as RequestWithUser['user'])!.userId;

    if (!userId) {
      res.status(401).json({ message: 'User not authenticated.' });
      return;
    }

    try {
      const result = await aiRagService.handleChatMessage(dto, userId);
      res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof HttpException) {
        res.status(error.getStatus()).json({ message: error.message });
      } else {
        console.error('Error in handleChatMessage route:', error.message);
        res.status(500).json({ message: error.message || 'Failed to handle chat message.' });
      }
    }
});

export { aiRagRouter };
