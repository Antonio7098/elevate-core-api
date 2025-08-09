import request from 'supertest';
import app from '../../app';
import prisma from '../../lib/prisma';
import { User } from '@prisma/client';
import { protect } from '../../middleware/auth.middleware';
import { generateDailyTasks } from '../../services/primitiveSR.service';

// Mock the auth middleware
jest.mock('../../middleware/auth.middleware', () => ({
  protect: jest.fn((req, res, next) => next()), // Default mock passes through
}));

// Mock the primitive SR service
jest.mock('../../services/primitiveSR.service', () => ({
  generateDailyTasks: jest.fn(),
}));

const mockedProtect = protect as jest.Mock;

const mockGenerateDailyTasks = generateDailyTasks as jest.Mock;

describe('GET /api/todays-tasks', () => {
  let testUser: User;

  // Helper to set up the authenticated user for a test run
  const setAuthenticatedUser = (userId: number) => {
    mockedProtect.mockImplementation((req, res, next) => {
      req.user = { userId };
      next();
    });
  };

  beforeAll(async () => {
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        email: `testuser-todaytasks-${Date.now()}@example.com`,
        password: 'testpassword',
        dailyStudyTimeMinutes: 30,
      },
    });
  });

  afterEach(async () => {
    // Reset mocks
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up the test user
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
  });

  it('should return 401 if no token is provided (actual middleware behavior)', async () => {
    // For this specific test, we want the real middleware to run to check unauth path
    mockedProtect.mockImplementation(jest.requireActual('../../middleware/auth.middleware').protect);
    const response = await request(app).get('/api/todays-tasks');
    expect(response.status).toBe(401);
    // Reset mock for other tests if needed, or set it specifically in each test
  });

  it('should return 200 and an empty list if user has no due tasks', async () => {
    setAuthenticatedUser(testUser.id);
    mockGenerateDailyTasks.mockResolvedValue([]);

    const response = await request(app).get('/api/todays-tasks');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tasks).toEqual([]);
    expect(response.body.data.totalTasks).toBe(0);
    expect(response.body.data.bucketDistribution.critical).toBe(0);
    expect(response.body.data.bucketDistribution.core).toBe(0);
    expect(response.body.data.bucketDistribution.plus).toBe(0);
    expect(mockGenerateDailyTasks).toHaveBeenCalledWith(testUser.id);
  });

  it('should return critical tasks when primitives are overdue', async () => {
    setAuthenticatedUser(testUser.id);
    
    const mockCriticalTasks = [
      {
        primitiveId: 'prim-1',
        title: 'Critical Primitive 1',
        bucket: 'critical',
        questions: [
          {
            id: 1,
            questionText: 'Critical Question 1?',
            answerText: 'Yes 1.',
            criterionId: 'crit-1'
          }
        ]
      },
      {
        primitiveId: 'prim-2', 
        title: 'Critical Primitive 2',
        bucket: 'critical',
        questions: [
          {
            id: 2,
            questionText: 'Critical Question 2?',
            answerText: 'Yes 2.',
            criterionId: 'crit-2'
          }
        ]
      }
    ];
    
    mockGenerateDailyTasks.mockResolvedValue(mockCriticalTasks);

    const response = await request(app).get('/api/todays-tasks');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tasks).toHaveLength(2);
    expect(response.body.data.totalTasks).toBe(2);
    expect(response.body.data.bucketDistribution.critical).toBe(2);
    expect(response.body.data.bucketDistribution.core).toBe(0);
    expect(response.body.data.bucketDistribution.plus).toBe(0);
    expect(response.body.data.tasks[0].primitiveId).toBe('prim-1');
    expect(response.body.data.tasks[0].title).toBe('Critical Primitive 1');
    expect(response.body.data.tasks[0].bucket).toBe('critical');
    expect(mockGenerateDailyTasks).toHaveBeenCalledWith(testUser.id);
  });

  it('should return core tasks when primitives are due but not critical', async () => {
    setAuthenticatedUser(testUser.id);
    
    const mockCoreTasks = [
      {
        primitiveId: 'prim-3',
        title: 'Core Primitive 1',
        bucket: 'core',
        questions: [
          {
            id: 3,
            questionText: 'Core Question 1?',
            answerText: 'Core Answer 1.',
            criterionId: 'crit-3'
          }
        ]
      }
    ];
    
    mockGenerateDailyTasks.mockResolvedValue(mockCoreTasks);

    const response = await request(app).get('/api/todays-tasks');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tasks).toHaveLength(1);
    expect(response.body.data.totalTasks).toBe(1);
    expect(response.body.data.bucketDistribution.critical).toBe(0);
    expect(response.body.data.bucketDistribution.core).toBe(1);
    expect(response.body.data.bucketDistribution.plus).toBe(0);
    expect(response.body.data.tasks[0].primitiveId).toBe('prim-3');
    expect(response.body.data.tasks[0].title).toBe('Core Primitive 1');
    expect(response.body.data.tasks[0].bucket).toBe('core');
    expect(mockGenerateDailyTasks).toHaveBeenCalledWith(testUser.id);
  });

  it('should return mixed bucket distribution', async () => {
    setAuthenticatedUser(testUser.id);
    
    const mockMixedTasks = [
      {
        primitiveId: 'prim-1',
        title: 'Critical Primitive',
        bucket: 'critical',
        questions: [{ id: 1, questionText: 'Critical Q', answerText: 'A', criterionId: 'crit-1' }]
      },
      {
        primitiveId: 'prim-2',
        title: 'Core Primitive',
        bucket: 'core', 
        questions: [{ id: 2, questionText: 'Core Q', answerText: 'A', criterionId: 'crit-2' }]
      },
      {
        primitiveId: 'prim-3',
        title: 'Plus Primitive',
        bucket: 'plus',
        questions: [{ id: 3, questionText: 'Plus Q', answerText: 'A', criterionId: 'crit-3' }]
      }
    ];
    
    mockGenerateDailyTasks.mockResolvedValue(mockMixedTasks);

    const response = await request(app).get('/api/todays-tasks');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tasks).toHaveLength(3);
    expect(response.body.data.totalTasks).toBe(3);
    expect(response.body.data.bucketDistribution.critical).toBe(1);
    expect(response.body.data.bucketDistribution.core).toBe(1);
    expect(response.body.data.bucketDistribution.plus).toBe(1);
    expect(mockGenerateDailyTasks).toHaveBeenCalledWith(testUser.id);
  });

  it('should handle service errors gracefully', async () => {
    setAuthenticatedUser(testUser.id);
    mockGenerateDailyTasks.mockRejectedValue(new Error('Service error'));

    const response = await request(app).get('/api/todays-tasks');

    expect(response.status).toBe(500);
    expect(mockGenerateDailyTasks).toHaveBeenCalledWith(testUser.id);
  });

  it('should return critical and core tasks with correct bucket distribution', async () => {
    setAuthenticatedUser(testUser.id);
    
    const mockCriticalAndCoreTasks = [
      {
        primitiveId: 'prim-1',
        title: 'Critical Primitive',
        bucket: 'critical',
        questions: [{ id: 1, questionText: 'Critical Q', answerText: 'A', criterionId: 'crit-1' }]
      },
      {
        primitiveId: 'prim-2',
        title: 'Core Primitive',
        bucket: 'core', 
        questions: [{ id: 2, questionText: 'Core Q', answerText: 'A', criterionId: 'crit-2' }]
      },
      {
        primitiveId: 'prim-3',
        title: 'Plus Primitive',
        bucket: 'plus',
        questions: [{ id: 3, questionText: 'Plus Q', answerText: 'A', criterionId: 'crit-3' }]
      }
    ];
    
    mockGenerateDailyTasks.mockResolvedValue(mockCriticalAndCoreTasks);

    const response = await request(app).get('/api/todays-tasks');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tasks).toHaveLength(3);
    expect(response.body.data.totalTasks).toBe(3);
    expect(response.body.data.bucketDistribution.critical).toBe(1);
    expect(response.body.data.bucketDistribution.core).toBe(1);
    expect(response.body.data.bucketDistribution.plus).toBe(1);
    expect(mockGenerateDailyTasks).toHaveBeenCalledWith(testUser.id);
  });

  it('should return empty tasks when no primitives are due', async () => {
    setAuthenticatedUser(testUser.id);
    mockGenerateDailyTasks.mockResolvedValue([]);

    const response = await request(app).get('/api/todays-tasks');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.tasks).toHaveLength(0);
    expect(response.body.data.totalTasks).toBe(0);
    expect(response.body.data.bucketDistribution.critical).toBe(0);
    expect(response.body.data.bucketDistribution.core).toBe(0);
    expect(response.body.data.bucketDistribution.plus).toBe(0);
    expect(mockGenerateDailyTasks).toHaveBeenCalledWith(testUser.id);
  });
});
