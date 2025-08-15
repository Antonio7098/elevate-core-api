const express = require('express');
const cors = require('cors');
const { questionInstanceController } = require('./src/controllers/blueprint-centric/questionInstance.controller');
const { masteryCriterionController } = require('./src/controllers/blueprint-centric/masteryCriterion.controller');
const { enhancedSpacedRepetitionController } = require('./src/controllers/blueprint-centric/enhancedSpacedRepetition.controller');
const { enhancedTodaysTasksController } = require('./src/controllers/blueprint-centric/enhancedTodaysTasks.controller');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock authentication middleware for testing
const mockAuth = (req, res, next) => {
  req.user = { userId: 123 }; // Mock user for testing
  next();
};

// ============================================================================
// BLUEPRINT-CENTRIC ROUTES ONLY
// ============================================================================

// Question Instance Routes
app.post('/api/question-instance', mockAuth, questionInstanceController.createQuestionInstance);
app.get('/api/question-instance/:id', questionInstanceController.getQuestionInstance);
app.post('/api/question-instance/:id/attempt', mockAuth, questionInstanceController.recordQuestionAttempt);
app.get('/api/question-instance/criterion/:criterionId', questionInstanceController.getQuestionsByCriterion);
app.get('/api/question-instance/search', questionInstanceController.searchQuestionInstances);
app.get('/api/question-instance/recommendations', mockAuth, questionInstanceController.getQuestionRecommendations);
app.get('/api/question-instance/user/:userId/stats', mockAuth, questionInstanceController.getUserQuestionStats);
app.post('/api/question-instance/batch-attempt', mockAuth, questionInstanceController.recordBatchAttempts);

// Mastery Criterion Routes
app.post('/api/mastery-criterion', mockAuth, masteryCriterionController.createCriterion);
app.get('/api/mastery-criterion/:id', masteryCriterionController.getCriterion);
app.put('/api/mastery-criterion/:id', masteryCriterionController.updateCriterion);
app.delete('/api/mastery-criterion/:id', masteryCriterionController.deleteCriterion);
app.get('/api/mastery-criterion/section/:sectionId', masteryCriterionController.getCriteriaBySection);
app.get('/api/mastery-criterion/uue-stage/:stage', masteryCriterionController.getCriteriaByUueStage);
app.post('/api/mastery-criterion/:id/review', mockAuth, masteryCriterionController.processCriterionReview);
app.get('/api/mastery-criterion/:id/mastery-progress', mockAuth, masteryCriterionController.getCriterionMasteryProgress);
app.put('/api/mastery-criterion/:id/mastery-threshold', mockAuth, masteryCriterionController.updateMasteryThreshold);
app.get('/api/mastery-criterion/section/:sectionId/uue-progress', mockAuth, masteryCriterionController.getSectionUueProgress);
app.get('/api/mastery-criterion/user/:userId/mastery-stats', mockAuth, masteryCriterionController.getUserMasteryStats);

// Enhanced Spaced Repetition Routes
app.get('/api/enhanced-spaced-repetition/daily-tasks', mockAuth, enhancedSpacedRepetitionController.getDailyTasks);
app.get('/api/enhanced-spaced-repetition/daily-summary', mockAuth, enhancedSpacedRepetitionController.getDailySummary);
app.post('/api/enhanced-spaced-repetition/review-outcome', mockAuth, enhancedSpacedRepetitionController.submitReviewOutcome);
app.post('/api/enhanced-spaced-repetition/batch-review-outcomes', mockAuth, enhancedSpacedRepetitionController.submitBatchReviewOutcomes);
app.get('/api/enhanced-spaced-repetition/mastery-progress/:criterionId', mockAuth, enhancedSpacedRepetitionController.getMasteryProgress);
app.put('/api/enhanced-spaced-repetition/tracking-intensity', mockAuth, enhancedSpacedRepetitionController.updateTrackingIntensity);
app.get('/api/enhanced-spaced-repetition/mastery-stats', mockAuth, enhancedSpacedRepetitionController.getMasteryStats);

// Enhanced Today's Tasks Routes
app.get('/api/enhanced-todays-tasks', mockAuth, enhancedTodaysTasksController.getTodaysTasks);
app.get('/api/enhanced-todays-tasks/capacity-analysis', mockAuth, enhancedTodaysTasksController.getCapacityAnalysis);
app.post('/api/enhanced-todays-tasks/prioritize', mockAuth, enhancedTodaysTasksController.prioritizeTasks);
app.get('/api/enhanced-todays-tasks/progress', mockAuth, enhancedTodaysTasksController.getTaskProgress);
app.get('/api/enhanced-todays-tasks/recommendations', mockAuth, enhancedTodaysTasksController.getTaskRecommendations);
app.post('/api/enhanced-todays-tasks/:taskId/complete', mockAuth, enhancedTodaysTasksController.completeTask);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'Blueprint-Centric Test Server Running',
    timestamp: new Date().toISOString(),
    endpoints: {
      questionInstance: 8,
      masteryCriterion: 12,
      enhancedSpacedRepetition: 7,
      enhancedTodaysTasks: 6
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error', 
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route Not Found', 
    message: `Endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      '/health',
      '/api/question-instance/*',
      '/api/mastery-criterion/*',
      '/api/enhanced-spaced-repetition/*',
      '/api/enhanced-todays-tasks/*'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Blueprint-Centric Test Server Started!');
  console.log(`📍 Server running on port ${PORT}`);
  console.log('🔗 Health check: http://localhost:3001/health');
  console.log('📚 Available endpoints:');
  console.log('   - Question Instance: 8 endpoints');
  console.log('   - Mastery Criterion: 12 endpoints');
  console.log('   - Enhanced Spaced Repetition: 7 endpoints');
  console.log('   - Enhanced Today\'s Tasks: 6 endpoints');
  console.log('✨ Total: 33 blueprint-centric endpoints ready for testing!');
});

module.exports = app;






