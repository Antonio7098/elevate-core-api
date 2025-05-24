// src/routes/__tests__/folder.routes.test.ts
import request from 'supertest';
import app from '../../app';
import { PrismaClient, User } from '@prisma/client';

const prisma = new PrismaClient();

describe('Folder Routes API', () => {
  let testUser: User;
  let authToken: string;
  const userCredentials = {
    email: 'folderuser@example.com',
    password: 'password123',
  };

  beforeAll(async () => {
    // Ensure no pre-existing user with this email
    await prisma.user.delete({ where: { email: userCredentials.email } }).catch(() => {});

    // 1. Register a new user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userCredentials);
    testUser = registerResponse.body.user;
    authToken = registerResponse.body.token;

    // As an alternative to the above, if registration doesn't return the full user or if login is preferred:
    // await request(app).post('/api/auth/register').send(userCredentials);
    // const loginResponse = await request(app).post('/api/auth/login').send(userCredentials);
    // testUser = loginResponse.body.user;
    // authToken = loginResponse.body.token;
  });

  afterEach(async () => {
    // Clean up folders created during tests
    // Make sure to only delete folders belonging to the testUser if necessary, or all if that's simpler for isolated tests
    await prisma.folder.deleteMany({ where: { userId: testUser?.id } });
  });

  afterAll(async () => {
    // Clean up the test user
    if (testUser) {
      await prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe('POST /api/folders', () => {
    it('should create a new folder successfully for an authenticated user', async () => {
      const folderData = {
        name: 'My Test Folder',
        description: 'A description for my test folder.',
      };

      const response = await request(app)
        .post('/api/folders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(folderData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', folderData.name);
      expect(response.body).toHaveProperty('description', folderData.description);
      expect(response.body).toHaveProperty('userId', testUser.id);

      // Verify the folder was created in the database
      const dbFolder = await prisma.folder.findUnique({
        where: { id: response.body.id },
      });
      expect(dbFolder).not.toBeNull();
      expect(dbFolder?.name).toBe(folderData.name);
      expect(dbFolder?.userId).toBe(testUser.id);
    });

    it('should return 401 if no token is provided', async () => {
      const folderData = {
        name: 'Unauthorized Folder',
      };

      const response = await request(app)
        .post('/api/folders')
        .send(folderData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'No token, authorization denied');
    });

    it('should return 400 if folder name is missing', async () => {
      const response = await request(app)
        .post('/api/folders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}); // Sending empty object, name is missing

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      // Check for both 'not a string' (as it's undefined) and 'cannot be empty' messages
      // The exact error might depend on how express-validator handles undefined vs empty string for chained validators
      // For `check('name').isString().notEmpty()`, if name is undefined, `isString` fails first.
      expect(response.body.errors[0]).toHaveProperty('msg', 'Folder name must be a string');
    });

    it('should return 400 if folder name is empty', async () => {
      const response = await request(app)
        .post('/api/folders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0]).toHaveProperty('msg', 'Folder name cannot be empty');
    });

    it('should return 400 if folder name is not a string', async () => {
      const response = await request(app)
        .post('/api/folders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 123 });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0]).toHaveProperty('msg', 'Folder name must be a string');
    });
  });

  describe('GET /api/folders', () => {
    it('should retrieve all folders for the authenticated user', async () => {
      // Create a couple of folders for the testUser
      const folder1Data = { name: 'Folder Alpha', description: 'Description A' };
      const folder2Data = { name: 'Folder Beta', description: 'Description B' };

      await prisma.folder.createMany({
        data: [
          { ...folder1Data, userId: testUser.id },
          { ...folder2Data, userId: testUser.id },
        ],
      });

      const response = await request(app)
        .get('/api/folders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      // Check if the response contains the folders (order might not be guaranteed)
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ ...folder1Data, userId: testUser.id }),
          expect.objectContaining({ ...folder2Data, userId: testUser.id }),
        ])
      );
      // Also check for id property in each folder
      response.body.forEach((folder: any) => {
        expect(folder).toHaveProperty('id');
      });
    });

    it('should return an empty array if the user has no folders', async () => {
      // Ensure no folders exist for the user (afterEach hook should handle this, but good to be explicit)
      // await prisma.folder.deleteMany({ where: { userId: testUser.id } });

      const response = await request(app)
        .get('/api/folders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 401 if no token is provided when getting folders', async () => {
      const response = await request(app).get('/api/folders');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'No token, authorization denied');
    });
  });

  describe('GET /api/folders/:id', () => {
    it('should retrieve a single folder by ID for the authenticated user', async () => {
      const folderData = { name: 'Specific Folder', description: 'Details here' };
      const createdFolder = await prisma.folder.create({
        data: { ...folderData, userId: testUser.id },
      });

      const response = await request(app)
        .get(`/api/folders/${createdFolder.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', createdFolder.id);
      expect(response.body).toHaveProperty('name', folderData.name);
      expect(response.body).toHaveProperty('description', folderData.description);
      expect(response.body).toHaveProperty('userId', testUser.id);
    });

    it('should return 404 if folder is not found', async () => {
      const nonExistentFolderId = 99999;
      const response = await request(app)
        .get(`/api/folders/${nonExistentFolderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Folder not found or access denied');
    });

    it('should return 404 if attempting to access another user\'s folder', async () => {
      // Create a folder for another user
      const anotherUserCredentials = { email: 'another@example.com', password: 'password123' };
      const registerResponse = await request(app).post('/api/auth/register').send(anotherUserCredentials);
      const anotherUser = registerResponse.body.user;

      const anotherUsersFolder = await prisma.folder.create({
        data: { name: 'Another User Folder', userId: anotherUser.id },
      });

      const response = await request(app)
        .get(`/api/folders/${anotherUsersFolder.id}`)
        .set('Authorization', `Bearer ${authToken}`); // Authenticated as testUser

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Folder not found or access denied');

      // Clean up the additionally created user and their folder
      await prisma.folder.delete({ where: { id: anotherUsersFolder.id } });
      await prisma.user.delete({ where: { id: anotherUser.id } });
    });

    it('should return 400 if folder ID is not a valid number', async () => {
      const invalidFolderId = 'abc';
      const response = await request(app)
        .get(`/api/folders/${invalidFolderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid folder ID provided');
    });

    it('should return 401 if no token is provided when getting a folder by ID', async () => {
      const folderData = { name: 'Some Folder' };
      const createdFolder = await prisma.folder.create({
        data: { ...folderData, userId: testUser.id },
      });

      const response = await request(app).get(`/api/folders/${createdFolder.id}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'No token, authorization denied');
    });
  });

  describe('PUT /api/folders/:id', () => {
    it('should update a folder\'s name and description successfully', async () => {
      const initialFolderData = { name: 'Old Name', description: 'Old Description' };
      const createdFolder = await prisma.folder.create({
        data: { ...initialFolderData, userId: testUser.id },
      });

      const updates = {
        name: 'New Updated Name',
        description: 'New Updated Description',
      };

      const response = await request(app)
        .put(`/api/folders/${createdFolder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', createdFolder.id);
      expect(response.body).toHaveProperty('name', updates.name);
      expect(response.body).toHaveProperty('description', updates.description);
      expect(response.body).toHaveProperty('userId', testUser.id);

      // Verify in database
      const dbFolder = await prisma.folder.findUnique({ where: { id: createdFolder.id } });
      expect(dbFolder).not.toBeNull();
      expect(dbFolder?.name).toBe(updates.name);
      expect(dbFolder?.description).toBe(updates.description);
    });

    it('should update only the folder name successfully', async () => {
      const initialFolderData = { name: 'NameOnly Original', description: 'Original Desc' };
      const createdFolder = await prisma.folder.create({ data: { ...initialFolderData, userId: testUser.id } });
      const updates = { name: 'NameOnly New' };

      const response = await request(app)
        .put(`/api/folders/${createdFolder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(updates.name);
      expect(response.body.description).toBe(initialFolderData.description); // Description should remain unchanged
    });

    it('should update only the folder description successfully', async () => {
      const initialFolderData = { name: 'DescOnly Original', description: 'Original Desc' };
      const createdFolder = await prisma.folder.create({ data: { ...initialFolderData, userId: testUser.id } });
      const updates = { description: 'DescOnly New' };

      const response = await request(app)
        .put(`/api/folders/${createdFolder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe(initialFolderData.name); // Name should remain unchanged
      expect(response.body.description).toBe(updates.description);
    });

    it('should update folder description to null successfully', async () => {
      const initialFolderData = { name: 'DescToNull Original', description: 'Original Desc' };
      const createdFolder = await prisma.folder.create({ data: { ...initialFolderData, userId: testUser.id } });
      const updates = { description: null };

      const response = await request(app)
        .put(`/api/folders/${createdFolder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.description).toBeNull();
    });

    it('should update folder description to an empty string successfully', async () => {
      const initialFolderData = { name: 'DescToEmpty Original', description: 'Original Desc' };
      const createdFolder = await prisma.folder.create({ data: { ...initialFolderData, userId: testUser.id } });
      const updates = { description: '' };

      const response = await request(app)
        .put(`/api/folders/${createdFolder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('');
    });

    it('should return 400 if updating name to an empty string', async () => {
      const folder = await prisma.folder.create({ data: { name: 'Test Folder', userId: testUser.id } });
      const response = await request(app)
        .put(`/api/folders/${folder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' });
      expect(response.status).toBe(400);
      expect(response.body.errors[0]).toHaveProperty('msg', 'Name, if provided, cannot be empty');
    });

    it('should return 400 if updating name to a non-string value', async () => {
      const folder = await prisma.folder.create({ data: { name: 'Test Folder', userId: testUser.id } });
      const response = await request(app)
        .put(`/api/folders/${folder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 123 });
      expect(response.status).toBe(400);
      expect(response.body.errors[0]).toHaveProperty('msg', 'Name must be a string');
    });

    it('should return 400 if updating description to a non-string value (not null)', async () => {
      const folder = await prisma.folder.create({ data: { name: 'Test Folder', userId: testUser.id } });
      const response = await request(app)
        .put(`/api/folders/${folder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 123 });
      expect(response.status).toBe(400);
      expect(response.body.errors[0]).toHaveProperty('msg', 'Description, if provided and not null, must be a string');
    });

    it('should return 404 if folder to update is not found', async () => {
      const nonExistentFolderId = 99999;
      const response = await request(app)
        .put(`/api/folders/${nonExistentFolderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Name' });
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Folder not found or access denied');
    });

    it('should return 404 if attempting to update another user\'s folder', async () => {
      const anotherUserCredentials = { email: 'anotherupdate@example.com', password: 'password123' };
      const registerResponse = await request(app).post('/api/auth/register').send(anotherUserCredentials);
      const anotherUser = registerResponse.body.user;
      const anotherUsersFolder = await prisma.folder.create({ data: { name: 'Another User Folder', userId: anotherUser.id } });

      const response = await request(app)
        .put(`/api/folders/${anotherUsersFolder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Attempted Update' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Folder not found or access denied');

      await prisma.folder.delete({ where: { id: anotherUsersFolder.id } });
      await prisma.user.delete({ where: { id: anotherUser.id } });
    });

    it('should return 400 if folder ID for update is not a valid number', async () => {
      const invalidFolderId = 'abc';
      const response = await request(app)
        .put(`/api/folders/${invalidFolderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'New Name' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid folder ID provided');
    });

    it('should return 400 if no update data is provided', async () => {
      const folder = await prisma.folder.create({ data: { name: 'Test Folder', userId: testUser.id } });
      const response = await request(app)
        .put(`/api/folders/${folder.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({}); // Empty body
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'No update data provided');
    });

    it('should return 401 if no token is provided when updating a folder', async () => {
      const folder = await prisma.folder.create({ data: { name: 'Test Folder', userId: testUser.id } });
      const response = await request(app)
        .put(`/api/folders/${folder.id}`)
        .send({ name: 'New Name' });
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'No token, authorization denied');
    });
  });

  describe('DELETE /api/folders/:id', () => {
    it('should delete a folder successfully', async () => {
      const folder = await prisma.folder.create({
        data: { name: 'Folder to Delete', userId: testUser.id },
      });

      const response = await request(app)
        .delete(`/api/folders/${folder.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify in database
      const dbFolder = await prisma.folder.findUnique({ where: { id: folder.id } });
      expect(dbFolder).toBeNull();
    });

    it('should return 404 if folder to delete is not found', async () => {
      const nonExistentFolderId = 99999;
      const response = await request(app)
        .delete(`/api/folders/${nonExistentFolderId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Folder not found or access denied');
    });

    it('should return 404 if attempting to delete another user\'s folder', async () => {
      const anotherUserCredentials = { email: 'anotherdelete@example.com', password: 'password123' };
      const registerResponse = await request(app).post('/api/auth/register').send(anotherUserCredentials);
      const anotherUser = registerResponse.body.user;
      const anotherUsersFolder = await prisma.folder.create({ data: { name: 'Another User Folder', userId: anotherUser.id } });

      const response = await request(app)
        .delete(`/api/folders/${anotherUsersFolder.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Folder not found or access denied');

      // Verify folder still exists for the other user
      const dbFolder = await prisma.folder.findUnique({ where: { id: anotherUsersFolder.id } });
      expect(dbFolder).not.toBeNull();

      await prisma.folder.delete({ where: { id: anotherUsersFolder.id } });
      await prisma.user.delete({ where: { id: anotherUser.id } });
    });

    it('should return 400 if folder ID for delete is not a valid number', async () => {
      const invalidFolderId = 'abc';
      const response = await request(app)
        .delete(`/api/folders/${invalidFolderId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid folder ID provided');
    });

    it('should return 401 if no token is provided when deleting a folder', async () => {
      const folder = await prisma.folder.create({ data: { name: 'Test Folder', userId: testUser.id } });
      const response = await request(app).delete(`/api/folders/${folder.id}`);
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'No token, authorization denied');

      // Verify folder still exists
      const dbFolder = await prisma.folder.findUnique({ where: { id: folder.id } });
      expect(dbFolder).not.toBeNull();
    });
  });
});
