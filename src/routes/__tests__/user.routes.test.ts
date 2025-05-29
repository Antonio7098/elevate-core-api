// src/routes/__tests__/user.routes.test.ts
import request from 'supertest';
import { jest } from '@jest/globals'; // Or your specific Jest import if different

import app from '../../app'; // Corrected path to app

describe('User Routes API', () => {
  let consoleErrorSpy: jest.SpyInstance;

  describe('GET /api/users/profile', () => {
    beforeEach(() => {
      // Suppress console.error for tests in this describe block that expect auth errors
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      // Restore console.error after the tests
      consoleErrorSpy.mockRestore();
    });

    it('should return 401 Unauthorized if no token is provided', async () => {
      const response = await request(app).get('/api/users/profile');
      expect(response.status).toBe(401);
      // Check against the actual message from your auth.middleware.ts
      expect(response.body).toHaveProperty('message', 'No token, authorization denied');
    });

    // We will add more tests here later, e.g., with a valid token
  });
});
