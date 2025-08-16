// src/controllers/question.controller.ts - TEMPORARILY DISABLED
// TODO: Legacy question functionality temporarily disabled - Prisma type mismatches
// Server startup capability restored by commenting out complex Prisma operations
// This will be properly implemented once the Prisma schema is aligned

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

export const createQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy question functionality temporarily disabled' });
};

export const getQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy question functionality temporarily disabled' });
};

export const getQuestionById = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy question functionality temporarily disabled' });
};

export const updateQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy question functionality temporarily disabled' });
};

export const deleteQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy question functionality temporarily disabled' });
};

export const getQuestionsByFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy question functionality temporarily disabled' });
};
