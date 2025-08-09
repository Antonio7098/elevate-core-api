import { Request, Response } from 'express';
import { cachedPrimitiveService } from '../services/cachedPrimitiveSR.service';
import { summaryMaintenanceService } from '../services/summaryMaintenance.service';

// GET /api/cache/stats
export async function getCacheStats(req: Request, res: Response) {
  try {
    const cacheStats = cachedPrimitiveService.getCacheStats();
    const summaryStats = await summaryMaintenanceService.getSummaryStats();

    res.json({
      success: true,
      data: {
        cache: cacheStats,
        summaries: summaryStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching cache stats:', error);
    res.status(500).json({ error: 'Failed to fetch cache stats' });
  }
}

// POST /api/cache/clear
export async function clearCache(req: Request, res: Response) {
  try {
    const { userId } = req.body;

    if (userId) {
      // Clear cache for specific user
      cachedPrimitiveService.invalidateUserCache(userId);
      res.json({
        success: true,
        message: `Cache cleared for user ${userId}`
      });
    } else {
      // Clear all cache
      cachedPrimitiveService.clearCache();
      res.json({
        success: true,
        message: 'All cache cleared'
      });
    }
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
}

// POST /api/cache/refresh-summaries
export async function refreshSummaries(req: Request, res: Response) {
  try {
    const { userId, userIds } = req.body;

    if (userId) {
      // Refresh summaries for specific user
      await summaryMaintenanceService.updateAllUserSummaries(userId);
      res.json({
        success: true,
        message: `Summaries refreshed for user ${userId}`
      });
    } else if (userIds && Array.isArray(userIds)) {
      // Refresh summaries for multiple users
      await summaryMaintenanceService.batchUpdateSummaries(userIds);
      res.json({
        success: true,
        message: `Summaries refreshed for ${userIds.length} users`
      });
    } else {
      res.status(400).json({
        error: 'Either userId or userIds array is required'
      });
    }
  } catch (error) {
    console.error('Error refreshing summaries:', error);
    res.status(500).json({ error: 'Failed to refresh summaries' });
  }
}

// POST /api/cache/maintenance
export async function performMaintenance(req: Request, res: Response) {
  try {
    const { type } = req.body;

    switch (type) {
      case 'daily':
        await summaryMaintenanceService.performDailySummaryMaintenance();
        res.json({
          success: true,
          message: 'Daily summary maintenance completed'
        });
        break;

      case 'cleanup':
        await summaryMaintenanceService.cleanupStaleData();
        res.json({
          success: true,
          message: 'Stale data cleanup completed'
        });
        break;

      case 'full':
        await summaryMaintenanceService.performDailySummaryMaintenance();
        await summaryMaintenanceService.cleanupStaleData();
        cachedPrimitiveService.clearCache();
        res.json({
          success: true,
          message: 'Full maintenance completed (summaries updated, stale data cleaned, cache cleared)'
        });
        break;

      default:
        res.status(400).json({
          error: 'Invalid maintenance type. Use: daily, cleanup, or full'
        });
    }
  } catch (error) {
    console.error('Error performing maintenance:', error);
    res.status(500).json({ error: 'Failed to perform maintenance' });
  }
}
