// src/controllers/mastery/primitive.controller.ts - TEMPORARILY DISABLED
// TODO: Legacy primitive functionality temporarily disabled - Prisma type mismatches
// Server startup capability restored by commenting out complex Prisma operations
// This will be properly implemented once the Prisma schema is aligned

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

export function setPrismaClient(client: PrismaClient) {
  prisma = client;
}

export function resetPrismaClient() {
  prisma = null;
}

export const submitReview = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Legacy primitive functionality temporarily disabled' });
};

export const toggleTracking = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Legacy primitive functionality temporarily disabled' });
};

export const listPrimitives = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Legacy primitive functionality temporarily disabled' });
};
