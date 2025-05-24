// src/controllers/user.controller.ts
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  // We can access req.user because our 'protect' middleware added it
  if (!req.user || typeof req.user.userId !== 'number') {
    res.status(400).json({ message: 'User ID not found in token' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, email: true } // Don't send the password back!
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
    return;
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile' });
    return;
  }
};
