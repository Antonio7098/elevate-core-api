// src/controllers/mastery/review.controller.ts - TEMPORARILY DISABLED
// TODO: Legacy review functionality temporarily disabled - Prisma type mismatches
// Server startup capability restored by commenting out complex Prisma operations
// This will be properly implemented once the Prisma schema is aligned

import { Request, Response, NextFunction } from 'express';

export const getTodayReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  res.status(501).json({ message: 'Legacy review functionality temporarily disabled' });
};

export const getReviewQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  res.status(501).json({ message: 'Legacy review functionality temporarily disabled' });
};

export const submitReview = async (req: Request, res: Response): Promise<void> => {
  res.status(501).json({ message: 'Legacy review functionality temporarily disabled' });
};

export const getReviewStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  res.status(501).json({ message: 'Legacy review functionality temporarily disabled' });
};

export const startReview = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Legacy review functionality temporarily disabled' });
};
