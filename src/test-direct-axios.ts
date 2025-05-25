/**
 * Direct Axios Test
 * 
 * This script directly uses axios to test the connection to the Flask service
 * without going through the aiService class.
 */

import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

async function testDirectAxios() {
  console.log('=== Direct Axios Test ===');
  
  const baseUrl = process.env.AI_SERVICE_BASE_URL || 'http://localhost:8000';
  const apiKey = process.env.AI_SERVICE_API_KEY || '';
  
  console.log(`Using base URL: ${baseUrl}`);
  console.log(`API Key length: ${apiKey.length}`);
  console.log(`API Key first 5 chars: ${apiKey.substring(0, 5)}...`);
  
  // Try different header formats and key variations
  const headerFormats = [
    // Standard formats
    { name: 'X-API-Key', value: apiKey },
    { name: 'Authorization', value: `Bearer ${apiKey}` },
    { name: 'Api-Key', value: apiKey },
    { name: 'CORE_API_ACCESS_KEY', value: apiKey },
    
    // Try without the 'y' prefix (in case it was added by mistake)
    { name: 'Authorization', value: `Bearer ${apiKey.substring(1)}` },
    
    // Try with different formats
    { name: 'Authorization', value: apiKey },  // Without 'Bearer '
    { name: 'X-API-Key', value: apiKey.replace(/\\/, '') },  // Remove escaped backslash
    
    // Try a hardcoded value (for testing)
    { name: 'Authorization', value: 'Bearer CORE_API_ACCESS_KEY' }
  ];
  
  for (const header of headerFormats) {
    try {
      console.log(`\nTesting with header: ${header.name}`);
      
      // Create headers object for this test
      const headers = {
        'Content-Type': 'application/json',
        [header.name]: header.value
      };
      
      console.log('Request headers:', headers);
      
      // Try without the version in the URL path
      console.log('Making request to:', `${baseUrl}/health-check`);
      const response = await axios.get(`${baseUrl}/health-check`, { headers });
      
      console.log(`Status: ${response.status}`);
      console.log('Response data:', response.data);
      
      console.log(`SUCCESS with header: ${header.name}`);
      return true;
    } catch (error: any) {
      console.error(`Failed with header ${header.name}:`, error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  }
  
  console.log('\nAll header formats failed');
  return false;
}

// Run the test
testDirectAxios().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
