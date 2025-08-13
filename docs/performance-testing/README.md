# Performance Testing Infrastructure

## Overview

This directory contains the comprehensive performance testing infrastructure for the Elevate Core API, implementing all performance testing requirements from:

- **Sprint 50**: Performance Testing & Optimization (Sections E & F)
- **Sprint 52**: Mastery Tracking & Algorithms Performance Tests

## 🚀 Quick Start

### Run All Performance Tests

```bash
# Using npm script
npm run test:performance

# Using ts-node directly
ts-node src/scripts/run-performance-tests.ts
```

### Run Specific Test Categories

```typescript
import PerformanceTestingService from '../services/blueprint-centric/performanceTesting.service';
import MasteryPerformanceTestingService from '../services/blueprint-centric/masteryPerformanceTesting.service';

// General performance tests (Sprint 50)
const performanceService = new PerformanceTestingService();
await performanceService.runLoadTesting(config);
await performanceService.runDatabasePerformanceTests();
await performanceService.runMemoryUsageTests();

// Mastery-specific performance tests (Sprint 52)
const masteryPerformanceService = new MasteryPerformanceTestingService();
await masteryPerformanceService.runMasteryCalculationPerformanceTests();
await masteryPerformanceService.runDailyTaskGenerationPerformanceTests();
await masteryPerformanceService.runSRAlgorithmPerformanceTests();
```

## 📊 Test Categories

### Sprint 50: Performance Testing & Optimization

#### Section E: Performance Testing & Optimization

1. **Load Testing** - Section hierarchy operations with 1000+ sections
   - Tests: 1000 sections, 5000 sections
   - Metrics: Duration, memory usage, query performance
   - Thresholds: <60s for 1000 sections, <3min for 5000 sections

2. **Database Performance** - Query benchmarks and index effectiveness
   - Tests: Query execution time, slowest query, total database time
   - Thresholds: <50ms average, <200ms slowest, <1s total

3. **Memory Usage Testing** - Large blueprint operations monitoring
   - Tests: Memory consumption during large operations
   - Thresholds: <200MB increase, <500MB peak

4. **Concurrent User Testing** - Section CRUD operations under load
   - Tests: Multiple users performing operations simultaneously
   - Thresholds: <30s completion, >100 operations processed

5. **Tree Depth Testing** - Hierarchy depth limits and performance impact
   - Tests: Deep nested section hierarchies
   - Thresholds: <45s completion, <100MB memory increase

6. **Query Optimization** - Recursive query optimization
   - Tests: Complex recursive queries for section trees
   - Thresholds: <100ms average for complex queries

#### Section F: Integration & Stress Testing

1. **End-to-End Testing** - Complete blueprint lifecycle with AI API integration
   - Tests: Full system workflow from creation to completion
   - Thresholds: <60s for complete lifecycle

2. **Data Consistency Testing** - High-load operations and data integrity validation
   - Tests: Data integrity under stress conditions
   - Thresholds: <30s completion, no data corruption

3. **Database Connection Testing** - Connection pool performance under stress
   - Tests: Connection pool behavior under load
   - Thresholds: <30s completion, stable connection counts

4. **Section Tree Validation** - Circular reference prevention
   - Tests: Infinite nesting prevention, circular reference detection
   - Thresholds: <15s completion, no circular references

5. **API Response Time Testing** - <200ms target validation
   - Tests: API endpoint response times
   - Thresholds: <200ms average, <30s total

6. **Scalability Testing** - System behavior with 10k+ sections
   - Tests: Large-scale blueprint operations
   - Thresholds: <10min completion, <1GB memory, <500ms response

### Sprint 52: Mastery Tracking & Algorithms Performance

#### Task 8.3: Performance Tests for Daily Task Generation

1. **Mastery Calculation Performance**
   - Tests: 10,000 criteria mastery calculations
   - Metrics: Duration, memory usage, calculations per second
   - Thresholds: <1s for 10k criteria, <50MB memory, >10k calc/sec

2. **Daily Task Generation Performance**
   - Tests: 5,000 users with varying capacities
   - Metrics: Duration, memory usage, tasks generated per second
   - Thresholds: <2s for 5k users, <100MB memory, >2.5k tasks/sec

3. **SR Algorithm Performance**
   - Tests: 10,000 learning items with progressive failure handling
   - Metrics: Duration, memory usage, calculations per second
   - Thresholds: <1s for 10k items, <50MB memory, >10k calc/sec

#### Task 8.5: Load Testing for Daily Task Generation Algorithms

1. **Concurrent Daily Task Generation**
   - Tests: 1,000-5,000 users with 50-100 criteria each
   - Metrics: Duration, memory usage, concurrent processing
   - Thresholds: Scalable performance with user count

2. **Large Blueprint Section Operations**
   - Tests: Large-scale section operations and queries
   - Metrics: Duration, memory usage, operation efficiency
   - Thresholds: Linear scaling with section count

## ⚙️ Configuration

### Environment-Specific Settings

The performance testing infrastructure automatically adjusts based on your environment:

```typescript
import { performanceConfig } from '../config/performance-testing.config';

// Automatically uses appropriate thresholds for your environment
const thresholds = performanceConfig.thresholds;
const configs = performanceConfig.configurations;
```

**Environments:**
- **Development**: Full test load, relaxed thresholds
- **Staging**: Medium test load, moderate thresholds  
- **Production**: Reduced test load, strict thresholds

### Customizing Test Parameters

```typescript
import { defaultTestConfigurations } from '../config/performance-testing.config';

const customConfigs = {
  ...defaultTestConfigurations,
  sprint50: {
    ...defaultTestConfigurations.sprint50,
    loadTestConfigs: [
      {
        sectionCount: 2000,
        maxDepth: 6,
        concurrentUsers: 15,
        testDuration: 45,
        operationsPerUser: 75
      }
    ]
  }
};
```

## 📈 Performance Thresholds

### Sprint 50 Thresholds

| Test Category | Metric | Development | Staging | Production |
|---------------|--------|-------------|---------|------------|
| Load Testing (1000 sections) | Duration | <60s | <45s | <30s |
| Load Testing (1000 sections) | Memory | <100MB | <75MB | <50MB |
| Database Performance | Avg Query Time | <50ms | <35ms | <25ms |
| Database Performance | Slowest Query | <200ms | <150ms | <100ms |
| Memory Usage | Increase | <200MB | <150MB | <100MB |
| Response Time | Average | <200ms | <150ms | <100ms |
| Scalability (10k sections) | Duration | <10min | <8min | <5min |

### Sprint 52 Thresholds

| Test Category | Metric | Development | Staging | Production |
|---------------|--------|-------------|---------|------------|
| Mastery Calculation | Duration (10k criteria) | <1s | <800ms | <500ms |
| Mastery Calculation | Memory | <50MB | <40MB | <25MB |
| Daily Task Generation | Duration (5k users) | <2s | <1.5s | <1s |
| Daily Task Generation | Memory | <100MB | <75MB | <50MB |
| SR Algorithm | Duration (10k items) | <1s | <800ms | <500ms |
| SR Algorithm | Memory | <50MB | <40MB | <25MB |

## 🔍 Interpreting Results

### Test Result Structure

```typescript
interface PerformanceTestResult {
  testName: string;
  duration: number;           // Total execution time in milliseconds
  memoryUsage: {
    start: number;            // Memory usage at start (bytes)
    end: number;              // Memory usage at end (bytes)
    peak: number;             // Peak memory usage (bytes)
    increase: number;         // Memory increase (bytes)
  };
  databaseMetrics: {
    queryCount: number;       // Total database queries executed
    averageQueryTime: number; // Average query execution time (ms)
    slowestQuery: number;     // Slowest query execution time (ms)
    totalDatabaseTime: number; // Total time spent in database (ms)
  };
  success: boolean;           // Whether the test passed
  error?: string;             // Error message if test failed
  metadata: Record<string, any>; // Additional test-specific data
}
```

### Mastery Test Result Structure

```typescript
interface MasteryPerformanceTestResult {
  testName: string;
  duration: number;
  memoryUsage: { /* same as above */ };
  masteryMetrics: {
    criteriaProcessed: number;        // Number of criteria processed
    stagesProcessed: number;          // Number of UUE stages processed
    primitivesProcessed: number;      // Number of primitives processed
    calculationsPerSecond: number;    // Performance metric
    averageCalculationTime: number;   // Average time per calculation
  };
  success: boolean;
  error?: string;
  metadata: Record<string, any>;
}
```

### Success Criteria

A test is considered successful if:

1. **All operations complete without errors**
2. **Performance thresholds are met**
3. **Memory usage stays within limits**
4. **Database performance meets requirements**

### Failure Analysis

When tests fail, check:

1. **Database connectivity** - Ensure database is accessible
2. **Memory constraints** - Check available system memory
3. **Database performance** - Verify indexes and query optimization
4. **System resources** - Check CPU and I/O performance

## 🛠️ Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database status
npx prisma db push
npx prisma generate

# Verify connection string in .env
DATABASE_URL="postgresql://..."
```

#### Memory Issues
```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 src/scripts/run-performance-tests.ts

# Check system memory
free -h
```

#### Performance Degradation
```bash
# Run with reduced load for debugging
NODE_ENV=production npm run test:performance

# Check database performance
npx prisma studio
```

### Debug Mode

Enable detailed logging:

```typescript
// Set environment variable for verbose logging
process.env.DEBUG_PERFORMANCE = 'true';

// Or modify the test runner
const runner = new PerformanceTestRunner();
runner.enableDebugMode();
```

## 📚 Advanced Usage

### Custom Test Scenarios

```typescript
import { PerformanceTestRunner } from '../scripts/run-performance-tests';

class CustomPerformanceRunner extends PerformanceTestRunner {
  async runCustomTests(): Promise<void> {
    // Implement custom test scenarios
    await this.runCustomLoadTest({
      sectionCount: 15000,
      maxDepth: 12,
      concurrentUsers: 100
    });
  }
}
```

### Integration with CI/CD

```yaml
# .github/workflows/performance-tests.yml
name: Performance Tests
on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:performance
```

### Performance Monitoring

```typescript
import { performance } from 'perf_hooks';

// Monitor specific operations
const start = performance.now();
await performOperation();
const duration = performance.now() - start;

console.log(`Operation took ${duration.toFixed(2)}ms`);
```

## 📋 Test Checklist

Before running performance tests, ensure:

- [ ] Database is running and accessible
- [ ] Environment variables are configured
- [ ] Sufficient system resources available
- [ ] No other heavy processes running
- [ ] Database indexes are optimized
- [ ] Test data is prepared (if needed)

## 🎯 Next Steps

1. **Run baseline tests** to establish current performance
2. **Identify bottlenecks** in failing tests
3. **Optimize problematic areas** (queries, algorithms, memory usage)
4. **Re-run tests** to verify improvements
5. **Set up continuous monitoring** for performance regression

## 📞 Support

For issues with the performance testing infrastructure:

1. Check this documentation
2. Review test logs and error messages
3. Verify system requirements
4. Check database performance
5. Contact the development team

---

**Note**: Performance testing can be resource-intensive. Always run in appropriate environments and monitor system resources during execution.
