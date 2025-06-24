/**
 * Test script for AI Service Integration
 * 
 * This script tests the connection between the Core API and the Python Flask service.
 * It directly uses the aiService to make requests to the Flask service.
 */

import dotenv from 'dotenv';
// import { aiService } from './services/aiService';
import { GenerateQuestionsRequest, ChatRequest, EvaluateAnswerRequest } from './types/ai-service.types';

// Load environment variables
dotenv.config();

// Test function to check if the AI service is available
async function testAIServiceAvailability() {
  try {
    console.log('Testing AI service availability...');
    // const isAvailable = await aiService.isAvailable();
    const isAvailable = false;
    console.log(`AI service is ${isAvailable ? 'available' : 'not available'}`);
    return isAvailable;
  } catch (error) {
    console.error('Error checking AI service availability:', error);
    return false;
  }
}

// Test function to generate questions
async function testGenerateQuestions() {
  try {
    console.log('\nTesting question generation...');
    const request: GenerateQuestionsRequest = {
      sourceText: 'The mitochondria is the powerhouse of the cell. It is responsible for generating energy in the form of ATP through cellular respiration.',
      questionCount: 2,
      questionTypes: ['multiple-choice', 'true-false'],
      difficulty: 'easy'
    };
    
    // const response = await aiService.generateQuestions(request);
    throw new Error('AI service is disabled');
    console.log('Question generation successful!');
    console.log('Generated questions:', JSON.stringify(response, null, 2));
    return true;
  } catch (error) {
    console.error('Error generating questions:', error);
    return false;
  }
}

// Test function to chat with AI
async function testChatWithAI() {
  try {
    console.log('\nTesting chat with AI...');
    const request: ChatRequest = {
      message: 'What is the mitochondria?',
      context: {
        questionSets: [
          {
            id: 1,
            name: 'Biology 101',
            questions: [
              {
                text: 'What is the function of mitochondria?',
                answer: 'Generate energy in the form of ATP'
              }
            ]
          }
        ],
        userLevel: 'beginner'
      }
    };
    
    // const response = await aiService.chat(request);
    throw new Error('AI service is disabled');
    console.log('Chat with AI successful!');
    console.log('AI response:', JSON.stringify(response, null, 2));
    return true;
  } catch (error) {
    console.error('Error chatting with AI:', error);
    return false;
  }
}

// Test function to evaluate an answer
async function testEvaluateAnswer() {
  try {
    console.log('\nTesting answer evaluation...');
    const request: EvaluateAnswerRequest = {
      questionId: 1,
      questionText: 'What is the function of mitochondria?',
      expectedAnswer: 'Generate energy in the form of ATP',
      questionType: 'short-answer',
      userAnswer: 'They produce energy for the cell'
    };
    
    // const response = await aiService.evaluateAnswer(request);
    throw new Error('AI service is disabled');
    console.log('Answer evaluation successful!');
    console.log('Evaluation:', JSON.stringify(response, null, 2));
    return true;
  } catch (error) {
    console.error('Error evaluating answer:', error);
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  console.log('=== AI Service Integration Test ===');
  console.log(`Using AI service at: ${process.env.AI_SERVICE_BASE_URL || 'http://localhost:8000'}`);
  
  // Test service availability
  const isAvailable = await testAIServiceAvailability();
  
  if (isAvailable) {
    // Run other tests only if the service is available
    await testGenerateQuestions();
    await testChatWithAI();
    await testEvaluateAnswer();
  } else {
    console.log('Skipping other tests because AI service is not available');
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});
