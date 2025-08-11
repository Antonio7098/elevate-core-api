// src/ai-rag/ai-rag.routes-minimal.ts - Minimal AI-RAG router for testing
import express, { Router, Request, Response, NextFunction } from 'express';

// Interface for authenticated requests (matches the main app's AuthRequest)
interface RequestWithUser extends Request {
  user?: {
    userId: number;
  };
}

const aiRagRouter = Router();
console.log('🚀 AI RAG ROUTER MINIMAL: Loading aiRagRouter module');

// Add logging middleware to trace all requests to this router
aiRagRouter.use((req, res, next) => {
  console.log(`🔍 AI RAG ROUTER MINIMAL: Incoming request - ${req.method} ${req.originalUrl}`);
  console.log(`🔍 AI RAG ROUTER MINIMAL: Request path: ${req.path}`);
  next();
});

// Simple test endpoint
aiRagRouter.get('/test', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  res.status(200).json({ message: 'AI-RAG minimal router working' });
});

// List all Learning Blueprints for the authenticated user (minimal version)
aiRagRouter.get('/learning-blueprints', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userId = (req.user as RequestWithUser['user'])!.userId;

  if (!userId) {
    res.status(401).json({ message: 'User not authenticated.' });
    return;
  }

  try {
    // Return empty array for now
    res.status(200).json([]);
  } catch (error: any) {
    console.error('Error in GET /learning-blueprints route:', error.message);
    res.status(500).json({ message: error.message || 'Failed to retrieve learning blueprints.' });
  }
});


