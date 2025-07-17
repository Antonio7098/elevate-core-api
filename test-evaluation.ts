import axios from 'axios';

async function testEvaluation() {
  try {
    // First authenticate
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Authentication successful');

    // Test the evaluation endpoint
    const evaluationResponse = await axios.post(
      'http://localhost:3000/api/ai/evaluate-answer',
      {
        questionId: 1308,
        userAnswer: "The First Law of Thermodynamics states that energy cannot be created or destroyed, only transformed from one form to another."
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Evaluation successful:');
    console.log(JSON.stringify(evaluationResponse.data, null, 2));

  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testEvaluation(); 