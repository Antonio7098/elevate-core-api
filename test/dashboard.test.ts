import request from 'supertest';
import app from '../src/app';
import prisma from '../src/lib/prisma'; // Use the shared prisma instance
import { QuestionSet, Folder, User } from '@prisma/client';

const TEST_USER_ID = 1;
const TEST_USER_EMAIL = 'testuser1@example.com';
const TEST_FOLDER_NAME = 'Dashboard Test Folder';

describe('Dashboard API', () => {
  let testUser: User;
  let testFolder: Folder;
  let dueTodaySet: QuestionSet;
  let recentSet: QuestionSet;
  let otherSet: QuestionSet;

  beforeAll(async () => {
    // 1. Ensure test user (id: 1) exists or create them
    testUser = await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      update: { email: TEST_USER_EMAIL }, // Ensure email is consistent if user exists
      create: {
        id: TEST_USER_ID,
        email: TEST_USER_EMAIL,
        password: 'somehashedpassword', // Not used for 'test123' token auth
      },
    });

    // 2. Create a folder for the test user
    testFolder = await prisma.folder.create({
      data: {
        name: TEST_FOLDER_NAME,
        userId: testUser.id,
      },
    });

    // 3. Create Question Sets
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    dueTodaySet = await prisma.questionSet.create({
      data: {
        name: 'Due Today Set',
        folderId: testFolder.id,
        nextReviewAt: today, // Due today
        questions: {
          create: [{ text: 'Q1 for due set', questionType: 'flashcard' }],
        },
      },
    });

    recentSet = await prisma.questionSet.create({
      data: {
        name: 'Recently Reviewed Set',
        folderId: testFolder.id,
        lastReviewedAt: yesterday, // Reviewed yesterday
        currentTotalMasteryScore: 75,
        understandScore: 80,
        useScore: 70,
        exploreScore: 75,
        questions: {
          create: [{ text: 'Q1 for recent set', questionType: 'flashcard' }],
        },
      },
    });

    otherSet = await prisma.questionSet.create({
      data: {
        name: 'Other Set - Not Due, Not Recent',
        folderId: testFolder.id,
        nextReviewAt: tomorrow, // Due tomorrow
        lastReviewedAt: new Date(today.setDate(today.getDate() - 10)), // Reviewed 10 days ago
        questions: {
          create: [{ text: 'Q1 for other set', questionType: 'flashcard' }],
        },
      },
    });
  });

  afterAll(async () => {
    // Clean up: Delete question sets, then folder, then user (if created by this test)
    // Order matters due to foreign key constraints
    await prisma.question.deleteMany({ where: { questionSet: { folderId: testFolder.id } } });
    await prisma.questionSet.deleteMany({ where: { folderId: testFolder.id } });
    await prisma.folder.deleteMany({ where: { id: testFolder.id } });
    // Only delete the user if we are sure it was created by these tests and isn't a general seed user
    // For now, assuming userId: 1 might be a general test user, so we won't delete it.
    // If it's exclusively for this test suite, uncomment the next line:
    // await prisma.user.delete({ where: { id: TEST_USER_ID } });
    await prisma.$disconnect();
  });

  describe('GET /api/dashboard', () => {
    const dashboardUrl = '/api/dashboard';
    const validToken = 'test123'; // From auth.middleware.ts special case for userId: 1

    it('should return 401 if no token is provided', async () => {
      const response = await request(app)
        .get(dashboardUrl)
        .expect('Content-Type', /json/)
        .expect(401);
      expect(response.body.message).toBe('No token, authorization denied');
    });

    it('should return 401 if an invalid token is provided', async () => {
      const response = await request(app)
        .get(dashboardUrl)
        .set('Authorization', 'Bearer invalidtoken')
        .expect('Content-Type', /json/)
        .expect(401);
      expect(response.body.message).toBe('Token is not valid');
    });

    it('should return dashboard data for an authenticated user', async () => {
      const response = await request(app)
        .get(dashboardUrl)
        .set('Authorization', `Bearer ${validToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      // Check overall structure
      expect(response.body).toHaveProperty('dueToday');
      expect(response.body).toHaveProperty('recentProgress');
      expect(response.body).toHaveProperty('overallStats');

      // Check dueToday
      expect(Array.isArray(response.body.dueToday)).toBe(true);
      expect(response.body.dueToday.length).toBe(1);
      const dueSet = response.body.dueToday[0];
      expect(dueSet.id).toBe(dueTodaySet.id);
      expect(dueSet.name).toBe(dueTodaySet.name);
      expect(dueSet.questionCount).toBe(1);

      // Check recentProgress
      expect(Array.isArray(response.body.recentProgress)).toBe(true);
      // Depending on the exact timing of 'yesterday' vs '10 days ago', recentSet should be there.
      const foundRecentSet = response.body.recentProgress.find((s: any) => s.id === recentSet.id);
      expect(foundRecentSet).toBeDefined();
      if (foundRecentSet) {
        expect(foundRecentSet.name).toBe(recentSet.name);
        expect(foundRecentSet.currentTotalMasteryScore).toBe(recentSet.currentTotalMasteryScore);
        expect(foundRecentSet.questionCount).toBe(1);
      }
      
      // Check overallStats
      const stats = response.body.overallStats;
      expect(stats.totalSets).toBe(3); // dueTodaySet, recentSet, otherSet
      expect(stats.setsDueCount).toBe(1);
      // Average mastery calculation depends on which sets are included by the service logic
      // For now, just check its presence and type
      expect(typeof stats.averageMastery).toBe('number');
    });

    it('should return empty arrays and zero stats if user has no relevant data', async () => {
      // Temporarily remove data for the test user to check empty state
      await prisma.question.deleteMany({ where: { questionSet: { folderId: testFolder.id } } });
      await prisma.questionSet.deleteMany({ where: { folderId: testFolder.id } });
      
      const response = await request(app)
        .get(dashboardUrl)
        .set('Authorization', `Bearer ${validToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.dueToday.length).toBe(0);
      expect(response.body.recentProgress.length).toBe(0);
      expect(response.body.overallStats.totalSets).toBe(0);
      expect(response.body.overallStats.setsDueCount).toBe(0);
      expect(response.body.overallStats.averageMastery).toBe(0);

      // Re-create data for other tests (or rely on afterAll to clean up if this is the last test in describe block)
      // For simplicity, we'll let afterAll handle full cleanup. 
      // If more tests followed this one within the same describe, we'd need to re-seed here.
    });
  });
});
