// Mock the services that actually exist
jest.mock('../../services/mindmap.service', () => ({
  MindmapService: jest.fn().mockImplementation(() => ({
    createMindmap: jest.fn(),
    getMindmap: jest.fn(),
    updateMindmap: jest.fn(),
    deleteMindmap: jest.fn(),
  })),
}));

jest.mock('../../services/ai-api-client.service', () => ({
  getAIAPIClient: jest.fn().mockReturnValue({
    generateQuestions: jest.fn(),
    generateNotes: jest.fn(),
  }),
}));

import request from 'supertest';
import { app } from '../../app';
import prisma from '../../lib/prisma';
import { User } from '@prisma/client';
import { createTestUser } from '../../scripts/create-test-user';

describe('Learning Blueprints Routes', () => {
  let user: User;
  let token: string;

  beforeAll(async () => {
    const { id, token: userToken } = await createTestUser({ email: 'learning-blueprint-test@example.com' });
    const foundUser = await prisma.user.findUnique({ where: { id } });
    if (!foundUser) {
      throw new Error('Test user not found');
    }
    user = foundUser;
    token = userToken;
  });

  afterAll(async () => {
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  });

    describe('POST /api/learning-blueprints', () => {
        it('should create a learning blueprint', async () => {
      // Mock the MindmapService to return a dummy ID
      const mockMindmapService = require('../../services/mindmap.service');
      mockMindmapService.MindmapService.mockReturnValue({
        createMindmap: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Test Mindmap',
          userId: user.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      });

      // Mock the AIAPIClient to return a dummy ID
      const mockAIAPIClient = require('../../services/ai-api-client.service');
      mockAIAPIClient.getAIAPIClient.mockReturnValue({
        generateQuestions: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Generated Question Set',
          userId: user.id,
          folderId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          generatedFromBlueprintId: 1,
          questions: [],
        }),
      });

      const response = await request(app)
        .post('/api/learning-blueprints')
        .set('Authorization', `Bearer ${token}`)
        .send({ sourceText: 'This is a test source text.' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.sourceText).toBe('This is a test source text.');
      expect(response.body.userId).toBe(user.id);
    });
  });

  describe('POST /api/learning-blueprints/:blueprintId/question-sets', () => {
    it('should generate a question set from a blueprint', async () => {
      // First create a blueprint to get a real ID
      const blueprintResponse = await request(app)
        .post('/api/learning-blueprints')
        .set('Authorization', `Bearer ${token}`)
        .send({ sourceText: 'This is a test source text for question generation.' });

      expect(blueprintResponse.status).toBe(201);
      const blueprintId = blueprintResponse.body.id;

      const response = await request(app)
        .post(`/api/learning-blueprints/${blueprintId}/question-sets`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Generated Question Set' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Generated Question Set');
    });
  });

  describe('POST /api/learning-blueprints/:blueprintId/notes', () => {
    it('should generate a note from a blueprint', async () => {
      // First create a blueprint to get a real ID
      const blueprintResponse = await request(app)
        .post('/api/learning-blueprints')
        .set('Authorization', `Bearer ${token}`)
        .send({ sourceText: 'This is a test source text for note generation.' });

      expect(blueprintResponse.status).toBe(201);
      const blueprintId = blueprintResponse.body.id;

      const response = await request(app)
        .post(`/api/learning-blueprints/${blueprintId}/notes`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Generated Note' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Generated Note');
    });
  });
});
