import { Router } from 'express';
import LearningBlueprintsController from '../controllers/learning-blueprints.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Create controller instance
const learningBlueprintsController = new LearningBlueprintsController();

// Test route to verify router is loaded
router.get('/test', (req, res) => {
  res.json({ message: 'Blueprints router is working!', timestamp: new Date().toISOString() });
});

// List all learning blueprints for the authenticated user
router.get('/', protect, learningBlueprintsController.getAllLearningBlueprints);

// Create a new learning blueprint
router.post('/', protect, learningBlueprintsController.createLearningBlueprint);

// Mindmap Endpoints (alias path expected by frontend)
router.get('/:id/mindmap', protect, learningBlueprintsController.getBlueprintMindmap);
router.put('/:id/mindmap', protect, learningBlueprintsController.updateBlueprintMindmap);

// Mindmap Statistics and Performance Monitoring
router.get('/:id/mindmap/stats', protect, learningBlueprintsController.getMindmapStats);
router.delete('/:id/mindmap/cache', protect, learningBlueprintsController.clearMindmapCache);

// General Service Statistics (not tied to specific blueprint)
router.get('/mindmap/service-stats', protect, learningBlueprintsController.getMindmapServiceStats);

// Generate content from blueprints
router.post('/:id/question-sets', protect, learningBlueprintsController.generateQuestionsFromBlueprint);
router.post('/:id/notes', protect, learningBlueprintsController.generateNoteFromBlueprint);

// AI API Status Management
router.get('/:id/indexing-status', protect, learningBlueprintsController.getBlueprintIndexingStatus);
router.post('/:id/reindex', protect, learningBlueprintsController.reindexBlueprint);

// Additional Blueprint Endpoints
router.get('/:id', protect, learningBlueprintsController.getLearningBlueprintById);
router.put('/:id', protect, learningBlueprintsController.updateLearningBlueprint);
router.delete('/:id', protect, learningBlueprintsController.deleteLearningBlueprint);

export default router;


