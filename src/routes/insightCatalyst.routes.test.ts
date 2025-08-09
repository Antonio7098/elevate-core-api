import request from 'supertest';
import { app } from '../app';
import prisma from '../lib/prisma';
import { generateToken } from '../utils/jwt';

describe('Insight Catalyst Routes', () => {
  let testUser: any;
  let testNote: any;
  let testQuestion: any;
  let authToken: string;
  const testEmail = `test-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.insightCatalyst.deleteMany({
      where: { user: { email: testEmail } },
    });
    await prisma.note.deleteMany({
      where: { user: { email: testEmail } },
    });
    await prisma.question.deleteMany({
      where: { questionSet: { folder: { user: { email: testEmail } } } },
    });
    await prisma.questionSet.deleteMany({
      where: { folder: { user: { email: testEmail } } },
    });
    await prisma.folder.deleteMany({
      where: { user: { email: testEmail } },
    });
    await prisma.user.deleteMany({
      where: { email: testEmail },
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        password: 'hashedPassword',
      },
    });

    // Create test folder
    const testFolder = await prisma.folder.create({
      data: {
        name: 'Test Folder',
        userId: testUser.id,
      },
    });

    // Create test question set
    const testQuestionSet = await prisma.questionSet.create({
      data: {
        title: 'Test Question Set',
        userId: testUser.id,
        folderId: testFolder.id,
      },
    });

    // Create test note
    testNote = await prisma.note.create({
      data: {
        title: 'Test Note',
        content: '<p>Test content</p>',
        userId: testUser.id,
      },
    });

    // Create test question
    testQuestion = await prisma.question.create({
      data: {
        questionText: 'Test Question',
        answerText: 'Answer',
        questionSetId: testQuestionSet.id,
      },
    });

    // Generate auth token
    authToken = generateToken({ userId: testUser.id });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.insightCatalyst.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.note.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.question.deleteMany({
      where: { questionSet: { folder: { userId: testUser.id } } },
    });
    await prisma.questionSet.deleteMany({
      where: { folder: { userId: testUser.id } },
    });
    await prisma.folder.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/insight-catalysts', () => {
    it('should create a new insight catalyst linked to a note', async () => {
      const response = await request(app)
        .post('/api/insight-catalysts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'test-type',
          text: 'Test insight catalyst',
          explanation: 'Test explanation',
          imageUrls: ['http://example.com/image.jpg'],
          noteId: testNote.id,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('test-type');
      expect(response.body.content).toBe('Test insight catalyst');
      expect(response.body.noteId).toBe(testNote.id);
    });

    it('should create an insight catalyst linked to a question', async () => {
      const response = await request(app)
        .post('/api/insight-catalysts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'question-insight',
          text: 'Question insight',
          questionId: testQuestion.id,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('question-insight');
      expect(response.body.content).toBe('Question insight');
      expect(response.body.questionId).toBe(testQuestion.id);
    });

    it('should return 404 when note does not exist', async () => {
      const response = await request(app)
        .post('/api/insight-catalysts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'test-type',
          text: 'Test insight catalyst',
          noteId: 99999,
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/insight-catalysts', () => {
    it('should get all insight catalysts for the user', async () => {
      const response = await request(app)
        .get('/api/insight-catalysts')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should filter insight catalysts by noteId', async () => {
      const response = await request(app)
        .get('/api/insight-catalysts')
        .query({ noteId: testNote.id })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((catalyst: any) => catalyst.noteId === testNote.id)).toBe(true);
    });

    it('should filter insight catalysts by questionId', async () => {
      const response = await request(app)
        .get('/api/insight-catalysts')
        .query({ questionId: testQuestion.id })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.every((catalyst: any) => catalyst.questionId === testQuestion.id)).toBe(true);
    });
  });

  describe('GET /api/insight-catalysts/:id', () => {
    let testCatalyst: any;

    beforeEach(async () => {
      testCatalyst = await prisma.insightCatalyst.create({
        data: {
          title: 'test-type',
          content: 'Test insight catalyst',
          userId: testUser.id,
          noteId: testNote.id,
        },
      });
    });

    it('should get a specific insight catalyst', async () => {
      const response = await request(app)
        .get(`/api/insight-catalysts/${testCatalyst.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testCatalyst.id);
      expect(response.body.title).toBe('test-type');
      expect(response.body.content).toBe('Test insight catalyst');
    });

    it('should return 404 for non-existent insight catalyst', async () => {
      const response = await request(app)
        .get('/api/insight-catalysts/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/insight-catalysts/:id', () => {
    let testCatalyst: any;

    beforeEach(async () => {
      testCatalyst = await prisma.insightCatalyst.create({
        data: {
          title: 'test-type',
          content: 'Test insight catalyst',
          userId: testUser.id,
          noteId: testNote.id,
        },
      });
    });

    it('should update an insight catalyst', async () => {
      const response = await request(app)
        .put(`/api/insight-catalysts/${testCatalyst.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'updated-type',
          text: 'Updated insight catalyst',
        });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testCatalyst.id);
      expect(response.body.title).toBe('updated-type');
      expect(response.body.content).toBe('Updated insight catalyst');
    });

    it('should return 404 for non-existent insight catalyst', async () => {
      const response = await request(app)
        .put('/api/insight-catalysts/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'updated-type',
          text: 'Updated insight catalyst',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/insight-catalysts/:id', () => {
    let testCatalyst: any;

    beforeEach(async () => {
      testCatalyst = await prisma.insightCatalyst.create({
        data: {
          title: 'test-type',
          content: 'Test insight catalyst',
          userId: testUser.id,
          noteId: testNote.id,
        },
      });
    });

    it('should delete an insight catalyst', async () => {
      const response = await request(app)
        .delete(`/api/insight-catalysts/${testCatalyst.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify the catalyst is deleted
      const deletedCatalyst = await prisma.insightCatalyst.findUnique({
        where: { id: testCatalyst.id },
      });
      expect(deletedCatalyst).toBeNull();
    });

    it('should return 404 for non-existent insight catalyst', async () => {
      const response = await request(app)
        .delete('/api/insight-catalysts/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
}); 