import request from 'supertest';
import { PrismaClient, Question, QuestionSet, Folder, User } from '@prisma/client';
import { FrontendReviewSubmission } from '../../types/review';
import { getIntervalForMastery } from '../../services/spacedRepetition.service';
import app from '../../app';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Review Routes', () => {
  let authToken: string;
  let userId: number;
  let folderId: number;
  let questionSetId: number;
  let questionSetId2: number;
  let questionId: number;
  let questionId2: number;

  // Setup test data before all tests
  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.question.deleteMany({
      where: {
        questionSet: {
          folder: {
            user: {
              email: 'test-review@example.com'
            }
          }
        }
      }
    });
    await prisma.questionSet.deleteMany({
      where: {
        folder: {
          user: {
            email: 'test-review@example.com'
          }
        }
      }
    });
    await prisma.folder.deleteMany({
      where: {
        user: {
          email: 'test-review@example.com'
        }
      }
    });
    await prisma.user.deleteMany({
      where: {
        email: 'test-review@example.com'
      }
    });

    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'test-review@example.com',
        password: 'hashedpassword123'
      }
    });
    userId = user.id;

    // Create a test folder
    const folder = await prisma.folder.create({
      data: {
        name: 'Test Review Folder',
        description: 'A folder for testing review routes',
        userId: user.id
      }
    });
    folderId = folder.id;

    // Create a test question set
    const questionSet = await prisma.questionSet.create({
      data: {
        name: 'Test Review Question Set',
        folderId: folder.id
      }
    });
    questionSetId = questionSet.id;

    // Create a second test question set
    const questionSet2 = await prisma.questionSet.create({
      data: {
        name: 'Test Review Question Set 2',
        folderId: folder.id,
      },
    });
    questionSetId2 = questionSet2.id;

    // Create test questions with different uueFocus and totalMarksAvailable
    const questionData = [
      {
        text: 'What is spaced repetition? (Understand)',
        answer: 'A learning technique that incorporates increasing intervals of time between reviews of previously learned material.',
        options: ['A learning technique', 'A memorization method', 'A scheduling system'],
        questionType: 'multiple-choice',
        uueFocus: 'Understand',
        totalMarksAvailable: 1,
      },
      {
        text: 'How do you apply SR? (Use)',
        answer: 'By reviewing material at systematic intervals.',
        options: ['Option A', 'Option B', 'Option C'],
        questionType: 'multiple-choice',
        uueFocus: 'Use',
        totalMarksAvailable: 2,
      },
      {
        text: 'Explore SR variations. (Explore)',
        answer: 'E.g., Leitner system, SuperMemo.',
        options: ['Option X', 'Option Y', 'Option Z'],
        questionType: 'multiple-choice',
        uueFocus: 'Explore',
        totalMarksAvailable: 1,
      },
    ];

    const createdQuestions = await Promise.all(
      questionData.map(q => prisma.question.create({
        data: {
          ...q,
          questionSetId: questionSet.id,
        }
      }))
    );

    const createdQuestions2 = await prisma.question.create({
      data: {
        text: 'Second set question',
        answer: 'An answer.',
        questionType: 'multiple-choice',
        uueFocus: 'Explore',
        totalMarksAvailable: 4,
        questionSetId: questionSetId2,
      },
    });

    // Save the ID of the first question for testing the review submission
    questionId = createdQuestions[0].id; // This is the 'Understand' question
    questionId2 = createdQuestions2.id;

    // Original code for reference, now replaced by the above structured creation
    // const questions = await Promise.all([


    // Generate JWT token for authentication
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    authToken = jwt.sign({ userId: user.id }, secret, { expiresIn: '1h' });
  });

  // Clean up after all tests
  afterAll(async () => {
    await prisma.question.deleteMany({
      where: {
        questionSet: {
          folder: {
            user: {
              email: 'test-review@example.com'
            }
          }
        }
      }
    });
    await prisma.questionSet.deleteMany({
      where: {
        folder: {
          user: {
            email: 'test-review@example.com'
          }
        }
      }
    });
    await prisma.folder.deleteMany({
      where: {
        user: {
          email: 'test-review@example.com'
        }
      }
    });
    await prisma.user.deleteMany({
      where: {
        email: 'test-review@example.com'
      }
    });
    await prisma.$disconnect();
  });

  describe('GET /api/reviews/today', () => {
    it('should return questions due for review today', async () => {
      const response = await request(app)
        .get('/api/reviews/today')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('questionSets');
      expect(Array.isArray(response.body.questionSets)).toBe(true);
      
      // Should include question sets that are due
      expect(response.body.count).toBe(2); // Two sets are created, both are due initially
      
      // Check that the question sets have the expected properties
      if (response.body.questionSets.length > 0) {
        const qSet = response.body.questionSets[0];
        expect(qSet).toHaveProperty('id');
        expect(qSet).toHaveProperty('name');
        expect(qSet).toHaveProperty('folderId');
        expect(qSet).toHaveProperty('folderName');
        expect(qSet).toHaveProperty('overallMasteryScore'); // Example new property
        expect(qSet).toHaveProperty('understandScore');
        expect(qSet).toHaveProperty('useScore');
        expect(qSet).toHaveProperty('exploreScore');
        expect(qSet).toHaveProperty('lastReviewedAt');
        expect(qSet).toHaveProperty('totalQuestions');
        expect(qSet).toHaveProperty('reviewCount');
        expect(qSet).toHaveProperty('previewQuestions');
        expect(Array.isArray(qSet.previewQuestions)).toBe(true);
        if (qSet.previewQuestions.length > 0) {
          const previewQuestion = qSet.previewQuestions[0];
          expect(previewQuestion).toHaveProperty('id');
          expect(previewQuestion).toHaveProperty('text');
          expect(previewQuestion).toHaveProperty('questionType');
          // Removed masteryScore and nextReviewAt from individual preview question checks
        }
      }
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/reviews/today');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/reviews', () => {
    it('should submit a review and update QuestionSet scores for a correct answer', async () => {
      const initialQuestionSet = await prisma.questionSet.findUnique({
        where: { id: questionSetId },
      });
      if (!initialQuestionSet) throw new Error('Test setup error: Initial question set not found');

      // This test simulates answering one question correctly.
      const reviewData: FrontendReviewSubmission = {
        outcomes: [
          { questionId: questionId, marksAchieved: 1, marksAvailable: 1 },
        ],
        sessionDurationSeconds: 120,
      };

      // Based on the test setup:
      // Q1 (Understand, totalMarks: 1) is answered with 1/1 marks.
      // Q2 (Use, totalMarks: 2) is not answered.
      // Q3 (Explore, totalMarks: 1) is not answered.
      // Total marks available = 1 + 2 + 1 = 4. Total marks achieved = 1.
      const expectedTotalMasteryScore = Math.round((1 / 4) * 100); // 25

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const updatedSet = response.body[0];
      expect(updatedSet.id).toBe(questionSetId);
      expect(updatedSet.currentTotalMasteryScore).toBe(expectedTotalMasteryScore);
      expect(updatedSet.reviewCount).toBe((initialQuestionSet.reviewCount || 0) + 1);
      expect(updatedSet.lastReviewedAt).not.toBeNull();
      expect(new Date(updatedSet.lastReviewedAt!)).toBeInstanceOf(Date);
    });

    it('should submit a review and update QuestionSet scores for an incorrect answer', async () => {
      const initialQuestionSet = await prisma.questionSet.findUnique({
        where: { id: questionSetId },
      });
      if (!initialQuestionSet) throw new Error('Test setup error: Initial question set not found');

      // This test simulates answering one question incorrectly.
      const reviewData: FrontendReviewSubmission = {
        outcomes: [
          { questionId: questionId, marksAchieved: 0, marksAvailable: 1 },
        ],
        sessionDurationSeconds: 60,
      };

      // Total marks achieved = 0.
      const expectedTotalMasteryScore = 0;

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);

      const updatedSet = response.body[0];
      expect(updatedSet.id).toBe(questionSetId);
      expect(updatedSet.currentTotalMasteryScore).toBe(expectedTotalMasteryScore);
      expect(updatedSet.reviewCount).toBe((initialQuestionSet.reviewCount || 0) + 1);
      expect(updatedSet.lastReviewedAt).not.toBeNull();
    });

    it('should handle a review submission spanning multiple question sets', async () => {
      const reviewData: FrontendReviewSubmission = {
        outcomes: [
          { questionId: questionId, marksAchieved: 1, marksAvailable: 1, timeSpentOnQuestion: 10 }, // From set 1
          { questionId: questionId2, marksAchieved: 4, marksAvailable: 4, timeSpentOnQuestion: 15 }, // From set 2
        ],
        sessionDurationSeconds: 25,
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);

      // Verify updates for the first set
      const updatedSet1 = response.body.find((s: QuestionSet) => s.id === questionSetId);
      expect(updatedSet1).toBeDefined();
      expect(updatedSet1.currentTotalMasteryScore).toBe(25); // 1/4 marks for the whole set

      // Verify updates for the second set
      const updatedSet2 = response.body.find((s: QuestionSet) => s.id === questionSetId2);
      expect(updatedSet2).toBeDefined();
      expect(updatedSet2.currentTotalMasteryScore).toBe(100); // 4/4 marks for the whole set
    });

    it('should return 404 if a question in the review does not exist', async () => {
      const nonExistentQuestionId = 999999;
      const reviewData: FrontendReviewSubmission = {
        outcomes: [
          { questionId: nonExistentQuestionId, marksAchieved: 1, marksAvailable: 1 },
        ],
        sessionDurationSeconds: 10,
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe(`Question with ID ${nonExistentQuestionId} not found during review processing.`);
    });

    it('should require authentication', async () => {
      const reviewData: FrontendReviewSubmission = {
        outcomes: [
          { questionId: questionId, marksAchieved: 1, marksAvailable: 1 },
        ],
        sessionDurationSeconds: 60,
      };

      const response = await request(app)
        .post('/api/reviews')
        .send(reviewData);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/reviews/question-set/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/reviews/question-set/${questionSetId}`);
      expect(response.status).toBe(401);
    });

    it('should return 403 or 404 if user does not own the question set', async () => {
      // Create a second user and question set
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-review@example.com',
          password: 'hashedpassword456'
        }
      });
      const otherFolder = await prisma.folder.create({
        data: {
          name: 'Other Review Folder',
          description: 'A folder for unauthorized access test',
          userId: otherUser.id
        }
      });
      const otherQuestionSet = await prisma.questionSet.create({
        data: {
          name: 'Other Review Question Set',
          folderId: otherFolder.id
        }
      });
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const otherAuthToken = jwt.sign({ userId: otherUser.id }, secret, { expiresIn: '1h' });

      // Try to access the main user's question set with other user's token
      const forbiddenResponse = await request(app)
        .get(`/api/reviews/question-set/${questionSetId}`)
        .set('Authorization', `Bearer ${otherAuthToken}`);
      expect([403, 404]).toContain(forbiddenResponse.status);

      // Clean up
      await prisma.questionSet.delete({ where: { id: otherQuestionSet.id } });
      await prisma.folder.delete({ where: { id: otherFolder.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should return 200 and prioritized questions for a valid request', async () => {
      const response = await request(app)
        .get(`/api/reviews/question-set/${questionSetId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.questions) || Array.isArray(response.body)).toBe(true);
      // Accept either { questions: [...] } or just an array for flexibility
      const questions = Array.isArray(response.body.questions) ? response.body.questions : response.body;
      expect(questions.length).toBeGreaterThan(0);
      for (const q of questions) {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('text');
        expect(q).toHaveProperty('questionType');
        expect(q).toHaveProperty('options');
        expect(q).toHaveProperty('uueFocus');
        expect(q).toHaveProperty('conceptTags');
        expect(q).toHaveProperty('totalMarksAvailable');
        expect(q).toHaveProperty('priorityScore');
      }
    });
  });

  describe('GET /api/reviews/stats', () => {
      it('should return review statistics', async () => {
        const response = await request(app)
          .get('/api/reviews/stats')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('totalQuestions');
        expect(response.body).toHaveProperty('totalSets');
        expect(response.body).toHaveProperty('masteredSets');
        expect(response.body).toHaveProperty('dueSets');
        
        
        // Check that the statistics are numbers
        expect(typeof response.body.totalQuestions).toBe('number');
        expect(typeof response.body.totalSets).toBe('number');
        expect(typeof response.body.masteredSets).toBe('number');
        expect(typeof response.body.dueSets).toBe('number');
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .get('/api/reviews/stats');

        expect(response.status).toBe(401);
      });
    });
});
