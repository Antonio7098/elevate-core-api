import jwt, { SignOptions } from 'jsonwebtoken';

/**
 * Generates a JWT token for a given user ID.
 * @param userId The ID of the user for whom the token is generated.
 * @returns A JWT token string.
 * @throws Error if JWT_SECRET is not defined in environment variables.
 */
export const generateToken = (userId: number): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET is not defined in environment variables.');
    throw new Error('Server configuration error: JWT_SECRET is missing.');
  }

  // const expiresInValue: string = process.env.JWT_EXPIRES_IN || '30d';

  const options: SignOptions = {
    expiresIn: '30d', // Using a direct string literal
  };

  return jwt.sign({ userId }, secret, options);
};
