import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { onUserPreferencesChanged } from '../services/summaryMaintenance.service';

const prisma = new PrismaClient();

// GET /api/user/bucket-preferences
export async function getBucketPreferences(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    let preferences = await prisma.userBucketPreferences.findUnique({
      where: { userId }
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await prisma.userBucketPreferences.create({
        data: {
          userId,
          criticalSize: 10,
          coreSize: 15,
          plusSize: 5,
          addMoreIncrement: 5,
          maxDailyLimit: 50,
          masteryThresholdLevel: 'PROFICIENT'
        }
      });
    }

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    console.error('Error fetching bucket preferences:', error);
    res.status(500).json({ error: 'Failed to fetch bucket preferences' });
  }
}

// PATCH /api/user/bucket-preferences
export async function updateBucketPreferences(req: Request, res: Response) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const {
      criticalSize,
      coreSize,
      plusSize,
      addMoreIncrement,
      maxDailyLimit,
      masteryThresholdLevel
    } = req.body;

    // Validate inputs
    if (criticalSize !== undefined && (criticalSize < 1 || criticalSize > 50)) {
      return res.status(400).json({ error: 'criticalSize must be between 1 and 50' });
    }
    if (coreSize !== undefined && (coreSize < 1 || coreSize > 50)) {
      return res.status(400).json({ error: 'coreSize must be between 1 and 50' });
    }
    if (plusSize !== undefined && (plusSize < 1 || plusSize > 50)) {
      return res.status(400).json({ error: 'plusSize must be between 1 and 50' });
    }
    if (maxDailyLimit !== undefined && (maxDailyLimit < 10 || maxDailyLimit > 200)) {
      return res.status(400).json({ error: 'maxDailyLimit must be between 10 and 200' });
    }
    if (masteryThresholdLevel !== undefined && !['SURVEY', 'PROFICIENT', 'EXPERT'].includes(masteryThresholdLevel)) {
      return res.status(400).json({ error: 'masteryThresholdLevel must be SURVEY, PROFICIENT, or EXPERT' });
    }

    const updateData: any = {};
    if (criticalSize !== undefined) updateData.criticalSize = criticalSize;
    if (coreSize !== undefined) updateData.coreSize = coreSize;
    if (plusSize !== undefined) updateData.plusSize = plusSize;
    if (addMoreIncrement !== undefined) updateData.addMoreIncrement = addMoreIncrement;
    if (maxDailyLimit !== undefined) updateData.maxDailyLimit = maxDailyLimit;
    if (masteryThresholdLevel !== undefined) updateData.masteryThresholdLevel = masteryThresholdLevel;

    const preferences = await prisma.userBucketPreferences.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        criticalSize: criticalSize ?? 10,
        coreSize: coreSize ?? 15,
        plusSize: plusSize ?? 5,
        addMoreIncrement: addMoreIncrement ?? 5,
        maxDailyLimit: maxDailyLimit ?? 50,
        masteryThresholdLevel: masteryThresholdLevel ?? 'PROFICIENT'
      }
    });

    // Trigger cache invalidation and summary refresh
    await onUserPreferencesChanged(userId);

    res.json({
      success: true,
      data: preferences,
      message: 'Bucket preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating bucket preferences:', error);
    res.status(500).json({ error: 'Failed to update bucket preferences' });
  }
}
