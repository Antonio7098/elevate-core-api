import request from 'supertest';
import { app } from '../../app';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../../utils/jwt';

const prisma = new PrismaClient();

describe('Question Set Routes', () => {
  let testUser: any;
  let testFolder: any;
  let testQuestionSet: any;
  let authToken: string;

  beforeAll(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
      },
    });

    // Create test folder
    testFolder = await prisma.folder.create({
      data: {
        name: 'Test Folder',
        userId: testUser.id,
      },
    });

    // Create test question set
    testQuestionSet = await prisma.questionSet.create({
      data: {
        name: 'Test Question Set',
        folderId: testFolder.id,
      },
    });

    // Generate auth token
    authToken = generateToken(testUser.id);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.note.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.questionSet.deleteMany({
      where: { folderId: testFolder.id },
    });
    await prisma.folder.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/folders/:folderId/questionsets/:id', () => {
    it('should get a question set with its questions and notes', async () => {
      // Create a test note
      const testNote = await prisma.note.create({
        data: {
          title: 'Test Note',
          content: '<p>Test content</p>',
          plainText: 'Test content',
          userId: testUser.id,
          questionSetId: testQuestionSet.id,
        },
      });

      const response = await request(app)
        .get(`/api/folders/${testFolder.id}/questionsets/${testQuestionSet.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testQuestionSet.id);
      expect(response.body).toHaveProperty('name', testQuestionSet.name);
      expect(Array.isArray(response.body.questions)).toBe(true);
      expect(Array.isArray(response.body.notes)).toBe(true);
      expect(response.body.notes).toHaveLength(1);
      expect(response.body.notes[0]).toHaveProperty('id', testNote.id);
      expect(response.body.notes[0]).toHaveProperty('title', 'Test Note');
    });
  });

  describe('GET /api/folders/:folderId/questionsets', () => {
    it('should get all question sets in a folder with their questions and notes', async () => {
      // Create a test note
      const testNote = await prisma.note.create({
        data: {
          title: 'Test Note',
          content: '<p>Test content</p>',
          plainText: 'Test content',
          userId: testUser.id,
          questionSetId: testQuestionSet.id,
        },
      });

      const response = await request(app)
        .get(`/api/folders/${testFolder.id}/questionsets`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('id', testQuestionSet.id);
      expect(response.body[0]).toHaveProperty('name', testQuestionSet.name);
      expect(Array.isArray(response.body[0].questions)).toBe(true);
      expect(Array.isArray(response.body[0].notes)).toBe(true);
      expect(response.body[0].notes).toHaveLength(1);
      expect(response.body[0].notes[0]).toHaveProperty('id', testNote.id);
      expect(response.body[0].notes[0]).toHaveProperty('title', 'Test Note');
    });
  });
}); 