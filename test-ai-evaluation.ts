import axios from 'axios';

async function testAIEvaluation() {
  try {
    // First, let's try to authenticate with the test user
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Authentication successful');

    // Test the AI evaluation endpoint
    const evaluationResponse = await axios.post(
      'http://localhost:3000/api/ai/evaluate-answer',
      {
        questionContext: 'What is the capital of France?',
        userAnswer: 'Paris',
        context: 'Geography question'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ AI Evaluation successful:');
    console.log(JSON.stringify(evaluationResponse.data, null, 2));

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAIEvaluation(); 