// src/routes/__tests__/auth.routes.test.ts
import request from 'supertest';
import app from '../../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth Routes API', () => {
  // Clean up the database after each test in this suite
  afterEach(async () => {
    // Delete all users. In a real app, be careful with cascading deletes if relations are set up.
    await prisma.folder.deleteMany({}); // If folders are linked to users and have onDelete: Cascade or similar
    await prisma.user.deleteMany({});
  });

  // Close Prisma connection after all tests in this file are done
  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully and return user data and a token', async () => {
      const newUser = {
        email: 'testuser@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', newUser.email);
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/); // Basic JWT format check

      // Optionally, verify the user was created in the database
      const dbUser = await prisma.user.findUnique({
        where: { email: newUser.email },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.email).toBe(newUser.email);
    });

    it('should return 400 if email already exists', async () => {
      const existingUser = {
        email: 'testexisting@example.com',
        password: 'password123',
      };

      // First, register the user
      await request(app).post('/api/auth/register').send(existingUser);

      // Then, attempt to register again with the same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'User already exists');
    });

    it('should return 400 if email is invalid', async () => {
      const newUser = {
        email: 'invalidemail',
        password: 'password123',
      };
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0]).toHaveProperty('msg', 'Please enter a valid email address');
    });

    it('should return 400 if password is too short', async () => {
      const newUser = {
        email: 'test@example.com',
        password: '123',
      };
      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0]).toHaveProperty('msg', 'Password must be at least 6 characters long');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in an existing user successfully and return user data and a token', async () => {
      const userCredentials = {
        email: 'loginuser@example.com',
        password: 'password123',
      };

      // First, register the user
      await request(app).post('/api/auth/register').send(userCredentials);

      // Then, attempt to log in
      const response = await request(app)
        .post('/api/auth/login')
        .send(userCredentials);

      expect(response.status).toBe(200);
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', userCredentials.email);
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toMatch(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/);
    });

    it('should return 401 if email does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 401 if password is incorrect', async () => {
      const userCredentials = {
        email: 'loginuser2@example.com',
        password: 'password123',
      };
      // Register the user first
      await request(app).post('/api/auth/register').send(userCredentials);

      // Attempt login with incorrect password
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: userCredentials.email, password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should return 400 if email is invalid for login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalidemail', password: 'password123' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0]).toHaveProperty('msg', 'Please enter a valid email address');
    });

    it('should return 400 if password is missing for login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: '' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors[0]).toHaveProperty('msg', 'Password is required');
    });

    it('should return 400 if email is missing for login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: '', password: 'password123' });
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
      // The email validation is isEmail(), which also implies notEmpty().
      // So the message will be for invalid email format.
      expect(response.body.errors[0]).toHaveProperty('msg', 'Please enter a valid email address');
    });
  });
});
