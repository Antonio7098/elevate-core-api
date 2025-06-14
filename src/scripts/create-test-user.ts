import { prisma } from '../lib/prisma';
import { generateToken } from '../utils/auth';

export async function createTestUser(email: string = 'test@example.com'): Promise<{ id: number; token: string }> {
  // Create test user
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Test User',
      password: 'password123' // In a real app, this would be hashed
    }
  });

  // Generate token
  const token = generateToken(user);

  return {
    id: user.id,
    token
  };
} 