// ============================================================================
// PERFORMANCE TESTING CONFIGURATION
// ============================================================================
// 
// This configuration file defines performance testing parameters, thresholds,
// and environment-specific settings for both Sprint 50 and Sprint 52 requirements.
//
// ============================================================================

export interface PerformanceThresholds {
  // Sprint 50: General Performance Requirements
  loadTesting: {
    maxDuration1000Sections: number; // ms
    maxDuration5000Sections: number; // ms
    maxMemoryIncrease: number; // MB
    maxQueryTime: number; // ms
  };
  
  databasePerformance: {
    maxAverageQueryTime: number; // ms
    maxSlowestQuery: number; // ms
    maxTotalDatabaseTime: number; // ms
  };
  
  memoryUsage: {
    maxIncrease: number; // MB
    maxPeak: number; // MB
  };
  
  responseTime: {
    maxAverageResponseTime: number; // ms
    maxTotalDuration: number; // ms
  };
  
  scalability: {
    maxDuration10kSections: number; // ms
    maxMemoryThreshold: number; // MB
    maxResponseTimeThreshold: number; // ms
  };
  
  // Sprint 52: Mastery Tracking Performance Requirements
  masteryCalculation: {
    maxDuration10000Criteria: number; // ms
    maxMemoryIncrease: number; // MB
    minCalculationsPerSecond: number;
  };
  
  dailyTaskGeneration: {
    maxDuration5000Users: number; // ms
    maxMemoryIncrease: number; // MB
    minTasksPerSecond: number;
  };
  
  srAlgorithm: {
    maxDuration10000Items: number; // ms
    maxMemoryIncrease: number; // MB
    minCalculationsPerSecond: number;
  };
  
  // Load Testing Parameters
  loadTesting: {
    maxConcurrentUsers: number;
    maxSectionCount: number;
    maxTestDuration: number; // seconds
  };
}

export interface TestConfigurations {
  // Sprint 50 Test Configurations
  sprint50: {
    loadTestConfigs: Array<{
      sectionCount: number;
      maxDepth: number;
      concurrentUsers: number;
      testDuration: number;
      operationsPerUser: number;
    }>;
    
    scalabilityTestConfigs: Array<{
      targetSectionCount: number;
      maxDepth: number;
      concurrentOperations: number;
      memoryThreshold: number;
      responseTimeThreshold: number;
    }>;
  };
  
  // Sprint 52 Test Configurations
  sprint52: {
    masteryLoadTestConfigs: Array<{
      userCount: number;
      criteriaPerUser: number;
      questionsPerCriterion: number;
      masteryThresholds: number[];
      trackingIntensities: string[];
      testDuration: number;
    }>;
  };
}

// ============================================================================
// DEFAULT PERFORMANCE THRESHOLDS
// ============================================================================

export const defaultPerformanceThresholds: PerformanceThresholds = {
  // Sprint 50: General Performance Requirements
  loadTesting: {
    maxDuration1000Sections: 60000, // 60 seconds
    maxDuration5000Sections: 180000, // 3 minutes
    maxMemoryIncrease: 100, // 100MB
    maxQueryTime: 100, // 100ms
  },
  
  databasePerformance: {
    maxAverageQueryTime: 50, // 50ms
    maxSlowestQuery: 200, // 200ms
    maxTotalDatabaseTime: 1000, // 1 second
  },
  
  memoryUsage: {
    maxIncrease: 200, // 200MB
    maxPeak: 500, // 500MB
  },
  
  responseTime: {
    maxAverageResponseTime: 200, // 200ms
    maxTotalDuration: 30000, // 30 seconds
  },
  
  scalability: {
    maxDuration10kSections: 600000, // 10 minutes
    maxMemoryThreshold: 1000, // 1GB
    maxResponseTimeThreshold: 500, // 500ms
  },
  
  // Sprint 52: Mastery Tracking Performance Requirements
  masteryCalculation: {
    maxDuration10000Criteria: 1000, // 1 second
    maxMemoryIncrease: 50, // 50MB
    minCalculationsPerSecond: 10000, // 10k calculations/sec
  },
  
  dailyTaskGeneration: {
    maxDuration5000Users: 2000, // 2 seconds
    maxMemoryIncrease: 100, // 100MB
    minTasksPerSecond: 2500, // 2.5k tasks/sec
  },
  
  srAlgorithm: {
    maxDuration10000Items: 1000, // 1 second
    maxMemoryIncrease: 50, // 50MB
    minCalculationsPerSecond: 10000, // 10k calculations/sec
  },
  
  // Load Testing Parameters
  loadTesting: {
    maxConcurrentUsers: 50,
    maxSectionCount: 10000,
    maxTestDuration: 300, // 5 minutes
  },
};

// ============================================================================
// DEFAULT TEST CONFIGURATIONS
// ============================================================================

export const defaultTestConfigurations: TestConfigurations = {
  // Sprint 50 Test Configurations
  sprint50: {
    loadTestConfigs: [
      {
        sectionCount: 1000,
        maxDepth: 5,
        concurrentUsers: 10,
        testDuration: 30,
        operationsPerUser: 50
      },
      {
        sectionCount: 5000,
        maxDepth: 8,
        concurrentUsers: 20,
        testDuration: 60,
        operationsPerUser: 100
      }
    ],
    
    scalabilityTestConfigs: [
      {
        targetSectionCount: 10000,
        maxDepth: 10,
        concurrentOperations: 50,
        memoryThreshold: 1000, // 1GB
        responseTimeThreshold: 500 // 500ms
      }
    ]
  },
  
  // Sprint 52 Test Configurations
  sprint52: {
    masteryLoadTestConfigs: [
      {
        userCount: 1000,
        criteriaPerUser: 50,
        questionsPerCriterion: 10,
        masteryThresholds: [60, 80, 95],
        trackingIntensities: ['DENSE', 'NORMAL', 'SPARSE'],
        testDuration: 60
      },
      {
        userCount: 5000,
        criteriaPerUser: 100,
        questionsPerCriterion: 15,
        masteryThresholds: [60, 80, 95],
        trackingIntensities: ['DENSE', 'NORMAL', 'SPARSE'],
        testDuration: 120
      }
    ]
  }
};

// ============================================================================
// ENVIRONMENT-SPECIFIC CONFIGURATIONS
// ============================================================================

export function getPerformanceThresholds(environment: string = 'development'): PerformanceThresholds {
  switch (environment) {
    case 'production':
      // Stricter thresholds for production
      return {
        ...defaultPerformanceThresholds,
        loadTesting: {
          ...defaultPerformanceThresholds.loadTesting,
          maxDuration1000Sections: 30000, // 30 seconds (stricter)
          maxMemoryIncrease: 50, // 50MB (stricter)
        },
        databasePerformance: {
          ...defaultPerformanceThresholds.databasePerformance,
          maxAverageQueryTime: 25, // 25ms (stricter)
          maxSlowestQuery: 100, // 100ms (stricter)
        },
        responseTime: {
          ...defaultPerformanceThresholds.responseTime,
          maxAverageResponseTime: 100, // 100ms (stricter)
        }
      };
      
    case 'staging':
      // Medium thresholds for staging
      return {
        ...defaultPerformanceThresholds,
        loadTesting: {
          ...defaultPerformanceThresholds.loadTesting,
          maxDuration1000Sections: 45000, // 45 seconds
          maxMemoryIncrease: 75, // 75MB
        },
        databasePerformance: {
          ...defaultPerformanceThresholds.databasePerformance,
          maxAverageQueryTime: 35, // 35ms
          maxSlowestQuery: 150, // 150ms
        }
      };
      
    case 'development':
    default:
      // Default thresholds for development
      return defaultPerformanceThresholds;
  }
}

export function getTestConfigurations(environment: string = 'development'): TestConfigurations {
  switch (environment) {
    case 'production':
      // Reduced test load for production
      return {
        ...defaultTestConfigurations,
        sprint50: {
          ...defaultTestConfigurations.sprint50,
          loadTestConfigs: [
            {
              sectionCount: 500,
              maxDepth: 3,
              concurrentUsers: 5,
              testDuration: 15,
              operationsPerUser: 25
            }
          ]
        },
        sprint52: {
          ...defaultTestConfigurations.sprint52,
          masteryLoadTestConfigs: [
            {
              userCount: 500,
              criteriaPerUser: 25,
              questionsPerCriterion: 5,
              masteryThresholds: [60, 80, 95],
              trackingIntensities: ['NORMAL'],
              testDuration: 30
            }
          ]
        }
      };
      
    case 'staging':
      // Medium test load for staging
      return {
        ...defaultTestConfigurations,
        sprint50: {
          ...defaultTestConfigurations.sprint50,
          loadTestConfigs: [
            {
              sectionCount: 1000,
              maxDepth: 5,
              concurrentUsers: 10,
              testDuration: 30,
              operationsPerUser: 50
            }
          ]
        }
      };
      
    case 'development':
    default:
      // Full test load for development
      return defaultTestConfigurations;
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validatePerformanceThresholds(thresholds: PerformanceThresholds): string[] {
  const errors: string[] = [];
  
  // Validate load testing thresholds
  if (thresholds.loadTesting.maxDuration1000Sections <= 0) {
    errors.push('maxDuration1000Sections must be positive');
  }
  if (thresholds.loadTesting.maxMemoryIncrease <= 0) {
    errors.push('maxMemoryIncrease must be positive');
  }
  
  // Validate database performance thresholds
  if (thresholds.databasePerformance.maxAverageQueryTime <= 0) {
    errors.push('maxAverageQueryTime must be positive');
  }
  if (thresholds.databasePerformance.maxSlowestQuery <= 0) {
    errors.push('maxSlowestQuery must be positive');
  }
  
  // Validate memory usage thresholds
  if (thresholds.memoryUsage.maxIncrease <= 0) {
    errors.push('maxIncrease must be positive');
  }
  if (thresholds.memoryUsage.maxPeak <= 0) {
    errors.push('maxPeak must be positive');
  }
  
  // Validate response time thresholds
  if (thresholds.responseTime.maxAverageResponseTime <= 0) {
    errors.push('maxAverageResponseTime must be positive');
  }
  
  // Validate mastery calculation thresholds
  if (thresholds.masteryCalculation.minCalculationsPerSecond <= 0) {
    errors.push('minCalculationsPerSecond must be positive');
  }
  
  return errors;
}

export function validateTestConfigurations(configs: TestConfigurations): string[] {
  const errors: string[] = [];
  
  // Validate Sprint 50 configurations
  for (const config of configs.sprint50.loadTestConfigs) {
    if (config.sectionCount <= 0) {
      errors.push('sectionCount must be positive');
    }
    if (config.concurrentUsers <= 0) {
      errors.push('concurrentUsers must be positive');
    }
    if (config.testDuration <= 0) {
      errors.push('testDuration must be positive');
    }
  }
  
  // Validate Sprint 52 configurations
  for (const config of configs.sprint52.masteryLoadTestConfigs) {
    if (config.userCount <= 0) {
      errors.push('userCount must be positive');
    }
    if (config.criteriaPerUser <= 0) {
      errors.push('criteriaPerUser must be positive');
    }
    if (config.testDuration <= 0) {
      errors.push('testDuration must be positive');
    }
  }
  
  return errors;
}

// ============================================================================
// EXPORT DEFAULT CONFIGURATION
// ============================================================================

export const performanceConfig = {
  thresholds: getPerformanceThresholds(process.env.NODE_ENV || 'development'),
  configurations: getTestConfigurations(process.env.NODE_ENV || 'development'),
  environment: process.env.NODE_ENV || 'development'
};

export default performanceConfig;
