import request from 'supertest';
import { app } from '../../app';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../../utils/jwt';

const prisma = new PrismaClient();

describe('Note Routes', () => {
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
    authToken = generateToken({ userId: testUser.id });
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

  describe('POST /api/notes', () => {
    it('should create a new note in a folder', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Note',
          content: {
            blocks: [
              {
                type: 'paragraph',
                content: 'Test content'
              }
            ]
          },
          plainText: 'Test content',
          folderId: testFolder.id,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Note');
      expect(response.body.folderId).toBe(testFolder.id);
      expect(response.body.content).toHaveProperty('blocks');
    });

    it('should create a new note in a question set', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Note in Question Set',
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'Test content' }],
              },
            ],
          },
          plainText: 'Test content',
          questionSetId: testQuestionSet.id,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Note in Question Set');
      expect(response.body.questionSetId).toBe(testQuestionSet.id);
    });

    it('should create a new note with BlockNote content', async () => {
      const blockNoteContent = {
        blocks: [
          {
            type: 'heading',
            content: 'Introduction',
            level: 1
          },
          {
            type: 'paragraph',
            content: 'This is a test note with multiple blocks.'
          },
          {
            type: 'list',
            content: [
              'First item',
              'Second item',
              'Third item'
            ],
            style: 'bullet'
          }
        ]
      };

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'BlockNote Test',
          content: blockNoteContent,
          plainText: 'Introduction\nThis is a test note with multiple blocks.\n• First item\n• Second item\n• Third item',
          folderId: testFolder.id,
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('BlockNote Test');
      expect(response.body.content).toEqual(blockNoteContent);
      expect(response.body.plainText).toContain('Introduction');
      expect(response.body.plainText).toContain('First item');
    });

    it('should return 400 if neither folderId nor questionSetId is provided', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Note',
          content: '<p>Test content</p>',
          plainText: 'Test content',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/notes', () => {
    it('should get all notes for a user', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter notes by folderId', async () => {
      const response = await request(app)
        .get('/api/notes')
        .query({ folderId: testFolder.id })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((note: any) => {
        expect(note.folderId).toBe(testFolder.id);
      });
    });

    it('should filter notes by questionSetId', async () => {
      const response = await request(app)
        .get('/api/notes')
        .query({ questionSetId: testQuestionSet.id })
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((note: any) => {
        expect(note.questionSetId).toBe(testQuestionSet.id);
      });
    });
  });

  describe('GET /api/notes/:id', () => {
    let testNote: any;

    beforeAll(async () => {
      testNote = await prisma.note.create({
        data: {
          title: 'Test Note for Get',
          content: '<p>Test content</p>',
          plainText: 'Test content',
          userId: testUser.id,
          folderId: testFolder.id,
        },
      });
    });

    it('should get a specific note', async () => {
      const response = await request(app)
        .get(`/api/notes/${testNote.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testNote.id);
      expect(response.body.title).toBe('Test Note for Get');
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .get('/api/notes/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/notes/:id', () => {
    let testNote: any;

    beforeAll(async () => {
      testNote = await prisma.note.create({
        data: {
          title: 'Test Note for Update',
          content: '<p>Test content</p>',
          plainText: 'Test content',
          userId: testUser.id,
          folderId: testFolder.id,
        },
      });
    });

    it('should update a note', async () => {
      const response = await request(app)
        .put(`/api/notes/${testNote.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Note Title',
          content: {
            blocks: [
              {
                type: 'paragraph',
                content: 'Updated content'
              }
            ]
          },
          plainText: 'Updated content',
        });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated Note Title');
      expect(response.body.content).toHaveProperty('blocks');
      expect(response.body.content.blocks[0].content).toBe('Updated content');
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .put('/api/notes/999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Note Title',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    let testNote: any;

    beforeAll(async () => {
      testNote = await prisma.note.create({
        data: {
          title: 'Test Note for Delete',
          content: '<p>Test content</p>',
          plainText: 'Test content',
          userId: testUser.id,
          folderId: testFolder.id,
        },
      });
    });

    it('should delete a note', async () => {
      const response = await request(app)
        .delete(`/api/notes/${testNote.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify note is deleted
      const deletedNote = await prisma.note.findUnique({
        where: { id: testNote.id },
      });
      expect(deletedNote).toBeNull();
    });

    it('should return 404 for non-existent note', async () => {
      const response = await request(app)
        .delete('/api/notes/999999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
}); 