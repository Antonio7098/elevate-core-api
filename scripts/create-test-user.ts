/**
 * =================================================================
 * Elevate Application - Comprehensive Prisma Seed Script
 * =================================================================
 *
 * Instructions:
 * 1. Place this file in your `prisma/` directory (e.g., `prisma/seed.ts`).
 * 2. Ensure you have `ts-node` installed as a dev dependency (`npm install -D ts-node`).
 * 3. In your `package.json`, update the `prisma.seed` script:
 * "prisma": {
 * "seed": "ts-node prisma/seed.ts"
 * }
 * 4. Run the seed script from your terminal: `npx prisma db seed`
 *
 * This script will:
 * - Delete any existing 'test@example.com' user and their associated data.
 * - Create a new test user with a rich, nested structure of folders.
 * - Create multiple Question Sets with varying levels of mastery and review dates.
 * - Populate sets with diverse questions (Understand, Use, Explore).
 * - Create Notes and link Insight Catalysts to both Notes and Questions.
 * - Simulate past review sessions to generate realistic mastery history for stats tracking.
 */

import { PrismaClient, Question, QuestionSet } from '@prisma/client';
import bcrypt from 'bcryptjs';
// IMPORTANT: We will import and use the app's own service logic to ensure data consistency.
// Adjust the import path based on your project structure.

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
      scoreAchieved: scores[q.id],
      userAnswerText: `Answered on ${reviewDate.toISOString()}`,
      timeSpentOnQuestion: 30,
    }));
    
  if (outcomes.length === 0) return;

  const sessionDurationSeconds = outcomes.length * 45;

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

  // 3. --- Create Folder Hierarchy ---
  console.log('📁 Creating folder structure...');
  const scienceFolder = await prisma.folder.create({
    data: {
      name: 'Science',
      userId: user.id,
      imageUrls: ['https://placehold.co/600x400/a78bfa/FFFFFF?text=Science'],
    },
  });

  const physicsFolder = await prisma.folder.create({
    data: {
      name: 'Physics',
      userId: user.id,
      parentId: scienceFolder.id, // Nested folder
    },
  });

  const historyFolder = await prisma.folder.create({
    data: {
      name: 'History',
      userId: user.id,
    },
  });
  console.log('✅ Folder structure created.');

  // 4. --- Create Notes & Insight Catalysts ---
  console.log('📝 Creating notes and insight catalysts...');
  const physicsNote = await prisma.note.create({
    data: {
      title: 'Newtonian Physics Concepts',
      // Simulate React Quill Delta JSON format
      content: { "ops": [{ "insert": "Newton's First Law: An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.\n" }, { "attributes": { "block-id": "uuid-law-1" }, "insert": "\n" }, { "insert": "Newton's Second Law: F = ma.\n" }] },
      plainText: "Newton's First Law... F = ma.",
      userId: user.id,
      folderId: physicsFolder.id,
    },
  });

  await prisma.insightCatalyst.create({
    data: {
      type: 'analogy',
      text: "Think of Newton's First Law like pushing a shopping cart. It won't move until you push it, and it won't stop until it hits something (or friction stops it).",
      noteId: physicsNote.id,
      userId: user.id,
    },
  });
  console.log('✅ Notes and catalysts created.');

  // 5. --- Create Question Sets & Questions ---
  console.log('📚 Creating question sets and questions...');

  // Set 1: High Mastery, due in the future
  const highMasterySet = await prisma.questionSet.create({
    data: {
      name: 'Classical Mechanics',
      folderId: physicsFolder.id,
      questions: {
        create: [
          { text: "What is Newton's First Law of Motion?", uueFocus: 'Understand', totalMarksAvailable: 2, markingCriteria: {"criteria": ["Defines inertia", "Gives an example"]}, questionType: 'multiple-choice' },
          { text: "Calculate the force needed to accelerate a 10kg mass at 5 m/s^2.", uueFocus: 'Use', answer: "50 N", questionType: 'multiple-choice' },
          { text: "How would projectile motion differ on Mars compared to Earth?", uueFocus: 'Explore', totalMarksAvailable: 3, questionType: 'multiple-choice' },
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
      questions: {
        create: [
          { text: "Who was the first Tudor monarch?", uueFocus: 'Understand', answer: "Henry VII", questionType: 'multiple-choice' },
          { text: "Explain the main reason for the English Reformation.", uueFocus: 'Understand', totalMarksAvailable: 2, questionType: 'multiple-choice' },
          { text: "Contrast the reigns of Mary I and Elizabeth I.", uueFocus: 'Explore', totalMarksAvailable: 4, questionType: 'multiple-choice' },
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
      questions: {
        create: [
          { text: "What is the First Law of Thermodynamics?", uueFocus: 'Understand', totalMarksAvailable: 2, questionType: 'multiple-choice' },
          { text: "What is entropy?", uueFocus: 'Understand', questionType: 'multiple-choice' },
        ],
      },
    },
    include: { questions: true },
  });

  // Set 4: Never reviewed
  const newSet = await prisma.questionSet.create({
      data: { name: 'Optics', folderId: physicsFolder.id, questions: { create: [{ text: "What is refraction?", uueFocus: 'Understand', questionType: 'multiple-choice' }]}},
      include: { questions: true },
  });
  console.log('✅ Question sets and questions created.');
  
  // 6. --- Simulate Past Review History ---
  console.log('⏳ Simulating past review sessions to build history...');

  // High Mastery Set: Simulate 3 successful reviews
  const tenDaysAgo = new Date(); tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  await simulateReviewSession(user.id, highMasterySet, { [highMasterySet.questions[0].id]: 1, [highMasterySet.questions[1].id]: 1, [highMasterySet.questions[2].id]: 0.8 }, tenDaysAgo);
  
  const fiveDaysAgo = new Date(); fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  await simulateReviewSession(user.id, highMasterySet, { [highMasterySet.questions[2].id]: 1 }, fiveDaysAgo);

  const oneDayAgo = new Date(); oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  await simulateReviewSession(user.id, highMasterySet, { [highMasterySet.questions[2].id]: 1 }, oneDayAgo);

  // Critical Set: Simulate one poor review session 10 days ago, making it very overdue
  await simulateReviewSession(user.id, criticalSet, { [criticalSet.questions[0].id]: 0, [criticalSet.questions[1].id]: 0.5 }, tenDaysAgo);

  // Due Today Set: Simulate one decent review session that makes it due today
  const twoDaysAgo = new Date(); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  // Assume a 2-day interval was set after this review
  const tempSet = await prisma.questionSet.findUnique({ where: {id: dueTodaySet.id } });
  if (tempSet) {
      await prisma.questionSet.update({
          where: { id: dueTodaySet.id },
          data: { nextReviewAt: new Date(), lastReviewedAt: twoDaysAgo } // Manually set to be due today
      });
  }
  await simulateReviewSession(user.id, dueTodaySet, { [dueTodaySet.questions[0].id]: 0.8, [dueTodaySet.questions[1].id]: 0.6 }, twoDaysAgo);

  console.log('✅ History simulation complete.');
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
