/**
 * Simple Test User Creation Script
 * Creates just the test user needed for E2E authentication
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Creating test user for E2E authentication...');
    
    // Delete existing test user if it exists
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' }
    });
    console.log('   Cleaned up existing test user');
    
    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
      }
    });
    
    console.log('✅ Test user created successfully:');
    console.log(`   ID: ${testUser.id}`);
    console.log(`   Email: ${testUser.email}`);
    console.log('   Password: password123');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
