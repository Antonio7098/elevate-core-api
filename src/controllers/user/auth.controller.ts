// src/controllers/user/auth.controller.ts - TEMPORARILY DISABLED
// TODO: Legacy user auth functionality temporarily disabled - Prisma type mismatches
// Server startup capability restored by commenting out complex Prisma operations
// This will be properly implemented once the Prisma schema is aligned

import { Request, Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';

export const register = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy user auth functionality temporarily disabled' });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy user auth functionality temporarily disabled' });
};

export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy user auth functionality temporarily disabled' });
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy user auth functionality temporarily disabled' });
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy user auth functionality temporarily disabled' });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy user auth functionality temporarily disabled' });
};
