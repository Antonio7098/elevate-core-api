import request from 'supertest';
import prisma from '../../lib/prisma';
import app from '../../app'; // Import app directly
import jwt from 'jsonwebtoken'; // For generating JWT tokens

describe.skip('Stats API Endpoints', () => {
  let userToken: string;
  let userId: number;
  let questionSetId: number; // For the primary question set used in tests
  const testMasteryHistory = [
    { timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), totalMasteryScore: 50, understandScore: 60, useScore: 40, exploreScore: 50, intervalDays: 1 },
    { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), totalMasteryScore: 75, understandScore: 80, useScore: 70, exploreScore: 75, intervalDays: 3 },
  ];

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not set for testing');
    }
    // Clean up potential leftover test users
    await prisma.user.deleteMany({ where: { email: 'stats-test-user@example.com' } });
    await prisma.user.deleteMany({ where: { email: 'otherstats-qs@example.com' } }); // For question set 403 test
    await prisma.user.deleteMany({ where: { email: 'otherstats-folder@example.com' } }); // For folder 403 test

    const user = await prisma.user.create({
      data: {
        email: 'stats-test-user@example.com',
        password: 'password',
      },
    });
    userId = user.id;
    userToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Create a primary QuestionSet for this user for testing question set details
    const folder = await prisma.folder.create({ data: { userId, name: 'Stats Test Folder' } });
    const qSet = await prisma.questionSet.create({
      data: {
        title: 'Primary Stats Test Set',
        userId: userId,
        folderId: folder.id,
      },
    });
    questionSetId = qSet.id;
  });

  afterAll(async () => {
    // Clean up test data - order matters
    // Clean up primary test user data
    await prisma.questionSet.deleteMany({ where: { folder: { userId: userId } } });
    await prisma.folder.deleteMany({ where: { userId: userId } });
    await prisma.user.deleteMany({ where: { id: userId } });

    // Clean up other users created specifically for 403 tests
    // Note: Cascading deletes should handle their folders/sets if schema is set up for it.
    // If not, explicit deletion of their sets/folders would be needed here first.
    await prisma.user.deleteMany({ where: { email: 'otherstats-qs@example.com' } });
    await prisma.user.deleteMany({ where: { email: 'otherstats-folder@example.com' } });

    await prisma.$disconnect();
  });

  describe('GET /api/stats/questionsets/:setId/details', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get(`/api/stats/questionsets/${questionSetId}/details`);
      expect(res.status).toBe(401);
    });

    it('should return 404 if question set does not exist', async () => {
      const nonExistentSetId = 99999;
      const res = await request(app)
        .get(`/api/stats/questionsets/${nonExistentSetId}/details`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 403 if question set does not belong to the user', async () => {
      // Create another user and their question set
      const otherUser = await prisma.user.create({
        data: { email: 'otherstats-qs@example.com', password: 'password' },
      });
      const otherFolder = await prisma.folder.create({
        data: { userId: otherUser.id, name: 'Other User Folder' },
      });
      const otherSet = await prisma.questionSet.create({
        data: { folderId: otherFolder.id, title: 'Other User Set', userId: otherUser.id },
      });

      const res = await request(app)
        .get(`/api/stats/questionsets/${otherSet.id}/details`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 200 and question set details for a valid request', async () => {
      const res = await request(app)
        .get(`/api/stats/questionsets/${questionSetId}/details`) // Use questionSetId from outer scope
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('masteryHistory');
      expect(res.body.masteryHistory).toEqual(testMasteryHistory); // Use testMasteryHistory from outer scope
      expect(res.body).toHaveProperty('reviewCount', 2); // Corrected from totalReviews
      expect(res.body).toHaveProperty('reviewDates'); // Check presence, actual values depend on UserQuestionSetReview
      expect(res.body).toHaveProperty('currentSRStatus');
      expect(res.body.currentSRStatus).toHaveProperty('currentIntervalDays', 3);
      expect(res.body.currentSRStatus.nextReviewAt).toBeDefined();
      expect(new Date(res.body.currentSRStatus.nextReviewAt).getTime()).toBeGreaterThan(Date.now());
      // Assert top-level scores (assuming testPrimaryQuestionSet was updated with these values)
      expect(res.body).toHaveProperty('currentTotalMasteryScore', 75); // Value from testPrimaryQuestionSet
      expect(res.body).toHaveProperty('understandScore', 80);          // Value from testPrimaryQuestionSet
      expect(res.body).toHaveProperty('useScore', 70);                // Value from testPrimaryQuestionSet
      expect(res.body).toHaveProperty('exploreScore', 75);            // Value from testPrimaryQuestionSet
      expect(res.body.currentSRStatus).toHaveProperty('currentForgottenPercentage', 10);
    });
  });

  describe('GET /api/stats/folders/:folderId/details', () => {
    let userFolderId: number;
    let qs1Id: number, qs2Id: number;
    const folderMasteryHistory = [
      { timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), aggregatedScore: 40 },
      { timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), aggregatedScore: 65 },
    ];

    beforeAll(async () => {
      // Create a folder for the primary test user
      const folder = await prisma.folder.create({
        data: {
          userId,
          name: 'Folder for Stats Test',
          masteryHistory: folderMasteryHistory,
        },
      });
      userFolderId = folder.id;

      // Create two question sets with one question each
      const qs1 = await prisma.questionSet.create({
        data: {
          folderId: userFolderId,
          title: 'Set 1 in Stats Folder',
          userId: userId,
        },
        include: { questions: true },
      });
      qs1Id = qs1.id;
      const q1_questionId = qs1.questions[0].id;

      const qs2 = await prisma.questionSet.create({
        data: {
          folderId: userFolderId,
          title: 'Set 2 in Stats Folder',
          userId: userId,
        },
        include: { questions: true },
      });
      qs2Id = qs2.id;
      const q2_questionId = qs2.questions[0].id;

      // --- Refactored Study Session and Answer Creation ---

      // Session 1: Answered Q1 from QS1
      const session1Date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const userSession1 = await prisma.userStudySession.create({
        data: { userId, sessionEndedAt: session1Date, timeSpentSeconds: 600, answeredQuestionsCount: 1 },
      });
      await prisma.questionSetStudySession.create({
        data: {
          userId: userId,
          sessionId: userSession1.id,
          questionSetId: qs1Id,
          sessionMarksAchieved: 1,
          sessionMarksAvailable: 1,
          srStageBefore: 0,
          questionsAnswered: { connect: [{ id: q1_questionId }] },
          userQuestionAnswers: {
            create: {
              userId: userId,
              questionId: q1_questionId,
              userAnswerText: 'Ans1',
              scoreAchieved: 0.8,
              isCorrect: true,
              timeSpent: 300,
              answeredAt: session1Date,
            },
          },
        },
      });

      // Session 2: Answered Q1 from QS1 again
      const session2Date = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const userSession2 = await prisma.userStudySession.create({
        data: { userId, sessionEndedAt: session2Date, timeSpentSeconds: 700, answeredQuestionsCount: 1 },
      });
      await prisma.questionSetStudySession.create({
        data: {
          userId: userId,
          sessionId: userSession2.id,
          questionSetId: qs1Id,
          sessionMarksAchieved: 0,
          sessionMarksAvailable: 1,
          srStageBefore: 1,
          questionsAnswered: { connect: [{ id: q1_questionId }] },
          userQuestionAnswers: {
            create: {
              userId: userId,
              questionId: q1_questionId,
              userAnswerText: 'Ans2',
              scoreAchieved: 0.5,
              isCorrect: false,
              timeSpent: 400,
              answeredAt: session2Date,
            },
          },
        },
      });

      // Session 3: Answered Q2 from QS2
      const session3Date = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const userSession3 = await prisma.userStudySession.create({
        data: { userId, sessionEndedAt: session3Date, timeSpentSeconds: 500, answeredQuestionsCount: 1 },
      });
      await prisma.questionSetStudySession.create({
        data: {
          userId: userId,
          sessionId: userSession3.id,
          questionSetId: qs2Id,
          sessionMarksAchieved: 1,
          sessionMarksAvailable: 1,
          srStageBefore: 0,
          questionsAnswered: { connect: [{ id: q2_questionId }] },
          userQuestionAnswers: {
            create: {
              userId: userId,
              questionId: q2_questionId,
              userAnswerText: 'Ans3',
              scoreAchieved: 1,
              isCorrect: true,
              timeSpent: 250,
              answeredAt: session3Date,
            },
          },
        },
      });
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get(`/api/stats/folders/${userFolderId}/details`);
      expect(res.status).toBe(401);
    });

    it('should return 404 if folder does not exist', async () => {
      const nonExistentFolderId = 88888;
      const res = await request(app)
        .get(`/api/stats/folders/${nonExistentFolderId}/details`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(404);
    });

    it('should return 403 if folder does not belong to the user', async () => {
      const otherUser = await prisma.user.create({
        data: { email: 'otherstats-folder@example.com', password: 'password' },
      });
      const otherUserFolder = await prisma.folder.create({
        data: { userId: otherUser.id, name: 'Other User Stats Folder' },
      });

      const res = await request(app)
        .get(`/api/stats/folders/${otherUserFolder.id}/details`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should return 200 and folder details for a valid request', async () => {
      const res = await request(app)
        .get(`/api/stats/folders/${userFolderId}/details`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('masteryHistory');
      expect(res.body.masteryHistory).toEqual(folderMasteryHistory);
      expect(res.body).toHaveProperty('totalReviewSessionsInFolder', 3);
      expect(res.body).toHaveProperty('questionSetSummaries');
      expect(res.body.questionSetSummaries).toHaveLength(2);

      const summaryQs1 = res.body.questionSetSummaries.find((s: any) => s.id === qs1Id);
      expect(summaryQs1).toBeDefined();
      expect(summaryQs1.name).toBe('Set 1 in Stats Folder');
      expect(summaryQs1.currentTotalMasteryScore).toBe(80);
      expect(new Date(summaryQs1.nextReviewAt).getTime()).toBeGreaterThan(Date.now());

      const summaryQs2 = res.body.questionSetSummaries.find((s: any) => s.id === qs2Id);
      expect(summaryQs2).toBeDefined();
      expect(summaryQs2.name).toBe('Set 2 in Stats Folder');
      expect(summaryQs2.currentTotalMasteryScore).toBe(50);
      expect(new Date(summaryQs2.nextReviewAt).getTime()).toBeGreaterThan(Date.now());
    });

    it('should return question sets from nested subfolders', async () => {
      // Create a nested folder structure
      const subfolder = await prisma.folder.create({
        data: {
          userId,
          name: 'Subfolder in Stats Test',
          parentId: userFolderId,
        },
      });

      // Create a question set in the subfolder
      const nestedQs = await prisma.questionSet.create({
        data: {
          folderId: subfolder.id,
          title: 'Nested Question Set',
          userId: userId,
        },
        include: { questions: true },
      });

      // Create a study session for the nested question set
      const nestedSessionDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const nestedUserSession = await prisma.userStudySession.create({
        data: { userId, sessionEndedAt: nestedSessionDate, timeSpentSeconds: 300, answeredQuestionsCount: 1 },
      });
      await prisma.questionSetStudySession.create({
        data: {
          userId: userId,
          sessionId: nestedUserSession.id,
          questionSetId: nestedQs.id,
          sessionMarksAchieved: 1,
          sessionMarksAvailable: 1,
          srStageBefore: 0,
          questionsAnswered: { connect: [{ id: nestedQs.questions[0].id }] },
          userQuestionAnswers: {
            create: {
              userId: userId,
              questionId: nestedQs.questions[0].id,
              userAnswerText: 'Nested Answer',
              scoreAchieved: 1,
              isCorrect: true,
              timeSpent: 150,
              answeredAt: nestedSessionDate,
            },
          },
        },
      });

      // Test that the parent folder details include the nested question set
      const res = await request(app)
        .get(`/api/stats/folders/${userFolderId}/details`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('questionSetSummaries');
      expect(res.body.questionSetSummaries).toHaveLength(3); // 2 original + 1 nested

      const nestedSummary = res.body.questionSetSummaries.find((s: any) => s.id === nestedQs.id);
      expect(nestedSummary).toBeDefined();
      expect(nestedSummary.name).toBe('Nested Question Set');
      expect(nestedSummary.currentTotalMasteryScore).toBe(90);

      expect(res.body).toHaveProperty('totalReviewSessionsInFolder', 4); // 3 original + 1 nested
    });
  });
});
