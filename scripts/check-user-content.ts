import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserContent(email: string) {
  try {
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        folders: {
          include: {
            questionSets: {
              include: {
                questions: true
              }
            }
          }
        }
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
        console.log(`\n📁 Folder ${index + 1}:`);
        console.log(`- ID: ${folder.id}`);
        console.log(`- Name: ${folder.name}`);
        console.log(`- Description: ${folder.description || 'None'}`);
        console.log(`- Created: ${folder.createdAt}`);
        console.log(`- Last Updated: ${folder.updatedAt}`);
        
        console.log(`\n  Question Sets (${folder.questionSets.length}):`);
        if (folder.questionSets.length === 0) {
          console.log('  No question sets in this folder.');
        } else {
          folder.questionSets.forEach((set, setIndex) => {
            console.log(`\n  📚 Question Set ${setIndex + 1}:`);
            console.log(`  - ID: ${set.id}`);
            console.log(`  - Name: ${set.name}`);
            console.log(`  - Created: ${set.createdAt}`);
            console.log(`  - Last Updated: ${set.updatedAt}`);
            
            console.log(`\n    Questions (${set.questions.length}):`);
            if (set.questions.length === 0) {
              console.log('    No questions in this set.');
            } else {
              set.questions.forEach((question, qIndex) => {
                console.log(`\n    ❓ Question ${qIndex + 1}:`);
                console.log(`    - ID: ${question.id}`);
                console.log(`    - Text: ${question.text}`);
                console.log(`    - Type: ${question.questionType}`);
                console.log(`    - Answer: ${question.answer || 'None'}`);
                console.log(`    - Options: ${JSON.stringify(question.options)}`);
                console.log(`    - Mastery Score: ${question.masteryScore}`);
                if (question.nextReviewAt) {
                  console.log(`    - Next Review: ${question.nextReviewAt}`);
                }
              });
            }
          });
        }
      });
    }
    
    // Summary
    const totalQuestionSets = user.folders.reduce((total, folder) => total + folder.questionSets.length, 0);
    const totalQuestions = user.folders.reduce((total, folder) => 
      total + folder.questionSets.reduce((setTotal, set) => setTotal + set.questions.length, 0), 0);
    
    console.log(`\n📊 Summary:`);
    console.log(`- Total Folders: ${user.folders.length}`);
    console.log(`- Total Question Sets: ${totalQuestionSets}`);
    console.log(`- Total Questions: ${totalQuestions}`);
    
  } catch (error) {
    console.error('Error checking user content:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Check for the specified email
checkUserContent('test@example.com')
  .catch(console.error);
