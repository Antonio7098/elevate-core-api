// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request type to include a user property
export interface AuthRequest extends Request {
  user?: { userId: number };
}

export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // console.log('🔑 [Auth] All Request Headers:', JSON.stringify(req.headers, null, 2)); // Log all headers
  // console.log(`🔒 [Auth] Protecting route: ${req.method} ${req.originalUrl}`);
  const authHeader = req.headers['authorization'];
  const testUserIdHeader = req.headers['x-test-user-id'];
  // console.log(`🔑 [Auth] Authorization header value: ${authHeader}`);
  // console.log(`🔑 [Auth] Type of authHeader: ${typeof authHeader}`);
  if (typeof authHeader === 'string') {
    // console.log(`🔑 [Auth] Length of authHeader: ${authHeader.length}`);
  }
  const cascadeTestHeader = req.headers['x-cascade-test'];
  // console.log(`🧪 [Auth] X-Cascade-Test header: ${cascadeTestHeader || 'None'}`);

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // console.log(`🔑 [Auth] Token extracted: ${token.substring(0, 10)}...`);
    // console.log(`🔑 [Auth] JWT_SECRET available: ${!!process.env.JWT_SECRET}`);
    
    // Special handling for test token in development environment
    if (process.env.NODE_ENV !== 'production' && token === 'test123') {
      // Allow test user ID override via header
      if (testUserIdHeader && typeof testUserIdHeader === 'string' && !isNaN(Number(testUserIdHeader))) {
        (req as AuthRequest).user = { userId: Number(testUserIdHeader) };
      } else {
        (req as AuthRequest).user = { userId: 1 };
      }
      next();
      return;
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number; iat: number; exp: number };
      // console.log(`✅ [Auth] Token verified successfully for userId: ${decoded.userId}`);
      // console.log(`User ${decoded.userId} authenticated successfully for ${req.method} ${req.path}`);
      // console.log(`PROTECT_MIDDLEWARE_END: Passing to next handler. Path: ${req.path}, Body: ${JSON.stringify(req.body, null, 2)}`);
      (req as AuthRequest).user = { userId: decoded.userId };
      // console.log(`✅ [Auth] Token expiration: ${new Date(decoded.exp * 1000).toISOString()}`);
      next();
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') { console.error(`❌ [Auth] Token verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`); }
      res.status(401).json({ message: 'Token is not valid' });
      return; // Ensure no further execution
    }
  } else {
    if (process.env.NODE_ENV !== 'test') { console.error(`❌ [Auth] No valid authorization header found`); }
    res.status(401).json({ message: 'No token, authorization denied' });
    return; // Ensure no further execution
  }
};
