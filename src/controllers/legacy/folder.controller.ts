// src/controllers/folder.controller.ts - TEMPORARILY DISABLED
// import { Response } from 'express';
// import { AuthRequest } from '../../middleware/auth.middleware'; // For req.user
// import prisma from '../../lib/prisma';

// TODO: Legacy folder functionality temporarily disabled - folder model not in current schema
// Server startup capability restored by commenting out folder operations
// This will be properly implemented once the folder model is added to the schema

import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';

export const createFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy folder functionality temporarily disabled' });
};

export const getFolders = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy folder functionality temporarily disabled' });
};

export const getFolderById = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy folder functionality temporarily disabled' });
};

export const updateFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy folder functionality temporarily disabled' });
};

export const deleteFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy folder functionality temporarily disabled' });
};

export const moveFolder = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy folder functionality temporarily disabled' });
};
