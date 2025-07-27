import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const CORE_API_BASE_URL = 'http://localhost:3000';

async function testBlueprintCreation() {
  try {
    console.log('🔐 Authenticating...');
    const authResponse = await axios.post(`${CORE_API_BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    const authToken = authResponse.data.token;
    console.log('✅ Authentication successful');
    
    console.log('\n📝 Creating blueprint...');
    const blueprintData = {
      sourceText: 'ATP is the main energy currency of the cell.'
    };
    
    const response = await axios.post(
      `${CORE_API_BASE_URL}/api/ai-rag/learning-blueprints`,
      blueprintData,
      {
        headers: { 
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✅ Blueprint created successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error: any) {
    console.log('❌ Error occurred:');
    console.log('Message:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.code) {
      console.log('Code:', error.code);
    }
  }
}

testBlueprintCreation();
