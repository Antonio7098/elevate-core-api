import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PremiumLearningPathController {
  async createLearningPath(req: Request, res: Response): Promise<void> {
    try {
      const { pathName, description, targetMasteryLevel, estimatedDurationDays } = req.body;
      const userId = (req as any).user.userId;

      const learningPath = await prisma.learningPath.create({
        data: {
          userId,
          pathName,
          description,
          targetMasteryLevel,
          estimatedDurationDays,
        },
        include: {
          pathSteps: true,
        },
      });

      res.status(201).json(learningPath);
    } catch (error) {
      console.error('Error creating learning path:', error);
      res.status(500).json({ error: 'Failed to create learning path' });
    }
  }

  async getLearningPath(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      const learningPath = await prisma.learningPath.findFirst({
        where: {
          id: parseInt(id),
          userId,
        },
        include: {
          pathSteps: {
            include: {
              knowledgePrimitive: true,
            },
            orderBy: {
              stepOrder: 'asc',
            },
          },
        },
      });

      if (!learningPath) {
        res.status(404).json({ error: 'Learning path not found' });
        return;
      }

      res.status(200).json(learningPath);
    } catch (error) {
      console.error('Error getting learning path:', error);
      res.status(500).json({ error: 'Failed to get learning path' });
    }
  }

  async getUserLearningPaths(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.userId;

      const learningPaths = await prisma.learningPath.findMany({
        where: {
          userId,
        },
        include: {
          pathSteps: {
            include: {
              knowledgePrimitive: true,
            },
            orderBy: {
              stepOrder: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      res.status(200).json(learningPaths);
    } catch (error) {
      console.error('Error getting user learning paths:', error);
      res.status(500).json({ error: 'Failed to get learning paths' });
    }
  }

  async updateLearningPathStep(req: Request, res: Response): Promise<void> {
    try {
      const { stepId } = req.params;
      const { isCompleted } = req.body;

      const step = await prisma.learningPathStep.update({
        where: {
          id: parseInt(stepId),
        },
        data: {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        },
        include: {
          knowledgePrimitive: true,
          learningPath: true,
        },
      });

      res.status(200).json(step);
    } catch (error) {
      console.error('Error updating learning path step:', error);
      res.status(500).json({ error: 'Failed to update learning path step' });
    }
  }

  async addStepToLearningPath(req: Request, res: Response): Promise<void> {
    try {
      const { pathId } = req.params;
      const { primitiveId, estimatedTimeMinutes } = req.body;

      // Get the next step order
      const lastStep = await prisma.learningPathStep.findFirst({
        where: {
          learningPathId: parseInt(pathId),
        },
        orderBy: {
          stepOrder: 'desc',
        },
      });

      const nextOrder = (lastStep?.stepOrder || 0) + 1;

      const step = await prisma.learningPathStep.create({
        data: {
          learningPathId: parseInt(pathId),
          primitiveId,
          stepOrder: nextOrder,
          estimatedTimeMinutes,
        },
        include: {
          knowledgePrimitive: true,
        },
      });

      res.status(201).json(step);
    } catch (error) {
      console.error('Error adding step to learning path:', error);
      res.status(500).json({ error: 'Failed to add step to learning path' });
    }
  }

  async deleteLearningPath(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user.userId;

      await prisma.learningPath.deleteMany({
        where: {
          id: parseInt(id),
          userId,
        },
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting learning path:', error);
      res.status(500).json({ error: 'Failed to delete learning path' });
    }
  }
}
