import request from 'supertest';
import { app } from '../app';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import axios from 'axios';

const prisma = new PrismaClient();

// AI API configuration
const AI_API_BASE_URL = process.env.AI_API_URL || 'http://localhost:8000/api/v1';
const AI_API_KEY = process.env.AI_API_KEY || 'test-token';

describe('AI API Integration Tests', () => {
  let userToken: string;
  let userId: number;
  let testPrimitiveId: string;

  beforeAll(async () => {
    // Create a test user
    const user = await prisma.user.create({
      data: {
        email: 'ai-integration-test@example.com',
        password: 'hashedpassword',
        name: 'AI Integration Test User',
      },
    });
    userId = user.id;
    userToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret');

    // Create test blueprint first
    const blueprint = await prisma.learningBlueprint.create({
      data: {
        title: 'AI Integration Test Blueprint',
        description: 'Test blueprint for AI API integration tests',
        sourceText: 'Test blueprint source text',
        blueprintJson: { title: 'Test Blueprint', sections: [] },
        userId: user.id
      }
    });

    // Create test knowledge primitive
    const primitive = await prisma.knowledgePrimitive.create({
      data: {
        primitiveId: "ai-test-concept",
        title: "AI Integration Test Concept",
        description: "A concept for testing AI API integration with real LLM calls",
        primitiveType: "concept",
        difficultyLevel: "intermediate",
        userId: user.id,
        blueprintId: blueprint.id,
        estimatedTimeMinutes: 30
      }
    });
    testPrimitiveId = primitive.primitiveId;

    // Create user memory profile (commented out - model not available in current schema)
    // await prisma.userMemory.create({
    //   data: {
    //     userId: user.id,
    //     cognitiveApproach: 'ADAPTIVE',
    //     explanationStyle: 'DETAILED',
    //     interactionStyle: 'COLLABORATIVE',
    //     learningPreferences: {
    //       preferredFormat: 'mixed',
    //       complexityLevel: 'intermediate',
    //       focusAreas: ['ai', 'machine-learning']
    //     }
    //   }
    // });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.knowledgePrimitive.deleteMany({ where: { primitiveId: testPrimitiveId } });
    await prisma.learningBlueprint.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email: 'ai-integration-test@example.com' } });
    await prisma.$disconnect();
  });

  describe('AI API Health Check', () => {
    test('should connect to AI API successfully', async () => {
      try {
        const response = await axios.get(`${AI_API_BASE_URL}/premium/health`, {
          headers: { Authorization: `Bearer ${AI_API_KEY}` },
          timeout: 10000,
        });

        expect(response.status).toBe(200);
        expect(response.data.status).toBe('healthy');
        expect(response.data.services).toBeDefined();
        
        console.log('✅ AI API Health Check:', response.data);
      } catch (error) {
        console.error('❌ AI API Health Check Failed:', error.message);
        throw error;
      }
    });
  });

  describe('Real LLM Integration Tests', () => {
    test('should complete premium chat workflow with real LLM calls', async () => {
      const startTime = Date.now();
      
      try {
        // Step 1: Test Premium Advanced Chat
        console.log('🧪 Testing Premium Advanced Chat...');
        const chatResponse = await axios.post(
          `${AI_API_BASE_URL}/premium/chat/advanced`,
          {
            query: 'Explain the concept of machine learning in simple terms',
            user_id: userId.toString(),
            user_context: {
              learning_style: 'visual',
              current_topic: 'machine learning',
              difficulty_level: 'beginner'
            }
          },
          {
            headers: { Authorization: `Bearer ${AI_API_KEY}` },
            timeout: 30000, // 30 seconds for LLM response
          }
        );

        expect(chatResponse.status).toBe(200);
        expect(chatResponse.data.response).toBeDefined();
        expect(chatResponse.data.response.length).toBeGreaterThan(0);
        expect(chatResponse.data.experts_used).toBeDefined();
        expect(chatResponse.data.confidence_score).toBeDefined();

        const chatTime = Date.now() - startTime;
        console.log(`✅ Premium Chat completed in ${chatTime}ms`);
        console.log(`   Response length: ${chatResponse.data.response.length} chars`);
        console.log(`   Experts used: ${chatResponse.data.experts_used.length}`);
        console.log(`   Confidence: ${chatResponse.data.confidence_score}`);

        // Step 2: Test LangGraph Chat
        console.log('🧪 Testing LangGraph Chat...');
        const langgraphResponse = await axios.post(
          `${AI_API_BASE_URL}/premium/chat/langgraph`,
          {
            query: 'Create a learning plan for understanding neural networks',
            user_id: userId.toString(),
            user_context: {
              learning_style: 'structured',
              current_topic: 'neural networks',
              difficulty_level: 'intermediate'
            }
          },
          {
            headers: { Authorization: `Bearer ${AI_API_KEY}` },
            timeout: 30000,
          }
        );

        expect(langgraphResponse.status).toBe(200);
        expect(langgraphResponse.data.response).toBeDefined();
        expect(langgraphResponse.data.workflow_status).toBeDefined();
        expect(langgraphResponse.data.agents_used).toBeDefined();

        const langgraphTime = Date.now() - startTime;
        console.log(`✅ LangGraph Chat completed in ${langgraphTime}ms`);
        console.log(`   Response length: ${langgraphResponse.data.response.length} chars`);
        console.log(`   Workflow status: ${langgraphResponse.data.workflow_status}`);
        console.log(`   Agents used: ${langgraphResponse.data.agents_used.length}`);

        // Step 3: Test Context Assembly Agent
        console.log('🧪 Testing Context Assembly Agent...');
        const contextResponse = await axios.post(
          `${AI_API_BASE_URL}/premium/context/assemble`,
          {
            query: 'What are the key principles of deep learning?',
            user_id: userId.toString(),
            user_context: {
              learning_style: 'comprehensive',
              current_topic: 'deep learning',
              difficulty_level: 'advanced'
            }
          },
          {
            headers: { Authorization: `Bearer ${AI_API_KEY}` },
            timeout: 30000,
          }
        );

        expect(contextResponse.status).toBe(200);
        expect(contextResponse.data.assembled_context).toBeDefined();
        expect(contextResponse.data.sufficiency_score).toBeDefined();
        expect(contextResponse.data.token_count).toBeDefined();

        const contextTime = Date.now() - startTime;
        console.log(`✅ Context Assembly completed in ${contextTime}ms`);
        console.log(`   Context length: ${contextResponse.data.assembled_context.length} chars`);
        console.log(`   Sufficiency score: ${contextResponse.data.sufficiency_score}`);
        console.log(`   Token count: ${contextResponse.data.token_count}`);

        // Step 4: Test Learning Workflow
        console.log('🧪 Testing Learning Workflow...');
        const workflowResponse = await axios.post(
          `${AI_API_BASE_URL}/premium/learning/workflow`,
          {
            query: 'Help me understand reinforcement learning step by step',
            user_id: userId.toString(),
            user_context: {
              learning_style: 'step_by_step',
              current_topic: 'reinforcement learning',
              difficulty_level: 'intermediate'
            }
          },
          {
            headers: { Authorization: `Bearer ${AI_API_KEY}` },
            timeout: 30000,
          }
        );

        expect(workflowResponse.status).toBe(200);
        expect(workflowResponse.data.learning_plan).toBeDefined();
        expect(workflowResponse.data.workflow_status).toBeDefined();

        const workflowTime = Date.now() - startTime;
        console.log(`✅ Learning Workflow completed in ${workflowTime}ms`);
        console.log(`   Learning plan: ${workflowResponse.data.learning_plan.length} chars`);
        console.log(`   Workflow status: ${workflowResponse.data.workflow_status}`);

        const totalTime = Date.now() - startTime;
        console.log(`🎯 Total AI API integration test completed in ${totalTime}ms`);

      } catch (error) {
        console.error('❌ AI API Integration Test Failed:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
        throw error;
      }
    });

    test('should test cost optimization features with real usage', async () => {
      try {
        // Test token optimization
        console.log('🧪 Testing Token Optimization...');
        const tokenResponse = await axios.post(
          `${AI_API_BASE_URL}/premium/optimize/tokens`,
          {
            query: 'Summarize the main concepts of artificial intelligence',
            user_id: userId.toString(),
            target_token_count: 100,
            optimization_strategy: 'compression'
          },
          {
            headers: { Authorization: `Bearer ${AI_API_KEY}` },
            timeout: 15000,
          }
        );

        expect(tokenResponse.status).toBe(200);
        expect(tokenResponse.data.optimized_query).toBeDefined();
        expect(tokenResponse.data.token_reduction).toBeDefined();
        expect(tokenResponse.data.estimated_savings).toBeDefined();

        console.log(`✅ Token Optimization completed`);
        console.log(`   Token reduction: ${tokenResponse.data.token_reduction}`);
        console.log(`   Estimated savings: ${tokenResponse.data.estimated_savings}`);

        // Test model cascading
        console.log('🧪 Testing Model Cascading...');
        const cascadeResponse = await axios.post(
          `${AI_API_BASE_URL}/premium/chat/cascade`,
          {
            query: 'What is the difference between supervised and unsupervised learning?',
            user_id: userId.toString(),
            user_context: {
              learning_style: 'comparative',
              current_topic: 'machine learning types',
              difficulty_level: 'beginner'
            }
          },
          {
            headers: { Authorization: `Bearer ${AI_API_KEY}` },
            timeout: 20000,
          }
        );

        expect(cascadeResponse.status).toBe(200);
        expect(cascadeResponse.data.response).toBeDefined();
        expect(cascadeResponse.data.model_used).toBeDefined();
        expect(cascadeResponse.data.cost_optimized).toBeDefined();

        console.log(`✅ Model Cascading completed`);
        console.log(`   Model used: ${cascadeResponse.data.model_used}`);
        console.log(`   Cost optimized: ${cascadeResponse.data.cost_optimized}`);

        // Test cost analytics
        console.log('🧪 Testing Cost Analytics...');
        const analyticsResponse = await axios.get(
          `${AI_API_BASE_URL}/premium/cost/analytics`,
          {
            headers: { Authorization: `Bearer ${AI_API_KEY}` },
            timeout: 10000,
          }
        );

        expect(analyticsResponse.status).toBe(200);
        expect(analyticsResponse.data.overview).toBeDefined();
        expect(analyticsResponse.data.timestamp).toBeDefined();

        console.log(`✅ Cost Analytics completed`);
        console.log(`   Total operations: ${analyticsResponse.data.overview.total_operations}`);
        console.log(`   Total cost: ${analyticsResponse.data.overview.total_cost}`);

      } catch (error) {
        console.error('❌ Cost Optimization Test Failed:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
        throw error;
      }
    });
  });

  describe('Performance and Load Testing', () => {
    test('should handle concurrent AI API requests efficiently', async () => {
      const concurrentRequests = 3;
      const startTime = Date.now();
      
      try {
        const promises = [];
        
        // Create concurrent requests
        for (let i = 0; i < concurrentRequests; i++) {
          promises.push(
            axios.post(
              `${AI_API_BASE_URL}/premium/chat/advanced`,
              {
                query: `Test query ${i + 1}: Explain concept ${i + 1}`,
                user_id: userId.toString(),
                user_context: {
                  learning_style: 'concurrent',
                  current_topic: `concept-${i + 1}`,
                  difficulty_level: 'beginner'
                }
              },
              {
                headers: { Authorization: `Bearer ${AI_API_KEY}` },
                timeout: 30000,
              }
            )
          );
        }

        console.log(`🧪 Testing ${concurrentRequests} concurrent requests...`);
        const responses = await Promise.all(promises);
        
        // Verify all requests succeeded
        responses.forEach((response, index) => {
          expect(response.status).toBe(200);
          expect(response.data.response).toBeDefined();
          console.log(`✅ Concurrent request ${index + 1} completed`);
        });

        const totalTime = Date.now() - startTime;
        const avgTime = totalTime / concurrentRequests;
        
        console.log(`🎯 Concurrent test completed:`);
        console.log(`   Total time: ${totalTime}ms`);
        console.log(`   Average time per request: ${avgTime.toFixed(0)}ms`);
        console.log(`   Throughput: ${(concurrentRequests / (totalTime / 1000)).toFixed(2)} requests/second`);

      } catch (error) {
        console.error('❌ Concurrent Test Failed:', error.message);
        throw error;
      }
    });

    test('should measure response time and quality metrics', async () => {
      const testQueries = [
        'What is machine learning?',
        'Explain neural networks',
        'How does deep learning work?',
        'What are the types of AI?',
        'Explain natural language processing'
      ];

      const results = [];
      const startTime = Date.now();

      try {
        for (let i = 0; i < testQueries.length; i++) {
          const queryStartTime = Date.now();
          
          const response = await axios.post(
            `${AI_API_BASE_URL}/premium/chat/advanced`,
            {
              query: testQueries[i],
              user_id: userId.toString(),
              user_context: {
                learning_style: 'performance_test',
                current_topic: `topic-${i + 1}`,
                difficulty_level: 'intermediate'
              }
            },
            {
              headers: { Authorization: `Bearer ${AI_API_KEY}` },
              timeout: 30000,
            }
          );

          const queryTime = Date.now() - queryStartTime;
          
          results.push({
            query: testQueries[i],
            responseTime: queryTime,
            responseLength: response.data.response.length,
            confidence: response.data.confidence_score,
            expertsUsed: response.data.experts_used.length
          });

          console.log(`✅ Query ${i + 1} completed in ${queryTime}ms`);
        }

        const totalTime = Date.now() - startTime;
        const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
        const avgResponseLength = results.reduce((sum, r) => sum + r.responseLength, 0) / results.length;
        const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

        console.log(`🎯 Performance Metrics:`);
        console.log(`   Total test time: ${totalTime}ms`);
        console.log(`   Average response time: ${avgResponseTime.toFixed(0)}ms`);
        console.log(`   Average response length: ${avgResponseLength.toFixed(0)} chars`);
        console.log(`   Average confidence: ${avgConfidence.toFixed(3)}`);
        console.log(`   Total throughput: ${(testQueries.length / (totalTime / 1000)).toFixed(2)} queries/second`);

        // Performance assertions
        expect(avgResponseTime).toBeLessThan(10000); // Should be under 10 seconds on average
        expect(avgConfidence).toBeGreaterThan(0.5); // Should have reasonable confidence
        expect(results.every(r => r.responseLength > 0)).toBe(true); // All responses should have content

      } catch (error) {
        console.error('❌ Performance Test Failed:', error.message);
        throw error;
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle AI API errors gracefully', async () => {
      try {
        // Test with invalid API key
        const invalidKeyResponse = await axios.get(
          `${AI_API_BASE_URL}/premium/health`,
          {
            headers: { Authorization: 'Bearer invalid-key' },
            timeout: 10000,
            validateStatus: () => true, // Don't throw on non-2xx status
          }
        );

        expect(invalidKeyResponse.status).toBe(401);

        // Test with malformed request
        const malformedResponse = await axios.post(
          `${AI_API_BASE_URL}/premium/chat/advanced`,
          {
            // Missing required fields
            user_id: userId.toString()
          },
          {
            headers: { Authorization: `Bearer ${AI_API_KEY}` },
            timeout: 10000,
            validateStatus: () => true,
          }
        );

        expect(malformedResponse.status).toBe(422); // Validation error

        // Test with very long query (potential token limit issue)
        const longQuery = 'A'.repeat(10000); // Very long query
        const longQueryResponse = await axios.post(
          `${AI_API_BASE_URL}/premium/chat/advanced`,
          {
            query: longQuery,
            user_id: userId.toString(),
            user_context: {
              learning_style: 'long_query_test',
              current_topic: 'long_query',
              difficulty_level: 'advanced'
            }
          },
          {
            headers: { Authorization: `Bearer ${AI_API_KEY}` },
            timeout: 30000,
            validateStatus: () => true,
          }
        );

        // Should either succeed or fail gracefully
        expect([200, 400, 413, 422]).toContain(longQueryResponse.status);

        console.log('✅ Error handling tests completed successfully');

      } catch (error) {
        console.error('❌ Error Handling Test Failed:', error.message);
        throw error;
      }
    });
  });
});
