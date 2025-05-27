import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function checkUserFolders() {
  try {
    // First find the user with email test@example.com
    const user = await prisma.user.findUnique({
      where: {
        email: 'test@example.com'
      }
    });

    if (!user) {
      console.log('User with email test@example.com not found');
      return;
    }

    console.log('User found:', user);

    // Find folders for this user
    const folders = await prisma.folder.findMany({
      where: {
        userId: user.id
      }
    });

    console.log(`Found ${folders.length} folders for user test@example.com:`);
    folders.forEach(folder => {
      console.log(`- Folder ID: ${folder.id}, Name: ${folder.name}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserFolders();
