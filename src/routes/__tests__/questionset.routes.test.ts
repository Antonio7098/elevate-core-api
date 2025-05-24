import request from 'supertest';
import app from '../../app';
import { PrismaClient, User, Folder } from '@prisma/client';
import { generateToken } from '../../../src/utils/jwt';

const prisma = new PrismaClient();

// Shared variables for all test suites in this file
let user1: User;
let user2: User;
let user1Token: string;
let user1Folder1: Folder;
let user1Folder2: Folder;

// Global setup and teardown for the entire test file
beforeAll(async () => {
  // Clean up database
  await prisma.question.deleteMany();
  await prisma.questionSet.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  user1 = await prisma.user.create({
    data: {
      email: 'qs-user1@example.com',
      password: 'password123',
    },
  });
  user2 = await prisma.user.create({
    data: {
      email: 'qs-user2@example.com',
      password: 'password123',
    },
  });

  // Generate tokens
  user1Token = generateToken(user1.id);

  // Create folders
  user1Folder1 = await prisma.folder.create({
    data: {
      name: 'User1 QS Test Folder 1',
      userId: user1.id,
    },
  });
  user1Folder2 = await prisma.folder.create({
    data: {
      name: 'User1 QS Test Folder 2',
      userId: user1.id,
    },
  });

  // Create some question sets for user1Folder1 for GET tests
  await prisma.questionSet.createMany({
    data: [
      { name: 'QS1 for Folder1', folderId: user1Folder1.id },
      { name: 'QS2 for Folder1', folderId: user1Folder1.id },
    ],
  });
});

afterAll(async () => {
  // Clean up database
  await prisma.question.deleteMany();
  await prisma.questionSet.deleteMany();
  await prisma.folder.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
});

describe('Question Set API - POST /api/folders/:folderId/questionsets', () => {
  // user1, user2, user1Token, user1Folder1 are now available from the global scope
  
  // Specific cleanup for this describe block if needed, e.g., delete question sets created here
  afterEach(async () => {
    // Example: if tests in this block create specific QS that shouldn't affect GET tests
    // await prisma.questionSet.deleteMany({ where: { folderId: user1Folder1.id, name: { startsWith: 'My First Question Set' } } });
  });

  describe('Successful Creation', () => {
    it('should create a new question set for an authenticated user in their folder', async () => {
      const res = await request(app)
        .post(`/api/folders/${user1Folder1.id}/questionsets`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'My First Question Set' });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('My First Question Set');
      expect(res.body.folderId).toBe(user1Folder1.id);

      // Verify in DB
      const qsInDb = await prisma.questionSet.findUnique({
        where: { id: res.body.id },
      });
      expect(qsInDb).not.toBeNull();
      expect(qsInDb?.name).toBe('My First Question Set');
      expect(qsInDb?.folderId).toBe(user1Folder1.id);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .post(`/api/folders/${user1Folder1.id}/questionsets`)
        .send({ name: 'Unauthorized Set' });
      expect(res.statusCode).toEqual(401);
    });

    it('should return 404 if trying to create in a non-existent folder', async () => {
      const nonExistentFolderId = 99999;
      const res = await request(app)
        .post(`/api/folders/${nonExistentFolderId}/questionsets`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Set for Non-existent Folder' });
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Folder not found or access denied');
    });

    it('should return 404 if trying to create in another user\'s folder', async () => {
      // Create a folder for user2
      const user2Folder = await prisma.folder.create({
        data: { name: 'User2 Folder', userId: user2.id },
      });

      const res = await request(app)
        .post(`/api/folders/${user2Folder.id}/questionsets`)
        .set('Authorization', `Bearer ${user1Token}`) // user1 tries to access user2's folder
        .send({ name: 'Set in Another User Folder' });
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Folder not found or access denied');
    });
  });

  describe('Input Validation', () => {
    it('should return 400 if folderId is not a number', async () => {
      const res = await request(app)
        .post('/api/folders/invalidFolderId/questionsets')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Valid Name' });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Invalid folder ID provided');
    });

    it('should return 400 if name is missing', async () => {
      const res = await request(app)
        .post(`/api/folders/${user1Folder1.id}/questionsets`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].msg).toBe('Question set name must be a string');
      expect(res.body.errors[0].path).toBe('name');
    });

    it('should return 400 if name is an empty string', async () => {
      const res = await request(app)
        .post(`/api/folders/${user1Folder1.id}/questionsets`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: '   ' }); // Empty string after trim
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].msg).toBe('Question set name cannot be empty');
    });

    it('should return 400 if name is not a string', async () => {
      const res = await request(app)
        .post(`/api/folders/${user1Folder1.id}/questionsets`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 123 });
      expect(res.statusCode).toEqual(400);
      expect(res.body.errors[0].msg).toBe('Question set name must be a string');
    });
  });
});

describe('Question Set API - GET /api/folders/:folderId/questionsets', () => {
  beforeEach(async () => {
    // Clean up any existing question sets in user1Folder1 to prevent leakage
    await prisma.questionSet.deleteMany({
      where: {
        folderId: user1Folder1.id,
      },
    });
    // Re-create the specific question sets expected for these GET tests sequentially
    await prisma.questionSet.create({
      data: { name: 'QS1 for Folder1', folderId: user1Folder1.id },
    });
    // Ensure a slight delay or rely on sequential execution for createdAt difference
    // For more robustness, could add a small explicit delay if needed, but usually not necessary
    await prisma.questionSet.create({
      data: { name: 'QS2 for Folder1', folderId: user1Folder1.id }, 
    });
  });

  it('should retrieve all question sets for a specific folder', async () => {
    const res = await request(app)
      .get(`/api/folders/${user1Folder1.id}/questionsets`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2); // Based on beforeEach setup
    expect(res.body[0].name).toBe('QS2 for Folder1'); // Ordered by createdAt desc
    expect(res.body[1].name).toBe('QS1 for Folder1');
    res.body.forEach((qs: any) => expect(qs.folderId).toBe(user1Folder1.id));
  });

  it('should return an empty array if the folder has no question sets', async () => {
    // First, ensure the folder is truly empty for this specific test
    await prisma.questionSet.deleteMany({
      where: {
        folderId: user1Folder2.id, // user1Folder2 is initially empty
      },
    });

    const res = await request(app)
      .get(`/api/folders/${user1Folder2.id}/questionsets`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app).get(`/api/folders/${user1Folder1.id}/questionsets`);
    expect(res.statusCode).toEqual(401);
  });

  it('should return 404 if trying to get question sets from a non-existent folder', async () => {
    const nonExistentFolderId = 99999;
    const res = await request(app)
      .get(`/api/folders/${nonExistentFolderId}/questionsets`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe('Folder not found or access denied');
  });

  it('should return 404 if trying to get question sets from another user\'s folder', async () => {
    const user2Folder = await prisma.folder.create({
      data: { name: 'User2 Folder for GET Test', userId: user2.id },
    });
    // Add a QS to user2's folder to ensure it's not just empty
    await prisma.questionSet.create({
        data: { name: 'QS for User2 Folder', folderId: user2Folder.id }
    });

    const res = await request(app)
      .get(`/api/folders/${user2Folder.id}/questionsets`)
      .set('Authorization', `Bearer ${user1Token}`); // user1 tries to access user2's folder
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe('Folder not found or access denied');

    // Clean up user2's folder and QS
    await prisma.questionSet.deleteMany({ where: { folderId: user2Folder.id } });
    await prisma.folder.delete({ where: { id: user2Folder.id } });
  });

  it('should return 400 if folderId is not a number', async () => {
    const res = await request(app)
      .get('/api/folders/invalidFolderId/questionsets')
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.message).toBe('Invalid folder ID provided');
  });
});

describe('Question Set API - GET /api/folders/:folderId/questionsets/:id', () => {
  let user1Qs1: any; // To store a question set created for user1

  beforeAll(async () => {
    // Find one of the question sets created in the global beforeAll for user1Folder1
    user1Qs1 = await prisma.questionSet.findFirst({
      where: {
        folderId: user1Folder1.id,
        name: 'QS1 for Folder1', // Assuming this was created
      },
    });
    if (!user1Qs1) {
      // Fallback if not found by name, create one directly for safety, though global beforeAll should handle it.
      user1Qs1 = await prisma.questionSet.create({
        data: { name: 'Test QS for GET by ID', folderId: user1Folder1.id },
      });
    }
  });

  it('should retrieve a specific question set by ID for the authenticated user', async () => {
    const res = await request(app)
      .get(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.id).toBe(user1Qs1.id);
    expect(res.body.name).toBe(user1Qs1.name);
    expect(res.body.folderId).toBe(user1Folder1.id);
  });

  it('should return 404 if the question set ID does not exist', async () => {
    const nonExistentId = 999999;
    const res = await request(app)
      .get(`/api/folders/${user1Folder1.id}/questionsets/${nonExistentId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe('Question set not found');
  });

  it('should return 404 if trying to access a question set in another user\'s folder (even if QS ID is valid for that other user)', async () => {
    // Create a question set for user2 in a folder owned by user2
    const user2Folder = await prisma.folder.create({
      data: { name: 'User2 Folder for QS', userId: user2.id },
    });
    const user2Qs = await prisma.questionSet.create({
      data: { name: 'User2 QS', folderId: user2Folder.id },
    });

    const res = await request(app)
      .get(`/api/folders/${user2Folder.id}/questionsets/${user2Qs.id}`) // Correct folder for user2Qs
      .set('Authorization', `Bearer ${user1Token}`); // Authenticated as user1
    
    // The controller checks folder ownership. Since user1 doesn't own user2Folder, it's a 404.
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe('Question set not found or access denied');

    // Cleanup
    await prisma.questionSet.delete({ where: { id: user2Qs.id } });
    await prisma.folder.delete({ where: { id: user2Folder.id } });
  });

  it('should return 400 if question set ID is not a valid number', async () => {
    const res = await request(app)
      .get(`/api/folders/${user1Folder1.id}/questionsets/invalid-id`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.errors[0].msg).toBe('ID parameter must be a positive integer');
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app)
      .get(`/api/folders/${user1Folder1.id}/questionsets/${user1Qs1.id}`);
    expect(res.statusCode).toEqual(401);
  });
});

describe('Question Set API - PUT /api/folders/:folderId/questionsets/:id', () => {
  let user1QsToUpdate: any;

  beforeEach(async () => {
    // Ensure a fresh question set for each test to avoid interference
    user1QsToUpdate = await prisma.questionSet.create({
      data: { name: 'QS to Update', folderId: user1Folder1.id },
    });
  });

  afterEach(async () => {
    // Clean up the created question set if it still exists
    const qsExists = await prisma.questionSet.findUnique({ where: { id: user1QsToUpdate.id } });
    if (qsExists) {
      await prisma.questionSet.delete({ where: { id: user1QsToUpdate.id } });
    }
  });

  it('should update a question set name successfully', async () => {
    const newName = 'Updated QS Name';
    const res = await request(app)
      .put(`/api/folders/${user1Folder1.id}/questionsets/${user1QsToUpdate.id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: newName });

    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe(newName);
    expect(res.body.id).toBe(user1QsToUpdate.id);

    const dbQs = await prisma.questionSet.findUnique({ where: { id: user1QsToUpdate.id } });
    expect(dbQs?.name).toBe(newName);
  });

  it('should return 200 and the original question set if name is not provided in body', async () => {
    const res = await request(app)
      .put(`/api/folders/${user1Folder1.id}/questionsets/${user1QsToUpdate.id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({}); // Empty body

    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe(user1QsToUpdate.name); // Name should be unchanged
    expect(res.body.id).toBe(user1QsToUpdate.id);
  });

  it('should return 400 if name is an empty string', async () => {
    const res = await request(app)
      .put(`/api/folders/${user1Folder1.id}/questionsets/${user1QsToUpdate.id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: '   ' }); // Empty string after trim

    expect(res.statusCode).toEqual(400);
    expect(res.body.errors[0].msg).toBe('Name, if provided, cannot be empty');
  });

  it('should return 400 if name is not a string', async () => {
    const res = await request(app)
      .put(`/api/folders/${user1Folder1.id}/questionsets/${user1QsToUpdate.id}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 123 });

    expect(res.statusCode).toEqual(400);
    expect(res.body.errors[0].msg).toBe('Name, if provided, must be a string');
  });

  it('should return 404 if question set ID does not exist', async () => {
    const nonExistentId = 999999;
    const res = await request(app)
      .put(`/api/folders/${user1Folder1.id}/questionsets/${nonExistentId}`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'New Name' });
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe('Question set not found');
  });

  it('should return 404 if trying to update a question set in another user\'s folder', async () => {
    const user2Folder = await prisma.folder.create({ data: { name: 'User2 Folder for QS Update', userId: user2.id } });
    const user2Qs = await prisma.questionSet.create({ data: { name: 'User2 QS', folderId: user2Folder.id } });

    const res = await request(app)
      .put(`/api/folders/${user2Folder.id}/questionsets/${user2Qs.id}`)
      .set('Authorization', `Bearer ${user1Token}`) // Authenticated as user1
      .send({ name: 'Attempted Update' });

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe('Question set not found or access denied');

    // Cleanup
    await prisma.questionSet.delete({ where: { id: user2Qs.id } });
    await prisma.folder.delete({ where: { id: user2Folder.id } });
  });

  it('should return 400 if question set ID is not a valid number', async () => {
    const res = await request(app)
      .put(`/api/folders/${user1Folder1.id}/questionsets/invalid-id`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ name: 'New Name' });
    expect(res.statusCode).toEqual(400);
    expect(res.body.errors[0].msg).toBe('ID parameter must be a positive integer');
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app)
      .put(`/api/folders/${user1Folder1.id}/questionsets/${user1QsToUpdate.id}`)
      .send({ name: 'New Name' });
    expect(res.statusCode).toEqual(401);
  });
});

describe('Question Set API - DELETE /api/folders/:folderId/questionsets/:id', () => {
  let user1QsToDelete: any;

  beforeEach(async () => {
    // Create a fresh question set for each test to avoid interference
    user1QsToDelete = await prisma.questionSet.create({
      data: { name: 'QS to Delete', folderId: user1Folder1.id },
    });
  });

  afterEach(async () => {
    // Ensure cleanup if a test fails before deleting
    if (user1QsToDelete) {
      const qsExists = await prisma.questionSet.findUnique({ where: { id: user1QsToDelete.id } });
      if (qsExists) {
        await prisma.questionSet.delete({ where: { id: user1QsToDelete.id } });
      }
    }
  });

  it('should delete a question set successfully', async () => {
    const res = await request(app)
      .delete(`/api/folders/${user1Folder1.id}/questionsets/${user1QsToDelete.id}`)
      .set('Authorization', `Bearer ${user1Token}`);

    expect(res.statusCode).toEqual(204);

    const dbQs = await prisma.questionSet.findUnique({ where: { id: user1QsToDelete.id } });
    expect(dbQs).toBeNull();
    user1QsToDelete = null; // Mark as deleted for afterEach
  });

  it('should return 404 if question set ID does not exist', async () => {
    const nonExistentId = 999999;
    const res = await request(app)
      .delete(`/api/folders/${user1Folder1.id}/questionsets/${nonExistentId}`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe('Question set not found');
  });

  it('should return 404 if trying to delete a question set in another user\'s folder', async () => {
    const user2Folder = await prisma.folder.create({ data: { name: 'User2 Folder for QS Delete', userId: user2.id } });
    const user2Qs = await prisma.questionSet.create({ data: { name: 'User2 QS', folderId: user2Folder.id } });

    const res = await request(app)
      .delete(`/api/folders/${user2Folder.id}/questionsets/${user2Qs.id}`)
      .set('Authorization', `Bearer ${user1Token}`); // Authenticated as user1

    expect(res.statusCode).toEqual(404);
    expect(res.body.message).toBe('Question set not found or access denied');

    // Verify user2's QS still exists
    const dbQs = await prisma.questionSet.findUnique({ where: { id: user2Qs.id } });
    expect(dbQs).not.toBeNull();

    // Cleanup
    await prisma.questionSet.delete({ where: { id: user2Qs.id } });
    await prisma.folder.delete({ where: { id: user2Folder.id } });
  });

  it('should return 400 if question set ID is not a valid number', async () => {
    const res = await request(app)
      .delete(`/api/folders/${user1Folder1.id}/questionsets/invalid-id`)
      .set('Authorization', `Bearer ${user1Token}`);
    expect(res.statusCode).toEqual(400);
    expect(res.body.errors[0].msg).toBe('ID parameter must be a positive integer');
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app)
      .delete(`/api/folders/${user1Folder1.id}/questionsets/${user1QsToDelete.id}`);
    expect(res.statusCode).toEqual(401);
  });
});
