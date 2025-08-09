import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { PremiumLearningPathController } from '../controllers/premiumLearningPath.controller';
import { PremiumAnalyticsController } from '../controllers/premiumAnalytics.controller';
import { PremiumSearchController } from '../controllers/premiumSearch.controller';

const router = Router();
const learningPathController = new PremiumLearningPathController();
const analyticsController = new PremiumAnalyticsController();
const searchController = new PremiumSearchController();

// Apply authentication middleware to all premium routes
router.use(protect);

// Learning Path Routes
router.post('/learning-paths', learningPathController.createLearningPath.bind(learningPathController));
router.get('/learning-paths', learningPathController.getUserLearningPaths.bind(learningPathController));
router.get('/learning-paths/:id', learningPathController.getLearningPath.bind(learningPathController));
router.put('/learning-paths/:pathId/steps/:stepId', learningPathController.updateLearningPathStep.bind(learningPathController));
router.post('/learning-paths/:pathId/steps', learningPathController.addStepToLearningPath.bind(learningPathController));
router.delete('/learning-paths/:id', learningPathController.deleteLearningPath.bind(learningPathController));

// Analytics Routes
router.get('/analytics/learning', analyticsController.getLearningAnalytics.bind(analyticsController));
router.get('/analytics/memory-insights', analyticsController.getMemoryInsights.bind(analyticsController));
router.get('/analytics/knowledge-graph', analyticsController.getKnowledgeGraph.bind(analyticsController));
router.post('/analytics/memory-insights', analyticsController.createMemoryInsight.bind(analyticsController));
router.post('/analytics/daily', analyticsController.updateDailyAnalytics.bind(analyticsController));

// Search Routes
router.get('/search/similar-concepts', searchController.searchSimilarConcepts.bind(searchController));
router.get('/search/complexity', searchController.searchByComplexityLevel.bind(searchController));
router.get('/search/prerequisites/:primitiveId', searchController.getPrerequisitesForConcept.bind(searchController));
router.get('/search/related/:primitiveId', searchController.getRelatedConcepts.bind(searchController));

export default router;
