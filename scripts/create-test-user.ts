/**
 * =================================================================
 * Elevate Application - Comprehensive Prisma Seed Script
 * =================================================================
 *
 * Instructions:
 * 1. Place this file in your `scripts/` directory.
 * 2. Ensure you have `ts-node` installed as a dev dependency (`npm install -D ts-node`).
 * 3. Run the seed script from your terminal: `npx ts-node scripts/create-test-user.ts`
 *
 * This script will:
 * - Delete any existing 'test@example.com' user and their associated data.
 * - Create a new test user with a rich, nested structure of folders.
 * - Create multiple Question Sets with varying levels of mastery and review dates.
 * - Populate sets with diverse questions (Understand, Use, Explore) with proper answers.
 * - Create Notes and link Insight Catalysts to both Notes and Questions.
 * - Create UserMemory profile for personalized learning.
 * - Create LearningBlueprints for AI-generated content.
 * - Simulate past review sessions to generate realistic mastery history for stats tracking.
 */

import { PrismaClient, Question, QuestionSet, UserMemory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper function to simulate a review session and update a Question Set
async function simulateReviewSession(
  userId: number,
  questionSet: QuestionSet,
  scores: { [questionId: number]: number }, // Map of questionId -> score (0-1)
  reviewDate: Date
) {
  console.log(`  -> Simulating review for set: "${questionSet.name}" on ${reviewDate.toISOString()}`);
  
  // Fetch questions for this set
  const questions = await prisma.question.findMany({ where: { questionSetId: questionSet.id } });
  
  const outcomes = questions
    .filter(q => scores[q.id] !== undefined)
    .map(q => ({
      questionId: q.id,
      scoreAchieved: Math.round(scores[q.id] * q.totalMarksAvailable),
      userAnswerText: `Answered on ${reviewDate.toISOString()}`,
      timeSpent: 30,
      isCorrect: scores[q.id] >= 0.7,
      confidence: Math.round(scores[q.id] * 5),
    }));
    
  if (outcomes.length === 0) return;

  const sessionDurationSeconds = outcomes.length * 45;

  // Create a study session
  const studySession = await prisma.userStudySession.create({
    data: {
      userId,
      sessionStartedAt: new Date(reviewDate.getTime() - sessionDurationSeconds * 1000),
      sessionEndedAt: reviewDate,
      timeSpentSeconds: sessionDurationSeconds,
      answeredQuestionsCount: outcomes.length,
    }
  });

  // Create question set study session
  const questionSetStudySession = await prisma.questionSetStudySession.create({
    data: {
      userId,
      sessionId: studySession.id,
      questionSetId: questionSet.id,
      sessionMarksAchieved: outcomes.reduce((sum, o) => sum + o.scoreAchieved, 0),
      sessionMarksAvailable: outcomes.reduce((sum, o) => {
        const question = questions.find(q => q.id === o.questionId);
        return sum + (question?.totalMarksAvailable || 0);
      }, 0),
      questionsAnswered: { connect: outcomes.map(o => ({ id: o.questionId })) },
      srStageBefore: questionSet.srStage,
    }
  });

  // Create user question answers
  for (const outcome of outcomes) {
    await prisma.userQuestionAnswer.create({
      data: {
        userId,
        questionId: outcome.questionId,
        questionSetId: questionSet.id,
        questionSetStudySessionId: questionSetStudySession.id, // Link to the study session
        isCorrect: outcome.isCorrect,
        confidence: outcome.confidence,
        timeSpent: outcome.timeSpent,
        answeredAt: reviewDate,
        userAnswerText: outcome.userAnswerText,
        scoreAchieved: outcome.scoreAchieved,
      }
    });
  }

  // Calculate mastery scores for this session
  const totalMarksAchieved = outcomes.reduce((sum, o) => sum + o.scoreAchieved, 0);
  const totalMarksAvailable = outcomes.reduce((sum, o) => {
    const question = questions.find(q => q.id === o.questionId);
    return sum + (question?.totalMarksAvailable || 0);
  }, 0);
  
  const totalMastery = totalMarksAvailable > 0 ? Math.round((totalMarksAchieved / totalMarksAvailable) * 100) : 0;

  // Update question set with mastery history
  await prisma.questionSet.update({
    where: { id: questionSet.id },
    data: {
      lastReviewedAt: reviewDate,
      reviewCount: { increment: 1 },
      currentTotalMasteryScore: totalMastery,
      masteryHistory: {
        push: { 
          timestamp: reviewDate.toISOString(), 
          totalMasteryScore: totalMastery,
          understandScore: totalMastery, // Simplified for seeding
          useScore: totalMastery,        // Simplified for seeding
          exploreScore: totalMastery     // Simplified for seeding
        },
      },
    },
  });

  // Update parent folder's mastery history
  if (questionSet.folderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: questionSet.folderId },
      include: { questionSets: true }
    });
    
    if (folder) {
      // Calculate folder's aggregated mastery score
      const folderQuestionSets = folder.questionSets;
      const totalFolderMastery = folderQuestionSets.reduce((sum, qs) => sum + (qs.currentTotalMasteryScore || 0), 0);
      const averageFolderMastery = folderQuestionSets.length > 0 ? Math.round(totalFolderMastery / folderQuestionSets.length) : 0;
      
      await prisma.folder.update({
        where: { id: questionSet.folderId },
        data: {
          currentMasteryScore: averageFolderMastery,
          masteryHistory: {
            push: { 
              timestamp: reviewDate.toISOString(), 
              aggregatedScore: averageFolderMastery
            },
          },
        },
      });
    }
  }

  console.log(`Simulated review session for user ${userId} with ${outcomes.length} outcomes.`);
}

async function main() {
  console.log('🌱 Starting the seeding process...');

  // 1. --- Clean up existing test user ---
  console.log('🧹 Cleaning up previous test user data...');
  const existingUser = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
  });
  if (existingUser) {
    // The `onDelete: Cascade` in the schema for relations from User will handle cleanup
    await prisma.user.delete({ where: { id: existingUser.id } });
    console.log('✅ Previous test user and all related data deleted.');
  }

  // 2. --- Create the main test user ---
  const hashedPassword = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      password: hashedPassword,
      dailyStudyTimeMinutes: 30, // User wants ~20 questions a day
    },
  });
  console.log(`👤 Created user: ${user.email} (ID: ${user.id})`);

  // 3. --- Create UserMemory profile ---
  console.log('🧠 Creating user memory profile...');
  await prisma.userMemory.create({
    data: {
      userId: user.id,
      cognitiveApproach: 'ADAPTIVE',
      explanationStyles: ['ANALOGY_DRIVEN', 'PRACTICAL_EXAMPLES'],
      interactionStyle: 'SOCRATIC',
      primaryGoal: 'Master complex concepts through active learning',
    },
  });
  console.log('✅ User memory profile created.');

  // 4. --- Create Folder Hierarchy ---
  console.log('📁 Creating folder structure...');
  const scienceFolder = await prisma.folder.create({
    data: {
      name: 'Science',
      description: 'Core scientific concepts and principles',
      userId: user.id,
      imageUrls: ['https://placehold.co/600x400/a78bfa/FFFFFF?text=Science'],
      isPinned: true,
    },
  });

  const physicsFolder = await prisma.folder.create({
    data: {
      name: 'Physics',
      description: 'Classical and modern physics concepts',
      userId: user.id,
      parentId: scienceFolder.id, // Nested folder
      imageUrls: ['https://placehold.co/600x400/ef4444/FFFFFF?text=Physics'],
    },
  });

  const historyFolder = await prisma.folder.create({
    data: {
      name: 'History',
      description: 'Historical events and their significance',
      userId: user.id,
      imageUrls: ['https://placehold.co/600x400/f59e0b/FFFFFF?text=History'],
    },
  });
  console.log('✅ Folder structure created.');

  // 5. --- Create Learning Blueprint ---
  console.log('📋 Creating learning blueprint...');
  const learningBlueprint = await prisma.learningBlueprint.create({
    data: {
      userId: user.id,
      sourceText: "Newton's laws of motion are three fundamental principles that describe the relationship between forces acting on a body and the motion of that body. They form the foundation of classical mechanics.",
      blueprintJson: {
        title: "Newton's Laws of Motion",
        concepts: [
          "First Law (Inertia)",
          "Second Law (Force and Acceleration)", 
          "Third Law (Action-Reaction)"
        ],
        difficulty: "intermediate",
        estimatedTime: "2 hours"
      },
    },
  });
  console.log('✅ Learning blueprint created.');

  // 6. --- Create Notes & Insight Catalysts ---
  console.log('📝 Creating notes and insight catalysts...');
  const physicsNote = await prisma.note.create({
    data: {
      title: 'Newtonian Physics Concepts',
      content: {
        blocks: [
          {
            type: 'paragraph',
            content: "Newton's First Law: An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force."
          },
          {
            type: 'paragraph',
            content: "Newton's Second Law: F = ma. The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass."
          },
          {
            type: 'paragraph',
            content: "Newton's Third Law: For every action, there is an equal and opposite reaction."
          }
        ]
      },
      plainText: "Newton's First Law: An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.\nNewton's Second Law: F = ma. The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass.\nNewton's Third Law: For every action, there is an equal and opposite reaction.",
      userId: user.id,
      folderId: physicsFolder.id,
      generatedFromBlueprintId: learningBlueprint.id,
    },
  });

  await prisma.insightCatalyst.create({
    data: {
      type: 'analogy',
      text: "Think of Newton's First Law like pushing a shopping cart. It won't move until you push it, and it won't stop until it hits something (or friction stops it).",
      explanation: "This analogy helps visualize inertia by relating it to everyday experience.",
      noteId: physicsNote.id,
      userId: user.id,
      imageUrls: ['https://placehold.co/400x300/10b981/FFFFFF?text=Shopping+Cart'],
    },
  });
  console.log('✅ Notes and catalysts created.');

  // 7. --- Create Question Sets & Questions ---
  console.log('📚 Creating question sets and questions...');

  // Set 1: High Mastery, due in the future
  const highMasterySet = await prisma.questionSet.create({
    data: {
      name: 'Classical Mechanics',
      folderId: physicsFolder.id,
      currentTotalMasteryScore: 0.85,
      understandScore: 0.9,
      useScore: 0.8,
      exploreScore: 0.85,
      currentUUESetStage: 'Use',
      srStage: 3,
      easeFactor: 2.8,
      generatedFromBlueprintId: learningBlueprint.id,
      questions: {
        create: [
          { 
            text: "What is Newton's First Law of Motion?", 
            answer: "An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.",
            uueFocus: 'Understand', 
            totalMarksAvailable: 2, 
            markingCriteria: {
              criteria: [
                { description: "Defines inertia correctly", marks: 1 },
                { description: "Mentions 'unbalanced force'", marks: 1 }
              ]
            }, 
            questionType: 'short-answer',
            conceptTags: ['inertia', 'newton-laws', 'motion'],
            aiGenerated: true,
          },
          { 
            text: "Calculate the force needed to accelerate a 10kg mass at 5 m/s².", 
            answer: "50 N",
            uueFocus: 'Use', 
            totalMarksAvailable: 3,
            markingCriteria: {
              criteria: [
                { description: "Uses correct formula F=ma", marks: 1 },
                { description: "Substitutes values correctly", marks: 1 },
                { description: "Provides correct answer with units", marks: 1 }
              ]
            },
            questionType: 'short-answer',
            conceptTags: ['force', 'acceleration', 'newton-second-law'],
            aiGenerated: true,
          },
          { 
            text: "How would projectile motion differ on Mars compared to Earth?", 
            answer: "Projectile motion on Mars would have a longer range and higher trajectory due to Mars' lower gravitational acceleration (about 3.7 m/s² vs 9.8 m/s² on Earth).",
            uueFocus: 'Explore', 
            totalMarksAvailable: 3, 
            markingCriteria: {
              criteria: [
                { description: "Identifies gravity difference", marks: 1 },
                { description: "Explains impact on trajectory", marks: 1 },
                { description: "Mentions specific values", marks: 1 }
              ]
            },
            questionType: 'short-answer',
            conceptTags: ['projectile-motion', 'gravity', 'comparative-analysis'],
            aiGenerated: true,
          },
        ],
      },
    },
    include: { questions: true },
  });

  // Set 2: Low Mastery, CRITICALLY Overdue
  const criticalSet = await prisma.questionSet.create({
    data: {
      name: 'The Tudor Dynasty',
      folderId: historyFolder.id,
      currentTotalMasteryScore: 0.3,
      understandScore: 0.4,
      useScore: 0.2,
      exploreScore: 0.3,
      currentUUESetStage: 'Understand',
      srStage: 0,
      easeFactor: 1.5,
      questions: {
        create: [
          { 
            text: "Who was the first Tudor monarch?", 
            answer: "Henry VII",
            uueFocus: 'Understand', 
            totalMarksAvailable: 1,
            markingCriteria: {
              criteria: [
                { description: "Correctly identifies Henry VII", marks: 1 }
              ]
            },
            questionType: 'short-answer',
            conceptTags: ['tudor-dynasty', 'henry-vii', 'english-monarchy'],
          },
          { 
            text: "Explain the main reason for the English Reformation.", 
            answer: "The main reason was Henry VIII's desire to annul his marriage to Catherine of Aragon, which the Pope refused. This led Henry to break with the Catholic Church and establish the Church of England.",
            uueFocus: 'Understand', 
            totalMarksAvailable: 2,
            markingCriteria: {
              criteria: [
                { description: "Mentions Henry VIII's marriage issue", marks: 1 },
                { description: "Explains the break with Catholic Church", marks: 1 }
              ]
            },
            questionType: 'short-answer',
            conceptTags: ['english-reformation', 'henry-viii', 'church-of-england'],
          },
          { 
            text: "Contrast the reigns of Mary I and Elizabeth I.", 
            answer: "Mary I (Bloody Mary) was a Catholic who persecuted Protestants and married Philip II of Spain. Elizabeth I was Protestant, established religious compromise, never married, and presided over England's golden age.",
            uueFocus: 'Explore', 
            totalMarksAvailable: 4,
            markingCriteria: {
              criteria: [
                { description: "Describes Mary's Catholic policies", marks: 1 },
                { description: "Mentions Mary's marriage", marks: 1 },
                { description: "Describes Elizabeth's Protestant policies", marks: 1 },
                { description: "Mentions Elizabeth's unmarried status and golden age", marks: 1 }
              ]
            },
            questionType: 'short-answer',
            conceptTags: ['mary-i', 'elizabeth-i', 'tudor-comparison'],
          },
        ],
      },
    },
    include: { questions: true },
  });

  // Set 3: Medium Mastery, due TODAY
  const dueTodaySet = await prisma.questionSet.create({
    data: {
      name: 'Thermodynamics Basics',
      folderId: physicsFolder.id,
      currentTotalMasteryScore: 0.6,
      understandScore: 0.7,
      useScore: 0.5,
      exploreScore: 0.6,
      currentUUESetStage: 'Understand',
      srStage: 1,
      easeFactor: 2.0,
      questions: {
        create: [
          { 
            text: "What is the First Law of Thermodynamics?", 
            answer: "The First Law of Thermodynamics states that energy cannot be created or destroyed, only transformed from one form to another. In a closed system, the total energy remains constant.",
            uueFocus: 'Understand', 
            totalMarksAvailable: 2,
            markingCriteria: {
              criteria: [
                { description: "States energy conservation principle", marks: 1 },
                { description: "Mentions energy transformation", marks: 1 }
              ]
            },
            questionType: 'short-answer',
            conceptTags: ['thermodynamics', 'energy-conservation', 'first-law'],
          },
          { 
            text: "What is entropy?", 
            answer: "Entropy is a measure of disorder or randomness in a system. It tends to increase in isolated systems, representing the natural tendency toward disorder.",
            uueFocus: 'Understand', 
            totalMarksAvailable: 2,
            markingCriteria: {
              criteria: [
                { description: "Defines entropy as disorder measure", marks: 1 },
                { description: "Mentions tendency to increase", marks: 1 }
              ]
            },
            questionType: 'short-answer',
            conceptTags: ['entropy', 'thermodynamics', 'disorder'],
          },
        ],
      },
    },
    include: { questions: true },
  });

  // Set 4: Never reviewed
  const newSet = await prisma.questionSet.create({
    data: { 
      name: 'Optics', 
      folderId: physicsFolder.id, 
      currentTotalMasteryScore: 0.0,
      understandScore: 0.0,
      useScore: 0.0,
      exploreScore: 0.0,
      currentUUESetStage: 'Explore',
      srStage: 0,
      easeFactor: 2.5,
      questions: { 
        create: [{ 
          text: "What is refraction?", 
          answer: "Refraction is the bending of light as it passes from one medium to another with a different optical density, causing the light to change direction.",
          uueFocus: 'Understand', 
          totalMarksAvailable: 2,
          markingCriteria: {
            criteria: [
              { description: "Defines refraction as bending of light", marks: 1 },
              { description: "Mentions different optical densities", marks: 1 }
            ]
          },
          questionType: 'short-answer',
          conceptTags: ['optics', 'refraction', 'light'],
        }]
      }
    },
    include: { questions: true },
  });
  console.log('✅ Question sets and questions created.');
  
  // 8. --- Simulate Past Review History ---
  console.log('⏳ Simulating past review sessions to build history...');

  // Remove previous simulateReviewSession calls for these sets (if any)
  // High Mastery Set, Critical Set, Due Today Set, New Set: Simulate 3 reviews each
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  for (const set of [highMasterySet, criticalSet, dueTodaySet, newSet]) {
    const questions = set.questions;
    // First review: all correct
    await simulateReviewSession(user.id, set, Object.fromEntries(questions.map(q => [q.id, 1])), fiveDaysAgo);
    // Second review: partial correct
    await simulateReviewSession(user.id, set, Object.fromEntries(questions.map(q => [q.id, 0.7])), threeDaysAgo);
    // Third review: some wrong
    await simulateReviewSession(user.id, set, Object.fromEntries(questions.map(q => [q.id, 0.5])), oneDayAgo);
  }

  // Optionally, update dueTodaySet's nextReviewAt to today (as before)
  const tempSet = await prisma.questionSet.findUnique({ where: {id: dueTodaySet.id } });
  if (tempSet) {
      await prisma.questionSet.update({
          where: { id: dueTodaySet.id },
          data: { nextReviewAt: new Date(), lastReviewedAt: oneDayAgo } // Manually set to be due today
      });
  }

  console.log('✅ History simulation complete.');

  // 9. --- Create Insight Catalysts for Questions ---
  console.log('💡 Creating insight catalysts for questions...');
  await prisma.insightCatalyst.create({
    data: {
      type: 'mnemonic',
      text: "Remember: 'F = ma' - Force equals mass times acceleration. Think of it as 'Fast Moving Automobile' - the faster you want to go, the more force you need!",
      explanation: "This mnemonic helps remember the mathematical relationship in Newton's Second Law.",
      questionId: highMasterySet.questions[1].id,
      userId: user.id,
      imageUrls: ['https://placehold.co/400x300/3b82f6/FFFFFF?text=F%3Dma'],
    },
  });

  await prisma.insightCatalyst.create({
    data: {
      type: 'real-world-example',
      text: "Think of entropy like your bedroom - it naturally gets messier over time unless you put in effort to clean it. The universe works the same way!",
      explanation: "This analogy helps visualize the concept of increasing disorder in systems.",
      questionId: dueTodaySet.questions[1].id,
      userId: user.id,
      imageUrls: ['https://placehold.co/400x300/8b5cf6/FFFFFF?text=Entropy'],
    },
  });
  console.log('✅ Question insight catalysts created.');

  console.log('\n🎉 Test user creation complete!');
  console.log('📧 Email: test@example.com');
  console.log('🔑 Password: password123');
  console.log('👤 User ID:', user.id);
  console.log('\n📊 Created:');
  console.log(`  - ${await prisma.folder.count()} folders`);
  console.log(`  - ${await prisma.questionSet.count()} question sets`);
  console.log(`  - ${await prisma.question.count()} questions`);
  console.log(`  - ${await prisma.note.count()} notes`);
  console.log(`  - ${await prisma.insightCatalyst.count()} insight catalysts`);
  console.log(`  - ${await prisma.userQuestionAnswer.count()} question answers`);
  console.log(`  - ${await prisma.userStudySession.count()} study sessions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('🌱 Seeding process finished.');
  });
