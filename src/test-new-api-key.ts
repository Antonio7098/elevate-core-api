import dotenv from 'dotenv';
import { AIService } from './services/aiService';

// Force reload of environment variables
dotenv.config({ override: true });

// Get the API key from environment variables
const apiKey = process.env.AI_SERVICE_API_KEY;
const baseUrl = process.env.AI_SERVICE_BASE_URL;

console.log('=== Testing with new API key ===');
console.log(`API Key: ${apiKey}`);
console.log(`Base URL: ${baseUrl}`);

// Create a new instance of AIService
const aiService = new AIService();

async function testConnection() {
  try {
    // Test if the AI service is available
    const isAvailable = await aiService.isAvailable();
    console.log(`AI service is ${isAvailable ? 'available' : 'not available'}`);

    if (isAvailable) {
      // Test generating questions
      const questionsResponse = await aiService.generateQuestions({
        sourceText: 'This is a test source text for generating questions.',
        questionCount: 3,
        difficulty: 'medium'
      });
      console.log('Generated questions:', questionsResponse);

      // Test chatting with AI
      const chatResponse = await aiService.chat({
        message: 'Hello, AI!',
        conversation: []
      });
      console.log('Chat response:', chatResponse);

      // Test evaluating an answer
      const evaluationResponse = await aiService.evaluateAnswer({
        questionId: 1,
        questionText: 'What is 2+2?',
        questionType: 'short-answer',
        userAnswer: '4',
        expectedAnswer: '4'
      });
      console.log('Evaluation response:', evaluationResponse);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testConnection();
