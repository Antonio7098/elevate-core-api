import request from 'supertest';
import { app } from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

describe('Folder Routes', () => {
  let testUser: { id: number };
  let testToken: string;
  let testFolder: { id: number };
  let testQuestionSet: { id: number };
  let testQuestion: { id: number };
  let testNote: { id: number };

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'password123'
      }
    });

    // Create test token
    testToken = jwt.sign({ userId: testUser.id }, process.env.JWT_SECRET!);

    // Create test folder
    testFolder = await prisma.folder.create({
      data: {
        name: 'Test Folder',
        userId: testUser.id
      }
    });

    // Create test question set
    testQuestionSet = await prisma.questionSet.create({
      data: {
        name: 'Test Question Set',
        folderId: testFolder.id
      }
    });

    // Create test question
    testQuestion = await prisma.question.create({
      data: {
        text: 'Test Question',
        answer: 'Test Answer',
        questionType: 'multiple_choice',
        options: ['A', 'B', 'C'],
        questionSetId: testQuestionSet.id
      }
    });

    // Create test note
    testNote = await prisma.note.create({
      data: {
        title: 'Test Note',
        content: { text: 'Test content' },
        folderId: testFolder.id,
        userId: testUser.id
      }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.question.deleteMany();
    await prisma.questionSet.deleteMany();
    await prisma.note.deleteMany();
    await prisma.folder.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/folders/:folderId/all-questions', () => {
    it('should return all questions in folder tree', async () => {
      const response = await request(app)
        .get(`/api/folders/${testFolder.id}/all-questions`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testFolder.id);
      expect(response.body).toHaveProperty('name', 'Test Folder');
      expect(response.body.questions).toHaveLength(1);
      expect(response.body.questions[0]).toHaveProperty('id', testQuestion.id);
      expect(response.body.questions[0]).toHaveProperty('text', 'Test Question');
      expect(response.body.questions[0]).toHaveProperty('questionSetId', testQuestionSet.id);
      expect(response.body.questions[0]).toHaveProperty('questionSetName', 'Test Question Set');
    });

    it('should return 404 for non-existent folder', async () => {
      const response = await request(app)
        .get('/api/folders/99999/all-questions')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get(`/api/folders/${testFolder.id}/all-questions`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/folders/:folderId/all-notes', () => {
    it('should return all notes in folder tree', async () => {
      const response = await request(app)
        .get(`/api/folders/${testFolder.id}/all-notes`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testFolder.id);
      expect(response.body).toHaveProperty('name', 'Test Folder');
      expect(response.body.notes).toHaveLength(1);
      expect(response.body.notes[0]).toHaveProperty('id', testNote.id);
      expect(response.body.notes[0]).toHaveProperty('title', 'Test Note');
    });

    it('should return 404 for non-existent folder', async () => {
      const response = await request(app)
        .get('/api/folders/99999/all-notes')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .get(`/api/folders/${testFolder.id}/all-notes`);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/folders/:folderId/pin', () => {
    it('should pin a folder', async () => {
      const response = await request(app)
        .put(`/api/folders/${testFolder.id}/pin`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ isPinned: true });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testFolder.id);
      expect(response.body).toHaveProperty('isPinned', true);
    });

    it('should unpin a folder', async () => {
      const response = await request(app)
        .put(`/api/folders/${testFolder.id}/pin`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ isPinned: false });
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testFolder.id);
      expect(response.body).toHaveProperty('isPinned', false);
    });

    it('should return 401 without auth token', async () => {
      const response = await request(app)
        .put(`/api/folders/${testFolder.id}/pin`)
        .send({ isPinned: true });
      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent folder', async () => {
      const response = await request(app)
        .put('/api/folders/99999/pin')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ isPinned: true });
      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid isPinned value', async () => {
      const response = await request(app)
        .put(`/api/folders/${testFolder.id}/pin`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({ isPinned: 'notabool' });
      expect(response.status).toBe(400);
    });
  });
}); 