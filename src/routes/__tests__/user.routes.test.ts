// src/routes/__tests__/user.routes.test.ts
import request from 'supertest';
import app from '../../app'; // Corrected path to app

describe('User Routes API', () => {
  describe('GET /api/users/profile', () => {
    it('should return 401 Unauthorized if no token is provided', async () => {
      const response = await request(app).get('/api/users/profile');
      expect(response.status).toBe(401);
      // Check against the actual message from your auth.middleware.ts
      expect(response.body).toHaveProperty('message', 'No token, authorization denied');
    });

    // We will add more tests here later, e.g., with a valid token
  });
});
