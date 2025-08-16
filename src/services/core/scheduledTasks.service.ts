import cron from 'node-cron';
import { summaryMaintenanceService } from './summaryMaintenance.service';
import { cachedPrimitiveService } from '../mastery/cachedPrimitiveSR.service';

class ScheduledTasksService {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  startScheduledTasks(): void {
    console.log('Starting scheduled tasks for primitive SR system...');

    // Daily summary maintenance at 2 AM
    const dailyMaintenanceTask = cron.schedule('0 2 * * *', async () => {
      console.log('Running daily summary maintenance...');
      try {
        await summaryMaintenanceService.performDailySummaryMaintenance();
        console.log('Daily summary maintenance completed successfully');
      } catch (error) {
        console.error('Daily summary maintenance failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Stale data cleanup every Sunday at 3 AM
    const weeklyCleanupTask = cron.schedule('0 3 * * 0', async () => {
      console.log('Running weekly stale data cleanup...');
      try {
        await summaryMaintenanceService.cleanupStaleData();
        console.log('Weekly cleanup completed successfully');
      } catch (error) {
        console.error('Weekly cleanup failed:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Cache statistics logging every hour
    const cacheStatsTask = cron.schedule('0 * * * *', async () => {
      try {
        const stats = cachedPrimitiveService.getCacheStats();
        const summaryStats = await summaryMaintenanceService.getSummaryStats();
        
        console.log('Cache Statistics:', {
          cacheKeys: stats.keys,
          cacheHits: stats.hits,
          cacheMisses: stats.misses,
          hitRate: stats.hits > 0 ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2) + '%' : '0%',
          totalSummaries: summaryStats.totalSummaries,
          recentlyUpdated: summaryStats.recentlyUpdated,
          staleCount: summaryStats.staleCount,
          avgMastery: summaryStats.averageWeightedMastery.toFixed(3)
        });
      } catch (error) {
        console.error('Failed to log cache statistics:', error);
      }
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Cache cleanup every 6 hours (remove expired entries)
    const cacheCleanupTask = cron.schedule('0 */6 * * *', () => {
      console.log('Performing cache cleanup...');
      // NodeCache automatically handles TTL expiration, but we can log stats
      const stats = cachedPrimitiveService.getCacheStats();
      console.log(`Cache cleanup: ${stats.keys} keys remaining`);
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Store tasks for management
    this.tasks.set('dailyMaintenance', dailyMaintenanceTask);
    this.tasks.set('weeklyCleanup', weeklyCleanupTask);
    this.tasks.set('cacheStats', cacheStatsTask);
    this.tasks.set('cacheCleanup', cacheCleanupTask);

    // Start all tasks
    dailyMaintenanceTask.start();
    weeklyCleanupTask.start();
    cacheStatsTask.start();
    cacheCleanupTask.start();

    console.log('All scheduled tasks started successfully');
  }

  stopScheduledTasks(): void {
    console.log('Stopping scheduled tasks...');
    
    this.tasks.forEach((task, name) => {
      task.stop();
      console.log(`Stopped task: ${name}`);
    });

    this.tasks.clear();
    console.log('All scheduled tasks stopped');
  }

  getTaskStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {};
    
    this.tasks.forEach((task, name) => {
      status[name] = task.getStatus() === 'scheduled';
    });

    return status;
  }

  restartTask(taskName: string): boolean {
    const task = this.tasks.get(taskName);
    if (task) {
      task.stop();
      task.start();
      console.log(`Restarted task: ${taskName}`);
      return true;
    }
    return false;
  }

  // Manual trigger functions for testing
  async triggerDailyMaintenance(): Promise<void> {
    console.log('Manually triggering daily maintenance...');
    await summaryMaintenanceService.performDailySummaryMaintenance();
  }

  async triggerWeeklyCleanup(): Promise<void> {
    console.log('Manually triggering weekly cleanup...');
    await summaryMaintenanceService.cleanupStaleData();
  }

  async triggerFullMaintenance(): Promise<void> {
    console.log('Manually triggering full maintenance...');
    await this.triggerDailyMaintenance();
    await this.triggerWeeklyCleanup();
    cachedPrimitiveService.clearCache();
    console.log('Full maintenance completed');
  }
}

// Export singleton instance
export const scheduledTasksService = new ScheduledTasksService();

// Graceful shutdown handler
process.on('SIGINT', () => {
  console.log('Received SIGINT, stopping scheduled tasks...');
  scheduledTasksService.stopScheduledTasks();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, stopping scheduled tasks...');
  scheduledTasksService.stopScheduledTasks();
  process.exit(0);
});
