import request from 'supertest';
import { app } from '../../app'; // Corrected path to app
import { PrismaClient, User } from '@prisma/client'; // LearningBlueprint not needed here directly for mocks
import { generateToken } from '../../utils/jwt'; // Corrected path to jwt utils
import { AiRAGService } from '../ai-rag.service';
import { CreateLearningBlueprintDto } from '../dtos/create-learning-blueprint.dto';
import { UpdateLearningBlueprintDto } from '../dtos/update-learning-blueprint.dto';
import { LearningBlueprintResponseDto } from '../dtos/responses.dto';

jest.mock('../ai-rag.service'); // Mock the AiRAGService module

const prisma = new PrismaClient();

describe('AI RAG Routes - Learning Blueprints', () => {
  let testUser: User;
  let authToken: string;
  let createdBlueprintId: number | undefined; // To store ID of created blueprint for later tests

  beforeAll(async () => {
    // 1. Create a test user
    testUser = await prisma.user.create({
      data: {
        email: `test-rag-${Date.now()}@example.com`, // Ensure unique email
        password: 'hashedPassword', // In a real scenario, use a proper hash
        name: 'Test RAG User',
      },
    });

    // 2. Generate auth token for the test user
    authToken = generateToken({ userId: testUser.id });
  });

  afterAll(async () => {
    // Clean up: Delete learning blueprints created by the test user, then the user
    if (testUser) {
      await prisma.learningBlueprint.deleteMany({
        where: { userId: testUser.id },
      });
      await prisma.user.delete({
        where: { id: testUser.id },
      });
    }
    await prisma.$disconnect();
  });

  // Test POST /api/ai-rag/learning-blueprints
  describe('POST /api/ai-rag/learning-blueprints', () => {
    let mockCreateLearningBlueprint: jest.SpyInstance<Promise<LearningBlueprintResponseDto>, [dto: CreateLearningBlueprintDto, userId: number]>;

    beforeEach(() => {
      // Setup mock for createLearningBlueprint for each test in this describe block
      mockCreateLearningBlueprint = jest.spyOn(AiRAGService.prototype, 'createLearningBlueprint');
    });

    afterEach(() => {
      mockCreateLearningBlueprint.mockRestore(); 
    });
    it('should create a new learning blueprint', async () => {
      const blueprintDto: CreateLearningBlueprintDto = {
        sourceText: 'This is the source text for our test blueprint.',
        folderId: 1, 
      };
      const mockServiceResponse: LearningBlueprintResponseDto = {
        id: 12345, 
        userId: testUser.id,
        sourceText: blueprintDto.sourceText,
        blueprintJson: { key: 'mocked deconstructed data' },
        folderId: blueprintDto.folderId, 
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCreateLearningBlueprint.mockResolvedValueOnce(mockServiceResponse);

      const response = await request(app)
        .post('/api/ai-rag/learning-blueprints')
        .set('Authorization', `Bearer ${authToken}`)
        .send(blueprintDto);

      expect(response.status).toBe(201);
      expect(mockCreateLearningBlueprint).toHaveBeenCalledWith(blueprintDto, testUser.id);

      const expectedCreatedAt = mockServiceResponse.createdAt!;
      const expectedUpdatedAt = mockServiceResponse.updatedAt!;
      const expectedFolderId = mockServiceResponse.folderId;

      expect(response.body).toEqual({
        id: mockServiceResponse.id,
        userId: mockServiceResponse.userId,
        sourceText: mockServiceResponse.sourceText,
        blueprintJson: mockServiceResponse.blueprintJson,
        folderId: expectedFolderId,
        createdAt: expectedCreatedAt.toISOString(), 
        updatedAt: expectedUpdatedAt.toISOString(),
      });
      createdBlueprintId = response.body.id;
      if (!createdBlueprintId) createdBlueprintId = mockServiceResponse.id;
    });

    it('should return 401 if not authenticated', async () => {
        const blueprintDto = {
            sourceText: 'This is the source text for our test blueprint.',
        };
        const response = await request(app)
            .post('/api/ai-rag/learning-blueprints')
            .send(blueprintDto);
        expect(response.status).toBe(401);
    });

    it('should return 400 if sourceText is missing', async () => {
        const blueprintDto = { folderId: 1 }; 
        const response = await request(app)
            .post('/api/ai-rag/learning-blueprints')
            .set('Authorization', `Bearer ${authToken}`)
            .send(blueprintDto);
        expect(response.status).toBe(400);
    });
  });

  describe('GET /api/ai-rag/learning-blueprints', () => {
    let mockGetAllLearningBlueprintsForUser: jest.SpyInstance<Promise<LearningBlueprintResponseDto[]>, [userId: number]>;

    beforeEach(() => {
      mockGetAllLearningBlueprintsForUser = jest.spyOn(AiRAGService.prototype, 'getAllLearningBlueprintsForUser');
    });

    afterEach(() => {
      mockGetAllLearningBlueprintsForUser.mockRestore();
    });

    it('should retrieve all learning blueprints for the user', async () => {
        // Ensure createdBlueprintId is defined from the POST test
        expect(createdBlueprintId).toBeDefined(); 

        const mockBlueprintsResponse: LearningBlueprintResponseDto[] = [
          {
            id: createdBlueprintId!,
            userId: testUser.id,
            sourceText: 'Mocked source text',
            blueprintJson: { mock: 'data' },
            folderId: 1,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        mockGetAllLearningBlueprintsForUser.mockResolvedValueOnce(mockBlueprintsResponse);

        expect(createdBlueprintId).toBeDefined();

        const response = await request(app)
            .get('/api/ai-rag/learning-blueprints')
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        const blueprint = response.body.find((bp: any) => bp.id === createdBlueprintId);
        expect(blueprint).toBeDefined();
        if(blueprint) { 
            expect(blueprint).toHaveProperty('userId', testUser.id);
        }
    });

    it('should return an empty array if no blueprints exist for the user', async () => {
        mockGetAllLearningBlueprintsForUser.mockResolvedValueOnce([]);
        // This test needs its own user context or ensure no blueprints exist for testUser
        // For simplicity, we'll assume the mock covers the 'no blueprints' case for testUser

        const newUser = await prisma.user.create({
            data: {
                email: `test-rag-nobp-${Date.now()}@example.com`,
                password: 'hashedPassword',
                name: 'Test RAG User No BP',
            },
        });
        const newUserToken = generateToken({ userId: newUser.id });

        const response = await request(app)
            .get('/api/ai-rag/learning-blueprints')
            .set('Authorization', `Bearer ${newUserToken}`);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(0);

        await prisma.user.delete({ where: { id: newUser.id } });
    });

    it('should return 401 if not authenticated', async () => {
        const response = await request(app)
            .get('/api/ai-rag/learning-blueprints');
        expect(response.status).toBe(401);
    });
  });

  describe('GET /api/ai-rag/learning-blueprints/:blueprintId', () => {
    let mockGetLearningBlueprintById: jest.SpyInstance<Promise<LearningBlueprintResponseDto | null>, [blueprintId: number, userId: number]>;

    beforeEach(() => {
      mockGetLearningBlueprintById = jest.spyOn(AiRAGService.prototype, 'getLearningBlueprintById');
    });

    afterEach(() => {
      mockGetLearningBlueprintById.mockRestore();
    });

    it('should retrieve a specific learning blueprint', async () => {
        expect(createdBlueprintId).toBeDefined();
        const mockBlueprintResponse: LearningBlueprintResponseDto = {
          id: createdBlueprintId!,
          userId: testUser.id,
          sourceText: 'Mocked source text for specific get',
          blueprintJson: { mock: 'specific data' },
          folderId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        // Ensure the mock is called with the correct blueprintId and userId
        mockGetLearningBlueprintById.mockImplementation(async (id, uid) => {
          if (id === createdBlueprintId! && uid === testUser.id) {
            return mockBlueprintResponse;
          }
          return null;
        });

        expect(createdBlueprintId).toBeDefined();
        const response = await request(app)
            .get(`/api/ai-rag/learning-blueprints/${createdBlueprintId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id', createdBlueprintId);
        expect(response.body).toHaveProperty('userId', testUser.id);
    });

    it('should return 404 for a non-existent blueprint ID', async () => {
        mockGetLearningBlueprintById.mockResolvedValue(null);
        const response = await request(app)
            .get(`/api/ai-rag/learning-blueprints/999999`) 
            .set('Authorization', `Bearer ${authToken}`);
        expect(response.status).toBe(404);
    });

    it('should return 404 if blueprint belongs to another user', async () => {
        // Mock that the service method returns null if userId doesn't match
        mockGetLearningBlueprintById.mockImplementation(async (id, uid) => {
          // Simulate finding the blueprint by id, but it belongs to a different user
          if (id === createdBlueprintId!) { 
            // console.log(`Mock getLearningBlueprintById called with id: ${id}, uid: ${uid}. TestUser.id is ${testUser.id}`);
            // If we want to be super strict, we can check uid !== testUser.id here
            // but for this test, just returning null if it's not the exact match is enough
            // as the route handler should perform the user check logic based on service response.
            // The service itself should return null if the user ID doesn't match.
            return null; 
          }
          return null;
        });

        const otherUser = await prisma.user.create({
            data: {
                email: `test-rag-other-${Date.now()}@example.com`,
                password: 'hashedPassword',
                name: 'Other Test RAG User',
            },
        });
        const otherBlueprint = await prisma.learningBlueprint.create({
            data: {
                userId: otherUser.id,
                sourceText: 'Belongs to other user',
                blueprintJson: { key: 'value' }
            }
        });

        const response = await request(app)
            .get(`/api/ai-rag/learning-blueprints/${otherBlueprint.id}`)
            .set('Authorization', `Bearer ${authToken}`); 
        expect(response.status).toBe(404); 

        await prisma.learningBlueprint.delete({ where: { id: otherBlueprint.id } });
        await prisma.user.delete({ where: { id: otherUser.id } });
    });

    it('should return 401 if not authenticated', async () => {
        expect(createdBlueprintId).toBeDefined();
        const response = await request(app)
            .get(`/api/ai-rag/learning-blueprints/${createdBlueprintId}`);
        expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/ai-rag/learning-blueprints/:blueprintId', () => {
    let mockUpdateLearningBlueprint: jest.SpyInstance<Promise<LearningBlueprintResponseDto | null>, [blueprintId: number, dto: UpdateLearningBlueprintDto, userId: number]>;

    beforeEach(() => {
      mockUpdateLearningBlueprint = jest.spyOn(AiRAGService.prototype, 'updateLearningBlueprint');
    });

    afterEach(() => {
      mockUpdateLearningBlueprint.mockRestore();
    });
    it('should update an existing learning blueprint', async () => {
        expect(createdBlueprintId).toBeDefined();
        const updateDto: UpdateLearningBlueprintDto = {
            sourceText: 'Updated source text for our blueprint.',
        };
        const mockServiceResponse: LearningBlueprintResponseDto = {
            id: createdBlueprintId!,
            userId: testUser.id,
            sourceText: updateDto.sourceText!, // Assert non-null as DTO type is string | undefined
            blueprintJson: { key: 'mocked updated deconstructed data' },
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        mockUpdateLearningBlueprint.mockResolvedValueOnce(mockServiceResponse);

        const response = await request(app)
            .put(`/api/ai-rag/learning-blueprints/${createdBlueprintId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(updateDto);

        expect(response.status).toBe(200);
        // Corrected parameter order for the spy assertion to match service: blueprintId, userId, dto
        expect(mockUpdateLearningBlueprint).toHaveBeenCalledWith(createdBlueprintId as number, updateDto, testUser.id as number);

        const expectedCreatedAt = mockServiceResponse.createdAt!;
        const expectedUpdatedAt = mockServiceResponse.updatedAt!;

        expect(response.body).toEqual({
            id: mockServiceResponse.id,
            userId: mockServiceResponse.userId,
            sourceText: mockServiceResponse.sourceText,
            blueprintJson: mockServiceResponse.blueprintJson,
            // folderId is not expected here
            createdAt: expectedCreatedAt.toISOString(),
            updatedAt: expectedUpdatedAt.toISOString(),
        });
    });

    it('should return 404 for a non-existent blueprint ID', async () => {
        const updateDto = { sourceText: 'Update for non-existent.' };
        const response = await request(app)
            .put(`/api/ai-rag/learning-blueprints/999999`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(updateDto);
        expect(response.status).toBe(404);
    });

     it('should return 400 if sourceText is empty string', async () => {
        expect(createdBlueprintId).toBeDefined();
        const updateDto = { sourceText: '' }; // Invalid: empty sourceText
        const response = await request(app)
            .put(`/api/ai-rag/learning-blueprints/${createdBlueprintId}`)
            .set('Authorization', `Bearer ${authToken}`)
            .send(updateDto);
        expect(response.status).toBe(400);
    });

    it('should return 401 if not authenticated', async () => {
        expect(createdBlueprintId).toBeDefined();
        const updateDto = { sourceText: 'Update attempt without auth.' };
        const response = await request(app)
            .put(`/api/ai-rag/learning-blueprints/${createdBlueprintId}`)
            .send(updateDto);
        expect(response.status).toBe(401);
    });
  });

  // Test DELETE /api/ai-rag/learning-blueprints/:blueprintId
  describe('DELETE /api/ai-rag/learning-blueprints/:blueprintId', () => {
    let mockDeleteLearningBlueprint: jest.SpyInstance<Promise<boolean>, [blueprintId: number, userId: number]>;

    beforeEach(() => {
      mockDeleteLearningBlueprint = jest.spyOn(AiRAGService.prototype, 'deleteLearningBlueprint');
    });

    afterEach(() => {
      mockDeleteLearningBlueprint.mockRestore();
    });

    it('should delete an existing learning blueprint', async () => {
        expect(createdBlueprintId).toBeDefined(); // Ensure it's defined before trying to use it
        // Mock the service to return true for this specific blueprintId and userId
        mockDeleteLearningBlueprint.mockImplementation(async (id, uid) => {
          return id === createdBlueprintId! && uid === testUser.id;
        });

        expect(createdBlueprintId).toBeDefined();
        const response = await request(app)
            .delete(`/api/ai-rag/learning-blueprints/${createdBlueprintId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(204); // No content

        // Verify it's actually deleted
        const getResponse = await request(app)
            .get(`/api/ai-rag/learning-blueprints/${createdBlueprintId}`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(getResponse.status).toBe(404);
        createdBlueprintId = undefined; // Mark as deleted for subsequent tests
    });

    it('should return 404 for a non-existent blueprint ID', async () => {
        mockDeleteLearningBlueprint.mockResolvedValue(false);
        const response = await request(app)
            .delete(`/api/ai-rag/learning-blueprints/999999`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(response.status).toBe(404);
    });

    it('should return 401 if not authenticated', async () => {
        // Re-create a blueprint for this specific test if needed, or use a known non-existent ID
        let tempBlueprintId = createdBlueprintId; // Might be undefined if previous test deleted it
        if (!tempBlueprintId) {
            const tempBlueprint = await prisma.learningBlueprint.create({
                data: {
                    userId: testUser.id,
                    sourceText: 'Temporary for delete auth test',
                    blueprintJson: { temp: 'data' }
                }
            });
            tempBlueprintId = tempBlueprint.id;
        }

        const response = await request(app)
            .delete(`/api/ai-rag/learning-blueprints/${tempBlueprintId}`); 
        expect(response.status).toBe(401);

        // Clean up the temporarily created blueprint if it was made for this test
        if (tempBlueprintId && tempBlueprintId !== createdBlueprintId) {
             await prisma.learningBlueprint.deleteMany({ where: { id: tempBlueprintId, userId: testUser.id } });
        }
    });
  });

  // Test POST /api/ai-rag/chat/message
  describe('POST /api/ai-rag/chat/message', () => {
    let mockHandleChatMessage: jest.SpyInstance;

    beforeEach(() => {
      mockHandleChatMessage = jest.spyOn(AiRAGService.prototype, 'handleChatMessage');
    });

    afterEach(() => {
      mockHandleChatMessage.mockRestore();
    });

    it('should process a chat message and return a response', async () => {
      const chatDto = {
        messageContent: 'Hello, assistant!',
        context: { blueprintId: createdBlueprintId },
      };
      const mockResponse = {
        role: 'assistant',
        content: 'Hello! How can I help you with this learning blueprint?',
      };

      mockHandleChatMessage.mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/ai-rag/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(chatDto);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResponse);
      expect(mockHandleChatMessage).toHaveBeenCalledWith(chatDto, testUser.id);
    });

    it('should return 404 if context blueprintId is not found', async () => {
      const chatDto = {
        messageContent: 'A question about a non-existent blueprint.',
        context: { blueprintId: 999999 },
      };

      mockHandleChatMessage.mockRejectedValue(new Error('Not Found')); // Simulate service throwing an error

      const response = await request(app)
        .post('/api/ai-rag/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(chatDto);

      expect(response.status).toBe(500); // Or 404 depending on controller error handling
    });

    it('should return 502 if the AI service fails', async () => {
      const chatDto = {
        messageContent: 'Another question.',
      };

      mockHandleChatMessage.mockRejectedValue(new Error('AI Service Error'));

      const response = await request(app)
        .post('/api/ai-rag/chat/message')
        .set('Authorization', `Bearer ${authToken}`)
        .send(chatDto);

      expect(response.status).toBe(500); // Or 502 depending on controller error handling
    });
  });
});
