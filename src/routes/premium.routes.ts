import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { 
  createLearningPath,
  getLearningPath,
  updateLearningPath,
  deleteLearningPath,
  getLearningPathStep,
  updateLearningPathStep
} from '../controllers/premiumLearningPath.controller';
import { 
  getAnalytics,
  getLearningInsights,
  getProgressMetrics
} from '../controllers/premiumAnalytics.controller';
import { 
  searchPrimitives,
  searchByMasteryLevel,
  searchByDifficulty,
  searchByConceptTags,
  searchByPrerequisites
} from '../controllers/premiumSearch.controller';

const router = Router();

// Apply authentication middleware to all premium routes
router.use(protect);

// Learning Path Routes
router.post('/learning-paths', createLearningPath);
router.get('/learning-paths', getLearningPath);
router.get('/learning-paths/:id', getLearningPath);
router.put('/learning-paths/:pathId/steps/:stepId', updateLearningPathStep);
router.post('/learning-paths/:pathId/steps', getLearningPathStep);
router.delete('/learning-paths/:id', deleteLearningPath);

// Analytics Routes
router.get('/analytics/learning', getAnalytics);
router.get('/analytics/memory-insights', getLearningInsights);
router.get('/analytics/knowledge-graph', getProgressMetrics);
router.post('/analytics/memory-insights', getAnalytics);
router.post('/analytics/daily', getProgressMetrics);

// Search Routes
router.get('/search/similar-concepts', searchPrimitives);
router.get('/search/complexity', searchByDifficulty);
router.get('/search/prerequisites/:primitiveId', searchByPrerequisites);
router.get('/search/related/:primitiveId', searchByConceptTags);

export default router;
