import request from 'supertest';
import prisma from '../../lib/prisma';
import app from '../../app'; // Import app directly
import jwt from 'jsonwebtoken'; // For generating JWT tokens

describe('Stats API Endpoints', () => {
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
    const qSet = await prisma.questionSet.create({
      data: {
        folder: {
          create: {
            userId: userId,
            name: 'Stats Test Folder',
          },
        },
        name: 'Primary Stats Test Set',
        masteryHistory: testMasteryHistory,
        currentIntervalDays: 3,
        nextReviewAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        currentTotalMasteryScore: 75,
        understandScore: 80, 
        useScore: 70,        
        exploreScore: 75,    
        currentForgottenPercentage: 10,
        reviewCount: 2,
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
        data: { folderId: otherFolder.id, name: 'Other User Set' },
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
      let q1_questionId: number;
      let q2_questionId: number;
      // Create a folder for the primary test user
      const folder = await prisma.folder.create({
        data: {
          userId,
          name: 'User Stats Folder',
          masteryHistory: folderMasteryHistory,
        },
      });
      userFolderId = folder.id;

      // Create question sets within this folder
      const qs1 = await prisma.questionSet.create({
        data: {
          folderId: userFolderId,
          name: 'Set 1 in Stats Folder',
          currentTotalMasteryScore: 80,
          nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          questions: {
            create: [
              { text: 'Sample Q1 for Set1', answer: 'A', questionType: 'flashcard', uueFocus: 'Understand' },
            ],
          },
        },
        include: {
          questions: { select: { id: true } },
        },
      });
      qs1Id = qs1.id;
      if (!qs1.questions || qs1.questions.length === 0) {
        throw new Error('Test setup: Failed to create question for qs1');
      }
      q1_questionId = qs1.questions[0].id;

      const qs2 = await prisma.questionSet.create({
        data: {
          folderId: userFolderId,
          name: 'Set 2 in Stats Folder',
          currentTotalMasteryScore: 50,
          nextReviewAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          questions: {
            create: [
              { text: 'Sample Q1 for Set2', answer: 'B', questionType: 'flashcard', uueFocus: 'Understand' },
            ],
          },
        },
        include: {
          questions: { select: { id: true } },
        },
      });
      qs2Id = qs2.id;
      if (!qs2.questions || qs2.questions.length === 0) {
        throw new Error('Test setup: Failed to create question for qs2');
      }
      q2_questionId = qs2.questions[0].id;

      // Create study sessions and link them to answers for the questions in qs1 and qs2
      const session1Date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      const session1 = await prisma.userStudySession.create({
        data: {
          userId,
          sessionEndedAt: session1Date,
          timeSpentSeconds: 600,
          answeredQuestionsCount: 1,
          userQuestionAnswers: {
            create: [
              {
                userId, questionId: q1_questionId, questionSetId: qs1Id, userAnswerText: 'Ans1', scoreAchieved: 0.8, isCorrect: true, timeSpent: 300, answeredAt: session1Date
              }
            ]
          }
        }
      });

      const session2Date = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const session2 = await prisma.userStudySession.create({
        data: {
          userId,
          sessionEndedAt: session2Date,
          timeSpentSeconds: 700,
          answeredQuestionsCount: 1,
          userQuestionAnswers: {
            create: [
              {
                userId, questionId: q1_questionId, questionSetId: qs1Id, userAnswerText: 'Ans2', scoreAchieved: 0.5, isCorrect: false, timeSpent: 400, answeredAt: session2Date
              }
            ]
          }
        }
      });

      const session3Date = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const session3 = await prisma.userStudySession.create({
        data: {
          userId,
          sessionEndedAt: session3Date,
          timeSpentSeconds: 500,
          answeredQuestionsCount: 1,
          userQuestionAnswers: {
            create: [
              {
                userId, questionId: q2_questionId, questionSetId: qs2Id, userAnswerText: 'Ans3', scoreAchieved: 1, isCorrect: true, timeSpent: 250, answeredAt: session3Date
              }
            ]
          }
        }
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
  });
});
