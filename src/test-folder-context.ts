/**
 * Test script to simulate a chat request with a folder ID
 * This will help us see the full context object being sent to the AI service
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Use a hardcoded JWT token for testing
// This is a dummy token that will be replaced by the real one when running the script
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI5NywiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNzE2ODIzNTY4LCJleHAiOjE3MTY5MDk5Njh9.Qy2Y8hY7hKqj0ZX9gG9mHX9gH-eH9tL8LmKXbL9YpCQ';

// Function to test the chat endpoint with a folder ID
async function testChatWithFolder() {
  try {
    // Replace with an actual folder ID from your database
    // You can get this by querying the database or from your frontend
    const folderId = 1; // Replace with an actual folder ID
    
    console.log(`Testing chat with folder ID: ${folderId}`);
    
    // Make the request to the chat endpoint
    const response = await axios.post(
      'http://localhost:3000/api/ai/chat',
      {
        message: 'Tell me about the content in this Mathematics folder',
        folderId: folderId,
        // You can also include a conversation history if needed
        conversation: []
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${JWT_TOKEN}`
        }
      }
    );
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error: any) {
    console.error('Error testing chat with folder:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Run the test
testChatWithFolder();
