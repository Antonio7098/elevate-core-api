# Testing Infrastructure Documentation

## Overview

This document describes the comprehensive testing infrastructure for the Elevate Core API, covering all services implemented in Sprint 50 (Blueprint-Centric Foundation) and Sprint 51 (Knowledge Graph & RAG Integration).

## 🧪 Test Categories

### 1. Unit Tests
- **Purpose**: Test individual service methods in isolation with mocked dependencies
- **Coverage**: All service methods, validation logic, and business rules
- **Location**: `src/tests/unit/`
- **Framework**: Jest with TypeScript

### 2. Integration Tests
- **Purpose**: Test service interactions with real database operations
- **Coverage**: Database CRUD operations, data integrity, and service coordination
- **Location**: `src/tests/integration/`
- **Framework**: Jest with Prisma client

### 3. Performance Tests
- **Purpose**: Validate performance thresholds and scalability requirements
- **Coverage**: Load testing, memory usage, database performance, algorithm efficiency
- **Location**: `src/tests/performance/`
- **Framework**: Custom performance testing services

## 🚀 Quick Start

### Run All Tests
```bash
# Comprehensive test suite (unit + integration + performance)
npm run test:all

# Individual test categories
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:performance   # Performance tests only
npm run test              # All Jest tests (unit + integration)
```

### Test Specific Services
```bash
# Test specific service
npm test -- --testPathPattern="blueprint-section.service.test.ts"
npm test -- --testPathPattern="mastery-criterion.service.test.ts"
npm test -- --testPathPattern="knowledge-graph-traversal.service.test.ts"
```

## 📋 Test Coverage

### Sprint 50: Blueprint-Centric Foundation

#### ✅ BlueprintSectionService
- **Unit Tests**: `src/tests/unit/blueprint-section.service.test.ts`
- **Integration Tests**: `src/tests/integration/blueprint-section.integration.test.ts`
- **Coverage**:
  - CRUD operations (create, read, update, delete)
  - Hierarchy management (tree building, depth calculation)
  - Section ordering and reordering
  - Content aggregation
  - Data validation and error handling
  - Performance with large datasets

#### ✅ MasteryCriterionService
- **Unit Tests**: `src/tests/unit/mastery-criterion.service.test.ts`
- **Coverage**:
  - Question family management
  - UUE stage progression tracking
  - Mastery calculation algorithms
  - Question instance management
  - AI integration for question generation
  - Validation and business rules

#### ✅ NoteSectionService
- **Unit Tests**: `src/tests/unit/note-section.service.test.ts`
- **Coverage**:
  - Section-based note management
  - Content versioning
  - Note organization and retrieval

#### ✅ ContentAggregator
- **Unit Tests**: `src/tests/unit/content-aggregator.service.test.ts`
- **Coverage**:
  - Recursive content aggregation
  - Mastery progress calculation
  - UUE stage progression analysis
  - Performance optimization

#### ✅ SectionHierarchyManager
- **Unit Tests**: `src/tests/unit/section-hierarchy-manager.service.test.ts`
- **Coverage**:
  - Tree building algorithms
  - Circular reference detection
  - Depth calculation
  - Hierarchy validation

### Sprint 51: Knowledge Graph & RAG Integration

#### ✅ KnowledgeGraphTraversal
- **Unit Tests**: `src/tests/unit/knowledge-graph-traversal.service.test.ts`
- **Coverage**:
  - Graph traversal algorithms (BFS, DFS)
  - Pathfinding and learning path discovery
  - Prerequisite chain analysis
  - UUE progression optimization
  - Performance with large graphs

#### ✅ ContextAssemblyService
- **Unit Tests**: `src/tests/unit/context-assembly.service.test.ts`
- **Coverage**:
  - Vector search integration
  - Knowledge graph traversal
  - Context combination and ranking
  - RAG response generation

#### ✅ IntelligentContextBuilder
- **Unit Tests**: `src/tests/unit/intelligent-context-builder.service.test.ts`
- **Coverage**:
  - Context building algorithms
  - Relevance scoring
  - Content diversity optimization
  - User preference integration

#### ✅ RelationshipDiscovery
- **Unit Tests**: `src/tests/unit/relationship-discovery.service.test.ts`
- **Coverage**:
  - AI-powered relationship detection
  - Confidence scoring
  - Relationship validation
  - Bulk processing

#### ✅ LearningPathService
- **Unit Tests**: `src/tests/unit/learning-path.service.test.ts`
- **Coverage**:
  - Learning pathway management
  - UUE stage progression
  - Path optimization
  - Difficulty balancing

## 🔧 Test Configuration

### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test Environment Setup
```bash
# Required environment variables
NODE_ENV=test
DATABASE_URL="postgresql://user:password@localhost:5432/elevate_test"
JWT_SECRET="test-secret-key"

# Optional: Performance test configuration
PERFORMANCE_TEST_TIMEOUT=30000
PERFORMANCE_TEST_MEMORY_LIMIT=512
```

## 📊 Performance Testing

### Performance Thresholds
```typescript
// src/config/performance-testing.config.ts
export const defaultPerformanceThresholds = {
  loadTesting: {
    section1000: 60000,      // 60s for 1000 sections
    section5000: 180000      // 3min for 5000 sections
  },
  databasePerformance: {
    averageQueryTime: 50,     // 50ms average
    slowestQuery: 200,        // 200ms slowest
    totalDatabaseTime: 1000   // 1s total
  },
  memoryUsage: {
    maxIncrease: 200,         // 200MB max increase
    maxPeak: 500              // 500MB max peak
  },
  responseTime: {
    average: 200,             // 200ms average
    total: 30000              // 30s total
  }
};
```

### Performance Test Categories
1. **Load Testing**: 1000+ sections, concurrent operations
2. **Database Performance**: Query optimization, index effectiveness
3. **Memory Usage**: Resource monitoring, garbage collection
4. **Concurrent User Testing**: Multiple simultaneous operations
5. **Tree Depth Testing**: Deep nesting performance
6. **Mastery Calculation Performance**: Algorithm efficiency
7. **Daily Task Generation Performance**: Large dataset handling
8. **SR Algorithm Performance**: Spaced repetition optimization

## 🧹 Test Data Management

### Test Database Setup
```typescript
// Integration test setup
beforeAll(async () => {
  await prisma.$connect();
  
  // Create test user
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedpassword'
    }
  });
  
  // Create test blueprint
  const testBlueprint = await prisma.learningBlueprint.create({
    data: {
      title: 'Test Blueprint',
      description: 'Test Description',
      userId: testUser.id
    }
  });
});

afterAll(async () => {
  // Clean up test data
  await prisma.blueprintSection.deleteMany();
  await prisma.learningBlueprint.delete();
  await prisma.user.delete();
  
  await prisma.$disconnect();
});
```

### Mock Data Generation
```typescript
// Performance test data generation
const generateLargeSectionTree = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `section-${i}`,
    title: `Section ${i}`,
    parentSectionId: i === 0 ? null : `section-${Math.floor((i - 1) / 2)}`,
    orderIndex: i,
    depth: Math.floor(Math.log2(i + 1))
  }));
};
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failures
```bash
# Check database status
pg_isready -h localhost -p 5432

# Verify environment variables
echo $DATABASE_URL
echo $NODE_ENV
```

#### 2. Test Timeout Issues
```typescript
// Increase Jest timeout for performance tests
jest.setTimeout(30000);

// Or in test file
describe('Performance Tests', () => {
  beforeAll(() => {
    jest.setTimeout(60000);
  });
});
```

#### 3. Memory Issues
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run test:performance

# Monitor memory usage
node --inspect src/scripts/run-performance-tests.ts
```

#### 4. Prisma Client Issues
```typescript
// Reset Prisma client between tests
beforeEach(async () => {
  await prisma.$disconnect();
  await prisma.$connect();
});
```

### Debug Mode
```bash
# Run tests with debug output
DEBUG=* npm run test:all

# Run specific test with verbose output
npm test -- --testPathPattern="blueprint-section" --verbose
```

## 📈 Test Metrics

### Coverage Reports
```bash
# Generate coverage report
npm test -- --coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

### Performance Benchmarks
```bash
# Run performance benchmarks
npm run test:performance -- --benchmark

# Generate performance report
npm run test:performance -- --report
```

### Test Execution Times
```bash
# View test execution times
npm test -- --verbose --json | jq '.testResults[] | {name: .name, duration: .perfStats.duration}'
```

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run test:all
      - run: npm run test:performance
```

## 📚 Additional Resources

### Test Utilities
- **Test Helpers**: `src/tests/utils/`
- **Mock Factories**: `src/tests/factories/`
- **Test Data**: `src/tests/data/`

### Performance Testing
- **Load Testing**: `src/services/blueprint-centric/performanceTesting.service.ts`
- **Mastery Performance**: `src/services/blueprint-centric/masteryPerformanceTesting.service.ts`
- **Configuration**: `src/config/performance-testing.config.ts`

### Documentation
- **API Documentation**: `docs/api/`
- **Sprint Documents**: `docs/sprints/`
- **Performance Testing**: `docs/performance-testing/`

## 🎯 Best Practices

### Writing Tests
1. **Arrange-Act-Assert**: Structure tests clearly
2. **Descriptive Names**: Use clear test descriptions
3. **Single Responsibility**: Test one thing per test
4. **Mock Dependencies**: Isolate units under test
5. **Clean Setup/Teardown**: Manage test data properly

### Performance Testing
1. **Baseline Measurements**: Establish performance baselines
2. **Realistic Data**: Use production-like test data
3. **Resource Monitoring**: Track CPU, memory, and I/O
4. **Threshold Validation**: Ensure performance requirements are met
5. **Regression Detection**: Catch performance regressions early

### Integration Testing
1. **Database Isolation**: Use separate test database
2. **Transaction Rollback**: Rollback changes after tests
3. **Data Cleanup**: Clean up test data thoroughly
4. **Real Dependencies**: Test with actual database operations
5. **Error Scenarios**: Test failure modes and edge cases

---

**Note**: This testing infrastructure ensures comprehensive coverage of all Sprint 50 and Sprint 51 functionality, providing confidence in the reliability and performance of the Elevate Core API.
