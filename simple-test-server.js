const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock authentication middleware
const mockAuth = (req, res, next) => {
  req.user = { userId: 123 };
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'Blueprint-Centric Test Server Running',
    timestamp: new Date().toISOString(),
    workingControllers: [
      'QuestionInstanceController',
      'MasteryCriterionController',
      'EnhancedTodaysTasksController'
    ]
  });
});

// Test endpoints
app.post('/api/question-instance', mockAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      questionText: req.body.questionText,
      answer: req.body.answer,
      masteryCriterionId: req.body.masteryCriterionId,
      userId: req.user.userId,
      createdAt: new Date().toISOString()
    }
  });
});

app.get('/api/question-instance/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: parseInt(req.params.id),
      questionText: 'Sample question',
      answer: 'Sample answer',
      masteryCriterionId: 1
    }
  });
});

app.post('/api/mastery-criterion', mockAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      id: 1,
      title: req.body.title,
      description: req.body.description,
      weight: req.body.weight,
      uueStage: req.body.uueStage,
      masteryThreshold: req.body.masteryThreshold,
      userId: req.user.userId
    }
  });
});

app.get('/api/mastery-criterion/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: parseInt(req.params.id),
      title: 'Sample Criterion',
      description: 'Sample description',
      weight: 1.0,
      uueStage: 'UNDERSTAND',
      masteryThreshold: 0.8
    }
  });
});

app.get('/api/enhanced-todays-tasks', mockAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.user.userId,
      tasks: [
        {
          id: 1,
          title: 'Review Criterion 1',
          type: 'REVIEW',
          priority: 'HIGH',
          estimatedTime: 15
        }
      ],
      totalTasks: 1
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route Not Found',
    message: `Endpoint ${req.method} ${req.originalUrl} does not exist`
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Simple Blueprint-Centric Test Server Started!');
  console.log(`📍 Server running on port ${PORT}`);
  console.log('🔗 Health check: http://localhost:3001/health');
  console.log('📚 Available endpoints:');
  console.log('   - /health');
  console.log('   - /api/question-instance/*');
  console.log('   - /api/mastery-criterion/*');
  console.log('   - /api/enhanced-todays-tasks');
  console.log('✨ System ready for testing!');
});

module.exports = app;






