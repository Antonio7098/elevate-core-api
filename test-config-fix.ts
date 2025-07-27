import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testConfigurationFix() {
  console.log('🔧 Testing AI Service Configuration Fix');
  console.log('=====================================');
  
  // Check environment variables
  console.log('\n📋 Environment Variables:');
  console.log(`AI_API_BASE_URL: ${process.env.AI_API_BASE_URL}`);
  console.log(`AI_SERVICE_API_KEY: ${process.env.AI_SERVICE_API_KEY}`);
  
  const AI_SERVICE_BASE_URL = process.env.AI_API_BASE_URL || 'http://localhost:8000';
  
  console.log(`\n🎯 Using AI Service URL: ${AI_SERVICE_BASE_URL}`);
  
  // Test 1: Health check
  try {
    console.log('\n🏥 Testing AI API Health Check...');
    const healthResponse = await axios.get(`${AI_SERVICE_BASE_URL}/api/health`, {
      timeout: 10000
    });
    console.log('✅ AI API Health Check successful');
    console.log(`   Status: ${healthResponse.status}`);
    console.log(`   Response: ${JSON.stringify(healthResponse.data, null, 2)}`);
  } catch (error: any) {
    console.log('❌ AI API Health Check failed');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  
  // Test 2: Deconstruct endpoint (used in blueprint update)
  try {
    console.log('\n📝 Testing AI API Deconstruct Endpoint...');
    const deconstructResponse = await axios.post(`${AI_SERVICE_BASE_URL}/api/v1/deconstruct`, {
      source_text: 'ATP is the main energy currency of the cell.'
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ AI API Deconstruct successful');
    console.log(`   Status: ${deconstructResponse.status}`);
    console.log(`   Has blueprint_json: ${!!deconstructResponse.data.blueprint_json}`);
    console.log(`   Has source_id: ${!!deconstructResponse.data.blueprint_json?.source_id}`);
  } catch (error: any) {
    console.log('❌ AI API Deconstruct failed');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  
  // Test 3: Chat endpoint (used in RAG chat)
  try {
    console.log('\n💬 Testing AI API Chat Endpoint...');
    const chatResponse = await axios.post(`${AI_SERVICE_BASE_URL}/api/v1/chat/message`, {
      user_id: 'test_user',
      message_content: 'What is ATP?',
      conversation_history: [],
      context: {
        blueprintId: 1
      },
      session_id: 'test_session',
      metadata: {}
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ AI API Chat successful');
    console.log(`   Status: ${chatResponse.status}`);
    console.log(`   Has response: ${!!chatResponse.data.response}`);
    console.log(`   Response length: ${chatResponse.data.response?.length || 0}`);
  } catch (error: any) {
    console.log('❌ AI API Chat failed');
    console.log(`   Error: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
  
  console.log('\n🏁 Configuration test completed');
}

testConfigurationFix().catch(console.error);
