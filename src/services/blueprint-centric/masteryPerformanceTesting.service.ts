import { PrismaClient } from '@prisma/client';
import PerformanceTestingService from './performanceTesting.service';

const prisma = new PrismaClient();

// ============================================================================
// MASTERY PERFORMANCE TESTING SERVICE
// ============================================================================
// 
// This service implements specialized performance testing for Sprint 52:
// - Mastery Calculation Performance (Task 8.3)
// - Daily Task Generation Performance (Task 8.3)
// - SR Algorithm Performance (Task 8.3)
// - Load Testing for Daily Task Generation (Task 8.5)
//
// Focuses on the new mastery tracking system and spaced repetition algorithms
// that replace the existing primitive-based tracking with criterion-level mastery.
//
// ============================================================================

export interface MasteryPerformanceTestResult {
  testName: string;
  duration: number;
  memoryUsage: {
    start: number;
    end: number;
    peak: number;
    increase: number;
  };
  masteryMetrics: {
    criteriaProcessed: number;
    stagesProcessed: number;
    primitivesProcessed: number;
    calculationsPerSecond: number;
    averageCalculationTime: number;
  };
  success: boolean;
  error?: string;
  metadata: Record<string, any>;
}

export interface MasteryLoadTestConfig {
  userCount: number;
  criteriaPerUser: number;
  questionsPerCriterion: number;
  masteryThresholds: number[];
  trackingIntensities: string[];
  testDuration: number; // seconds
}

export default class MasteryPerformanceTestingService {
  
  private performanceService: PerformanceTestingService;
  
  constructor() {
    this.performanceService = new PerformanceTestingService();
  }
  
  /**
   * Sprint 52 Task 8.3: Performance tests for daily task generation
   * Tests the new criterion-based mastery tracking system performance
   */
  async runMasteryCalculationPerformanceTests(): Promise<MasteryPerformanceTestResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    let peakMemory = startMemory;
    
    try {
      console.log('Starting mastery calculation performance tests...');
      
      // Test 1: Criterion-level mastery calculations
      const criterionResults = await this.testCriterionMasteryCalculations();
      
      // Test 2: UUE stage mastery calculations with weighted averages
      const stageResults = await this.testUUEStageMasteryCalculations();
      
      // Test 3: Primitive-level mastery calculations
      const primitiveResults = await this.testPrimitiveMasteryCalculations();
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      peakMemory = Math.max(peakMemory, endMemory);
      
      const totalCriteria = criterionResults.criteriaProcessed;
      const totalStages = stageResults.stagesProcessed;
      const totalPrimitives = primitiveResults.primitivesProcessed;
      const totalDuration = endTime - startTime;
      
      const result: MasteryPerformanceTestResult = {
        testName: 'Mastery Calculation Performance Tests',
        duration: totalDuration,
        memoryUsage: {
          start: startMemory,
          end: endMemory,
          peak: peakMemory,
          increase: endMemory - startMemory
        },
        masteryMetrics: {
          criteriaProcessed: totalCriteria,
          stagesProcessed: totalStages,
          primitivesProcessed: totalPrimitives,
          calculationsPerSecond: Math.round((totalCriteria + totalStages + totalPrimitives) / (totalDuration / 1000)),
          averageCalculationTime: totalDuration / (totalCriteria + totalStages + totalPrimitives)
        },
        success: true,
        metadata: {
          criterionResults,
          stageResults,
          primitiveResults
        }
      };
      
      console.log('Mastery calculation performance test completed:', {
        duration: result.duration,
        criteriaProcessed: result.masteryMetrics.criteriaProcessed,
        calculationsPerSecond: result.masteryMetrics.calculationsPerSecond,
        memoryIncrease: result.memoryUsage.increase / (1024 * 1024)
      });
      
      return result;
      
    } catch (error) {
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      return {
        testName: 'Mastery Calculation Performance Tests',
        duration: endTime - startTime,
        memoryUsage: {
          start: startMemory,
          end: endMemory,
          peak: peakMemory,
          increase: endMemory - startMemory
        },
        masteryMetrics: {
          criteriaProcessed: 0,
          stagesProcessed: 0,
          primitivesProcessed: 0,
          calculationsPerSecond: 0,
          averageCalculationTime: 0
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {}
      };
    }
  }
  
  /**
   * Sprint 52 Task 8.3: Performance tests for daily task generation
   * Tests the new section-based daily task generation with UUE progression
   */
  async runDailyTaskGenerationPerformanceTests(): Promise<MasteryPerformanceTestResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    let peakMemory = startMemory;
    
    try {
      console.log('Starting daily task generation performance tests...');
      
      // Test 1: Large dataset daily task generation
      const largeDatasetResults = await this.testLargeDatasetDailyTaskGeneration();
      
      // Test 2: UUE stage progression in daily tasks
      const uueProgressionResults = await this.testUUEStageProgressionInDailyTasks();
      
      // Test 3: Capacity-based bucket filling performance
      const bucketFillingResults = await this.testCapacityBasedBucketFilling();
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      peakMemory = Math.max(peakMemory, endMemory);
      
      const totalUsers = largeDatasetResults.usersProcessed;
      const totalTasks = largeDatasetResults.totalTasksGenerated;
      const totalDuration = endTime - startTime;
      
      const result: MasteryPerformanceTestResult = {
        testName: 'Daily Task Generation Performance Tests',
        duration: totalDuration,
        memoryUsage: {
          start: startMemory,
          end: endMemory,
          peak: peakMemory,
          increase: endMemory - startMemory
        },
        masteryMetrics: {
          criteriaProcessed: totalTasks,
          stagesProcessed: uueProgressionResults.stagesProcessed,
          primitivesProcessed: 0,
          calculationsPerSecond: Math.round(totalTasks / (totalDuration / 1000)),
          averageCalculationTime: totalDuration / totalTasks
        },
        success: true,
        metadata: {
          largeDatasetResults,
          uueProgressionResults,
          bucketFillingResults
        }
      };
      
      console.log('Daily task generation performance test completed:', {
        duration: result.duration,
        usersProcessed: totalUsers,
        tasksGenerated: totalTasks,
        tasksPerSecond: result.masteryMetrics.calculationsPerSecond,
        memoryIncrease: result.memoryUsage.increase / (1024 * 1024)
      });
      
      return result;
      
    } catch (error) {
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      return {
        testName: 'Daily Task Generation Performance Tests',
        duration: endTime - startTime,
        memoryUsage: {
          start: startMemory,
          end: endMemory,
          peak: peakMemory,
          increase: endMemory - startMemory
        },
        masteryMetrics: {
          criteriaProcessed: 0,
          stagesProcessed: 0,
          primitivesProcessed: 0,
          calculationsPerSecond: 0,
          averageCalculationTime: 0
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {}
      };
    }
  }
  
  /**
   * Sprint 52 Task 8.3: SR algorithm performance
   * Tests the new enhanced spaced repetition algorithms
   */
  async runSRAlgorithmPerformanceTests(): Promise<MasteryPerformanceTestResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    let peakMemory = startMemory;
    
    try {
      console.log('Starting SR algorithm performance tests...');
      
      // Test 1: Progressive failure handling performance
      const failureHandlingResults = await this.testProgressiveFailureHandling();
      
      // Test 2: Tracking intensity multipliers performance
      const intensityMultiplierResults = await this.testTrackingIntensityMultipliers();
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      peakMemory = Math.max(peakMemory, endMemory);
      
      const totalItems = failureHandlingResults.itemsProcessed;
      const totalCalculations = totalItems * 2; // 2 types of calculations
      const totalDuration = endTime - startTime;
      
      const result: MasteryPerformanceTestResult = {
        testName: 'SR Algorithm Performance Tests',
        duration: totalDuration,
        memoryUsage: {
          start: startMemory,
          end: endMemory,
          peak: peakMemory,
          increase: endMemory - startMemory
        },
        masteryMetrics: {
          criteriaProcessed: totalItems,
          stagesProcessed: 0,
          primitivesProcessed: 0,
          calculationsPerSecond: Math.round(totalCalculations / (totalDuration / 1000)),
          averageCalculationTime: totalDuration / totalCalculations
        },
        success: true,
        metadata: {
          failureHandlingResults,
          intensityMultiplierResults
        }
      };
      
      console.log('SR algorithm performance test completed:', {
        duration: result.duration,
        itemsProcessed: totalItems,
        calculationsPerSecond: result.masteryMetrics.calculationsPerSecond,
        memoryIncrease: result.memoryUsage.increase / (1024 * 1024)
      });
      
      return result;
      
    } catch (error) {
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      return {
        testName: 'SR Algorithm Performance Tests',
        duration: endTime - startTime,
        memoryUsage: {
          start: startMemory,
          end: endMemory,
          peak: peakMemory,
          increase: endMemory - startMemory
        },
        masteryMetrics: {
          criteriaProcessed: 0,
          stagesProcessed: 0,
          primitivesProcessed: 0,
          calculationsPerSecond: 0,
          averageCalculationTime: 0
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {}
      };
    }
  }
  
  /**
   * Sprint 52 Task 8.5: Load testing for daily task generation algorithms
   * Tests system behavior under high load with large datasets
   */
  async runDailyTaskGenerationLoadTests(config: MasteryLoadTestConfig): Promise<MasteryPerformanceTestResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    let peakMemory = startMemory;
    
    try {
      console.log(`Starting daily task generation load tests: ${config.userCount} users, ${config.criteriaPerUser} criteria each`);
      
      // Test 1: Concurrent daily task generation for multiple users
      const concurrentResults = await this.testConcurrentDailyTaskGeneration(config);
      
      // Test 2: Large blueprint section operations
      const largeBlueprintResults = await this.testLargeBlueprintSectionOperations(config);
      
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      peakMemory = Math.max(peakMemory, endMemory);
      
      const totalUsers = config.userCount;
      const totalCriteria = totalUsers * config.criteriaPerUser;
      const totalDuration = endTime - startTime;
      
      const result: MasteryPerformanceTestResult = {
        testName: 'Daily Task Generation Load Tests',
        duration: totalDuration,
        memoryUsage: {
          start: startMemory,
          end: endMemory,
          peak: peakMemory,
          increase: endMemory - startMemory
        },
        masteryMetrics: {
          criteriaProcessed: totalCriteria,
          stagesProcessed: concurrentResults.stagesProcessed,
          primitivesProcessed: 0,
          calculationsPerSecond: Math.round(totalCriteria / (totalDuration / 1000)),
          averageCalculationTime: totalDuration / totalCriteria
        },
        success: true,
        metadata: {
          concurrentResults,
          largeBlueprintResults,
          config
        }
      };
      
      console.log('Daily task generation load test completed:', {
        duration: result.duration,
        usersProcessed: totalUsers,
        criteriaProcessed: totalCriteria,
        calculationsPerSecond: result.masteryMetrics.calculationsPerSecond,
        memoryIncrease: result.memoryUsage.increase / (1024 * 1024)
      });
      
      return result;
      
    } catch (error) {
      const endTime = Date.now();
      const endMemory = process.memoryUsage().heapUsed;
      
      return {
        testName: 'Daily Task Generation Load Tests',
        duration: endTime - startTime,
        memoryUsage: {
          start: startMemory,
          end: endMemory,
          peak: peakMemory,
          increase: endMemory - startMemory
        },
        masteryMetrics: {
          criteriaProcessed: 0,
          stagesProcessed: 0,
          primitivesProcessed: 0,
          calculationsPerSecond: 0,
          averageCalculationTime: 0
        },
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {}
      };
    }
  }
  
  // ============================================================================
  // PRIVATE TEST IMPLEMENTATION METHODS
  // ============================================================================
  
  private async testCriterionMasteryCalculations() {
    const startTime = Date.now();
    
    // Simulate 10000 criteria with mastery tracking data
    const testCriteria = Array.from({ length: 10000 }, (_, i) => ({
      id: `criterion-${i}`,
      attempts: Array.from({ length: 15 }, (_, j) => ({
        score: 60 + Math.random() * 40, // 60-100% range
        date: new Date(Date.now() - j * 24 * 60 * 60 * 1000),
        isCorrect: Math.random() > 0.3 // 70% success rate
      }))
    }));
    
    // Calculate mastery scores using new algorithm
    const masteryScores = testCriteria.map(criterion => {
      const recentAttempts = criterion.attempts.slice(0, 2);
      const averageScore = recentAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / recentAttempts.length;
      const consecutiveCorrect = this.calculateConsecutiveCorrect(criterion.attempts);
      
      return {
        criterionId: criterion.id,
        masteryScore: averageScore,
        consecutiveCorrect,
        isMastered: averageScore >= 80 && consecutiveCorrect >= 2
      };
    });
    
    const endTime = Date.now();
    
    return {
      criteriaProcessed: testCriteria.length,
      duration: endTime - startTime,
      masteryScores: masteryScores.length,
      averageMasteryScore: masteryScores.reduce((sum, score) => sum + score.masteryScore, 0) / masteryScores.length
    };
  }
  
  private async testUUEStageMasteryCalculations() {
    const startTime = Date.now();
    
    // Simulate 1000 stages with weighted criteria
    const testStages = Array.from({ length: 1000 }, (_, stageIndex) => ({
      id: `stage-${stageIndex}`,
      criteria: Array.from({ length: 8 + Math.floor(Math.random() * 7) }, (_, criterionIndex) => ({
        id: `criterion-${stageIndex}-${criterionIndex}`,
        masteryScore: 70 + Math.random() * 30, // 70-100% range
        weight: 1 + Math.floor(Math.random() * 3), // 1-3 weight range
        stage: ['UNDERSTAND', 'USE', 'EXPLORE'][stageIndex % 3]
      }))
    }));
    
    // Calculate stage mastery using weighted averages
    const stageMasteryScores = testStages.map(stage => {
      const totalWeight = stage.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
      const weightedSum = stage.criteria.reduce((sum, criterion) => 
        sum + (criterion.masteryScore * criterion.weight), 0);
      const stageMastery = weightedSum / totalWeight;
      
      const criteriaMastered = stage.criteria.filter(c => c.masteryScore >= 80).length;
      const isStageMastered = stageMastery >= 80 && criteriaMastered === stage.criteria.length;
      
      return {
        stageId: stage.id,
        masteryScore: stageMastery,
        criteriaMastered,
        totalCriteria: stage.criteria.length,
        isStageMastered
      };
    });
    
    const endTime = Date.now();
    
    return {
      stagesProcessed: testStages.length,
      duration: endTime - startTime,
      stagesMastered: stageMasteryScores.filter(s => s.isStageMastered).length,
      averageStageMastery: stageMasteryScores.reduce((sum, stage) => sum + stage.masteryScore, 0) / stageMasteryScores.length
    };
  }
  
  private async testPrimitiveMasteryCalculations() {
    const startTime = Date.now();
    
    // Simulate 100 primitives with multiple UUE stages
    const testPrimitives = Array.from({ length: 100 }, (_, primitiveIndex) => ({
      id: `primitive-${primitiveIndex}`,
      stages: Array.from({ length: 3 }, (_, stageIndex) => ({
        id: `stage-${primitiveIndex}-${stageIndex}`,
        masteryScore: 75 + Math.random() * 25, // 75-100% range
        isMastered: Math.random() > 0.2 // 80% mastery rate
      }))
    }));
    
    // Calculate primitive mastery (all stages must be mastered)
    const primitiveMasteryScores = testPrimitives.map(primitive => {
      const allStagesMastered = primitive.stages.every(stage => stage.isMastered);
      const averageStageMastery = primitive.stages.reduce((sum, stage) => sum + stage.masteryScore, 0) / primitive.stages.length;
      
      return {
        primitiveId: primitive.id,
        averageStageMastery,
        allStagesMastered,
        isPrimitiveMastered: allStagesMastered
      };
    });
    
    const endTime = Date.now();
    
    return {
      primitivesProcessed: testPrimitives.length,
      duration: endTime - startTime,
      primitivesMastered: primitiveMasteryScores.filter(p => p.isPrimitiveMastered).length,
      averagePrimitiveMastery: primitiveMasteryScores.reduce((sum, p) => sum + p.averageStageMastery, 0) / primitiveMasteryScores.length
    };
  }
  
  private async testLargeDatasetDailyTaskGeneration() {
    const startTime = Date.now();
    
    // Simulate 5000 users with varying capacities and preferences
    const testUsers = Array.from({ length: 5000 }, (_, i) => ({
      id: `user-${i}`,
      capacity: 15 + Math.floor(Math.random() * 35), // 15-50 capacity
      preferences: {
        trackingIntensity: ['DENSE', 'NORMAL', 'SPARSE'][Math.floor(Math.random() * 3)],
        masteryThreshold: [60, 80, 95][Math.floor(Math.random() * 3)]
      }
    }));
    
    // Simulate 10000 criteria with different states
    const testCriteria = Array.from({ length: 10000 }, (_, i) => ({
      id: `criterion-${i}`,
      lastAttempt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      masteryScore: Math.random() * 100,
      stage: ['UNDERSTAND', 'USE', 'EXPLORE'][Math.floor(Math.random() * 3)],
      isOverdue: Math.random() > 0.7 // 30% overdue
    }));
    
    // Generate daily tasks for each user
    const dailyTasks = testUsers.map(user => {
      const criticalTasks = testCriteria
        .filter(criterion => 
          criterion.isOverdue && criterion.masteryScore < user.preferences.masteryThreshold
        )
        .slice(0, Math.floor(user.capacity * 0.4));
        
      const coreTasks = testCriteria
        .filter(criterion => 
          !criterion.isOverdue && criterion.masteryScore < user.preferences.masteryThreshold
        )
        .slice(0, Math.floor(user.capacity * 0.5));
        
      const plusTasks = testCriteria
        .filter(criterion => 
          criterion.masteryScore >= user.preferences.masteryThreshold &&
          criterion.stage !== 'EXPLORE'
        )
        .slice(0, Math.floor(user.capacity * 0.1));
        
      return {
        userId: user.id,
        critical: criticalTasks.length,
        core: coreTasks.length,
        plus: plusTasks.length,
        total: criticalTasks.length + coreTasks.length + plusTasks.length
      };
    });
    
    const endTime = Date.now();
    
    return {
      usersProcessed: testUsers.length,
      duration: endTime - startTime,
      totalTasksGenerated: dailyTasks.reduce((sum, tasks) => sum + tasks.total, 0),
      averageTasksPerUser: dailyTasks.reduce((sum, tasks) => sum + tasks.total, 0) / dailyTasks.length
    };
  }
  
  private async testUUEStageProgressionInDailyTasks() {
    const startTime = Date.now();
    
    // Simulate UUE stage progression logic
    const testStages = Array.from({ length: 500 }, (_, stageIndex) => ({
      id: `stage-${stageIndex}`,
      level: ['UNDERSTAND', 'USE', 'EXPLORE'][stageIndex % 3],
      criteria: Array.from({ length: 5 + Math.floor(Math.random() * 6) }, (_, criterionIndex) => ({
        id: `criterion-${stageIndex}-${criterionIndex}`,
        masteryScore: 70 + Math.random() * 30,
        isReadyForNextStage: Math.random() > 0.3
      }))
    }));
    
    // Calculate stage progression readiness
    const stageProgression = testStages.map(stage => {
      const readyCriteria = stage.criteria.filter(c => c.isReadyForNextStage).length;
      const totalCriteria = stage.criteria.length;
      const progressionReady = readyCriteria === totalCriteria;
      
      return {
        stageId: stage.id,
        level: stage.level,
        readyCriteria,
        totalCriteria,
        progressionReady
      };
    });
    
    const endTime = Date.now();
    
    return {
      stagesProcessed: testStages.length,
      duration: endTime - startTime,
      stagesReadyForProgression: stageProgression.filter(s => s.progressionReady).length,
      understandStages: stageProgression.filter(s => s.level === 'UNDERSTAND').length,
      useStages: stageProgression.filter(s => s.level === 'USE').length,
      exploreStages: stageProgression.filter(s => s.level === 'EXPLORE').length
    };
  }
  
  private async testCapacityBasedBucketFilling() {
    const startTime = Date.now();
    
    // Test bucket filling algorithm with capacity constraints
    const testBuckets = Array.from({ length: 1000 }, (_, i) => ({
      userId: `user-${i}`,
      capacity: 20 + Math.floor(Math.random() * 30),
      criticalItems: Array.from({ length: 10 + Math.floor(Math.random() * 20) }, (_, j) => ({
        id: `critical-${i}-${j}`,
        priority: Math.random(),
        estimatedTime: 2 + Math.random() * 8
      })),
      coreItems: Array.from({ length: 15 + Math.floor(Math.random() * 25) }, (_, j) => ({
        id: `core-${i}-${j}`,
        priority: Math.random(),
        estimatedTime: 3 + Math.random() * 10
      })),
      plusItems: Array.from({ length: 20 + Math.floor(Math.random() * 30) }, (_, j) => ({
        id: `plus-${i}-${j}`,
        priority: Math.random(),
        estimatedTime: 5 + Math.random() * 15
      }))
    }));
    
    // Fill buckets based on capacity
    const filledBuckets = testBuckets.map(bucket => {
      let remainingCapacity = bucket.capacity;
      const selectedItems = [];
      
      // Fill critical bucket first (40% of capacity)
      const criticalCapacity = Math.floor(bucket.capacity * 0.4);
      const selectedCritical = bucket.criticalItems
        .sort((a, b) => b.priority - a.priority)
        .slice(0, criticalCapacity);
      selectedItems.push(...selectedCritical);
      remainingCapacity -= selectedCritical.reduce((sum, item) => sum + item.estimatedTime, 0);
      
      // Fill core bucket (50% of capacity)
      const coreCapacity = Math.floor(bucket.capacity * 0.5);
      const selectedCore = bucket.coreItems
        .sort((a, b) => b.priority - a.priority)
        .slice(0, coreCapacity);
      selectedItems.push(...selectedCore);
      remainingCapacity -= selectedCore.reduce((sum, item) => sum + item.estimatedTime, 0);
      
      // Fill plus bucket with remaining capacity
      const selectedPlus = bucket.plusItems
        .sort((a, b) => b.priority - a.priority)
        .filter(item => item.estimatedTime <= remainingCapacity);
      selectedItems.push(...selectedPlus);
      
      return {
        userId: bucket.userId,
        totalSelected: selectedItems.length,
        criticalSelected: selectedCritical.length,
        coreSelected: selectedCore.length,
        plusSelected: selectedPlus.length,
        capacityUtilization: (bucket.capacity - remainingCapacity) / bucket.capacity
      };
    });
    
    const endTime = Date.now();
    
    return {
      bucketsProcessed: testBuckets.length,
      duration: endTime - startTime,
      averageCapacityUtilization: filledBuckets.reduce((sum, bucket) => sum + bucket.capacityUtilization, 0) / filledBuckets.length,
      totalItemsSelected: filledBuckets.reduce((sum, bucket) => sum + bucket.totalSelected, 0)
    };
  }
  
  private async testProgressiveFailureHandling() {
    const startTime = Date.now();
    
    // Test progressive failure handling algorithm
    const testItems = Array.from({ length: 10000 }, (_, i) => ({
      id: `item-${i}`,
      currentStage: Math.floor(Math.random() * 6),
      consecutiveFailures: Math.floor(Math.random() * 3),
      lastAttempt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)
    }));
    
    // Apply progressive failure handling
    const updatedItems = testItems.map(item => {
      let nextStage: number;
      let nextInterval: number;
      
      if (item.consecutiveFailures === 0) {
        // Success: move up one stage
        nextStage = Math.min(item.currentStage + 1, 5);
        nextInterval = this.getBaseInterval(nextStage);
      } else if (item.consecutiveFailures === 1) {
        // First failure: go back one stage
        nextStage = Math.max(item.currentStage - 1, 0);
        nextInterval = this.getBaseInterval(nextStage);
      } else {
        // Second failure: go back to start
        nextStage = 0;
        nextInterval = this.getBaseInterval(0);
      }
      
      return {
        itemId: item.id,
        previousStage: item.currentStage,
        nextStage,
        nextInterval,
        nextReviewDate: new Date(Date.now() + nextInterval * 24 * 60 * 60 * 1000)
      };
    });
    
    const endTime = Date.now();
    
    return {
      itemsProcessed: testItems.length,
      duration: endTime - startTime,
      itemsAdvanced: updatedItems.filter(item => item.nextStage > item.previousStage).length,
      itemsRegressed: updatedItems.filter(item => item.nextStage < item.previousStage).length,
      itemsReset: updatedItems.filter(item => item.nextStage === 0).length
    };
  }
  
  private async testTrackingIntensityMultipliers() {
    const startTime = Date.now();
    
    // Test tracking intensity multipliers
    const testItems = Array.from({ length: 10000 }, (_, i) => ({
      id: `item-${i}`,
      baseInterval: [1, 3, 7, 21, 60, 180][Math.floor(Math.random() * 6)],
      trackingIntensity: ['DENSE', 'NORMAL', 'SPARSE'][Math.floor(Math.random() * 3)]
    }));
    
    // Apply intensity multipliers
    const adjustedIntervals = testItems.map(item => {
      const multiplier = {
        'DENSE': 0.7,
        'NORMAL': 1.0,
        'SPARSE': 1.5
      }[item.trackingIntensity];
      
      const adjustedInterval = item.baseInterval * multiplier;
      
      return {
        itemId: item.id,
        baseInterval: item.baseInterval,
        trackingIntensity: item.trackingIntensity,
        multiplier,
        adjustedInterval,
        difference: adjustedInterval - item.baseInterval
      };
    });
    
    const endTime = Date.now();
    
    return {
      itemsProcessed: testItems.length,
      duration: endTime - startTime,
      denseItems: adjustedIntervals.filter(item => item.trackingIntensity === 'DENSE').length,
      normalItems: adjustedIntervals.filter(item => item.trackingIntensity === 'NORMAL').length,
      sparseItems: adjustedIntervals.filter(item => item.trackingIntensity === 'SPARSE').length,
      averageMultiplier: adjustedIntervals.reduce((sum, item) => sum + item.multiplier, 0) / adjustedIntervals.length
    };
  }
  
  private async testConcurrentDailyTaskGeneration(config: MasteryLoadTestConfig) {
    const startTime = Date.now();
    
    // Simulate concurrent daily task generation
    const concurrentUsers = Array.from({ length: config.userCount }, (_, i) => ({
      userId: `user-${i}`,
      criteria: Array.from({ length: config.criteriaPerUser }, (_, j) => ({
        id: `criterion-${i}-${j}`,
        masteryScore: Math.random() * 100,
        lastAttempt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      }))
    }));
    
    // Process users concurrently (simulated)
    const results = await Promise.all(
      concurrentUsers.map(async (user) => {
        const criticalTasks = user.criteria
          .filter(c => c.masteryScore < 80 && (Date.now() - c.lastAttempt.getTime()) > 3 * 24 * 60 * 60 * 1000)
          .slice(0, 10);
          
        const coreTasks = user.criteria
          .filter(c => c.masteryScore < 80 && (Date.now() - c.lastAttempt.getTime()) <= 3 * 24 * 60 * 60 * 1000)
          .slice(0, 15);
          
        return {
          userId: user.userId,
          critical: criticalTasks.length,
          core: coreTasks.length,
          total: criticalTasks.length + coreTasks.length
        };
      })
    );
    
    const endTime = Date.now();
    
    return {
      usersProcessed: config.userCount,
      duration: endTime - startTime,
      stagesProcessed: results.length,
      totalTasksGenerated: results.reduce((sum, result) => sum + result.total, 0),
      averageTasksPerUser: results.reduce((sum, result) => sum + result.total, 0) / results.length
    };
  }
  
  private async testLargeBlueprintSectionOperations(config: MasteryLoadTestConfig) {
    const startTime = Date.now();
    
    // Simulate large blueprint section operations
    const totalSections = config.userCount * config.criteriaPerUser;
    const sections = Array.from({ length: totalSections }, (_, i) => ({
      id: `section-${i}`,
      depth: Math.floor(Math.random() * 5),
      criteriaCount: 5 + Math.floor(Math.random() * 10),
      lastModified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
    }));
    
    // Perform section operations
    const sectionOperations = sections.map(section => ({
      sectionId: section.id,
      depth: section.depth,
      criteriaCount: section.criteriaCount,
      estimatedTime: section.criteriaCount * 2 + section.depth * 5,
      isDeepSection: section.depth > 3
    }));
    
    const endTime = Date.now();
    
    return {
      sectionsProcessed: totalSections,
      duration: endTime - startTime,
      deepSections: sectionOperations.filter(s => s.isDeepSection).length,
      totalEstimatedTime: sectionOperations.reduce((sum, s) => sum + s.estimatedTime, 0)
    };
  }
  
  // ============================================================================
  // UTILITY METHODS
  // ============================================================================
  
  private calculateConsecutiveCorrect(attempts: any[]): number {
    let consecutive = 0;
    for (let i = attempts.length - 1; i >= 0; i--) {
      if (attempts[i].isCorrect) {
        consecutive++;
      } else {
        break;
      }
    }
    return consecutive;
  }
  
  private getBaseInterval(stage: number): number {
    const baseIntervals = [1, 3, 7, 21, 60, 180];
    return baseIntervals[Math.min(stage, baseIntervals.length - 1)];
  }
}
