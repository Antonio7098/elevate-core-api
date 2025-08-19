#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { performance } from 'perf_hooks';
import TestDatabaseManager from '../test/database/test-database.config';

let prisma: PrismaClient;
let testDbManager: TestDatabaseManager | null = null;

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  errors: string[];
}

interface TestSummary {
  totalSuites: number;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  totalDuration: number;
  results: TestResult[];
}

class ComprehensiveTestRunner {
  private summary: TestSummary;

  constructor() {
    this.summary = {
      totalSuites: 0,
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0,
      totalSkipped: 0,
      totalDuration: 0,
      results: []
    };
  }

  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Test Suite for Elevate Core API');
    console.log('=' .repeat(80));
    console.log('📋 Test Coverage: Sprint 50 + Sprint 51 + Performance Testing');
    console.log('');

    try {
      // Test database connection
      await this.testDatabaseConnection();

      // Run unit tests
      await this.runUnitTests();

      // Run integration tests
      await this.runIntegrationTests();

      // Run performance tests
      await this.runPerformanceTests();

      // Generate test report
      this.generateTestReport();

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    } finally {
      try {
        if (testDbManager) {
          await testDbManager.teardown();
        } else if (prisma) {
          await prisma.$disconnect();
        }
      } catch {
        // noop
      }
    }
  }

  private async testDatabaseConnection(): Promise<void> {
    console.log('🔌 Testing database connection...');
    try {
      const forceDocker = (process.env.USE_DOCKER_TEST_DB || '').toLowerCase() === 'true';
      const existingUrl = process.env.DATABASE_URL;
      if (!forceDocker && existingUrl) {
        // Use provided DATABASE_URL
        prisma = new PrismaClient({ datasources: { db: { url: existingUrl } } });
        await prisma.$connect();
        console.log('✅ Database connection successful (using existing DATABASE_URL)');
      } else {
        // Spin up ephemeral test DB (Postgres via Testcontainers)
        testDbManager = TestDatabaseManager.getInstance();
        const config = await testDbManager.setup();
        prisma = config.prisma;

        // Ensure child processes (Jest, etc.) use the same DB
        process.env.DATABASE_URL = config.databaseUrl;

        console.log('✅ Database connection successful (provisioned test DB via Testcontainers)');
      }
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw new Error('Cannot run tests without database connection');
    }
  }

  private async runUnitTests(): Promise<void> {
    console.log('');
    console.log('🧪 Running Unit Tests...');
    console.log('-'.repeat(50));

    const unitTestSuites = [
      'BlueprintSectionService',
      'MasteryCriterionService',
      'KnowledgeGraphTraversal',
      'NoteSectionService',
      'ContentAggregator'
    ];

    for (const suite of unitTestSuites) {
      await this.runTestSuite(`unit/${suite.toLowerCase().replace(/service$/, '')}.service.test.ts`, suite);
    }
  }

  private async runIntegrationTests(): Promise<void> {
    console.log('');
    console.log('🔗 Running Integration Tests...');
    console.log('-'.repeat(50));

    const integrationTestSuites = [
      'BlueprintSectionService',
      'MasteryCriterionService',
      'KnowledgeGraphTraversal',
      'RAG Integration',
      'Database Operations'
    ];

    for (const suite of integrationTestSuites) {
      await this.runTestSuite(`integration/${suite.toLowerCase().replace(/service$/, '')}.integration.test.ts`, suite);
    }
  }

  private async runPerformanceTests(): Promise<void> {
    console.log('');
    console.log('⚡ Running Performance Tests...');
    console.log('-'.repeat(50));

    const performanceTestSuites = [
      'Load Testing (1000+ sections)',
      'Database Performance',
      'Memory Usage Testing',
      'Concurrent User Testing',
      'Tree Depth Testing',
      'Mastery Calculation Performance',
      'Daily Task Generation Performance',
      'SR Algorithm Performance'
    ];

    for (const suite of performanceTestSuites) {
      await this.runPerformanceTestSuite(suite);
    }
  }

  private async runTestSuite(testPath: string, suiteName: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log(`📝 Running ${suiteName}...`);
      
      // Check if test file exists
      const fs = require('fs');
      const fullPath = `src/tests/${testPath}`;
      
      if (!fs.existsSync(fullPath)) {
        console.log(`⏭️  Skipping ${suiteName} - test file not found`);
        this.recordTestResult(suiteName, 0, 0, 1, 0, [`Test file not found: ${fullPath}`]);
        return;
      }

      // Run Jest test
      const result = execSync(`npm test -- --testPathPattern="${testPath}" --verbose --json`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Parse Jest output
      const jestOutput = JSON.parse(result);
      const testResult = this.parseJestOutput(jestOutput, suiteName);
      
      const duration = performance.now() - startTime;
      testResult.duration = duration;
      
      this.recordTestResult(
        suiteName,
        testResult.passed,
        testResult.failed,
        testResult.skipped,
        duration,
        testResult.errors
      );

      console.log(`✅ ${suiteName}: ${testResult.passed} passed, ${testResult.failed} failed, ${testResult.skipped} skipped`);

    } catch (error: any) {
      const duration = performance.now() - startTime;
      const errorMessage = error.stderr || error.message || 'Unknown error';
      
      this.recordTestResult(suiteName, 0, 1, 0, duration, [errorMessage]);
      console.log(`❌ ${suiteName}: Failed with error`);
    }
  }

  private async runPerformanceTestSuite(suiteName: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      console.log(`📊 Running ${suiteName}...`);
      
      // Run performance test using the performance testing service
      const { PerformanceTestingService } = require('../services/blueprint-centric/performanceTesting.service');
      const { MasteryPerformanceTestingService } = require('../services/blueprint-centric/masteryPerformanceTesting.service');
      
      const performanceService = new PerformanceTestingService();
      const masteryPerformanceService = new MasteryPerformanceTestingService();
      
      let testResult: any;
      
      switch (suiteName) {
        case 'Load Testing (1000+ sections)':
          testResult = await performanceService.runLoadTesting();
          break;
        case 'Database Performance':
          testResult = await performanceService.runDatabasePerformanceTests();
          break;
        case 'Memory Usage Testing':
          testResult = await performanceService.runMemoryUsageTests();
          break;
        case 'Concurrent User Testing':
          testResult = await performanceService.runConcurrentUserTests();
          break;
        case 'Tree Depth Testing':
          testResult = await performanceService.runTreeDepthTests();
          break;
        case 'Mastery Calculation Performance':
          testResult = await masteryPerformanceService.runMasteryCalculationPerformanceTests();
          break;
        case 'Daily Task Generation Performance':
          testResult = await masteryPerformanceService.runDailyTaskGenerationPerformanceTests();
          break;
        case 'SR Algorithm Performance':
          testResult = await masteryPerformanceService.runSRAlgorithmPerformanceTests();
          break;
        default:
          testResult = { success: true, duration: 0 };
      }
      
      const duration = performance.now() - startTime;
      
      if (testResult.success) {
        this.recordTestResult(suiteName, 1, 0, 0, duration, []);
        console.log(`✅ ${suiteName}: Performance test passed`);
      } else {
        this.recordTestResult(suiteName, 0, 1, 0, duration, [testResult.error || 'Performance test failed']);
        console.log(`❌ ${suiteName}: Performance test failed`);
      }

    } catch (error: any) {
      const duration = performance.now() - startTime;
      const errorMessage = error.message || 'Performance test error';
      
      this.recordTestResult(suiteName, 0, 1, 0, duration, [errorMessage]);
      console.log(`❌ ${suiteName}: Failed with error`);
    }
  }

  private parseJestOutput(jestOutput: any, suiteName: string): TestResult {
    const result: TestResult = {
      suite: suiteName,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      errors: []
    };

    if (jestOutput.testResults && jestOutput.testResults.length > 0) {
      const testResult = jestOutput.testResults[0];
      result.passed = testResult.numPassingTests || 0;
      result.failed = testResult.numFailingTests || 0;
      result.skipped = testResult.numPendingTests || 0;
      result.duration = testResult.perfStats?.end - testResult.perfStats?.start || 0;
      
      if (testResult.testResults) {
        testResult.testResults.forEach((test: any) => {
          if (test.status === 'failed') {
            result.errors.push(`${test.fullName}: ${test.failureMessages?.join(', ') || 'Test failed'}`);
          }
        });
      }
    }

    return result;
  }

  private recordTestResult(
    suite: string,
    passed: number,
    failed: number,
    skipped: number,
    duration: number,
    errors: string[]
  ): void {
    this.summary.totalSuites++;
    this.summary.totalTests += passed + failed + skipped;
    this.summary.totalPassed += passed;
    this.summary.totalFailed += failed;
    this.summary.totalSkipped += skipped;
    this.summary.totalDuration += duration;

    this.summary.results.push({
      suite,
      passed,
      failed,
      skipped,
      duration,
      errors
    });
  }

  private generateTestReport(): void {
    console.log('');
    console.log('📊 Test Execution Summary');
    console.log('=' .repeat(80));
    
    // Overall statistics
    console.log(`Total Test Suites: ${this.summary.totalSuites}`);
    console.log(`Total Tests: ${this.summary.totalTests}`);
    console.log(`Passed: ${this.summary.totalPassed} ✅`);
    console.log(`Failed: ${this.summary.totalFailed} ❌`);
    console.log(`Skipped: ${this.summary.totalSkipped} ⏭️`);
    console.log(`Total Duration: ${(this.summary.totalDuration / 1000).toFixed(2)}s`);
    console.log('');

    // Detailed results
    console.log('📋 Detailed Results:');
    console.log('-'.repeat(80));
    
    this.summary.results.forEach(result => {
      const status = result.failed > 0 ? '❌' : result.passed > 0 ? '✅' : '⏭️';
      const duration = (result.duration / 1000).toFixed(2);
      
      console.log(`${status} ${result.suite.padEnd(40)} | ${result.passed.toString().padStart(3)} passed | ${result.failed.toString().padStart(3)} failed | ${result.skipped.toString().padStart(3)} skipped | ${duration}s`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`   💥 ${error}`);
        });
      }
    });

    console.log('');
    console.log('🎯 Test Coverage Summary:');
    console.log('-'.repeat(80));
    
    // Sprint 50 coverage
    const sprint50Tests = this.summary.results.filter(r => 
      r.suite.includes('BlueprintSection') || 
      r.suite.includes('MasteryCriterion') || 
      r.suite.includes('NoteSection') ||
      r.suite.includes('ContentAggregator')
    );
    const sprint50Passed = sprint50Tests.reduce((sum, r) => sum + r.passed, 0);
    const sprint50Total = sprint50Tests.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0);
    console.log(`Sprint 50 (Blueprint-Centric Foundation): ${sprint50Passed}/${sprint50Total} tests passed`);

    // Sprint 51 coverage
    const sprint51Tests = this.summary.results.filter(r => 
      r.suite.includes('KnowledgeGraph') || 
      r.suite.includes('RAG') ||
      r.suite.includes('ContextAssembly')
    );
    const sprint51Passed = sprint51Tests.reduce((sum, r) => sum + r.passed, 0);
    const sprint51Total = sprint51Tests.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0);
    console.log(`Sprint 51 (Knowledge Graph & RAG): ${sprint51Passed}/${sprint51Total} tests passed`);

    // Performance testing coverage
    const performanceTests = this.summary.results.filter(r => 
      r.suite.includes('Performance') || 
      r.suite.includes('Load') ||
      r.suite.includes('Memory') ||
      r.suite.includes('Concurrent') ||
      r.suite.includes('Tree Depth') ||
      r.suite.includes('Mastery Calculation') ||
      r.suite.includes('Daily Task') ||
      r.suite.includes('SR Algorithm')
    );
    const performancePassed = performanceTests.reduce((sum, r) => sum + r.passed, 0);
    const performanceTotal = performanceTests.reduce((sum, r) => sum + r.passed + r.failed + r.skipped, 0);
    console.log(`Performance Testing: ${performancePassed}/${performanceTotal} tests passed`);

    console.log('');
    
    // Final status
    if (this.summary.totalFailed === 0) {
      console.log('🎉 All tests passed! The Elevate Core API is ready for production.');
    } else {
      console.log(`⚠️  ${this.summary.totalFailed} tests failed. Please review and fix the issues.`);
      process.exit(1);
    }
  }
}

async function main(): Promise<void> {
  const runner = new ComprehensiveTestRunner();
  await runner.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export default ComprehensiveTestRunner;
