import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    // Clear existing data
    console.log('Clearing existing data...');
    await prisma.userQuestionAnswer.deleteMany({});
    await prisma.question.deleteMany({});
    await prisma.questionSet.deleteMany({});
    await prisma.folder.deleteMany({});
    await prisma.user.deleteMany({});
    
    console.log('Creating test user...');
    // Create test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword
      }
    });
    console.log(`Test user created with ID: ${user.id}`);

    // Create a test folder for the user
    console.log('Creating test folder...');
    const folder = await prisma.folder.create({
      data: {
        name: 'Test Folder',
        userId: user.id,
      },
    });
    console.log(`Test folder created with ID: ${folder.id}`);

    // Create test question sets in the folder
    console.log('Creating test question sets...');
    
    // Create a question set that's due for review (past due)
    const pastDueDate = new Date();
    pastDueDate.setDate(pastDueDate.getDate() - 2); // 2 days ago
    
    const questionSet1 = await prisma.questionSet.create({
      data: {
        name: 'Past Due Question Set',
        folderId: folder.id,
        // Spaced repetition fields
        overallMasteryScore: 30,
        understandScore: 40,
        useScore: 30,
        exploreScore: 20,
        nextReviewAt: pastDueDate,
        currentIntervalDays: 1,
        lastReviewedAt: new Date(pastDueDate.getTime() - 24 * 60 * 60 * 1000), // 1 day before past due
      },
    });
    
    // Create a question set that's due today
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0); // Beginning of today
    
    const questionSet2 = await prisma.questionSet.create({
      data: {
        name: 'Due Today Question Set',
        folderId: folder.id,
        // Spaced repetition fields
        overallMasteryScore: 50,
        understandScore: 60,
        useScore: 50,
        exploreScore: 30,
        nextReviewAt: todayDate,
        currentIntervalDays: 2,
        lastReviewedAt: new Date(todayDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before
      },
    });
    
    // Create a question set that's due tomorrow (not due yet)
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    tomorrowDate.setHours(0, 0, 0, 0); // Beginning of tomorrow
    
    const questionSet3 = await prisma.questionSet.create({
      data: {
        name: 'Due Tomorrow Question Set',
        folderId: folder.id,
        // Spaced repetition fields
        overallMasteryScore: 70,
        understandScore: 75,
        useScore: 70,
        exploreScore: 60,
        nextReviewAt: tomorrowDate,
        currentIntervalDays: 4,
        lastReviewedAt: new Date(tomorrowDate.getTime() - 4 * 24 * 60 * 60 * 1000), // 4 days before
      },
    });
    
    // Create a question set that's never been reviewed
    const questionSet4 = await prisma.questionSet.create({
      data: {
        name: 'Never Reviewed Question Set',
        folderId: folder.id,
        // Spaced repetition fields
        overallMasteryScore: 0,
        understandScore: 0,
        useScore: 0,
        exploreScore: 0,
        currentIntervalDays: 1,
      },
    });
    
    console.log(`Created 4 test question sets with IDs: ${questionSet1.id}, ${questionSet2.id}, ${questionSet3.id}, ${questionSet4.id}`);
    
    // Use questionSet1 for questions

    // Create test questions for questionSet1
    console.log('Creating test questions...');
    
    // Create questions with different U-U-E focus levels
    const questions = await Promise.all([
      // Understand focus questions
      prisma.question.create({
        data: {
          text: 'What is the capital of France?',
          questionType: 'multiple-choice',
          answer: 'Paris',
          options: ['Paris', 'London', 'Berlin', 'Madrid'],
          questionSetId: questionSet1.id,
          uueFocus: 'Understand',
          conceptTags: ['geography', 'europe', 'capitals'],
          difficultyScore: 0.3,
        },
      }),
      prisma.question.create({
        data: {
          text: 'What is 2 + 2?',
          questionType: 'short-answer',
          answer: '4',
          options: [],
          questionSetId: questionSet1.id,
          uueFocus: 'Understand',
          conceptTags: ['math', 'addition', 'basics'],
          difficultyScore: 0.1,
        },
      }),
      
      // Use focus questions
      prisma.question.create({
        data: {
          text: 'Solve the equation: 3x + 5 = 20',
          questionType: 'short-answer',
          answer: 'x = 5',
          options: [],
          questionSetId: questionSet1.id,
          uueFocus: 'Use',
          conceptTags: ['math', 'algebra', 'equations'],
          difficultyScore: 0.5,
        },
      }),
      prisma.question.create({
        data: {
          text: 'Apply the Pythagorean theorem to find the hypotenuse of a right triangle with sides 3 and 4.',
          questionType: 'short-answer',
          answer: '5',
          options: [],
          questionSetId: questionSet1.id,
          uueFocus: 'Use',
          conceptTags: ['math', 'geometry', 'triangles'],
          difficultyScore: 0.6,
        },
      }),
      
      // Explore focus questions
      prisma.question.create({
        data: {
          text: 'Explain the concept of photosynthesis and its importance in the ecosystem.',
          questionType: 'long-answer',
          answer: 'Photosynthesis is the process by which plants convert light energy into chemical energy. It is important because...',
          options: [],
          questionSetId: questionSet1.id,
          uueFocus: 'Explore',
          conceptTags: ['biology', 'plants', 'energy', 'ecosystems'],
          difficultyScore: 0.7,
        },
      }),
      prisma.question.create({
        data: {
          text: 'Compare and contrast classical and operant conditioning.',
          questionType: 'long-answer',
          answer: 'Classical conditioning involves associating an involuntary response with a stimulus, while operant conditioning involves...',
          options: [],
          questionSetId: questionSet1.id,
          uueFocus: 'Explore',
          conceptTags: ['psychology', 'learning', 'behavior'],
          difficultyScore: 0.8,
        },
      }),
    ]);

    console.log(`Created ${questions.length} test questions for question set ${questionSet1.id}`);
    
    // Create some user answers to questions
    console.log('Creating test user answers...');
    
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    await Promise.all([
      // Correct answer from a week ago
      prisma.userQuestionAnswer.create({
        data: {
          userId: user.id,
          questionId: questions[0].id,
          userAnswer: 'Paris',
          isCorrect: true,
          scoreAchieved: 1.0,
          answeredAt: oneWeekAgo,
          timeSpent: 15 // 15 seconds to answer
        }
      }),
      // Incorrect answer from 3 days ago
      prisma.userQuestionAnswer.create({
        data: {
          userId: user.id,
          questionId: questions[1].id,
          userAnswer: '5',
          isCorrect: false,
          scoreAchieved: 0.0,
          answeredAt: threeDaysAgo,
          timeSpent: 30 // 30 seconds to answer
        }
      }),
    ]);
    
    console.log('\nTest data setup complete!');
    console.log(`\nTo test the API endpoints:`);
    console.log(`1. Get a JWT token: npm run get-jwt-token`);
    console.log(`2. Get due question sets: curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3333/api/reviews/due`);
    console.log(`3. Get questions for a set: curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:3333/api/questionsets/${questionSet1.id}/questions`);

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
