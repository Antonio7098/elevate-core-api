import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../app';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Review Routes', () => {
  let authToken: string;
  let userId: number;
  let folderId: number;
  let questionSetId: number;
  let questionId: number;

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

    // Create test questions with different mastery levels
    const questions = await Promise.all([
      // Question due for review (mastery 2, reviewed yesterday)
      prisma.question.create({
        data: {
          text: 'What is spaced repetition?',
          answer: 'A learning technique that incorporates increasing intervals of time between reviews of previously learned material.',
          options: ['A learning technique', 'A memorization method', 'A scheduling system'],
          questionType: 'multiple-choice',
          masteryScore: 2,
          nextReviewAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
          questionSetId: questionSet.id
        }
      }),
      // Question not due for review (mastery 3, reviewed tomorrow)
      prisma.question.create({
        data: {
          text: 'What is the forgetting curve?',
          answer: 'A hypothesis that describes the decrease in ability to retain memory over time.',
          options: ['A graph showing memory decay', 'A learning theory', 'A cognitive bias'],
          questionType: 'multiple-choice',
          masteryScore: 3,
          nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          questionSetId: questionSet.id
        }
      }),
      // Question never reviewed (mastery 0, null nextReviewAt)
      prisma.question.create({
        data: {
          text: 'What is the spacing effect?',
          answer: 'The phenomenon whereby learning is greater when studying is spread out over time.',
          options: ['A learning principle', 'A memory technique', 'A cognitive phenomenon'],
          questionType: 'multiple-choice',
          masteryScore: 0,
          questionSetId: questionSet.id
        }
      })
    ]);

    // Save the ID of the first question for testing the review submission
    questionId = questions[0].id;

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
      expect(response.body).toHaveProperty('questions');
      expect(Array.isArray(response.body.questions)).toBe(true);
      
      // Should include questions that are due (past review date or never reviewed)
      expect(response.body.count).toBe(2);
      
      // Check that the questions have the expected properties
      if (response.body.questions.length > 0) {
        const question = response.body.questions[0];
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('text');
        expect(question).toHaveProperty('questionType');
        expect(question).toHaveProperty('options');
        expect(question).toHaveProperty('masteryScore');
        expect(question).toHaveProperty('nextReviewAt');
        expect(question).toHaveProperty('questionSetId');
        expect(question).toHaveProperty('questionSetName');
        expect(question).toHaveProperty('folderId');
        expect(question).toHaveProperty('folderName');
      }
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/reviews/today');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/reviews', () => {
    it('should submit a review and update the question', async () => {
      const reviewData = {
        questionId,
        answeredCorrectly: true,
        userAnswer: 'A learning technique that incorporates increasing intervals of time between reviews of previously learned material.'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('question');
      expect(response.body).toHaveProperty('reviewResult');
      
      // Check that the mastery score was increased
      expect(response.body.reviewResult.oldMasteryScore).toBe(2);
      expect(response.body.reviewResult.newMasteryScore).toBe(3);
      expect(response.body.reviewResult.answeredCorrectly).toBe(true);
      expect(response.body.reviewResult).toHaveProperty('nextReviewAt');
      
      // Verify that the question was updated in the database
      const updatedQuestion = await prisma.question.findUnique({
        where: { id: questionId }
      });
      
      expect(updatedQuestion).not.toBeNull();
      expect(updatedQuestion?.masteryScore).toBe(3);
      expect(updatedQuestion?.nextReviewAt).not.toBeNull();
    });

    it('should decrease mastery score for incorrect answers', async () => {
      // First get the current mastery score
      const question = await prisma.question.findUnique({
        where: { id: questionId }
      });
      
      const currentMastery = question?.masteryScore || 0;
      
      const reviewData = {
        questionId,
        answeredCorrectly: false,
        userAnswer: 'Wrong answer'
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      expect(response.status).toBe(200);
      
      // Check that the mastery score was decreased by 2 (or to min of 0)
      const expectedNewMastery = Math.max(0, currentMastery - 2);
      expect(response.body.reviewResult.oldMasteryScore).toBe(currentMastery);
      expect(response.body.reviewResult.newMasteryScore).toBe(expectedNewMastery);
      expect(response.body.reviewResult.answeredCorrectly).toBe(false);
    });

    it('should require authentication', async () => {
      const reviewData = {
        questionId,
        answeredCorrectly: true
      };

      const response = await request(app)
        .post('/api/reviews')
        .send(reviewData);

      expect(response.status).toBe(401);
    });

    it('should validate the request body', async () => {
      // Missing questionId
      const invalidReviewData = {
        answeredCorrectly: true
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidReviewData);

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent question', async () => {
      const reviewData = {
        questionId: 99999, // Non-existent ID
        answeredCorrectly: true
      };

      const response = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/reviews/stats', () => {
    it('should return review statistics', async () => {
      const response = await request(app)
        .get('/api/reviews/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalQuestions');
      expect(response.body).toHaveProperty('reviewedQuestions');
      expect(response.body).toHaveProperty('masteredQuestions');
      expect(response.body).toHaveProperty('dueQuestions');
      expect(response.body).toHaveProperty('questionsByMastery');
      expect(response.body).toHaveProperty('completionRate');
      
      // Check that the statistics are numbers
      expect(typeof response.body.totalQuestions).toBe('number');
      expect(typeof response.body.reviewedQuestions).toBe('number');
      expect(typeof response.body.masteredQuestions).toBe('number');
      expect(typeof response.body.dueQuestions).toBe('number');
      expect(typeof response.body.completionRate).toBe('number');
      
      // Check that questionsByMastery is an array with 6 items (mastery 0-5)
      expect(Array.isArray(response.body.questionsByMastery)).toBe(true);
      expect(response.body.questionsByMastery.length).toBe(6);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/reviews/stats');

      expect(response.status).toBe(401);
    });
  });
});
