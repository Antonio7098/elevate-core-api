// Create a mock instance that we can control
let mockAiRagServiceInstance: any;

jest.mock('../../ai-rag/ai-rag.service', () => ({
  AiRAGService: jest.fn().mockImplementation(() => {
    if (!mockAiRagServiceInstance) {
      mockAiRagServiceInstance = {
        createLearningBlueprint: jest.fn(),
        generateQuestionsFromBlueprint: jest.fn(),
        generateNoteFromBlueprint: jest.fn(),
      };
    }
    return mockAiRagServiceInstance;
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
    const { id, token: userToken } = await createTestUser('learning-blueprint-test@example.com');
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
      mockAiRagServiceInstance.createLearningBlueprint.mockResolvedValue({
        id: 1,
        sourceText: 'This is a test source text.',
        blueprintJson: { some: 'data' },
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
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
      const blueprintId = 1;
      mockAiRagServiceInstance.generateQuestionsFromBlueprint.mockResolvedValue({
        id: 1,
        name: 'Generated Question Set',
        userId: user.id,
        folderId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        generatedFromBlueprintId: blueprintId,
        questions: [],
      } as any);

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
      const blueprintId = 1;
      mockAiRagServiceInstance.generateNoteFromBlueprint.mockResolvedValue({
        id: 1,
        title: 'Generated Note',
        content: {},
        plainText: 'Generated note content.',
        userId: user.id,
        folderId: null,
        questionSetId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        generatedFromBlueprintId: blueprintId,
      });

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
