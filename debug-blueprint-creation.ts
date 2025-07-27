#!/usr/bin/env ts-node

/**
 * Debug script to test blueprint creation and sourceId storage
 */

import * as dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';

const CORE_API_BASE_URL = process.env.CORE_API_BASE_URL || 'http://localhost:3000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@example.com';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'password123';

async function debugBlueprintCreation() {
  try {
    console.log('🔐 Authenticating...');
    const authResponse = await axios.post(`${CORE_API_BASE_URL}/api/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    });
    
    const authToken = authResponse.data.token;
    console.log('✅ Authentication successful');

    console.log('\n📝 Creating blueprint...');
    const createResponse = await axios.post(`${CORE_API_BASE_URL}/api/ai-rag/learning-blueprints`, {
      sourceText: "What is photosynthesis? Photosynthesis is the process by which plants convert sunlight into energy."
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const blueprintId = createResponse.data.id;
    console.log(`✅ Blueprint created with ID: ${blueprintId}`);

    // Wait a moment for indexing to complete
    console.log('\n⏳ Waiting 5 seconds for indexing...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check multiple times to see if sourceId gets stored
    for (let attempt = 1; attempt <= 5; attempt++) {
      console.log(`\n🔍 Checking blueprint details (attempt ${attempt}/5)...`);
      const getResponse = await axios.get(`${CORE_API_BASE_URL}/api/ai-rag/learning-blueprints/${blueprintId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (getResponse.data.sourceId) {
        console.log(`✅ sourceId found: ${getResponse.data.sourceId}`);
        break;
      } else {
        console.log('❌ sourceId not found in response');
        if (attempt < 5) {
          console.log('   Waiting 2 seconds before next check...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Also check what's in the blueprintJson
    const finalResponse = await axios.get(`${CORE_API_BASE_URL}/api/ai-rag/learning-blueprints/${blueprintId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('\n📋 Final blueprint details:');
    console.log('- ID:', finalResponse.data.id);
    console.log('- sourceId (top-level):', finalResponse.data.sourceId || 'NOT FOUND');
    console.log('- source_id in blueprintJson:', finalResponse.data.blueprintJson?.source_id || 'NOT FOUND');
    console.log('- updatedAt:', finalResponse.data.updatedAt);

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugBlueprintCreation();
