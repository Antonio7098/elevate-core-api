// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request type to include a user property
export interface AuthRequest extends Request {
  user?: { userId: number };
}

export const protect = (req: Request, res: Response, next: NextFunction): void => {
  console.log(`🔒 [Auth] Protecting route: ${req.method} ${req.originalUrl}`);
  const authHeader = req.headers['authorization'];
  console.log(`🔑 [Auth] Authorization header: ${authHeader || 'None'}`);

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    console.log(`🔑 [Auth] Token extracted: ${token.substring(0, 10)}...`);
    console.log(`🔑 [Auth] JWT_SECRET available: ${!!process.env.JWT_SECRET}`);
    
    // Special handling for test token in development environment
    if (process.env.NODE_ENV !== 'production' && token === 'test123') {
      console.log(`🧪 [Auth] Using test token in development environment`);
      // Use a default test user ID (1) for development
      (req as AuthRequest).user = { userId: 1 };
      next();
      return;
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; iat: number; exp: number };
      console.log(`✅ [Auth] Token verified successfully for userId: ${decoded.userId}`);
      console.log(`✅ [Auth] Token expiration: ${new Date(decoded.exp * 1000).toISOString()}`);
      (req as AuthRequest).user = { userId: decoded.userId };
      next();
    } catch (error) {
      console.error(`❌ [Auth] Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      res.status(401).json({ message: 'Token is not valid' });
      return; // Ensure no further execution
    }
  } else {
    console.error(`❌ [Auth] No valid authorization header found`);
    res.status(401).json({ message: 'No token, authorization denied' });
    return; // Ensure no further execution
  }
};
