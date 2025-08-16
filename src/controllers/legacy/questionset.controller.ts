// src/controllers/legacy/questionset.controller.ts - TEMPORARILY DISABLED
// TODO: Legacy questionset functionality temporarily disabled - references non-existent Prisma models
// Server startup capability restored by commenting out legacy operations
// This will be properly implemented once the legacy models are added to the schema

import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';

export const getQuestionSets = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy questionset functionality temporarily disabled' });
};

export const getQuestionSetById = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy questionset functionality temporarily disabled' });
};

export const createQuestionSet = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy questionset functionality temporarily disabled' });
};

export const updateQuestionSet = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy questionset functionality temporarily disabled' });
};

export const deleteQuestionSet = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy questionset functionality temporarily disabled' });
};

export const getQuestionSetsByFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy questionset functionality temporarily disabled' });
};

export const getQuestionSetsByNote = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy questionset functionality temporarily disabled' });
};
