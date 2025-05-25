// Simple test script for the AI question generation endpoint
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000/api';
const TEST_USER = {
  email: 'aitest@example.com',
  password: 'password123'
};
const TEST_FOLDER = {
  name: 'AI Test Folder',
  description: 'Folder for testing AI question generation'
};
const SOURCE_TEXT = `
The water cycle, also known as the hydrologic cycle, describes the continuous movement of water on, above, and below the surface of the Earth. 
Water can change states among liquid, vapor, and ice at various places in the water cycle. 
Although the balance of water on Earth remains fairly constant over time, individual water molecules can come and go.
The water moves from one reservoir to another, such as from river to ocean, or from the ocean to the atmosphere, by the physical processes of evaporation, condensation, precipitation, infiltration, surface runoff, and subsurface flow.
In doing so, the water goes through different forms: liquid, solid (ice) and vapor.
`;

// Main function to run the test
async function runTest() {
  try {
    console.log('Starting AI endpoint test...');
    
    // Step 1: Register or login
    let token;
    try {
      // Try to register first
      const registerResponse = await axios.post(`${API_URL}/auth/register`, TEST_USER);
      token = registerResponse.data.token;
      console.log('Registered new test user');
    } catch (error) {
      // If registration fails (likely because user already exists), try login
      const loginResponse = await axios.post(`${API_URL}/auth/login`, TEST_USER);
      token = loginResponse.data.token;
      console.log('Logged in with existing test user');
    }
    
    // Step 2: Create a test folder
    const folderResponse = await axios.post(
      `${API_URL}/folders`,
      TEST_FOLDER,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const folderId = folderResponse.data.id;
    console.log(`Created test folder with ID: ${folderId}`);
    
    // Step 3: Call the AI endpoint
    const aiResponse = await axios.post(
      `${API_URL}/ai/generate-from-source`,
      {
        sourceText: SOURCE_TEXT,
        folderId: folderId,
        questionCount: 5
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Step 4: Display results
    console.log('\nAI Question Generation Results:');
    console.log(`Question Set: ${aiResponse.data.questionSet.name}`);
    console.log(`Generated ${aiResponse.data.questionSet.questions.length} questions:`);
    
    aiResponse.data.questionSet.questions.forEach((question, index) => {
      console.log(`\nQuestion ${index + 1}: ${question.text}`);
      console.log(`Answer: ${question.answer}`);
      console.log(`Type: ${question.questionType}`);
      if (question.options && question.options.length > 0) {
        console.log('Options:');
        question.options.forEach((option, i) => {
          console.log(`  ${String.fromCharCode(65 + i)}. ${option}`);
        });
      }
    });
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed with error:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`Status: ${error.response.status}`);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
  }
}

// Run the test
runTest();
