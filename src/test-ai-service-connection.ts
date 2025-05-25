/**
 * Test script for AI Service Connection
 * 
 * This script tests the connection between the Core API and the Python Flask service.
 */

import dotenv from 'dotenv';
import { aiService } from './services/aiService';
import { GenerateQuestionsRequest, ChatRequest, EvaluateAnswerRequest } from './types/ai-service.types';

// Load environment variables
dotenv.config();

async function testAIServiceConnection() {
  console.log('=== AI Service Connection Test ===');
  
  try {
    // Test 1: Check if the AI service is available
    console.log('\n1. Testing AI service availability...');
    const isAvailable = await aiService.isAvailable();
    console.log(`AI service is ${isAvailable ? 'available' : 'not available'}`);
    
    if (!isAvailable) {
      console.log('Skipping remaining tests as the AI service is not available.');
      return;
    }
    
    // Test 2: Generate questions
    console.log('\n2. Testing question generation...');
    const generateRequest: GenerateQuestionsRequest = {
      sourceText: 'The mitochondria is the powerhouse of the cell. It is responsible for generating energy in the form of ATP through cellular respiration.',
      questionCount: 2,
      questionTypes: ['multiple-choice', 'true-false'],
      difficulty: 'easy'
    };
    
    const generateResponse = await aiService.generateQuestions(generateRequest);
    console.log('Question generation successful!');
    console.log('Generated questions:', JSON.stringify(generateResponse, null, 2));
    
    // Test 3: Chat with AI
    console.log('\n3. Testing chat with AI...');
    const chatRequest: ChatRequest = {
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
    
    const chatResponse = await aiService.chat(chatRequest);
    console.log('Chat with AI successful!');
    console.log('AI response:', JSON.stringify(chatResponse, null, 2));
    
    // Test 4: Evaluate answer
    console.log('\n4. Testing answer evaluation...');
    const evaluateRequest: EvaluateAnswerRequest = {
      questionId: 1,
      questionText: 'What is the function of mitochondria?',
      expectedAnswer: 'Generate energy in the form of ATP',
      questionType: 'short-answer',
      userAnswer: 'They produce energy for the cell'
    };
    
    const evaluateResponse = await aiService.evaluateAnswer(evaluateRequest);
    console.log('Answer evaluation successful!');
    console.log('Evaluation:', JSON.stringify(evaluateResponse, null, 2));
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

// Run the test
testAIServiceConnection().catch(error => {
  console.error('Unhandled error:', error);
});
