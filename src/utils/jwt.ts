// src/utils/jwt.ts
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
}

/**
 * Generates a JWT token.
 * @param payload - The payload to sign, typically { userId: number }.
 * @param expiresInSeconds - The expiration time for the token in seconds. Defaults to 604800 (7 days).
 * @returns The generated JWT token.
 */
export const generateToken = (payload: JwtPayload, expiresInSeconds: number = 60 * 60 * 24 * 7 /* 7 days */): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign(payload, secret, { expiresIn: expiresInSeconds });
};

/**
 * Verifies a JWT token.
 * @param token - The JWT token to verify.
 * @returns The decoded payload if the token is valid.
 * @throws Error if the token is invalid or JWT_SECRET is not defined.
 */
export const verifyToken = (token: string): JwtPayload & { iat: number; exp: number } => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  try {
    return jwt.verify(token, process.env.JWT_SECRET) as JwtPayload & { iat: number; exp: number };
  } catch (error) {
    throw new Error('Invalid token');
  }
};
