import axios from 'axios';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testBlueprintDeletion() {
  try {
    console.log('🗑️ Starting Blueprint Deletion Debug Test');
    
    const blueprintId = 131; // Use the blueprint ID from the end-to-end test
    console.log(`🗑️ Attempting to delete blueprint ${blueprintId} via AI API`);
    
    // Call AI API deletion endpoint directly
    const deleteResponse = await axios.delete(
      `http://localhost:8000/api/v1/index-blueprint/${blueprintId}`,
      {
        headers: {
          'Authorization': 'Bearer test_api_key_123',
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✅ Deletion response status: ${deleteResponse.status}`);
    console.log(`✅ Deletion response data:`, deleteResponse.data);
    
    // Check status after deletion
    console.log(`🔍 Checking blueprint status after deletion...`);
    const statusResponse = await axios.get(
      `http://localhost:8000/api/v1/blueprints/${blueprintId}/status`,
      {
        headers: {
          'Authorization': 'Bearer test_api_key_123'
        }
      }
    );
    
    console.log(`📊 Status response status: ${statusResponse.status}`);
    console.log(`📊 Status after deletion:`, statusResponse.data);
    
    console.log('🎉 Blueprint deletion test completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Blueprint deletion test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('❌ Response status:', error.response.status);
      console.error('❌ Response headers:', error.response.headers);
    }
    process.exit(1);
  }
}

testBlueprintDeletion();
