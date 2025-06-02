import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample data
const testFolders = [
  {
    name: 'Mathematics',
    description: 'Practice problems and concepts in mathematics',
    questionSets: [
      {
        name: 'Algebra Basics',
        questions: [
          {
            text: 'Solve for x: 2x + 5 = 15',
            answer: '5',
            options: ['3', '5', '10', '15'],
            questionType: 'multiple-choice'
          },
          {
            text: 'What is the quadratic formula?',
            answer: 'x = [-b ± √(b² - 4ac)] / (2a)',
            questionType: 'short-answer'
          }
        ]
      },
      {
        name: 'Geometry',
        questions: [
          {
            text: 'What is the area of a circle with radius 5?',
            answer: '78.54',
            questionType: 'short-answer'
          }
        ]
      }
    ]
  },
  {
    name: 'Science',
    description: 'Various science topics and concepts',
    questionSets: [
      {
        name: 'Physics 101',
        questions: [
          {
            text: 'What is the formula for force?',
            answer: 'F = ma',
            questionType: 'short-answer'
          },
          {
            text: 'What is the speed of light?',
            answer: '299,792,458 m/s',
            options: ['300,000 km/s', '150,000 km/s', '299,792,458 m/s', '186,282 miles/s'],
            questionType: 'multiple-choice'
          }
        ]
      }
    ]
  }
];

async function createTestUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      include: {
        folders: {
          include: {
            questionSets: true
          }
        }
      }
    });

    if (existingUser) {
      console.log('Deleting existing test user and related data...');
      // Delete all related data first
      for (const folder of existingUser.folders) {
        await prisma.questionSet.deleteMany({
          where: { folderId: folder.id }
        });
      }
      await prisma.folder.deleteMany({
        where: { userId: existingUser.id }
      });
      await prisma.user.delete({ 
        where: { id: existingUser.id } 
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('test123', 10);

    // Create the test user with folders and question sets
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        folders: {
          create: testFolders.map(folder => ({
            name: folder.name,
            description: folder.description,
            questionSets: {
              create: folder.questionSets.map(qs => ({
                name: qs.name,
                questions: {
                  create: qs.questions.map(q => ({
                    text: q.text,
                    answer: q.answer,
                    options: q.options || [],
                    questionType: q.questionType,
                    
                    
                  }))
                }
              }))
            }
          }))
        }
      },
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

    console.log('\nTest user created successfully!');
    console.log('Email:', user.email);
    console.log('Password: test123');
    console.log('User ID:', user.id);
    
    // Log the created structure
    console.log('\nCreated folders and question sets:');
    user.folders.forEach(folder => {
      console.log(`\n- ${folder.name} (ID: ${folder.id})`);
      console.log(`  Description: ${folder.description}`);
      console.log('  Question Sets:');
      folder.questionSets.forEach(qs => {
        console.log(`    - ${qs.name} (ID: ${qs.id})`);
        console.log(`      Questions: ${qs.questions.length}`);
      });
    });
    
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
