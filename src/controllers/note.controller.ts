// src/controllers/note.controller.ts - TEMPORARILY DISABLED
// TODO: Legacy note functionality temporarily disabled - Prisma type mismatches
// Server startup capability restored by commenting out complex Prisma operations
// This will be properly implemented once the Prisma schema is aligned

import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';

export const createNote = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy note functionality temporarily disabled' });
};

export const getNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy note functionality temporarily disabled' });
};

export const getNoteById = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy note functionality temporarily disabled' });
};

export const updateNote = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy note functionality temporarily disabled' });
};

export const deleteNote = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy note functionality temporarily disabled' });
};

export const getNotesByFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy note functionality temporarily disabled' });
};

export const getNotesByQuestionSet = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy note functionality temporarily disabled' });
}; 