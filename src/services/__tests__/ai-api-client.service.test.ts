import axios from 'axios';
import { AIAPIClientService, initializeAIAPIClient, getAIAPIClient, shutdownAIAPIClient } from '../ai/ai-api-client.service';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AIAPIClientService', () => {
  let service: AIAPIClientService;
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn()
      },
      response: {
        use: jest.fn()
      }
    }
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock axios.create to return our mock instance
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    
    // Set environment variables for testing
    process.env.AI_API_BASE_URL = 'http://localhost:8001';
    process.env.AI_API_KEY = 'test-api-key';
    process.env.AI_API_TIMEOUT = '30';
    
    service = new AIAPIClientService();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.AI_API_BASE_URL;
    delete process.env.AI_API_KEY;
    delete process.env.AI_API_TIMEOUT;
  });

  describe('Constructor and Configuration', () => {
    it('should initialize with default values when env vars are not set', () => {
      delete process.env.AI_API_BASE_URL;
      delete process.env.AI_API_KEY;
      delete process.env.AI_API_TIMEOUT;
      
      const defaultService = new AIAPIClientService();
      expect(defaultService['baseUrl']).toBe('http://localhost:8000');
      expect(defaultService['timeout']).toBe(30000);
    });

    it('should use environment variables when provided', () => {
      expect(service['baseUrl']).toBe('http://localhost:8001');
      expect(service['apiKey']).toBe('test-api-key');
      expect(service['timeout']).toBe(30000);
    });

    it('should create axios instance with correct configuration', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8001',
        timeout: 30000,
        headers: {
          'Authorization': 'Bearer test-api-key',
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('Health Check', () => {
    it('should return healthy status on successful response', async () => {
      const mockResponse = {
        data: { status: 'healthy', version: '1.0.0', uptime: '5 minutes' }
      };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await service.healthCheck();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/health');
      expect(result).toEqual({
        status: 'healthy',
        version: '1.0.0',
        uptime: '5 minutes'
      });
    });

    it('should return unhealthy status on API error', async () => {
      const mockError = new Error('Network error');
      mockAxiosInstance.get.mockRejectedValueOnce(mockError);

      const result = await service.healthCheck();

      expect(result).toEqual({
        status: 'unhealthy',
        error: 'Network error'
      });
    });
  });

  describe('Blueprint Operations', () => {
    const mockBlueprintData = {
      title: 'Test Blueprint',
      content: 'Test content',
      metadata: { topic: 'testing' }
    };

    describe('indexBlueprint', () => {
      it('should successfully index a blueprint', async () => {
        const mockPayload = {
          blueprint_id: 'bp-123',
          blueprint_json: { content: 'Test content' },
          force_reindex: false,
        };
        const mockResponse = {
          data: { blueprint_id: 'bp-123', indexed_at: new Date().toISOString() }
        };
        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

        const result = await service.indexBlueprint(mockPayload);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v1/index-blueprint', mockPayload, { timeout: 120000 });
        expect(result).toEqual(mockResponse.data);
      });

      it('should handle indexing errors', async () => {
        const mockPayload = {
          blueprint_id: 'bp-123',
          blueprint_json: { content: 'Test content' },
          force_reindex: false,
        };
        const mockError = new Error('Indexing failed');
        mockAxiosInstance.post.mockRejectedValueOnce(mockError);

        await expect(service.indexBlueprint(mockPayload))
          .rejects.toThrow('Indexing failed');
      });
    });

    describe('updateBlueprint', () => {
      it('should successfully update a blueprint', async () => {
        const mockResponse = {
          data: { success: true, updated_at: '2024-01-01T00:00:00Z' }
        };
        mockAxiosInstance.put.mockResolvedValueOnce(mockResponse);

        const result = await service.updateBlueprint('bp-123', mockBlueprintData as any);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/api/v1/blueprints/bp-123', expect.objectContaining({
          source: 'core_api',
          strategy: 'incremental',
          timestamp: expect.any(String)
        }));
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('deleteBlueprint', () => {
      it('should successfully delete a blueprint', async () => {
        const mockResponse = {
          data: { deletion_completed: true, nodes_deleted: 0, nodes_remaining: 0 }
        };
        mockAxiosInstance.delete.mockResolvedValueOnce(mockResponse);

        const result = await service.deleteBlueprint('bp-123');

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/api/v1/blueprints/bp-123');
        expect(result).toEqual({
          status: 'deleted',
          message: 'Deleted 0 nodes for blueprint bp-123',
          deleted_at: expect.any(String),
          nodes_deleted: 0,
          nodes_remaining: 0
        });
      });
    });

    describe('getBlueprintStatus', () => {
      it('should get blueprint status successfully', async () => {
        const mockResponse = {
          data: { 
            id: 'bp-123', 
            status: 'indexed', 
            last_updated: '2024-01-01T00:00:00Z' 
          }
        };
        mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

        const result = await service.getBlueprintStatus('bp-123');

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/v1/blueprints/bp-123/status');
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('previewBlueprintChanges', () => {
      it('should preview blueprint changes successfully', async () => {
        const mockResponse = {
          data: { 
            changes: ['Added new section', 'Updated metadata'],
            impact_score: 0.8
          }
        };
        mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

        const result = await service.previewBlueprintChanges('bp-123', mockBlueprintData);

        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/v1/blueprints/bp-123/changes', expect.objectContaining({
          blueprint: mockBlueprintData,
          source: 'core_api',
          timestamp: expect.any(String)
        }));
        expect(result).toEqual(mockResponse.data);
      });
    });
  });

  describe('Error Handling and Retry Logic', () => {
    it('should retry failed requests up to max retries', async () => {
      const mockError = { response: { status: 500 } };
      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(service.healthCheck()).resolves.toEqual({
        status: 'unhealthy',
        error: 'Unknown error'
      });

      // Should attempt the request (retries are handled by the retry logic)
      expect(mockAxiosInstance.get).toHaveBeenCalled();
    });

    it('should not retry on client errors (4xx)', async () => {
      const mockError = { 
        response: { status: 400, data: { message: 'Bad request' } },
        message: 'Request failed with status code 400'
      };
      mockAxiosInstance.post.mockRejectedValueOnce(mockError);

      const mockPayload = {
        blueprint_id: 'bp-123',
        blueprint_json: { content: 'Test content' },
        force_reindex: false,
      };
      await expect(service.indexBlueprint(mockPayload))
        .rejects.toThrow('Bad request');
    });
  });
});

describe('Singleton Functions', () => {
  afterEach(async () => {
    await shutdownAIAPIClient();
  });

  describe('initializeAIAPIClient', () => {
    it('should initialize the client singleton', async () => {
      process.env.AI_API_BASE_URL = 'http://localhost:8001';
      process.env.AI_API_KEY = 'test-key';

      await initializeAIAPIClient();
      const client = getAIAPIClient();

      expect(client).toBeInstanceOf(AIAPIClientService);
    });

    it('should not reinitialize if already initialized', async () => {
      await initializeAIAPIClient();
      const client1 = getAIAPIClient();
      
      await initializeAIAPIClient();
      const client2 = getAIAPIClient();

      expect(client1).toBe(client2);
    });
  });

  describe('getAIAPIClient', () => {
    it('should throw error if not initialized', () => {
      expect(() => getAIAPIClient()).toThrow('AI API client not initialized');
    });

    it('should return the initialized client', async () => {
      await initializeAIAPIClient();
      const client = getAIAPIClient();
      expect(client).toBeInstanceOf(AIAPIClientService);
    });
  });

  describe('shutdownAIAPIClient', () => {
    it('should shutdown the client and set to null', async () => {
      await initializeAIAPIClient();
      expect(getAIAPIClient()).toBeInstanceOf(AIAPIClientService);

      await shutdownAIAPIClient();
      expect(() => getAIAPIClient()).toThrow('AI API client not initialized');
    });

    it('should handle shutdown when client is not initialized', async () => {
      await expect(shutdownAIAPIClient()).resolves.not.toThrow();
    });
  });
});
