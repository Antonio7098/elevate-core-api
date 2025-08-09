import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/lib/prisma';
import { User } from '@prisma/client';

/**
 * End-to-End Primitive Lifecycle Test
 * 
 * Tests the complete flow:
 * 1. AI generates primitives from source text
 * 2. User gets daily tasks including the new primitive
 * 3. User submits review outcomes
 * 4. System updates progress and schedules next review
 * 5. User can view updated primitive details
 */
describe('Primitive Lifecycle E2E Test', () => {
  let testUser: User;
  let authToken: string;
  let createdPrimitiveId: string;

  beforeAll(async () => {
    // Create a test user
    testUser = await prisma.user.create({
      data: {
        email: 'e2e-test@example.com',
        name: 'E2E Test User',
        password: 'hashedpassword',
        dailyStudyTimeMinutes: 20,
      },
    });

    // Use test auth token with user ID header
    authToken = 'Bearer test123';
  });

  afterAll(async () => {
    // Clean up test data
    if (createdPrimitiveId && testUser?.id) {
      try {
        await prisma.question.deleteMany({
          where: {
            masteryCriterion: {
              primitiveId: createdPrimitiveId
            }
          }
        });
        
        await prisma.questionSet.deleteMany({
          where: {
            title: 'React Hooks Test Questions',
            userId: testUser.id
          }
        });
        
        await prisma.userCriterionMastery.deleteMany({
          where: {
            masteryCriterion: {
              primitiveId: createdPrimitiveId
            }
          }
        });
        
        await prisma.masteryCriterion.deleteMany({
          where: { primitiveId: createdPrimitiveId }
        });
        
        await prisma.userPrimitiveProgress.deleteMany({
          where: { primitiveId: createdPrimitiveId }
        });
        
        await prisma.knowledgePrimitive.deleteMany({
          where: { primitiveId: createdPrimitiveId }
        });
        
        await prisma.folder.deleteMany({
          where: {
            name: 'E2E Test Folder',
            userId: testUser.id
          }
        });
      } catch (error) {
        console.warn('Error cleaning up test data:', error);
      }
    }

    if (testUser?.id) {
      try {
        await prisma.user.delete({
          where: { id: testUser.id },
        });
      } catch (error) {
        console.warn('Error deleting test user:', error);
      }
    }
  });

  describe('Complete Primitive Lifecycle', () => {
    it('should complete the full primitive lifecycle from creation to review', async () => {
      // Step 1: Create primitives directly in database (bypassing AI service for testing)
      console.log('Step 1: Creating test primitive and criteria...');
      
      // Create a test folder first
      const testFolder = await prisma.folder.create({
        data: {
          name: 'E2E Test Folder',
          userId: testUser.id,
        },
      });
      
      // Create a knowledge primitive
      const primitive = await prisma.knowledgePrimitive.create({
        data: {
          primitiveId: 'test-primitive-1',
          title: 'React Hooks Concept',
          description: 'Understanding React Hooks and useState',
          primitiveType: 'concept',
          difficultyLevel: 'beginner',
          estimatedTimeMinutes: 15,
          userId: testUser.id,
          blueprintId: 1,
        },
      });
      
      createdPrimitiveId = primitive.primitiveId;
      console.log(`Created primitive: ${createdPrimitiveId}`);
      
      // Create mastery criteria
      const criterion1 = await prisma.masteryCriterion.create({
        data: {
          criterionId: 'crit-1',
          primitiveId: createdPrimitiveId,
          title: 'Understanding useState',
          description: 'Can explain useState hook functionality',
          ueeLevel: 'UNDERSTAND',
          weight: 0.5,
          userId: testUser.id,
        },
      });
      
      const criterion2 = await prisma.masteryCriterion.create({
        data: {
          criterionId: 'crit-2',
          primitiveId: createdPrimitiveId,
          title: 'Using useState',
          description: 'Can implement useState in components',
          ueeLevel: 'USE',
          weight: 0.5,
          userId: testUser.id,
        },
      });
      
      // Create a question set for the questions
      const questionSet = await prisma.questionSet.create({
        data: {
          title: 'React Hooks Test Questions',
          folderId: testFolder.id,
          userId: testUser.id,
        },
      });
      
      // Create questions for the criteria
      await prisma.question.create({
        data: {
          questionSetId: questionSet.id,
          questionText: 'What does useState return?',
          answerText: 'An array with current state and setter function',
          criterionId: criterion1.criterionId,
        },
      });
      
      await prisma.question.create({
        data: {
          questionSetId: questionSet.id,
          questionText: 'How do you update state with useState?',
          answerText: 'Call the setter function with the new value',
          criterionId: criterion2.criterionId,
        },
      });
      
      // Create user primitive progress
      await prisma.userPrimitiveProgress.create({
        data: {
          userId: testUser.id,
          primitiveId: createdPrimitiveId,
          blueprintId: 1,
          masteryLevel: 'UNDERSTAND', // Set to match criteria UEE level
          nextReviewAt: new Date(), // Due now
          reviewCount: 0,
          successfulReviews: 0,
        },
      });
      
      // Create user criterion masteries
      await prisma.userCriterionMastery.create({
        data: {
          userId: testUser.id,
          criterionId: criterion1.criterionId,
          primitiveId: createdPrimitiveId,
          blueprintId: 1,
          isMastered: false,
        },
      });
      
      await prisma.userCriterionMastery.create({
        data: {
          userId: testUser.id,
          criterionId: criterion2.criterionId,
          primitiveId: createdPrimitiveId,
          blueprintId: 1,
          isMastered: false,
        },
      });
      
      console.log('Test primitive and criteria created successfully');

      // Step 2: Get daily tasks (should include the new primitive)
      console.log('Step 2: Getting daily tasks...');
      
      const tasksResponse = await request(app)
        .get('/api/todays-tasks')
        .set('Authorization', authToken)
        .set('x-test-user-id', testUser.id.toString());

      expect(tasksResponse.status).toBe(200);
      expect(tasksResponse.body.success).toBe(true);
      expect(tasksResponse.body.data.tasks.length).toBeGreaterThan(0);

      // Find our created primitive in the tasks
      const primitiveTask = tasksResponse.body.data.tasks.find(
        (task: any) => task.primitiveId === createdPrimitiveId
      );
      
      expect(primitiveTask).toBeDefined();
      expect(primitiveTask.questions.length).toBeGreaterThan(0);
      console.log(`Found primitive in daily tasks with ${primitiveTask.questions.length} questions`);

      // Step 3: Submit review outcomes for the primitive
      console.log('Step 3: Submitting review outcomes...');
      
      const reviewOutcomes = primitiveTask.questions.map((question: any) => ({
        primitiveId: createdPrimitiveId,
        blueprintId: 1, // Default blueprint
        questionId: question.id,
        criterionId: question.criterionId,
        isCorrect: true,
        difficultyRating: 3, // Neutral difficulty
        responseTimeMs: 5000,
      }));

      const reviewResponse = await request(app)
        .post('/api/primitives/review')
        .set('Authorization', authToken)
        .set('x-test-user-id', testUser.id.toString())
        .send({ outcomes: reviewOutcomes });

      expect(reviewResponse.status).toBe(200);
      expect(reviewResponse.body.success).toBe(true);
      expect(reviewResponse.body.data.outcomes).toHaveLength(reviewOutcomes.length);

      // Verify all outcomes were processed successfully
      reviewResponse.body.data.outcomes.forEach((result: any) => {
        expect(result).toHaveProperty('primitiveId');
        expect(result).toHaveProperty('success', true);
        expect(result).toHaveProperty('nextReviewAt');
      });

      console.log('Review outcomes processed successfully');

      // Step 4: Check updated primitive details
      console.log('Step 4: Checking updated primitive details...');
      
      const detailsResponse = await request(app)
        .get(`/api/primitives/${createdPrimitiveId}/details`)
        .set('Authorization', authToken)
        .set('x-test-user-id', testUser.id.toString());

      expect(detailsResponse.status).toBe(200);
      expect(detailsResponse.body.success).toBe(true);
      
      const updatedPrimitive = detailsResponse.body.data;
      expect(updatedPrimitive.title).toBe('React Hooks Concept');
      expect(updatedPrimitive.reviewCount).toBeGreaterThan(0);
      expect(updatedPrimitive.successfulReviews).toBeGreaterThan(0);
      expect(updatedPrimitive.nextReviewAt).toBeDefined();
      
      // Check that mastery criteria have been updated
      expect(updatedPrimitive.criteria.length).toBeGreaterThan(0);
      updatedPrimitive.criteria.forEach((criterion: any) => {
        expect(criterion.id).toBeDefined();
        expect(criterion.attemptCount).toBeGreaterThanOrEqual(0);
      });

      console.log('Primitive details updated correctly after review');

      // Step 5: Verify primitive is now scheduled for future review
      console.log('Step 5: Verifying future review scheduling...');
      
      const listResponse = await request(app)
        .get('/api/primitives')
        .set('Authorization', authToken)
        .set('x-test-user-id', testUser.id.toString());

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.success).toBe(true);
      
      const listedPrimitive = listResponse.body.data.primitives.find(
        (p: any) => p.primitiveId === createdPrimitiveId
      );
      
      expect(listedPrimitive).toBeDefined();
      expect(listedPrimitive.isTracking).toBe(true);
      expect(listedPrimitive.nextReviewAt).toBeDefined();
      
      // Next review should be in the future
      const nextReviewDate = new Date(listedPrimitive.nextReviewAt);
      const now = new Date();
      expect(nextReviewDate.getTime()).toBeGreaterThan(now.getTime());

      console.log('Primitive successfully scheduled for future review');

      // Step 6: Test tracking intensity management
      console.log('Step 6: Testing tracking intensity management...');
      
      const intensityResponse = await request(app)
        .post(`/api/primitives/${createdPrimitiveId}/tracking-intensity`)
        .set('Authorization', authToken)
        .set('x-test-user-id', testUser.id.toString())
        .send({ intensity: 'DENSE' });

      expect(intensityResponse.status).toBe(200);
      expect(intensityResponse.body.success).toBe(true);
      expect(intensityResponse.body.data.intensity).toBe('DENSE');

      // Verify intensity was updated
      const getIntensityResponse = await request(app)
        .get(`/api/primitives/${createdPrimitiveId}/tracking-intensity`)
        .set('Authorization', authToken)
        .set('x-test-user-id', testUser.id.toString());

      expect(getIntensityResponse.status).toBe(200);
      expect(getIntensityResponse.body.data.intensity).toBe('DENSE');

      console.log('Tracking intensity management working correctly');

      console.log('✅ Complete primitive lifecycle test passed successfully!');
    }, 30000); // 30 second timeout for the full lifecycle test

    it('should handle primitive tracking toggle', async () => {
      // Ensure we have a primitive to work with
      expect(createdPrimitiveId).toBeDefined();

      console.log('Testing primitive tracking toggle...');

      // Toggle tracking off
      const toggleOffResponse = await request(app)
        .post(`/api/primitives/${createdPrimitiveId}/tracking`)
        .set('Authorization', authToken)
        .set('x-test-user-id', testUser.id.toString())
        .send({ isTracking: false });

      expect(toggleOffResponse.status).toBe(200);
      expect(toggleOffResponse.body.success).toBe(true);
      expect(toggleOffResponse.body.data.isTracking).toBe(false);

      // Verify primitive is not in daily tasks when tracking is off
      const tasksResponse = await request(app)
        .get('/api/todays-tasks')
        .set('Authorization', authToken)
        .set('x-test-user-id', testUser.id.toString());

      expect(tasksResponse.status).toBe(200);
      const primitiveInTasks = tasksResponse.body.data.tasks.find(
        (task: any) => task.primitiveId === createdPrimitiveId
      );
      expect(primitiveInTasks).toBeUndefined();

      // Toggle tracking back on
      const toggleOnResponse = await request(app)
        .post(`/api/primitives/${createdPrimitiveId}/tracking`)
        .set('Authorization', authToken)
        .set('x-test-user-id', testUser.id.toString())
        .send({ isTracking: true });

      expect(toggleOnResponse.status).toBe(200);
      expect(toggleOnResponse.body.data.isTracking).toBe(true);

      console.log('Primitive tracking toggle working correctly');
    });

    it('should handle error scenarios gracefully', async () => {
      console.log('Testing error scenarios...');

      // Test with non-existent primitive
      const nonExistentResponse = await request(app)
        .get('/api/primitives/non-existent-id/details')
        .set('Authorization', authToken)
        .set('x-test-user-id', testUser.id.toString());

      expect(nonExistentResponse.status).toBe(404);

      // Test with invalid review data
      const invalidReviewResponse = await request(app)
        .post('/api/primitives/review')
        .set('Authorization', authToken)
        .set('x-test-user-id', testUser.id.toString())
        .send({ outcomes: [] }); // Empty outcomes

      expect(invalidReviewResponse.status).toBe(400);

      // Test without authentication
      const unauthResponse = await request(app)
        .get('/api/primitives');

      expect(unauthResponse.status).toBe(401);

      console.log('Error scenarios handled correctly');
    });
  });
});
