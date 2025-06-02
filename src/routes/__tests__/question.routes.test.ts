import request from 'supertest';
import app from '../../app'; // Assuming your Express app is exported from app.ts
import { PrismaClient, User, Folder, QuestionSet } from '@prisma/client';
import { generateToken } from '../../utils/jwt'; // Assuming jwt.ts will be restored or re-created

const prisma = new PrismaClient();

let user1: User, user2: User;
let user1Token: string, user2Token: string;
let user1Folder1: Folder;
let user1Qs1: QuestionSet;

describe('Question API - GET /api/folders/:folderId/questionsets/:setId/questions', () => {
  beforeAll(async () => {
    // Clear database before all tests
    await prisma.question.deleteMany();
    await prisma.questionSet.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    user1 = await prisma.user.create({
      data: { email: 'user1.question@example.com', password: 'password123' },
    });
    user2 = await prisma.user.create({
      data: { email: 'user2.question@example.com', password: 'password123' },
    });

    // Generate tokens
    // Note: generateToken from utils/jwt.ts needs to exist. If not, this will fail.
    // For now, assuming it will be restored or a placeholder is used.
    try {
        user1Token = generateToken({ userId: user1.id });
        user2Token = generateToken({ userId: user2.id });
    } catch (e) {
        console.error("Failed to generate tokens. Ensure utils/jwt.ts and its generateToken function are available.");
        // Fallback tokens if generateToken is not available, tests might not behave as expected for auth
        user1Token = 'fallback.token.user1'; 
        user2Token = 'fallback.token.user2';
    }

    // Create a folder for user1
    user1Folder1 = await prisma.folder.create({
      data: {
        name: 'User1 Folder1 For Questions',
        userId: user1.id,
      },
    });

    // Create a question set in user1Folder1
    user1Qs1 = await prisma.questionSet.create({
      data: {
        name: 'User1 QS1 in Folder1',
        folderId: user1Folder1.id,
        understandScore: 0,
        useScore: 0,
        exploreScore: 0,
        currentTotalMasteryScore: 0,
        currentIntervalDays: 1,
        nextReviewAt: null,
        lastReviewedAt: null
      },
    });
  });

  beforeEach(async () => {
    // Clear only questions before each test, as folder and question set are shared
    await prisma.question.deleteMany();
  });

  afterAll(async () => {
    // Final cleanup
    await prisma.question.deleteMany();
    await prisma.questionSet.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  // --- Test cases will go here ---

  describe('Successful Retrieval', () => {
    it('should retrieve all questions for a specific question set', async () => {
      // 1. Create sample questions in user1Qs1
      // Create test questions one by one to handle the JSON field properly
      await prisma.question.create({
        data: { 
          text: 'Q1 Text', 
          answer: 'A1', 
          questionSetId: user1Qs1.id, 
          questionType: 'flashcard',
          uueFocus: 'Understand',
          conceptTags: ['concept1', 'concept2'],
          difficultyScore: 0.5,
          timesAnsweredCorrectly: 0,
          timesAnsweredIncorrectly: 0,
          lastAnswerCorrect: null,
          // In the schema, totalMarksAvailable is mapped to marksAvailable in the database
          // but we need to use totalMarksAvailable in the Prisma client
          totalMarksAvailable: 2, 
          markingCriteria: [
            { criterion: 'Basic understanding', marks: 1 },
            { criterion: 'Detailed explanation', marks: 1 }
          ]
        } as any
      });
      
      await prisma.question.create({
        data: { 
          text: 'Q2 Text', 
          answer: 'A2', 
          questionSetId: user1Qs1.id, 
          questionType: 'flashcard',
          uueFocus: 'Use',
          conceptTags: ['concept2', 'concept3'],
          difficultyScore: 0.7,
          timesAnsweredCorrectly: 0,
          timesAnsweredIncorrectly: 0,
          lastAnswerCorrect: null,
          // In the schema, totalMarksAvailable is mapped to marksAvailable in the database
          // but we need to use totalMarksAvailable in the Prisma client
          totalMarksAvailable: 4, 
          markingCriteria: [
            { criterion: 'Correct application', marks: 2 },
            { criterion: 'Clear reasoning', marks: 2 }
          ]
        } as any
      });

      const res = await request(app)
        .get(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty('text', 'Q1 Text');
      expect(res.body[1]).toHaveProperty('text', 'Q2 Text');
      // Verify new question attributes are returned
      expect(res.body[0]).toHaveProperty('totalMarksAvailable', 2);
      expect(res.body[0]).toHaveProperty('markingCriteria');
      expect(res.body[0].markingCriteria).toHaveLength(2);
      expect(res.body[0].markingCriteria[0]).toHaveProperty('criterion', 'Basic understanding');
      
      expect(res.body[1]).toHaveProperty('totalMarksAvailable', 4);
      expect(res.body[1]).toHaveProperty('markingCriteria');
      expect(res.body[1].markingCriteria).toHaveLength(2);
      expect(res.body[1].markingCriteria[1]).toHaveProperty('marks', 2);
    });

    it('should return an empty array if the question set has no questions', async () => {
      const res = await request(app)
        .get(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(0);
    });
  });

  describe('Error Handling & Validation', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions`);
      expect(res.statusCode).toEqual(401);
    });

    it('should return 400 if folderId is not a number', async () => {
      const res = await request(app)
        .get(`/api/folders/invalidFolderId/questionsets/${user1Qs1.id}/questions`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].msg).toEqual('Folder ID parameter must be a positive integer');
    });

    it('should return 400 if setId is not a number', async () => {
      const res = await request(app)
        .get(`/api/folders/${user1Folder1.id}/questionsets/invalidSetId/questions`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].msg).toEqual('Set ID parameter must be a positive integer');
    });

    it('should return 404 if folderId does not exist', async () => {
      const nonExistentFolderId = 99999;
      const res = await request(app)
        .get(`/api/folders/${nonExistentFolderId}/questionsets/${user1Qs1.id}/questions`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Folder not found or access denied.');
    });

    it('should return 404 if trying to access questions in another user\'s folder', async () => {
      const res = await request(app)
        .get(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions`)
        .set('Authorization', `Bearer ${user2Token}`); // Use user2's token
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Folder not found or access denied.');
    });

    it('should return 404 if questionSetId does not exist', async () => {
      const nonExistentSetId = 99999;
      const res = await request(app)
        .get(`/api/folders/${user1Folder1.id}/questionsets/${nonExistentSetId}/questions`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Question set not found in this folder or access denied.');
    });

    it('should return 404 if questionSetId exists but does not belong to the specified folderId', async () => {
      // Create another folder for user1
      const user1Folder2 = await prisma.folder.create({
        data: { name: 'User1 Folder2 For Questions', userId: user1.id },
      });
      // user1Qs1 belongs to user1Folder1, try to access it via user1Folder2
      const res = await request(app)
        .get(`/api/folders/${user1Folder2.id}/questionsets/${user1Qs1.id}/questions`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Question set not found in this folder or access denied.');
    });
  });

  // --- Test cases for POST endpoint ---
  describe('POST /api/folders/:folderId/questionsets/:setId/questions - Create Question', () => {
    // We need to use totalMarksAvailable in both the request and response
    // because that's the field name in the Prisma client (though it's mapped to marksAvailable in DB)
    const validQuestionData = {
      text: 'What is the capital of France?',
      questionType: 'multiple-choice',
      options: ['Paris', 'London', 'Berlin', 'Madrid'],
      answer: 'Paris',
      uueFocus: 'Understand',
      difficultyScore: 0.5,
      conceptTags: ['Geography', 'Europe'],
      totalMarksAvailable: 3, // This is mapped to marksAvailable in the database
      markingCriteria: [
        { criterion: 'Correct identification of capital', marks: 1 },
        { criterion: 'Understanding of European geography', marks: 2 }
      ]
    };

    it('should create a new question successfully with all valid data', async () => {
      const res = await request(app)
        .post(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(validQuestionData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.text).toEqual(validQuestionData.text);
      expect(res.body.questionType).toEqual(validQuestionData.questionType);
      expect(res.body.options).toEqual(validQuestionData.options);
      expect(res.body.answer).toEqual(validQuestionData.answer);
      expect(res.body.questionSetId).toEqual(user1Qs1.id);
      expect(res.body.totalMarksAvailable).toEqual(validQuestionData.totalMarksAvailable);
      expect(res.body.markingCriteria).toEqual(validQuestionData.markingCriteria);
    });

    it('should create a new question successfully with only required data (text, questionType)', async () => {
      const minimalData = {
        text: 'What is 2 + 2?',
        questionType: 'flashcard',
      };
      const res = await request(app)
        .post(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(minimalData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.text).toEqual(minimalData.text);
      expect(res.body.questionType).toEqual(minimalData.questionType);
      expect(res.body.options).toEqual([]); // Default from controller
      expect(res.body.answer).toBeNull(); // Default from schema or controller
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .post(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions`)
        .send(validQuestionData);
      expect(res.statusCode).toEqual(401);
    });

    it('should return 404 if folderId does not exist', async () => {
      const nonExistentFolderId = 99999;
      const res = await request(app)
        .post(`/api/folders/${nonExistentFolderId}/questionsets/${user1Qs1.id}/questions`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(validQuestionData);
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Folder not found or access denied.');
    });

    it('should return 404 if questionSetId does not exist', async () => {
      const nonExistentSetId = 99999;
      const res = await request(app)
        .post(`/api/folders/${user1Folder1.id}/questionsets/${nonExistentSetId}/questions`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(validQuestionData);
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Question set not found in this folder.');
    });

    it('should return 404 if trying to create a question in another user\'s folder', async () => {
      const res = await request(app)
        .post(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions`)
        .set('Authorization', `Bearer ${user2Token}`) // User2's token
        .send(validQuestionData);
      expect(res.statusCode).toEqual(404);
    });

    describe('Input Validation', () => {
      it('should return 400 if text is missing', async () => {
        const { text, ...invalidData } = validQuestionData;
        const res = await request(app)
          .post(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send(invalidData);
        expect(res.statusCode).toEqual(400);
        expect(res.body.errors[0].msg).toEqual('Question text cannot be empty');
      });

      it('should return 400 if questionType is missing', async () => {
        const { questionType, ...invalidData } = validQuestionData;
        const res = await request(app)
          .post(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send(invalidData);
        expect(res.statusCode).toEqual(400);
        expect(res.body.errors[0].msg).toEqual('Question type cannot be empty');
      });

      it('should return 400 if options is not an array', async () => {
        const invalidData = { ...validQuestionData, options: 'not-an-array' };
        const res = await request(app)
          .post(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send(invalidData);
        expect(res.statusCode).toEqual(400);
        expect(res.body.errors[0].msg).toEqual('Options, if provided, must be an array');
      });

      it('should return 400 if options contains empty strings', async () => {
        const invalidData = { ...validQuestionData, options: ['Paris', ''] };
        const res = await request(app)
          .post(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send(invalidData);
        expect(res.statusCode).toEqual(400);
        expect(res.body.errors[0].msg).toEqual('Options cannot contain empty strings');
      });

      it('should return 400 if folderId param is invalid', async () => {
        const res = await request(app)
          .post(`/api/folders/abc/questionsets/${user1Qs1.id}/questions`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send(validQuestionData);
        expect(res.statusCode).toEqual(400);
        expect(res.body.errors[0].msg).toEqual('Folder ID parameter must be a positive integer');
      });

      it('should return 400 if setId param is invalid', async () => {
        const res = await request(app)
          .post(`/api/folders/${user1Folder1.id}/questionsets/xyz/questions`)
          .set('Authorization', `Bearer ${user1Token}`)
          .send(validQuestionData);
        expect(res.statusCode).toEqual(400);
        expect(res.body.errors[0].msg).toEqual('Set ID parameter must be a positive integer');
      });
    });
  });

  // GET /api/folders/:folderId/questionsets/:setId/questions/:id - Get Question by ID
  describe('GET /api/folders/:folderId/questionsets/:setId/questions/:id - Get Question by ID', () => {
    let testQuestion: any;
    let otherUserQuestion: any;
    let otherUserFolder: any;
    let otherUserQuestionSet: any;

    beforeAll(async () => {
      // Clean up existing questions
      await prisma.question.deleteMany();
      

      
      // Verify the question set exists before creating the question
      const verifiedQuestionSet = await prisma.questionSet.findUnique({
        where: { id: user1Qs1.id }
      });
      

      
      if (!verifiedQuestionSet) {
        throw new Error('Question set not found before creating test question');
      }
      
      // Create a test question for user1
      testQuestion = await prisma.question.create({
        data: {
          text: 'Test Question for GET by ID',
          answer: 'Test Answer',
          questionType: 'flashcard',
          options: [],
          questionSetId: user1Qs1.id // Direct assignment instead of connect
        }
      });
      
      // Verify the question was created with the correct questionSetId
      const verifiedQuestion = await prisma.question.findUnique({
        where: { id: testQuestion.id }
      });
      


      // Create a folder, question set, and question for user2 to test authorization
      otherUserFolder = await prisma.folder.create({
        data: { name: 'Other User Folder', userId: user2.id }
      });
      
      otherUserQuestionSet = await prisma.questionSet.create({
        data: { 
          name: 'Other User Question Set', 
          folder: { connect: { id: otherUserFolder.id } }
        }
      });
      
      otherUserQuestion = await prisma.question.create({
        data: {
          text: 'Other User Question',
          answer: 'Other Answer',
          questionType: 'flashcard',
          options: [],
          questionSet: { connect: { id: otherUserQuestionSet.id } }
        }
      });
      

    });

  it('should retrieve a specific question by ID', async () => {

      
      // Create a test question specifically for this test
      const testQuestion = await prisma.question.create({
        data: {
          text: 'Test Question for GET by ID',
          answer: 'Test Answer',
          questionType: 'flashcard',
          options: [],
          questionSet: { connect: { id: user1Qs1.id } }
        } as any // Type assertion to bypass TypeScript error
      });
      

      
      // Double-check the question exists in the database
      const dbQuestion = await prisma.question.findUnique({
        where: { id: testQuestion.id },
        include: { questionSet: true }
      });
      

      
      const res = await request(app)
        .get(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${user1Token}`);
      

      
      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(testQuestion.id);
      expect(res.body.text).toEqual('Test Question for GET by ID');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/${testQuestion.id}`);
      
      expect(res.statusCode).toEqual(401);
    });

    it('should return 404 if question ID does not exist', async () => {
      const res = await request(app)
        .get(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/9999`)
        .set('Authorization', `Bearer ${user1Token}`);
      
      expect(res.statusCode).toEqual(404);
    });

    it('should return 404 if trying to access another user\'s question', async () => {
      const res = await request(app)
        .get(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/${otherUserQuestion.id}`)
        .set('Authorization', `Bearer ${user1Token}`);
      
      expect(res.statusCode).toEqual(404);
    });

    it('should return 400 if question ID is invalid', async () => {
      const res = await request(app)
        .get(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/invalid-id`)
        .set('Authorization', `Bearer ${user1Token}`);
      
      expect(res.statusCode).toEqual(400);
    });
  });

  // PUT /api/folders/:folderId/questionsets/:setId/questions/:id - Update Question
  describe('PUT /api/folders/:folderId/questionsets/:setId/questions/:id - Update Question', () => {
    let updateTestQuestion: any;

    beforeAll(async () => {
      // Create a test question for updating
      updateTestQuestion = await prisma.question.create({
        data: {
          text: 'Test Question for Update',
          answer: 'Original Answer',
          questionType: 'flashcard',
          options: ['Option 1', 'Option 2'],
          questionSetId: user1Qs1.id // Direct assignment instead of connect
        }
      });
      
      // Verify the question was created with the correct questionSetId
      const verifiedUpdateQuestion = await prisma.question.findUnique({
        where: { id: updateTestQuestion.id }
      });
      

      

    });

    const updateData = {
      text: 'Updated question text',
      answer: 'Updated answer',
      questionType: 'multiple-choice',
      options: ['Option A', 'Option B', 'Option C']
    };

    it('should update a question successfully with all fields', async () => {

      
      // Create a test question specifically for this test
      const updateTestQuestion = await prisma.question.create({
        data: {
          text: 'Original Question Text',
          answer: 'Original Answer',
          questionType: 'flashcard',
          options: [],
          questionSet: { connect: { id: user1Qs1.id } }
        } as any // Type assertion to bypass TypeScript error
      });
      

      
      // Double-check the question exists in the database
      const dbQuestion = await prisma.question.findUnique({
        where: { id: updateTestQuestion.id },
        include: { questionSet: true }
      });
      

      
      const res = await request(app)
        .put(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/${updateTestQuestion.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData);
      

      
      expect(res.statusCode).toEqual(200);
      expect(res.body.text).toEqual(updateData.text);
      expect(res.body.answer).toEqual(updateData.answer);
      expect(res.body.questionType).toEqual(updateData.questionType);
      expect(res.body.options).toEqual(updateData.options);
    });

    it('should update a question successfully with partial data', async () => {
      // Create another question for partial update test
      const partialUpdateQuestion = await prisma.question.create({
        data: {
          text: 'Question for Partial Update',
          answer: 'Original Answer',
          questionType: 'flashcard',
          options: [],
          questionSet: { connect: { id: user1Qs1.id } }
        }
      });
      
      const partialUpdateData = {
        text: 'Partially updated question'
      };

      const res = await request(app)
        .put(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/${partialUpdateQuestion.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(partialUpdateData);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.text).toEqual(partialUpdateData.text);
      // Other fields should remain unchanged
      expect(res.body.answer).toEqual('Original Answer');
      expect(res.body.questionType).toEqual('flashcard');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .put(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/${updateTestQuestion.id}`)
        .send(updateData);
      
      expect(res.statusCode).toEqual(401);
    });

    it('should return 404 if question ID does not exist', async () => {
      const res = await request(app)
        .put(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/9999`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData);
      
      expect(res.statusCode).toEqual(404);
    });

    it('should return 404 if trying to update another user\'s question', async () => {
      // Create a question for user2 to test authorization
      const otherUserFolder = await prisma.folder.create({
        data: { name: 'Other User Folder for PUT', userId: user2.id }
      });
      
      const otherUserQuestionSet = await prisma.questionSet.create({
        data: { 
          name: 'Other User Question Set for PUT', 
          folder: { connect: { id: otherUserFolder.id } }
        }
      });
      
      const otherUserQuestion = await prisma.question.create({
        data: {
          text: 'Other User Question for PUT',
          answer: 'Other Answer',
          questionType: 'flashcard',
          options: [],
          questionSet: { connect: { id: otherUserQuestionSet.id } }
        }
      });
      
      // We need to use the correct path for user2's question
      const res = await request(app)
        .put(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/${otherUserQuestion.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData);
      
      // This should return 404 because the question doesn't belong to user1's question set
      expect(res.statusCode).toEqual(404);
    });

    it('should return 400 if question ID is invalid', async () => {
      const res = await request(app)
        .put(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/invalid-id`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(updateData);
      
      expect(res.statusCode).toEqual(400);
    });

    it('should return 400 if text is not a string', async () => {
      const invalidData = {
        text: 123 // Not a string
      };

      const res = await request(app)
        .put(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/${updateTestQuestion.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(invalidData);
      
      expect(res.statusCode).toEqual(400);
    });

    it('should return 400 if options is not an array', async () => {
      const invalidData = {
        options: 'not an array'
      };

      const res = await request(app)
        .put(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/${updateTestQuestion.id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send(invalidData);
      
      expect(res.statusCode).toEqual(400);
    });
  });

  // DELETE /api/folders/:folderId/questionsets/:setId/questions/:id - Delete Question
  describe('DELETE /api/folders/:folderId/questionsets/:setId/questions/:id - Delete Question', () => {
    let deleteTestQuestion: any;
    let otherUserDeleteQuestion: any;

    beforeAll(async () => {
      // Create a question for deletion testing
      deleteTestQuestion = await prisma.question.create({
        data: {
          text: 'Question for Deletion Test',
          answer: 'Delete Test Answer',
          questionType: 'flashcard',
          options: [],
          questionSetId: user1Qs1.id // Direct assignment instead of connect
        }
      });
      
      // Verify the question was created with the correct questionSetId
      const verifiedDeleteQuestion = await prisma.question.findUnique({
        where: { id: deleteTestQuestion.id }
      });
      

      
      // Create a question for user2 to test authorization
      const otherUserFolder = await prisma.folder.create({
        data: { name: 'Other User Folder for DELETE', userId: user2.id }
      });
      
      const otherUserQuestionSet = await prisma.questionSet.create({
        data: { 
          name: 'Other User Question Set for DELETE', 
          folder: { connect: { id: otherUserFolder.id } }
        }
      });
      
      otherUserDeleteQuestion = await prisma.question.create({
        data: {
          text: 'Other User Question for DELETE',
          answer: 'Other Answer',
          questionType: 'flashcard',
          options: [],
          questionSet: { connect: { id: otherUserQuestionSet.id } }
        }
      });
      

    });

    it('should delete a question successfully', async () => {

      
      // Create a test question specifically for this test
      const deleteTestQuestion = await prisma.question.create({
        data: {
          text: 'Question to be deleted',
          answer: 'Answer to be deleted',
          questionType: 'flashcard',
          options: [],
          questionSet: { connect: { id: user1Qs1.id } }
        } as any // Type assertion to bypass TypeScript error
      });
      

      
      // Double-check the question exists in the database
      const dbQuestion = await prisma.question.findUnique({
        where: { id: deleteTestQuestion.id },
        include: { questionSet: true }
      });
      

      
      const res = await request(app)
        .delete(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/${deleteTestQuestion.id}`)
        .set('Authorization', `Bearer ${user1Token}`);
      

      
      expect(res.statusCode).toEqual(204);
      
      // Verify question is deleted
      const checkRes = await request(app)
        .get(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/${deleteTestQuestion.id}`)
        .set('Authorization', `Bearer ${user1Token}`);
      

      
      expect(checkRes.statusCode).toEqual(404);
    });

    it('should return 401 if no token is provided', async () => {
      // Create another question for this test
      const authTestQuestion = await prisma.question.create({
        data: {
          text: 'Question for Auth Test',
          answer: 'Auth Test Answer',
          questionType: 'flashcard',
          options: [],
          questionSet: { connect: { id: user1Qs1.id } }
        }
      });

      const res = await request(app)
        .delete(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/${authTestQuestion.id}`);
      
      expect(res.statusCode).toEqual(401);
    });

    it('should return 404 if question ID does not exist', async () => {
      const res = await request(app)
        .delete(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/9999`)
        .set('Authorization', `Bearer ${user1Token}`);
      
      expect(res.statusCode).toEqual(404);
    });

    it('should return 404 if trying to delete another user\'s question', async () => {
      // We need to use the correct path for user2's question
      const res = await request(app)
        .delete(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/${otherUserDeleteQuestion.id}`)
        .set('Authorization', `Bearer ${user1Token}`);
      
      // This should return 404 because the question doesn't belong to user1's question set
      expect(res.statusCode).toEqual(404);
    });

    it('should return 400 if question ID is invalid', async () => {
      const res = await request(app)
        .delete(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}/questions/invalid-id`)
        .set('Authorization', `Bearer ${user1Token}`);
      
      expect(res.statusCode).toEqual(400);
    });
  });
});
