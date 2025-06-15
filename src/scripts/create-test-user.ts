import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/auth';

const prisma = new PrismaClient();

export async function createTestUser(email: string = 'test@example.com'): Promise<{ id: number; token: string }> {
  // Ensure database connection
  await prisma.$connect();
  
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

  // Close connection
  await prisma.$disconnect();

  return {
    id: user.id,
    token
  };
}