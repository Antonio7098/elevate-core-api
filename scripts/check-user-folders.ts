import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserFolders(email: string) {
  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        folders: true  // Include all folders belonging to this user
      }
    });
    
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return;
    }
    
    console.log(`\nUser found:`);
    console.log(`- ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Created At: ${user.createdAt}`);
    
    console.log(`\nFolders (${user.folders.length}):`);
    if (user.folders.length === 0) {
      console.log('No folders found for this user.');
    } else {
      user.folders.forEach((folder, index) => {
        console.log(`\nFolder ${index + 1}:`);
        console.log(`- ID: ${folder.id}`);
        console.log(`- Name: ${folder.name}`);
        console.log(`- Description: ${folder.description || 'None'}`);
        console.log(`- Created: ${folder.createdAt}`);
        console.log(`- Last Updated: ${folder.updatedAt}`);
      });
    }
  } catch (error) {
    console.error('Error checking user folders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check for both possible email formats
checkUserFolders('user@example')
  .then(() => checkUserFolders('user@example.com'))
  .catch(console.error);
