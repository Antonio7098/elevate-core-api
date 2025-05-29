/**
 * Test script to directly test context generation for a folder
 * This bypasses authentication and directly tests the context building logic
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a Prisma client
const prisma = new PrismaClient();

// Function to test context generation for a folder
async function testContextGeneration() {
  try {
    // Get all folders to find the Mathematics folder
    const folders = await prisma.folder.findMany({
      where: {
        name: {
          contains: 'Mathematics',
          mode: 'insensitive'
        }
      },
      include: {
        questionSets: {
          include: {
            questions: true
          }
        }
      }
    });

    if (folders.length === 0) {
      console.log('No Mathematics folder found. Creating a test folder...');
      
      // Create a test folder with a question set and questions
      const testFolder = await prisma.folder.create({
        data: {
          name: 'Mathematics',
          description: 'A folder for mathematics questions',
          userId: 297, // Use the same user ID from your logs
          questionSets: {
            create: [
              {
                name: 'Algebra Basics',
                questions: {
                  create: [
                    {
                      text: 'What is the quadratic formula?',
                      answer: 'x = (-b ± √(b² - 4ac)) / 2a',
                      questionType: 'OPEN_ENDED',
                    },
                    {
                      text: 'Solve for x: 2x + 5 = 13',
                      answer: 'x = 4',
                      questionType: 'OPEN_ENDED',
                    }
                  ]
                }
              },
              {
                name: 'Geometry',
                questions: {
                  create: [
                    {
                      text: 'What is the formula for the area of a circle?',
                      answer: 'A = πr²',
                      questionType: 'OPEN_ENDED',
                    },
                    {
                      text: 'What is the Pythagorean theorem?',
                      answer: 'a² + b² = c²',
                      questionType: 'OPEN_ENDED',
                    }
                  ]
                }
              }
            ]
          }
        },
        include: {
          questionSets: {
            include: {
              questions: true
            }
          }
        }
      });
      
      console.log('Created test folder:', testFolder.id);
      
      // Use the newly created folder for testing
      testContextGeneration();
      return;
    }
    
    // Use the first Mathematics folder found
    const folder = folders[0];
    console.log(`Found Mathematics folder with ID: ${folder.id}`);
    console.log(`Folder name: ${folder.name}`);
    console.log(`Question sets: ${folder.questionSets.length}`);
    
    // Build the context object similar to what's done in the controller
    const folderInfo = {
      id: folder.id,
      name: folder.name,
      description: folder.description,
      createdAt: folder.createdAt.toISOString()
    };
    
    const questionSets = folder.questionSets.map(qs => ({
      id: qs.id,
      name: qs.name,
      folderName: folder.name,
      totalQuestions: qs.questions.length,
      createdAt: qs.createdAt.toISOString(),
      questions: qs.questions.map(q => ({
        id: q.id,
        text: q.text,
        answer: q.answer,
        questionType: q.questionType,
        uueFocus: q.uueFocus || 'Understand'
      }))
    }));
    
    // Extract unique question types
    const questionTypes = new Set<string>();
    const topics = new Set<string>();
    
    // Extract unique question types and potential topics from question texts
    questionSets.forEach(qs => {
      qs.questions.forEach(q => {
        if (q.questionType) questionTypes.add(q.questionType);
        
        // Extract potential topics from question text (simple approach)
        const words = q.text.split(' ');
        words.forEach(word => {
          if (word.length > 5 && !word.match(/^[0-9]+$/)) {
            topics.add(word.toLowerCase());
          }
        });
      });
    });
    
    // Build the context summary
    const summary = {
      totalQuestionSets: questionSets.length,
      totalQuestions: questionSets.reduce((acc, qs) => acc + qs.questions.length, 0),
      questionTypes: Array.from(questionTypes),
      topics: Array.from(topics).slice(0, 10) // Limit to 10 topics
    };
    
    // Build the full context object
    const aiContext = {
      folderInfo,
      questionSets,
      summary,
      userInfo: {
        id: 297,
        email: 'test@example.com',
        memberSince: new Date().toISOString()
      }
    };
    
    // Log the context object
    console.log('\n==== CONTEXT OBJECT FOR MATHEMATICS FOLDER ====');
    console.log(JSON.stringify(aiContext, null, 2));
    console.log('==== END OF CONTEXT OBJECT ====\n');
    
  } catch (error) {
    console.error('Error testing context generation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testContextGeneration();
