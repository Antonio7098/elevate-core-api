import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
      };
    }
  }
}

export type AuthenticatedRequest = Request; 