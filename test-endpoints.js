const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Test data
const testData = {
  questionInstance: {
    questionText: 'What is the capital of France?',
    answer: 'Paris',
    explanation: 'Paris is the capital and largest city of France.',
    masteryCriterionId: 1,
    userId: 123,
    difficulty: 'MEDIUM',
    context: 'Geography'
  },
  masteryCriterion: {
    title: 'Test Criterion',
    description: 'A test mastery criterion',
    weight: 1,
    uueStage: 'UNDERSTAND',
    masteryThreshold: 0.8,
    knowledgePrimitiveId: 'primitive_1',
    blueprintSectionId: 'section_1',
    userId: 123,
    complexityScore: 5,
    assessmentType: 'QUESTION_BASED'
  },
  reviewOutcome: {
    criterionId: 1,
    isCorrect: true,
    confidence: 4,
    timeSpent: 30,
    notes: 'Test review'
  },
  taskPriority: {
    priorityOrder: ['task_1', 'task_2'],
    focusAreas: ['core'],
    timeConstraints: { maxTime: 120 }
  }
};

// Test functions
async function testHealthEndpoint() {
  try {
    console.log('🏥 Testing Health Endpoint...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testQuestionInstanceEndpoints() {
  console.log('\n📝 Testing Question Instance Endpoints...');
  
  try {
    // Test create question instance
    console.log('  Creating question instance...');
    const createResponse = await axios.post(`${BASE_URL}/api/question-instance`, testData.questionInstance);
    console.log('  ✅ Create question instance:', createResponse.data.success);
    
    // Test get question instance
    console.log('  Getting question instance...');
    const getResponse = await axios.get(`${BASE_URL}/api/question-instance/1`);
    console.log('  ✅ Get question instance:', getResponse.data.success);
    
    // Test search questions
    console.log('  Searching questions...');
    const searchResponse = await axios.get(`${BASE_URL}/api/question-instance/search?q=capital`);
    console.log('  ✅ Search questions:', searchResponse.data.success);
    
    console.log('  ✅ All Question Instance endpoints working!');
    return true;
  } catch (error) {
    console.error('  ❌ Question Instance test failed:', error.message);
    return false;
  }
}

async function testMasteryCriterionEndpoints() {
  console.log('\n🎯 Testing Mastery Criterion Endpoints...');
  
  try {
    // Test create criterion
    console.log('  Creating mastery criterion...');
    const createResponse = await axios.post(`${BASE_URL}/api/mastery-criterion`, testData.masteryCriterion);
    console.log('  ✅ Create criterion:', createResponse.data.success);
    
    // Test get criteria by UUE stage
    console.log('  Getting criteria by UUE stage...');
    const stageResponse = await axios.get(`${BASE_URL}/api/mastery-criterion/uue-stage/UNDERSTAND`);
    console.log('  ✅ Get criteria by stage:', stageResponse.data.success);
    
    // Test process review
    console.log('  Processing review...');
    const reviewResponse = await axios.post(`${BASE_URL}/api/mastery-criterion/1/review`, testData.reviewOutcome);
    console.log('  ✅ Process review:', reviewResponse.data.success);
    
    console.log('  ✅ All Mastery Criterion endpoints working!');
    return true;
  } catch (error) {
    console.error('  ❌ Mastery Criterion test failed:', error.message);
    return false;
  }
}

async function testEnhancedSpacedRepetitionEndpoints() {
  console.log('\n🔄 Testing Enhanced Spaced Repetition Endpoints...');
  
  try {
    // Test get daily tasks
    console.log('  Getting daily tasks...');
    const tasksResponse = await axios.get(`${BASE_URL}/api/enhanced-spaced-repetition/daily-tasks`);
    console.log('  ✅ Get daily tasks:', tasksResponse.data.success);
    
    // Test get daily summary
    console.log('  Getting daily summary...');
    const summaryResponse = await axios.get(`${BASE_URL}/api/enhanced-spaced-repetition/daily-summary`);
    console.log('  ✅ Get daily summary:', summaryResponse.data.success);
    
    // Test submit review outcome
    console.log('  Submitting review outcome...');
    const reviewResponse = await axios.post(`${BASE_URL}/api/enhanced-spaced-repetition/review-outcome`, testData.reviewOutcome);
    console.log('  ✅ Submit review outcome:', reviewResponse.data.success);
    
    console.log('  ✅ All Enhanced Spaced Repetition endpoints working!');
    return true;
  } catch (error) {
    console.error('  ❌ Enhanced Spaced Repetition test failed:', error.message);
    return false;
  }
}

async function testEnhancedTodaysTasksEndpoints() {
  console.log('\n📅 Testing Enhanced Today\'s Tasks Endpoints...');
  
  try {
    // Test get today's tasks
    console.log('  Getting today\'s tasks...');
    const tasksResponse = await axios.get(`${BASE_URL}/api/enhanced-todays-tasks`);
    console.log('  ✅ Get today\'s tasks:', tasksResponse.data.success);
    
    // Test get capacity analysis
    console.log('  Getting capacity analysis...');
    const capacityResponse = await axios.get(`${BASE_URL}/api/enhanced-todays-tasks/capacity-analysis`);
    console.log('  ✅ Get capacity analysis:', capacityResponse.data.success);
    
    // Test prioritize tasks
    console.log('  Prioritizing tasks...');
    const priorityResponse = await axios.post(`${BASE_URL}/api/enhanced-todays-tasks/prioritize`, testData.taskPriority);
    console.log('  ✅ Prioritize tasks:', priorityResponse.data.success);
    
    console.log('  ✅ All Enhanced Today\'s Tasks endpoints working!');
    return true;
  } catch (error) {
    console.error('  ❌ Enhanced Today\'s Tasks test failed:', error.message);
    return false;
  }
}

// Main test function
async function runAllTests() {
  console.log('🚀 Starting Blueprint-Centric Endpoint Tests...\n');
  
  const results = {
    health: await testHealthEndpoint(),
    questionInstance: await testQuestionInstanceEndpoints(),
    masteryCriterion: await testMasteryCriterionEndpoints(),
    enhancedSpacedRepetition: await testEnhancedSpacedRepetitionEndpoints(),
    enhancedTodaysTasks: await testEnhancedTodaysTasksEndpoints()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n🎯 Overall Result: ${passedTests}/${totalTests} test categories passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All endpoints are working perfectly!');
  } else {
    console.log('⚠️  Some endpoints need attention.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };






