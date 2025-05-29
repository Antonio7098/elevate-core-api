import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    // Find existing user by email
    let user = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    if (!user) {
      console.log('No user found with email test@example.com');
      return;
    }

    console.log(`Found user with ID: ${user.id} and email: ${user.email}`);
    const userId = user.id;

    // Create a test folder for the user
    let folder = await prisma.folder.findFirst({
      where: { userId },
    });

    if (!folder) {
      folder = await prisma.folder.create({
        data: {
          name: 'Test Folder',
          userId,
        },
      });
      console.log(`Test folder created with ID: ${folder.id}`);
    } else {
      console.log(`Existing folder found with ID: ${folder.id}`);
    }

    // Create a test question set in the folder
    let questionSet = await prisma.questionSet.findFirst({
      where: { folderId: folder.id },
    });

    if (!questionSet) {
      questionSet = await prisma.questionSet.create({
        data: {
          name: 'Test Question Set',
          folderId: folder.id,
          // Add spaced repetition fields
          currentTotalMasteryScore: 0,
          understandScore: 0,
          useScore: 0,
          exploreScore: 0,
          currentForgottenPercentage: 0,
          currentIntervalDays: 1,
          reviewCount: 0,
        },
      });
      console.log(`Test question set created with ID: ${questionSet.id}`);
    } else {
      console.log(`Existing question set found with ID: ${questionSet.id}`);
    }

    // Create test questions in the question set
    const existingQuestions = await prisma.question.count({
      where: { questionSetId: questionSet.id },
    });

    if (existingQuestions === 0) {
      // Create multiple test questions
      const questions = await Promise.all([
        prisma.question.create({
          data: {
            text: 'What is the capital of France?',
            questionType: 'multiple-choice',
            answer: 'Paris',
            options: ['Paris', 'London', 'Berlin', 'Madrid'],
            questionSetId: questionSet.id,
          },
        }),
        prisma.question.create({
          data: {
            text: 'What is 2 + 2?',
            questionType: 'short-answer',
            answer: '4',
            options: [],
            questionSetId: questionSet.id,
          },
        }),
        prisma.question.create({
          data: {
            text: 'Explain the concept of photosynthesis.',
            questionType: 'long-answer',
            answer: 'Photosynthesis is the process by which plants convert light energy into chemical energy.',
            options: [],
            questionSetId: questionSet.id,
          },
        }),
      ]);

      console.log(`Created ${questions.length} test questions`);
      questions.forEach((q, i) => {
        console.log(`Question ${i + 1} ID: ${q.id}`);
      });
    } else {
      console.log(`${existingQuestions} existing questions found`);
    }

    // Generate a new JWT token for the correct user ID
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    
    const token = jwt.sign(
      { userId, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('\nTest data setup complete!');
    console.log(`\nTo test the API endpoint, use the following command:`);
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3333/api/questionsets/${questionSet.id}/questions`);

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
