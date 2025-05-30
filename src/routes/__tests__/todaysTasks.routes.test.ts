import request from 'supertest';
import app from '../../app'; // Adjust path if your app entry point is different
import prisma from '../../lib/prisma';
import { User, Folder, QuestionSet, Question } from '@prisma/client'; // Removed UserQuestionAnswer as it's not directly used yet
import { QuestionWithContext } from '../../types/todaysTasks.types';
import { protect } from '../../middleware/auth.middleware'; // Import the actual middleware

// Mock the auth middleware
jest.mock('../../middleware/auth.middleware', () => ({
  protect: jest.fn((req, res, next) => next()), // Default mock passes through
}));

const mockedProtect = protect as jest.Mock;

describe('GET /api/todays-tasks', () => {
  let testUser: User;
  let testFolder: Folder;

  // Helper to set up the authenticated user for a test run
  const setAuthenticatedUser = (userId: number) => {
    mockedProtect.mockImplementation((req, res, next) => {
      req.user = { userId };
      next();
    });
  };

  beforeAll(async () => {
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        email: `testuser-todaytasks-${Date.now()}@example.com`,
        password: 'testpassword', // Changed from passwordHash to password
        dailyStudyTimeMinutes: 30, // Default study time
      },
    });

    testFolder = await prisma.folder.create({
      data: {
        name: 'Test Folder for TodayTasks',
        userId: testUser.id,
      },
    });
  });

  afterEach(async () => {
    // Clean up question sets, questions, and answers created during tests
    await prisma.userQuestionAnswer.deleteMany({ where: { userId: testUser.id } });
    await prisma.question.deleteMany({ where: { questionSet: { folderId: testFolder.id } } });
    await prisma.questionSet.deleteMany({ where: { folderId: testFolder.id } });
  });

  afterAll(async () => {
    // Clean up the test folder and user
    await prisma.folder.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  it('should return 401 if no token is provided (actual middleware behavior)', async () => {
    // For this specific test, we want the real middleware to run to check unauth path
    mockedProtect.mockImplementation(jest.requireActual('../../middleware/auth.middleware').protect);
    const response = await request(app).get('/api/todays-tasks');
    expect(response.status).toBe(401);
    // Reset mock for other tests if needed, or set it specifically in each test
  });

  it('should return 200 and an empty list if user has no due tasks', async () => {
    setAuthenticatedUser(testUser.id);
    const response = await request(app)
      .get('/api/todays-tasks'); // No need for .set(getAuthHeader()) anymore

    expect(response.status).toBe(200);
    expect(response.body.criticalQuestions).toEqual([]);
    expect(response.body.coreQuestions).toEqual([]);
    expect(response.body.plusQuestions).toEqual([]);
    expect(response.body.selectedCoreAndCriticalCount).toBe(0);
    expect(response.body.targetQuestionCount).toBe(20); // Math.max(5, Math.floor(30 / 1.5))
  });

  it('should return critical tasks when a set in \'Understand\' stage is overdue', async () => {
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
    fourDaysAgo.setHours(0, 0, 0, 0); // Set to beginning of four days ago

    const criticalSet = await prisma.questionSet.create({
      data: {
        name: 'Critical Overdue Set',
        folderId: testFolder.id,
        nextReviewAt: fourDaysAgo, // Adjusted to be >3 days overdue
        currentUUESetStage: 'Understand',
        currentTotalMasteryScore: 10,
        questions: {
          create: [
            {
              text: 'Critical Question 1?',
              answer: 'Yes 1.',
              uueFocus: 'Understand',
              currentMasteryScore: 0.1,
              questionType: 'flashcard', // Added questionType
            },
            {
              text: 'Critical Question 2?',
              answer: 'Yes 2.',
              uueFocus: 'Understand',
              currentMasteryScore: 0.2,
              questionType: 'flashcard', // Added questionType
            },
          ],
        },
      },
      include: {
        questions: true, // Ensure questions are returned for assertion
      },
    });

    setAuthenticatedUser(testUser.id);
    const response = await request(app)
      .get('/api/todays-tasks');

    expect(response.status).toBe(200);
    expect(response.body.criticalQuestions).toHaveLength(2);
    expect(response.body.criticalQuestions[0].questionSetId).toBe(criticalSet.id);
    expect(response.body.criticalQuestions[0].questionSetName).toBe(criticalSet.name);
    expect(response.body.criticalQuestions[0].text).toBe('Critical Question 1?'); // Direct string comparison
    expect(response.body.criticalQuestions[0].uueFocus).toBe('Understand');
    expect(response.body.criticalQuestions[1].text).toBe('Critical Question 2?'); // Direct string comparison

    expect(response.body.coreQuestions).toEqual([]);
    expect(response.body.plusQuestions).toEqual([]);
    expect(response.body.selectedCoreAndCriticalCount).toBe(2);
    expect(response.body.targetQuestionCount).toBe(20);
  });

  // More tests to be added here:
  // - User with critical due tasks
  // - User with core due tasks
  // - User with plus tasks eligible
  // - Interaction with dailyStudyTimeMinutes
  // - mockToday query parameter functionality
  // - Prioritization (basic checks)

  it('should return core tasks when a set is due but not critical', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const coreSet = await prisma.questionSet.create({
      data: {
        name: 'Core Due Set',
        folderId: testFolder.id,
        nextReviewAt: yesterday, // Due, but not >3 days overdue
        currentUUESetStage: 'Understand',
        currentTotalMasteryScore: 30, // Not critical (e.g., > 20)
        questions: {
          create: [
            {
              text: 'Core Question 1U?',
              answer: 'Core Answer 1U.',
              uueFocus: 'Understand',
              currentMasteryScore: 0.3,
              questionType: 'flashcard',
            },
            {
              text: 'Core Question 2S?', // Note: S for 'Use', but set stage is 'Understand'
              answer: 'Core Answer 2S.',
              uueFocus: 'Use', // This question won't be picked if currentUUESetStage is 'Understand'
              currentMasteryScore: 0.4,
              questionType: 'flashcard',
            },
          ],
        },
      },
    });

    setAuthenticatedUser(testUser.id);
    const response = await request(app)
      .get('/api/todays-tasks');

    expect(response.status).toBe(200);
    expect(response.body.criticalQuestions).toEqual([]);

    expect(response.body.coreQuestions).toHaveLength(2); // Expect 2 now

    // First question (from set's currentUUESetStage)
    const q1 = response.body.coreQuestions.find((q: QuestionWithContext) => q.text === 'Core Question 1U?');
    expect(q1).toBeDefined();
    expect(q1!.questionSetId).toBe(coreSet.id);
    expect(q1!.questionSetName).toBe(coreSet.name);
    expect(q1!.text).toBe('Core Question 1U?');
    expect(q1!.uueFocus).toBe('Understand');
    expect(q1!.selectedForUUEFocus).toBe('Understand');

    // Second question (from fallback UUE stage for the same set)
    const q2 = response.body.coreQuestions.find((q: QuestionWithContext) => q.text === 'Core Question 2S?');
    expect(q2).toBeDefined();
    expect(q2!.questionSetId).toBe(coreSet.id);
    expect(q2!.questionSetName).toBe(coreSet.name);
    expect(q2!.text).toBe('Core Question 2S?');
    expect(q2!.uueFocus).toBe('Use');
    expect(q2!.selectedForUUEFocus).toBe('Use');

    expect(response.body.plusQuestions).toEqual([]);
    expect(response.body.selectedCoreAndCriticalCount).toBe(2); // Now 2
    expect(response.body.targetQuestionCount).toBe(20);
  });

  it('should return plus questions when core/critical targets are met but overall target is not', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const plusTestSet = await prisma.questionSet.create({
      data: {
        name: 'Set for Plus Questions',
        folderId: testFolder.id,
        nextReviewAt: yesterday,
        currentUUESetStage: 'Understand',
        currentTotalMasteryScore: 30, // Regular, not critical
        questions: {
          create: [
            {
              text: 'Q1U - Core for Plus Test',
              answer: 'A1U',
              uueFocus: 'Understand',
              currentMasteryScore: 0.1, // Low score, likely picked
              questionType: 'flashcard',
            },
            {
              text: 'Q2S - Core for Plus Test',
              answer: 'A2S',
              uueFocus: 'Use',
              currentMasteryScore: 0.2, // Low score, likely picked
              questionType: 'flashcard',
            },
            {
              text: 'Q3E - Plus for Plus Test',
              answer: 'A3E',
              uueFocus: 'Explore',
              currentMasteryScore: 0.3, // Low score, likely picked
              questionType: 'flashcard',
            },
          ],
        },
      },
    });

    setAuthenticatedUser(testUser.id); // Default user, targetQuestionCount should be 20
    const response = await request(app).get('/api/todays-tasks');

    expect(response.status).toBe(200);
    expect(response.body.criticalQuestions).toEqual([]);

    // Core questions (Q1U, Q2S, and Q3E due to high targetCoreCount)
    expect(response.body.coreQuestions).toHaveLength(3);
    const coreTexts = response.body.coreQuestions.map((q: QuestionWithContext) => q.text);
    expect(coreTexts).toContain('Q1U - Core for Plus Test');
    expect(coreTexts).toContain('Q2S - Core for Plus Test');
    expect(coreTexts).toContain('Q3E - Plus for Plus Test'); // Q3E is also picked as core

    // Plus questions (should be empty as core took all)
    expect(response.body.plusQuestions).toHaveLength(0);
    
    expect(response.body.selectedCoreAndCriticalCount).toBe(3); // All 3 selected are core
    expect(response.body.targetQuestionCount).toBe(20);
  });
});
