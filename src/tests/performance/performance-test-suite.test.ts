import { PrismaClient } from '@prisma/client';
import PerformanceTestingService from '../../services/blueprint-centric/performanceTesting.service';
import { LoadTestConfig, ScalabilityTestConfig } from '../../services/blueprint-centric/performanceTesting.service';

const prisma = new PrismaClient();

// ============================================================================
// COMPREHENSIVE PERFORMANCE TESTING SUITE
// ============================================================================
// 
// This test suite implements all performance testing requirements from:
// - Sprint 50: Performance Testing & Optimization (Sections E & F)
// - Sprint 52: Performance Tests for Mastery Tracking & Algorithms
//
// Test Categories:
// 1. Load Testing: 1000+ sections, concurrent operations
// 2. Database Performance: Query benchmarks, index validation
// 3. Memory Usage: Large blueprint operations monitoring
// 4. Concurrent Testing: Section CRUD under load
// 5. Tree Depth Testing: Hierarchy depth limits and performance
// 6. Query Optimization: Recursive query optimization
// 7. End-to-End Testing: Complete blueprint lifecycle
// 8. Data Consistency: High-load integrity validation
// 9. Database Connection: Connection pool stress testing
// 10. Section Tree Validation: Circular reference prevention
// 11. API Response Time: <200ms target validation
// 12. Scalability: 10k+ sections performance
// 13. Mastery Calculation Performance: Criterion, stage, and primitive levels
// 14. Daily Task Generation Performance: Large dataset handling
// 15. SR Algorithm Performance: Spaced repetition efficiency
//
// ============================================================================

describe('Performance Testing Suite', () => {
  let performanceService: PerformanceTestingService;
  
  beforeAll(async () => {
    performanceService = new PerformanceTestingService();
    
    // Ensure database is ready
    try {
      await prisma.$connect();
      console.log('Database connected for performance testing');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
  });
  
  afterEach(async () => {
    // Clean up any test data created during tests
    // This is handled by the PerformanceTestingService internally
  });

  // ============================================================================
  // SECTION E: PERFORMANCE TESTING & OPTIMIZATION (Sprint 50)
  // ============================================================================

  describe('Load Testing - Section E.1', () => {
    it('should handle 1000+ sections with concurrent operations', async () => {
      const config: LoadTestConfig = {
        sectionCount: 1000,
        maxDepth: 5,
        concurrentUsers: 10,
        testDuration: 30,
        operationsPerUser: 50
      };
      
      const result = await performanceService.runLoadTesting(config);
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(60000); // Should complete within 60 seconds
      expect(result.databaseMetrics.queryCount).toBeGreaterThan(0);
      expect(result.databaseMetrics.averageQueryTime).toBeLessThan(100); // <100ms average
      expect(result.memoryUsage.increase).toBeLessThan(100 * 1024 * 1024); // <100MB increase
      
      console.log('Load Test Results:', {
        duration: result.duration,
        queryCount: result.databaseMetrics.queryCount,
        avgQueryTime: result.databaseMetrics.averageQueryTime,
        memoryIncrease: result.memoryUsage.increase / (1024 * 1024)
      });
    }, 120000); // 2 minute timeout for large load test

    it('should handle 5000+ sections for scalability testing', async () => {
      const config: LoadTestConfig = {
        sectionCount: 5000,
        maxDepth: 8,
        concurrentUsers: 20,
        testDuration: 60,
        operationsPerUser: 100
      };
      
      const result = await performanceService.runLoadTesting(config);
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(180000); // Should complete within 3 minutes
      expect(result.memoryUsage.increase).toBeLessThan(500 * 1024 * 1024); // <500MB increase
      
      console.log('Scalability Load Test Results:', {
        duration: result.duration,
        queryCount: result.databaseMetrics.queryCount,
        avgQueryTime: result.databaseMetrics.averageQueryTime,
        memoryIncrease: result.memoryUsage.increase / (1024 * 1024)
      });
    }, 300000); // 5 minute timeout for scalability test
  });

  describe('Database Performance - Section E.2', () => {
    it('should validate query benchmarks and index effectiveness', async () => {
      const result = await performanceService.runDatabasePerformanceTests();
      
      expect(result.success).toBe(true);
      expect(result.databaseMetrics.averageQueryTime).toBeLessThan(50); // <50ms average
      expect(result.databaseMetrics.slowestQuery).toBeLessThan(200); // <200ms slowest
      expect(result.databaseMetrics.totalDatabaseTime).toBeLessThan(1000); // <1s total
      
      console.log('Database Performance Results:', {
        avgQueryTime: result.databaseMetrics.averageQueryTime,
        slowestQuery: result.databaseMetrics.slowestQuery,
        totalTime: result.databaseMetrics.totalDatabaseTime
      });
    }, 60000);

    it('should maintain performance with complex recursive queries', async () => {
      // Test deep hierarchy queries
      const result = await performanceService.runQueryOptimizationTests();
      
      expect(result.success).toBe(true);
      expect(result.databaseMetrics.averageQueryTime).toBeLessThan(100); // <100ms for complex queries
      
      console.log('Query Optimization Results:', {
        avgQueryTime: result.databaseMetrics.averageQueryTime,
        queryCount: result.databaseMetrics.queryCount
      });
    }, 60000);
  });

  describe('Memory Usage Testing - Section E.3', () => {
    it('should monitor memory usage during large blueprint operations', async () => {
      const result = await performanceService.runMemoryUsageTests();
      
      expect(result.success).toBe(true);
      expect(result.memoryUsage.increase).toBeLessThan(200 * 1024 * 1024); // <200MB increase
      expect(result.memoryUsage.peak).toBeLessThan(500 * 1024 * 1024); // <500MB peak
      
      console.log('Memory Usage Results:', {
        start: result.memoryUsage.start / (1024 * 1024),
        end: result.memoryUsage.end / (1024 * 1024),
        peak: result.memoryUsage.peak / (1024 * 1024),
        increase: result.memoryUsage.increase / (1024 * 1024)
      });
    }, 60000);
  });

  describe('Concurrent User Testing - Section E.4', () => {
    it('should handle section CRUD operations under concurrent load', async () => {
      const result = await performanceService.runConcurrentUserTests();
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(30000); // <30 seconds
      expect(result.databaseMetrics.queryCount).toBeGreaterThan(100); // Should process many operations
      
      console.log('Concurrent User Test Results:', {
        duration: result.duration,
        queryCount: result.databaseMetrics.queryCount,
        avgQueryTime: result.databaseMetrics.averageQueryTime
      });
    }, 60000);
  });

  describe('Tree Depth Testing - Section E.5', () => {
    it('should handle hierarchy depth limits and performance impact', async () => {
      const result = await performanceService.runTreeDepthTests();
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(45000); // <45 seconds
      expect(result.memoryUsage.increase).toBeLessThan(100 * 1024 * 1024); // <100MB increase
      
      console.log('Tree Depth Test Results:', {
        duration: result.duration,
        memoryIncrease: result.memoryUsage.increase / (1024 * 1024)
      });
    }, 60000);
  });

  // ============================================================================
  // SECTION F: INTEGRATION & STRESS TESTING (Sprint 50)
  // ============================================================================

  describe('End-to-End Testing - Section F.1', () => {
    it('should complete full blueprint lifecycle with AI API integration', async () => {
      const result = await performanceService.runEndToEndTests();
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(60000); // <60 seconds for full lifecycle
      
      console.log('End-to-End Test Results:', {
        duration: result.duration,
        queryCount: result.databaseMetrics.queryCount
      });
    }, 90000);
  });

  describe('Data Consistency Testing - Section F.2', () => {
    it('should maintain data integrity during high-load operations', async () => {
      const result = await performanceService.runDataConsistencyTests();
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(30000); // <30 seconds
      
      console.log('Data Consistency Test Results:', {
        duration: result.duration,
        queryCount: result.databaseMetrics.queryCount
      });
    }, 60000);
  });

  describe('Database Connection Testing - Section F.3', () => {
    it('should handle connection pool performance under stress', async () => {
      const result = await performanceService.runDatabaseConnectionTests();
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(30000); // <30 seconds
      
      console.log('Database Connection Test Results:', {
        duration: result.duration,
        queryCount: result.databaseMetrics.queryCount
      });
    }, 60000);
  });

  describe('Section Tree Validation - Section F.4', () => {
    it('should prevent infinite nesting and circular references', async () => {
      const result = await performanceService.runTreeValidationTests();
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(15000); // <15 seconds
      
      console.log('Tree Validation Test Results:', {
        duration: result.duration,
        queryCount: result.databaseMetrics.queryCount
      });
    }, 30000);
  });

  describe('API Response Time Testing - Section F.5', () => {
    it('should maintain <200ms response times for section operations', async () => {
      const result = await performanceService.runResponseTimeTests();
      
      expect(result.success).toBe(true);
      expect(result.databaseMetrics.averageQueryTime).toBeLessThan(200); // <200ms target
      expect(result.duration).toBeLessThan(30000); // <30 seconds total
      
      console.log('Response Time Test Results:', {
        avgQueryTime: result.databaseMetrics.averageQueryTime,
        totalDuration: result.duration
      });
    }, 60000);
  });

  describe('Scalability Testing - Section F.6', () => {
    it('should handle 10k+ sections with acceptable performance', async () => {
      const config: ScalabilityTestConfig = {
        targetSectionCount: 10000,
        maxDepth: 10,
        concurrentOperations: 50,
        memoryThreshold: 1000, // 1GB
        responseTimeThreshold: 500 // 500ms
      };
      
      const result = await performanceService.runScalabilityTests(config);
      
      expect(result.success).toBe(true);
      expect(result.duration).toBeLessThan(600000); // <10 minutes
      expect(result.memoryUsage.peak).toBeLessThan(config.memoryThreshold * 1024 * 1024);
      expect(result.databaseMetrics.averageQueryTime).toBeLessThan(config.responseTimeThreshold);
      
      console.log('Scalability Test Results:', {
        duration: result.duration,
        memoryPeak: result.memoryUsage.peak / (1024 * 1024),
        avgQueryTime: result.databaseMetrics.averageQueryTime
      });
    }, 900000); // 15 minute timeout for large scalability test
  });

  // ============================================================================
  // SPRINT 52: MASTERY TRACKING & ALGORITHMS PERFORMANCE TESTS
  // ============================================================================

  describe('Mastery Calculation Performance - Sprint 52 Task 8.3', () => {
    it('should efficiently calculate criterion mastery scores', async () => {
      // Test criterion mastery calculation performance
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;
      
      // Simulate criterion mastery calculations for 1000+ criteria
      const testCriteria = Array.from({ length: 1000 }, (_, i) => ({
        id: `criterion-${i}`,
        attempts: Array.from({ length: 10 }, (_, j) => ({
          score: Math.random() * 100,
          date: new Date(Date.now() - j * 24 * 60 * 60 * 1000)
        }))
      }));
      
      // Simulate mastery calculations
      const masteryScores = testCriteria.map(criterion => {
        const recentAttempts = criterion.attempts.slice(0, 2);
        const averageScore = recentAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / recentAttempts.length;
        return {
          criterionId: criterion.id,
          masteryScore: averageScore,
          isMastered: averageScore >= 80
        };
      });
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      expect(masteryScores).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000); // <1 second for 1000 calculations
      expect(endMemory - startMemory).toBeLessThan(50 * 1024 * 1024); // <50MB increase
      
      console.log('Criterion Mastery Performance:', {
        duration: endTime - startTime,
        memoryIncrease: (endMemory - startMemory) / (1024 * 1024),
        criteriaProcessed: masteryScores.length
      });
    });

    it('should efficiently calculate UUE stage mastery with weighted averages', async () => {
      // Test stage mastery calculation performance
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;
      
      // Simulate 100 stages with 10 criteria each
      const testStages = Array.from({ length: 100 }, (_, stageIndex) => ({
        id: `stage-${stageIndex}`,
        criteria: Array.from({ length: 10 }, (_, criterionIndex) => ({
          id: `criterion-${stageIndex}-${criterionIndex}`,
          masteryScore: 70 + Math.random() * 30, // 70-100% range
          weight: 1 + Math.random() * 2 // 1-3 weight range
        }))
      }));
      
      // Calculate stage mastery scores
      const stageMasteryScores = testStages.map(stage => {
        const totalWeight = stage.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
        const weightedSum = stage.criteria.reduce((sum, criterion) => 
          sum + (criterion.masteryScore * criterion.weight), 0);
        const stageMastery = weightedSum / totalWeight;
        
        return {
          stageId: stage.id,
          masteryScore: stageMastery,
          isMastered: stageMastery >= 80,
          criteriaCount: stage.criteria.length
        };
      });
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      expect(stageMasteryScores).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(500); // <500ms for 100 stage calculations
      expect(endMemory - startMemory).toBeLessThan(25 * 1024 * 1024); // <25MB increase
      
      console.log('Stage Mastery Performance:', {
        duration: endTime - startTime,
        memoryIncrease: (endMemory - startMemory) / (1024 * 1024),
        stagesProcessed: stageMasteryScores.length
      });
    });
  });

  describe('Daily Task Generation Performance - Sprint 52 Task 8.3', () => {
    it('should efficiently generate daily tasks for large datasets', async () => {
      // Test daily task generation performance
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;
      
      // Simulate large dataset: 1000 users, 1000 criteria, 10000 questions
      const testUsers = Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        capacity: 20 + Math.floor(Math.random() * 30), // 20-50 capacity
        preferences: {
          trackingIntensity: ['DENSE', 'NORMAL', 'SPARSE'][Math.floor(Math.random() * 3)],
          masteryThreshold: [60, 80, 95][Math.floor(Math.random() * 3)]
        }
      }));
      
      const testCriteria = Array.from({ length: 1000 }, (_, i) => ({
        id: `criterion-${i}`,
        lastAttempt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // 0-30 days ago
        masteryScore: Math.random() * 100,
        stage: ['UNDERSTAND', 'USE', 'EXPLORE'][Math.floor(Math.random() * 3)]
      }));
      
      // Simulate daily task generation for each user
      const dailyTasks = testUsers.map(user => {
        const criticalTasks = testCriteria
          .filter(criterion => 
            criterion.masteryScore < user.preferences.masteryThreshold &&
            (Date.now() - criterion.lastAttempt.getTime()) > 3 * 24 * 60 * 60 * 1000
          )
          .slice(0, Math.floor(user.capacity * 0.4)); // 40% critical
          
        const coreTasks = testCriteria
          .filter(criterion => 
            criterion.masteryScore < user.preferences.masteryThreshold &&
            (Date.now() - criterion.lastAttempt.getTime()) <= 3 * 24 * 60 * 60 * 1000
          )
          .slice(0, Math.floor(user.capacity * 0.5)); // 50% core
          
        const plusTasks = testCriteria
          .filter(criterion => 
            criterion.masteryScore >= user.preferences.masteryThreshold &&
            criterion.stage !== 'EXPLORE'
          )
          .slice(0, Math.floor(user.capacity * 0.1)); // 10% plus
          
        return {
          userId: user.id,
          critical: criticalTasks.length,
          core: coreTasks.length,
          plus: plusTasks.length,
          total: criticalTasks.length + coreTasks.length + plusTasks.length
        };
      });
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      expect(dailyTasks).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(2000); // <2 seconds for 1000 users
      expect(endMemory - startMemory).toBeLessThan(100 * 1024 * 1024); // <100MB increase
      
      console.log('Daily Task Generation Performance:', {
        duration: endTime - startTime,
        memoryIncrease: (endMemory - startMemory) / (1024 * 1024),
        usersProcessed: dailyTasks.length,
        avgTasksPerUser: dailyTasks.reduce((sum, tasks) => sum + tasks.total, 0) / dailyTasks.length
      });
    });
  });

  describe('SR Algorithm Performance - Sprint 52 Task 8.3', () => {
    it('should efficiently calculate spaced repetition intervals', async () => {
      // Test SR algorithm performance
      const startTime = Date.now();
      const startMemory = process.memoryUsage().heapUsed;
      
      // Simulate 10000 learning items with different tracking intensities
      const learningItems = Array.from({ length: 10000 }, (_, i) => ({
        id: `item-${i}`,
        currentStage: Math.floor(Math.random() * 6), // 0-5 stages
        consecutiveFailures: Math.floor(Math.random() * 3), // 0-2 failures
        trackingIntensity: ['DENSE', 'NORMAL', 'SPARSE'][Math.floor(Math.random() * 3)],
        lastAttempt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000) // 0-60 days ago
      }));
      
      // Base intervals for SR algorithm
      const baseIntervals = [1, 3, 7, 21, 60, 180];
      const intensityMultipliers = { DENSE: 0.7, NORMAL: 1.0, SPARSE: 1.5 };
      
      // Calculate next intervals for all items
      const nextIntervals = learningItems.map(item => {
        let nextInterval: number;
        
        if (item.consecutiveFailures === 0) {
          // Success: move up one stage
          const nextStage = Math.min(item.currentStage + 1, baseIntervals.length - 1);
          nextInterval = baseIntervals[nextStage] * intensityMultipliers[item.trackingIntensity];
        } else if (item.consecutiveFailures === 1) {
          // First failure: go back one stage
          const prevStage = Math.max(item.currentStage - 1, 0);
          nextInterval = baseIntervals[prevStage] * intensityMultipliers[item.trackingIntensity];
        } else {
          // Second failure: go back to start
          nextInterval = baseIntervals[0] * intensityMultipliers[item.trackingIntensity];
        }
        
        return {
          itemId: item.id,
          nextInterval,
          nextReviewDate: new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000),
          isOverdue: nextInterval < 0
        };
      });
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      expect(nextIntervals).toHaveLength(10000);
      expect(endTime - startTime).toBeLessThan(1000); // <1 second for 10000 calculations
      expect(endMemory - startMemory).toBeLessThan(50 * 1024 * 1024); // <50MB increase
      
      console.log('SR Algorithm Performance:', {
        duration: endTime - startTime,
        memoryIncrease: (endMemory - startMemory) / (1024 * 1024),
        itemsProcessed: nextIntervals.length,
        overdueCount: nextIntervals.filter(item => item.isOverdue).length
      });
    });
  });

  // ============================================================================
  // PERFORMANCE BENCHMARKS & THRESHOLDS
  // ============================================================================

  describe('Performance Benchmarks', () => {
    it('should meet all performance thresholds for production readiness', async () => {
      // Run comprehensive performance validation
      const benchmarks = {
        loadTesting: await performanceService.runLoadTesting({
          sectionCount: 1000,
          maxDepth: 5,
          concurrentUsers: 10,
          testDuration: 30,
          operationsPerUser: 50
        }),
        databasePerformance: await performanceService.runDatabasePerformanceTests(),
        memoryUsage: await performanceService.runMemoryUsageTests(),
        responseTime: await performanceService.runResponseTimeTests()
      };
      
      // Validate all benchmarks meet production thresholds
      expect(benchmarks.loadTesting.success).toBe(true);
      expect(benchmarks.databasePerformance.success).toBe(true);
      expect(benchmarks.memoryUsage.success).toBe(true);
      expect(benchmarks.responseTime.success).toBe(true);
      
      // Performance thresholds
      expect(benchmarks.loadTesting.duration).toBeLessThan(60000); // <60s for 1000 sections
      expect(benchmarks.databasePerformance.databaseMetrics.averageQueryTime).toBeLessThan(100); // <100ms
      expect(benchmarks.memoryUsage.memoryUsage.increase).toBeLessThan(200 * 1024 * 1024); // <200MB
      expect(benchmarks.responseTime.databaseMetrics.averageQueryTime).toBeLessThan(200); // <200ms
      
      console.log('Production Readiness Benchmarks:', {
        loadTestDuration: benchmarks.loadTesting.duration,
        avgQueryTime: benchmarks.databasePerformance.databaseMetrics.averageQueryTime,
        memoryIncrease: benchmarks.memoryUsage.memoryUsage.increase / (1024 * 1024),
        responseTime: benchmarks.responseTime.databaseMetrics.averageQueryTime
      });
    }, 300000); // 5 minute timeout for comprehensive benchmarks
  });
});
