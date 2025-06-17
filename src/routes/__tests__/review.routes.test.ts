import request from 'supertest';
import { PrismaClient, QuestionSet } from '@prisma/client';
import jwt from 'jsonwebtoken';
import app from '../../app';
import { FrontendReviewSubmission } from '../../types/review';
import { subDays, startOfDay } from 'date-fns';

const prisma = new PrismaClient();

describe('Review Routes', () => {
  let authToken: string;
  let userId: number;
  let folderId: number;
  let questionSetId: number; // Used by POST test
  let questionSetId2: number; // Used by POST test
  let questionId: number; // Used by POST test
  let questionId2: number; // Used by POST test
  let dueSetForGetTestId: number;
  let dueSetForGetTest_questionId: number;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: `test-review-${Date.now()}@example.com`,
        password: 'hashedpassword123',
      },
    });
    userId = user.id;

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    authToken = jwt.sign({ userId: user.id }, secret, { expiresIn: '1h' });

    const folder = await prisma.folder.create({
      data: { name: 'Test Review Folder', userId: user.id },
    });
    folderId = folder.id;

    const yesterday = startOfDay(subDays(new Date(), 1));

    const qs1 = await prisma.questionSet.create({
      data: {
        name: 'Test Review Question Set 1',
        folderId: folder.id,
        nextReviewAt: yesterday,
        questions: {
          create: [{ text: 'Q1', answer: 'A1', questionType: 'TEXT', totalMarksAvailable: 1 }],
        },
      },
      include: { questions: true },
    });
    questionSetId = qs1.id;
    questionId = qs1.questions[0].id;

    const qs2 = await prisma.questionSet.create({
      data: {
        name: 'Test Review Question Set 2',
        folderId: folder.id,
        nextReviewAt: yesterday,
        questions: {
          create: [{ text: 'Q2', answer: 'A2', questionType: 'TEXT', totalMarksAvailable: 4 }],
        },
      },
      include: { questions: true },
    });
    questionSetId2 = qs2.id;
    questionId2 = qs2.questions[0].id;

    // Dedicated set for the GET /api/reviews/question-set/:id 200 test
    const dueSetForGetTest = await prisma.questionSet.create({
      data: {
        name: 'Due Set for GET Test',
        folderId: folder.id,
        nextReviewAt: yesterday, // 'yesterday' is startOfDay(subDays(new Date(), 1))
        questions: {
          create: [{ text: 'Q for GET Test', answer: 'A for GET Test', questionType: 'TEXT', totalMarksAvailable: 5 }],
        },
      },
      include: { questions: true },
    });
    dueSetForGetTestId = dueSetForGetTest.id;
    dueSetForGetTest_questionId = dueSetForGetTest.questions[0].id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/reviews/today', () => {
    it('should return question sets due for review today', async () => {
      const response = await request(app)
        .get('/api/reviews/today')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(3);
      expect(response.body.questionSets).toHaveLength(3);
    });
  });

  describe('POST /api/reviews', () => {
    it('should submit a multi-set review and update all DB entities correctly', async () => {
      const reviewData: FrontendReviewSubmission = {
        outcomes: [
          { questionId: questionId, marksAchieved: 1, marksAvailable: 10, timeSpentOnQuestion: 60 },
          { questionId: questionId2, marksAchieved: 2, marksAvailable: 10, timeSpentOnQuestion: 50 },
        ],
        sessionDurationSeconds: 120,
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      expect(response.status).toBe(200);

      const updatedSet1 = response.body.find((s: QuestionSet) => s.id === questionSetId);
      expect(updatedSet1.currentTotalMasteryScore).toBe(100);
      const updatedSet2 = response.body.find((s: QuestionSet) => s.id === questionSetId2);
      expect(updatedSet2.currentTotalMasteryScore).toBe(50);

      const studySession = await prisma.userStudySession.findFirst({ where: { userId } });
      expect(studySession).not.toBeNull();

      const qsSession1 = await prisma.questionSetStudySession.findFirst({
        where: { sessionId: studySession!.id, questionSetId: questionSetId },
      });
      expect(qsSession1).not.toBeNull();
      expect(qsSession1?.sessionMarksAchieved).toBe(1);

      const qsSession2 = await prisma.questionSetStudySession.findFirst({
        where: { sessionId: studySession!.id, questionSetId: questionSetId2 },
      });
      expect(qsSession2).not.toBeNull();
      expect(qsSession2?.sessionMarksAchieved).toBe(2);

      const userAnswer1 = await prisma.userQuestionAnswer.findFirst({
        where: { questionId: questionId, questionSetStudySessionId: qsSession1!.id },
      });
      expect(userAnswer1).not.toBeNull();
      expect(userAnswer1?.isCorrect).toBe(true);

      const userAnswer2 = await prisma.userQuestionAnswer.findFirst({
        where: { questionId: questionId2, questionSetStudySessionId: qsSession2!.id },
      });
      expect(userAnswer2).not.toBeNull();
      expect(userAnswer2?.isCorrect).toBe(true);
    });
  });

  describe('GET /api/reviews/question-set/:questionSetId', () => {
    it('should return 403 if set is not due', async () => {
      const notDueSet = await prisma.questionSet.create({
        data: {
          name: 'Not Due Set',
          folderId: folderId,
          nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });
      const response = await request(app)
        .get(`/api/reviews/question-set/${notDueSet.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(403);
    });

    it('should return questions for a valid request', async () => {
      const response = await request(app)
        .get(`/api/reviews/question-set/${dueSetForGetTestId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      // The response body for this route is now an object: { questionSetId, questionSetName, count, questions }
      expect(response.body.questionSetId).toBe(dueSetForGetTestId);
      expect(Array.isArray(response.body.questions)).toBe(true);
      expect(response.body.questions[0].id).toBe(dueSetForGetTest_questionId);
    });
  });
});
