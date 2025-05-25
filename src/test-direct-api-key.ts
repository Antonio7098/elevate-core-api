import axios from 'axios';

// Use the new API key directly
const apiKey = 'd0zYy6XQNIe3yy2iSTgEr9G6dpoJaejo';
const baseUrl = 'http://localhost:8000';

console.log('=== Testing with direct API key ===');
console.log(`API Key: ${apiKey}`);
console.log(`Base URL: ${baseUrl}`);

async function testHealthCheck() {
  try {
    console.log('Testing health check endpoint...');
    
    // Try with X-API-Key header
    console.log('\nTrying with X-API-Key header:');
    try {
      const response = await axios.get(`${baseUrl}/v1/health-check`, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      });
      console.log('Status:', response.status);
      console.log('Response:', response.data);
    } catch (error: any) {
      console.error('Error with X-API-Key:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
    // Try with Authorization header
    console.log('\nTrying with Authorization header:');
    try {
      const response = await axios.get(`${baseUrl}/v1/health-check`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      });
      console.log('Status:', response.status);
      console.log('Response:', response.data);
    } catch (error: any) {
      console.error('Error with Authorization:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
    // Try with both headers
    console.log('\nTrying with both headers:');
    try {
      const response = await axios.get(`${baseUrl}/v1/health-check`, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          'Authorization': `Bearer ${apiKey}`
        }
      });
      console.log('Status:', response.status);
      console.log('Response:', response.data);
    } catch (error: any) {
      console.error('Error with both headers:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
    
    // Try without version in URL
    console.log('\nTrying without version in URL:');
    try {
      const response = await axios.get(`${baseUrl}/health-check`, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        }
      });
      console.log('Status:', response.status);
      console.log('Response:', response.data);
    } catch (error: any) {
      console.error('Error without version:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testHealthCheck();
