// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request type to include a user property
export interface AuthRequest extends Request {
  user?: { userId: number };
}

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; iat: number; exp: number };
      (req as AuthRequest).user = { userId: decoded.userId };
      next();
    } catch (error) {
      res.status(401).json({ message: 'Token is not valid' });
      return; // Ensure no further execution
    }
  } else {
    res.status(401).json({ message: 'No token, authorization denied' });
    return; // Ensure no further execution
  }
};
