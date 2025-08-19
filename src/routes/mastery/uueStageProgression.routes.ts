import { Router, Request, Response, NextFunction } from 'express';
import { protect, AuthRequest } from '../../middleware/auth.middleware';
import { uueStageProgressionService } from '../../services/mastery/uueStageProgression.service';
import { UueStage } from '@prisma/client';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

/**
 * @swagger
 * /api/uue-stage-progression:
 *   tags: [UUE Stage Progression]
 *   description: UUE stage progression management endpoints
 */

// Helper: validate request
function handleValidation(req: Request, res: Response): boolean {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

// GET /:sectionId/current-stage
router.get(
  '/:sectionId/current-stage',
  [param('sectionId').isInt().withMessage('sectionId must be an integer')],
  async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
    if (!handleValidation(req, res)) return;
    try {
      const userId = req.user!.userId;
      const sectionId = parseInt(req.params.sectionId, 10);
      const currentStage = await uueStageProgressionService.getCurrentStage(userId, sectionId);
      res.json({ sectionId, currentStage });
    } catch (err) {
      res.status(500).json({ message: 'Failed to get current stage', error: err instanceof Error ? err.message : String(err) });
    }
  }
);

// GET /:sectionId/can-progress?currentStage=UNDERSTAND|USE|EXPLORE
router.get(
  '/:sectionId/can-progress',
  [
    param('sectionId').isInt().withMessage('sectionId must be an integer'),
    query('currentStage')
      .isIn(['UNDERSTAND', 'USE', 'EXPLORE'])
      .withMessage('currentStage must be one of UNDERSTAND, USE, EXPLORE'),
  ],
  async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
    if (!handleValidation(req, res)) return;
    try {
      const userId = req.user!.userId;
      const sectionId = parseInt(req.params.sectionId, 10);
      const currentStage = req.query.currentStage as UueStage;
      const result = await uueStageProgressionService.canProgressToNextUueStage(userId, sectionId, currentStage);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: 'Failed to evaluate progression', error: err instanceof Error ? err.message : String(err) });
    }
  }
);

// POST /:sectionId/unlock-next-stage { currentStage }
router.post(
  '/:sectionId/unlock-next-stage',
  [
    param('sectionId').isInt().withMessage('sectionId must be an integer'),
    body('currentStage')
      .isIn(['UNDERSTAND', 'USE', 'EXPLORE'])
      .withMessage('currentStage must be one of UNDERSTAND, USE, EXPLORE'),
  ],
  async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
    if (!handleValidation(req, res)) return;
    try {
      const userId = req.user!.userId;
      const sectionId = parseInt(req.params.sectionId, 10);
      const currentStage = req.body.currentStage as UueStage;
      const result = await uueStageProgressionService.unlockNextStage(userId, sectionId, currentStage);
      if (!result) {
        res.status(400).json({ message: 'Prerequisites not met or no next stage available' });
        return;
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: 'Failed to unlock next stage', error: err instanceof Error ? err.message : String(err) });
    }
  }
);

// GET /:sectionId/learning-path
router.get(
  '/:sectionId/learning-path',
  [param('sectionId').isInt().withMessage('sectionId must be an integer')],
  async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
    if (!handleValidation(req, res)) return;
    try {
      const userId = req.user!.userId;
      const sectionId = parseInt(req.params.sectionId, 10);
      const result = await uueStageProgressionService.getLearningPath(userId, sectionId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get learning path', error: err instanceof Error ? err.message : String(err) });
    }
  }
);

// GET /:sectionId/stats
router.get(
  '/:sectionId/stats',
  [param('sectionId').isInt().withMessage('sectionId must be an integer')],
  async (req: AuthRequest, res: Response, _next: NextFunction): Promise<void> => {
    if (!handleValidation(req, res)) return;
    try {
      const userId = req.user!.userId;
      const sectionId = parseInt(req.params.sectionId, 10);
      const result = await uueStageProgressionService.getStageCompletionStats(userId, sectionId);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: 'Failed to get stage stats', error: err instanceof Error ? err.message : String(err) });
    }
  }
);

export default router;
