import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Sample data
const testFolders = [
  {
    name: 'Mathematics',
    description: 'Practice problems and concepts in mathematics',
    notes: [
      {
        title: 'Math Note 1',
        content: { text: 'This is a note for Mathematics.' },
        plainText: 'This is a note for Mathematics.'
      }
    ],
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
    notes: [
      {
        title: 'Science Note 1',
        content: { text: 'This is a note for Science.' },
        plainText: 'This is a note for Science.'
      }
    ],
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

// New sample data for Insight Catalysts
const testInsightCatalysts = [
  {
    type: 'note',
    text: 'This is an insight catalyst linked to a note.',
    explanation: 'Explanation for the note insight catalyst.',
    imageUrls: ['https://example.com/image1.jpg'],
    noteId: null // Will be set dynamically
  },
  {
    type: 'question',
    text: 'This is an insight catalyst linked to a question.',
    explanation: 'Explanation for the question insight catalyst.',
    imageUrls: ['https://example.com/image2.jpg'],
    questionId: null // Will be set dynamically
  }
];

async function createTestUser(): Promise<void> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      include: { folders: true }
    });

    if (existingUser) {
      console.log('Deleting existing test user and related data...');
      // Delete all related data first
      for (const folder of existingUser.folders) {
        await prisma.questionSet.deleteMany({ where: { folderId: folder.id } });
        await prisma.note.deleteMany({ where: { folderId: folder.id } });
      }
      await prisma.folder.deleteMany({ where: { userId: existingUser.id } });
      await prisma.user.delete({ where: { id: existingUser.id } });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('test123', 10);

    // Create the test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword
      }
    });

    // Create folders, notes, and question sets for the user
    // First, create the parent folders and keep track of their IDs
    const createdFolders: { [name: string]: any } = {};
    for (const folderData of testFolders) {
      const folder = await prisma.folder.create({
        data: {
          name: folderData.name,
          description: folderData.description,
          userId: user.id
        }
      });
      createdFolders[folderData.name] = folder;

      // Create notes for the folder
      for (const noteData of folderData.notes) {
        await prisma.note.create({
          data: {
            title: noteData.title,
            content: noteData.content,
            plainText: noteData.plainText,
            userId: user.id,
            folderId: folder.id
          }
        });
      }

      // Create question sets and questions for the folder
      for (const qsData of folderData.questionSets) {
        const questionSet = await prisma.questionSet.create({
          data: {
            name: qsData.name,
            folderId: folder.id
          }
        });
        for (const qData of qsData.questions) {
          await prisma.question.create({
            data: {
              text: qData.text,
              answer: qData.answer,
              options: qData.options || [],
              questionType: qData.questionType,
              questionSetId: questionSet.id
            }
          });
        }
      }
    }

    // Create a nested folder under "Mathematics"
    const parentMath = createdFolders['Mathematics'];
    if (parentMath) {
      const nestedFolder = await prisma.folder.create({
        data: {
          name: 'Mathematics - Algebra Subfolder',
          description: 'Nested folder for Algebra topics',
          userId: user.id,
          parentId: parentMath.id
        }
      });
      // Add a note to the nested folder
      await prisma.note.create({
        data: {
          title: 'Algebra Subfolder Note',
          content: { text: 'This is a note for the nested Algebra folder.' },
          plainText: 'This is a note for the nested Algebra folder.',
          userId: user.id,
          folderId: nestedFolder.id
        }
      });
      // Add a question set to the nested folder
      const nestedQS = await prisma.questionSet.create({
        data: {
          name: 'Algebra Advanced',
          folderId: nestedFolder.id
        }
      });
      await prisma.question.create({
        data: {
          text: 'What is the binomial theorem?',
          answer: 'A formula for the expansion of (a + b)^n.',
          options: [],
          questionType: 'short-answer',
          questionSetId: nestedQS.id
        }
      });
    }

    // Create Insight Catalysts for the user
    for (const catalystData of testInsightCatalysts) {
      await prisma.insightCatalyst.create({
        data: {
          type: catalystData.type,
          text: catalystData.text,
          explanation: catalystData.explanation,
          imageUrls: catalystData.imageUrls,
          userId: user.id,
          noteId: catalystData.noteId,
          questionId: catalystData.questionId
        }
      });
    }

    // Fetch and print the created structure
    const createdUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
      include: {
        folders: {
          include: {
            notes: true,
            questionSets: {
              include: { questions: true }
            }
          }
        },
        insightCatalysts: true
      }
    });

    if (createdUser && (createdUser as any).folders) {
      console.log('\nTest user created successfully!');
      console.log('Email:', createdUser.email);
      console.log('Password: test123');
      console.log('User ID:', createdUser.id);
      console.log('\nCreated folders and question sets:');
      for (const folder of (createdUser as any).folders) {
        console.log(`\n- ${folder.name} (ID: ${folder.id})`);
        console.log(`  Description: ${folder.description}`);
        console.log(`  Notes:`);
        for (const note of folder.notes) {
          console.log(`    - ${note.title} (ID: ${note.id})`);
        }
        console.log('  Question Sets:');
        for (const qs of folder.questionSets) {
          console.log(`    - ${qs.name} (ID: ${qs.id})`);
          console.log(`      Questions: ${qs.questions.length}`);
        }
      }
      console.log('\nCreated Insight Catalysts:');
      for (const catalyst of (createdUser as any).insightCatalysts) {
        console.log(`- Type: ${catalyst.type}, Text: ${catalyst.text}, ID: ${catalyst.id}`);
      }
    }
  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
