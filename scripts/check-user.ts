import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });
    
    console.log('User found:', user);
    
    if (user) {
      console.log('User ID:', user.id);
      console.log('Email:', user.email);
      console.log('Created At:', user.createdAt);
    } else {
      console.log('No user found with email: test@example.com');
    }
  } catch (error) {
    console.error('Error checking user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
