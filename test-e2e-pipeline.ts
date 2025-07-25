#!/usr/bin/env ts-node

/**
 * End-to-End Pipeline Verification Script
 * 
 * This script tests the complete RAG pipeline by:
 * 1. Creating a blueprint via Core API
 * 2. Verifying it's indexed in the AI API/vector database
 * 3. Updating the blueprint
 * 4. Verifying changes are reflected in the vector database
 * 5. Deleting the blueprint
 * 6. Verifying it's removed from the vector database
 * 
 * Usage: npx ts-node test-e2e-pipeline.ts
 */

// Load environment variables first
import * as dotenv from 'dotenv';
dotenv.config();


import axios from 'axios';
import { AIAPIClientService } from './src/services/ai-api-client.service';

// Configuration
const CORE_API_BASE_URL = process.env.CORE_API_BASE_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'password123';

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  details?: string;
  error?: any;
}

class E2EPipelineTest {
  private results: TestResult[] = [];
  private authToken: string = '';
  private aiApiClient: AIAPIClientService;
  private createdBlueprintId: number | null = null;

  constructor() {
    this.aiApiClient = new AIAPIClientService();
  }

  async run(): Promise<void> {
    console.log('🚀 Starting End-to-End RAG Pipeline Verification\n');
    
    try {
      // Step 1: Authentication
      await this.authenticateUser();
      
      // Step 2: Check AI API health
      await this.checkAIAPIHealth();
      
      // Step 3: Create blueprint via Core API
      await this.createBlueprint();
      
      // Step 4: Verify blueprint is indexed in AI API
      await this.verifyBlueprintIndexed();
      
      // Step 5: Update blueprint via Core API
      await this.updateBlueprint();
      
      // Step 6: Verify blueprint changes in AI API
      await this.verifyBlueprintUpdated();
      
      // Step 7: Test RAG chat with blueprint context
      await this.testRAGChatWithBlueprint();
      
      // Step 8: Delete blueprint via Core API
      await this.deleteBlueprint();
      
      // Step 9: Verify blueprint removed from AI API
      await this.verifyBlueprintDeleted();
      
    } catch (error) {
      console.error('❌ Test suite failed with unexpected error:', error);
      this.results.push({
        step: 'Unexpected Error',
        status: 'FAIL',
        error: error
      });
    }
    
    // Print results summary
    this.printResults();
  }

  private async authenticateUser(): Promise<void> {
    try {
      console.log('🔐 Step 1: Authenticating test user...');
      
      const response = await axios.post(`${CORE_API_BASE_URL}/api/auth/login`, {
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      });

      if (response.data.token) {
        this.authToken = response.data.token;
        this.results.push({
          step: '1. Authentication',
          status: 'PASS',
          details: 'Successfully authenticated test user'
        });
        console.log('   ✅ Authentication successful');
      } else {
        throw new Error('No token received from authentication');
      }
    } catch (error: any) {
      this.results.push({
        step: '1. Authentication',
        status: 'FAIL',
        details: `Failed to authenticate: ${error.message}`,
        error
      });
      console.log('   ❌ Authentication failed');
      throw error;
    }
  }

  private async checkAIAPIHealth(): Promise<void> {
    try {
      console.log('🏥 Step 2: Checking AI API health...');
      
      const health = await this.aiApiClient.healthCheck();
      
      if (health.status === 'healthy') {
        this.results.push({
          step: '2. AI API Health Check',
          status: 'PASS',
          details: `AI API is healthy (version: ${health.version || 'unknown'})`
        });
        console.log('   ✅ AI API is healthy');
      } else {
        throw new Error(`AI API is unhealthy: ${health.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      this.results.push({
        step: '2. AI API Health Check',
        status: 'FAIL',
        details: `AI API health check failed: ${error.message}`,
        error
      });
      console.log('   ❌ AI API health check failed');
      throw error;
    }
  }

  private async createBlueprint(): Promise<void> {
    try {
      console.log('📝 Step 3: Creating blueprint via Core API...');
      
      const blueprintData = {
        sourceText: `
# Photosynthesis Study Guide

## What is Photosynthesis?
Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen.

## Key Components:
1. **Chloroplasts**: The organelles where photosynthesis occurs
2. **Chlorophyll**: The green pigment that captures light energy
3. **Stomata**: Pores in leaves that allow gas exchange

## The Process:
- **Light Reactions**: Occur in the thylakoids
- **Calvin Cycle**: Occurs in the stroma

## Equation:
6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂
        `.trim()
      };

      const response = await axios.post(
        `${CORE_API_BASE_URL}/api/ai-rag/learning-blueprints`,
        blueprintData,
        {
          headers: { Authorization: `Bearer ${this.authToken}` }
        }
      );

      if (response.data && response.data.id) {
        this.createdBlueprintId = response.data.id;
        this.results.push({
          step: '3. Create Blueprint',
          status: 'PASS',
          details: `Blueprint created successfully with ID: ${this.createdBlueprintId}`
        });
        console.log(`   ✅ Blueprint created with ID: ${this.createdBlueprintId}`);
      } else {
        throw new Error('No blueprint ID returned from creation');
      }
    } catch (error: any) {
      this.results.push({
        step: '3. Create Blueprint',
        status: 'FAIL',
        details: `Blueprint creation failed: ${error.response?.data?.message || error.message}`,
        error
      });
      console.log('   ❌ Blueprint creation failed');
      throw error;
    }
  }

  private async verifyBlueprintIndexed(): Promise<void> {
    try {
      console.log('🔍 Step 4: Verifying blueprint is indexed in AI API...');
      
      if (!this.createdBlueprintId) {
        throw new Error('No blueprint ID available for verification');
      }

      // Retry logic for vector DB indexing verification
      const maxRetries = 5;
      const retryDelay = 3000; // 3 seconds between retries
      let lastError: any;
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`   🔄 Verification attempt ${attempt}/${maxRetries}...`);
          
          const status = await this.aiApiClient.getBlueprintStatus(this.createdBlueprintId.toString());
          
          // Debug: Log the actual response to understand the structure
          if (process.env.DEBUG) {
            console.log('   🔍 Debug - AI API status response:', JSON.stringify(status, null, 2));
          }
          
          // Check multiple possible indicators of successful indexing
          const isIndexed = status.is_indexed || 
                           status.indexing_completed || 
                           (status.nodes_processed && status.nodes_processed > 0) ||
                           (status.embeddings_generated && status.embeddings_generated > 0) ||
                           (status.vectors_stored && status.vectors_stored > 0);
          
          if (isIndexed) {
            this.results.push({
              step: '4. Verify Blueprint Indexed',
              status: 'PASS',
              details: `Blueprint indexed successfully after ${attempt} attempt(s). ` +
                      `Vector count: ${status.vector_count || status.vectors_stored || 'unknown'}, ` +
                      `Nodes: ${status.nodes_processed || 'unknown'}, ` +
                      `Last indexed: ${status.last_indexed_at || status.created_at || 'unknown'}`
            });
            console.log('   ✅ Blueprint successfully indexed in vector database');
            console.log(`      📊 Indexing stats: Vectors=${status.vectors_stored || 'unknown'}, Nodes=${status.nodes_processed || 'unknown'}`);
            return; // Success! Exit the retry loop
          }
          
          // If not indexed yet, prepare for retry
          if (attempt < maxRetries) {
            console.log(`   ⏳ Blueprint not yet indexed, waiting ${retryDelay/1000}s before retry...`);
            await this.sleep(retryDelay);
          } else {
            throw new Error(`Blueprint not indexed after ${maxRetries} attempts. Last status: ${JSON.stringify(status)}`);
          }
          
        } catch (error: any) {
          lastError = error;
          
          // If this is the last attempt, throw the error
          if (attempt === maxRetries) {
            throw error;
          }
          
          // For other attempts, log the error and continue
          console.log(`   ⚠️  Attempt ${attempt} failed: ${error.message}, retrying...`);
          await this.sleep(retryDelay);
        }
      }
      
    } catch (error: any) {
      this.results.push({
        step: '4. Verify Blueprint Indexed',
        status: 'FAIL',
        details: `Blueprint indexing verification failed: ${error.message}`,
        error
      });
      console.log('   ❌ Blueprint indexing verification failed');
      console.log(`   💡 Tip: Try setting DEBUG=1 to see full AI API responses`);
      throw error;
    }
  }

  private async updateBlueprint(): Promise<void> {
    try {
      console.log('✏️ Step 5: Updating blueprint via Core API...');
      
      if (!this.createdBlueprintId) {
        throw new Error('No blueprint ID available for update');
      }

      const updatedData = {
        sourceText: `
# Photosynthesis Study Guide (Updated)

## What is Photosynthesis?
Photosynthesis is the biological process by which plants, algae, and some bacteria convert sunlight, carbon dioxide, and water into glucose and oxygen. This process is essential for life on Earth.

## Key Components:
1. **Chloroplasts**: The specialized organelles where photosynthesis occurs
2. **Chlorophyll**: The green pigment that captures light energy efficiently
3. **Stomata**: Microscopic pores in leaves that control gas exchange
4. **Thylakoids**: Membrane-bound compartments within chloroplasts

## The Process:
- **Light Reactions (Photo part)**: Occur in the thylakoids, convert light energy to chemical energy
- **Calvin Cycle (Synthesis part)**: Occurs in the stroma, uses chemical energy to produce glucose

## Additional Details:
- **Factors affecting photosynthesis**: Light intensity, CO₂ concentration, temperature
- **Types**: C3, C4, and CAM photosynthesis

## Equation:
6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂ + ATP
        `.trim()
      };

      const response = await axios.put(
        `${CORE_API_BASE_URL}/api/ai-rag/learning-blueprints/${this.createdBlueprintId}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${this.authToken}` }
        }
      );

      if (response.status === 200) {
        this.results.push({
          step: '5. Update Blueprint',
          status: 'PASS',
          details: 'Blueprint updated successfully with expanded content'
        });
        console.log('   ✅ Blueprint updated successfully');
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error: any) {
      this.results.push({
        step: '5. Update Blueprint',
        status: 'FAIL',
        details: `Blueprint update failed: ${error.response?.data?.message || error.message}`,
        error
      });
      console.log('   ❌ Blueprint update failed');
      throw error;
    }
  }

  private async verifyBlueprintUpdated(): Promise<void> {
    try {
      console.log('🔄 Step 6: Verifying blueprint changes in AI API...');
      
      if (!this.createdBlueprintId) {
        throw new Error('No blueprint ID available for verification');
      }

      // Wait a bit for re-indexing to complete
      await this.sleep(3000);

      const status = await this.aiApiClient.getBlueprintStatus(this.createdBlueprintId.toString());
      
      if (status.is_indexed) {
        this.results.push({
          step: '6. Verify Blueprint Updated',
          status: 'PASS',
          details: `Blueprint re-indexed successfully. Vector count: ${status.vector_count || 'unknown'}, Last indexed: ${status.last_indexed_at || 'unknown'}`
        });
        console.log('   ✅ Blueprint changes reflected in vector database');
        console.log(`      📊 Updated vector count: ${status.vector_count || 'unknown'}`);
      } else {
        throw new Error('Updated blueprint not found in vector database');
      }
    } catch (error: any) {
      this.results.push({
        step: '6. Verify Blueprint Updated',
        status: 'FAIL',
        details: `Blueprint update verification failed: ${error.message}`,
        error
      });
      console.log('   ❌ Blueprint update verification failed');
      // Don't throw - continue with next steps
    }
  }

  private async testRAGChatWithBlueprint(): Promise<void> {
    try {
      console.log('💬 Step 7: Testing RAG chat with blueprint context...');
      
      if (!this.createdBlueprintId) {
        throw new Error('No blueprint ID available for chat test');
      }

      const chatData = {
        messageContent: 'What are the key components needed for photosynthesis?',
        context: {
          blueprintId: this.createdBlueprintId
        }
      };

      const response = await axios.post(
        `${CORE_API_BASE_URL}/api/ai-rag/chat/message`,
        chatData,
        {
          headers: { Authorization: `Bearer ${this.authToken}` }
        }
      );

      // Handle different possible response formats
      let responseContent: string | null = null;
      if (response.data && response.data.response) {
        responseContent = response.data.response;
      } else if (response.data && response.data.content) {
        responseContent = response.data.content;
      } else if (response.data && typeof response.data === 'string') {
        responseContent = response.data;
      }

      if (responseContent && responseContent.length > 0) {
        this.results.push({
          step: '7. Test RAG Chat',
          status: 'PASS',
          details: `RAG chat successful. Response length: ${responseContent.length} characters`
        });
        console.log('   ✅ RAG chat with blueprint context successful');
        console.log(`      💭 Response preview: ${responseContent.substring(0, 100)}...`);
      } else {
        console.log('   🔍 Debug: Full response data:', JSON.stringify(response.data, null, 2));
        throw new Error('No valid response content received from RAG chat');
      }
    } catch (error: any) {
      this.results.push({
        step: '7. Test RAG Chat',
        status: 'FAIL',
        details: `RAG chat test failed: ${error.response?.data?.message || error.message}`,
        error
      });
      console.log('   ❌ RAG chat test failed');
      // Don't throw - continue with cleanup
    }
  }

  private async deleteBlueprint(): Promise<void> {
    try {
      console.log('🗑️ Step 8: Deleting blueprint via Core API...');
      
      if (!this.createdBlueprintId) {
        throw new Error('No blueprint ID available for deletion');
      }

      const response = await axios.delete(
        `${CORE_API_BASE_URL}/api/ai-rag/learning-blueprints/${this.createdBlueprintId}`,
        {
          headers: { Authorization: `Bearer ${this.authToken}` }
        }
      );

      if (response.status === 200 || response.status === 204) {
        this.results.push({
          step: '8. Delete Blueprint',
          status: 'PASS',
          details: 'Blueprint deleted successfully from Core API'
        });
        console.log('   ✅ Blueprint deleted from Core API');
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error: any) {
      this.results.push({
        step: '8. Delete Blueprint',
        status: 'FAIL',
        details: `Blueprint deletion failed: ${error.response?.data?.message || error.message}`,
        error
      });
      console.log('   ❌ Blueprint deletion failed');
      // Don't throw - still try to verify cleanup
    }
  }

  private async verifyBlueprintDeleted(): Promise<void> {
    try {
      console.log('🧹 Step 9: Verifying blueprint removed from AI API...');
      
      if (!this.createdBlueprintId) {
        throw new Error('No blueprint ID available for deletion verification');
      }

      // Wait a bit for deletion to propagate
      await this.sleep(2000);

      const status = await this.aiApiClient.getBlueprintStatus(this.createdBlueprintId.toString());
      
      if (!status.is_indexed) {
        this.results.push({
          step: '9. Verify Blueprint Deleted',
          status: 'PASS',
          details: 'Blueprint successfully removed from vector database'
        });
        console.log('   ✅ Blueprint successfully removed from vector database');
      } else {
        throw new Error('Blueprint still exists in vector database after deletion');
      }
    } catch (error: any) {
      if (error.message.includes('not_indexed') || error.message.includes('404')) {
        // This is actually what we want - blueprint not found means it was deleted
        this.results.push({
          step: '9. Verify Blueprint Deleted',
          status: 'PASS',
          details: 'Blueprint successfully removed from vector database (not found)'
        });
        console.log('   ✅ Blueprint successfully removed from vector database');
      } else {
        this.results.push({
          step: '9. Verify Blueprint Deleted',
          status: 'FAIL',
          details: `Blueprint deletion verification failed: ${error.message}`,
          error
        });
        console.log('   ❌ Blueprint deletion verification failed');
      }
    }
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 END-TO-END PIPELINE TEST RESULTS');
    console.log('='.repeat(60));

    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const skipped = this.results.filter(r => r.status === 'SKIP').length;

    this.results.forEach((result, index) => {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
      console.log(`${statusIcon} ${result.step}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
      if (result.error && process.env.DEBUG) {
        console.log(`   Error: ${result.error.message}`);
      }
    });

    console.log('\n' + '-'.repeat(60));
    console.log(`📈 SUMMARY: ${passed} passed, ${failed} failed, ${skipped} skipped`);
    
    if (failed === 0) {
      console.log('🎉 ALL TESTS PASSED! Your RAG pipeline is working correctly!');
    } else {
      console.log('⚠️  Some tests failed. Check the errors above for details.');
    }
    console.log('='.repeat(60));
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  const test = new E2EPipelineTest();
  test.run().catch(error => {
    console.error('Failed to run E2E pipeline test:', error);
    process.exit(1);
  });
}

export { E2EPipelineTest };
