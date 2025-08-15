import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { execSync } from 'child_process';

export interface TestDatabaseConfig {
  container: StartedTestContainer;
  prisma: PrismaClient;
  databaseUrl: string;
  isDockerAvailable: boolean;
}

export class TestDatabaseManager {
  private static instance: TestDatabaseManager;
  private config: TestDatabaseConfig | null = null;

  private constructor() {}

  static getInstance(): TestDatabaseManager {
    if (!TestDatabaseManager.instance) {
      TestDatabaseManager.instance = new TestDatabaseManager();
    }
    return TestDatabaseManager.instance;
  }

  async setup(): Promise<TestDatabaseConfig> {
    if (this.config) {
      return this.config;
    }

    let container: StartedTestContainer | null = null;
    let isDockerAvailable = true;
    let databaseUrl: string;
    let prisma: PrismaClient;

    try {
      // Start PostgreSQL container
      container = await new GenericContainer('postgres:16-alpine')
        .withEnvironment({
          POSTGRES_PASSWORD: 'test',
          POSTGRES_USER: 'test',
          POSTGRES_DB: 'elevate_test_db'
        })
        .withExposedPorts(5432)
        .start();

      const port = container.getMappedPort(5432);
      const host = container.getHost();
      databaseUrl = `postgresql://test:test@${host}:${port}/elevate_test_db?schema=public`;

      // Wait for container to be ready
      await this.waitForDatabase(databaseUrl);

      // Apply migrations
      await this.runMigrations(databaseUrl);

      // Create Prisma client
      prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
      await prisma.$connect();

      this.config = {
        container,
        prisma,
        databaseUrl,
        isDockerAvailable: true
      };

      console.log('✅ Test database setup complete');
      return this.config;

    } catch (error) {
      isDockerAvailable = false;
      console.warn('⚠️ Docker unavailable, falling back to SQLite for testing');
      
      // Fallback to SQLite for testing
      const sqliteUrl = 'file:./test.db';
      databaseUrl = sqliteUrl;
      
      prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
      await prisma.$connect();

      this.config = {
        container: null as any,
        prisma,
        databaseUrl,
        isDockerAvailable: false
      };

      return this.config;
    }
  }

  private async waitForDatabase(databaseUrl: string): Promise<void> {
    const maxAttempts = 30;
    const delayMs = 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const tempPrisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
        await tempPrisma.$connect();
        await tempPrisma.$disconnect();
        console.log(`✅ Database ready after ${attempt} attempts`);
        return;
      } catch (error) {
        if (attempt === maxAttempts) {
          throw new Error(`Database failed to start after ${maxAttempts} attempts: ${error}`);
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  private async runMigrations(databaseUrl: string): Promise<void> {
    try {
      const projectRoot = path.resolve(__dirname, '../../../');
      
      // Set environment variable for migrations
      const env = { ...process.env, DATABASE_URL: databaseUrl };
      
      // Run migrations
      execSync('npx prisma migrate deploy', {
        cwd: projectRoot,
        stdio: 'inherit',
        env
      });

      // Generate Prisma client
      execSync('npx prisma generate', {
        cwd: projectRoot,
        stdio: 'inherit',
        env
      });

      console.log('✅ Database migrations applied successfully');
    } catch (error) {
      console.error('❌ Failed to run migrations:', error);
      throw error;
    }
  }

  async teardown(): Promise<void> {
    if (this.config) {
      try {
        await this.config.prisma.$disconnect();
        
        if (this.config.isDockerAvailable && this.config.container) {
          await this.config.container.stop();
          console.log('✅ Test database container stopped');
        }
        
        this.config = null;
      } catch (error) {
        console.error('❌ Error during test database teardown:', error);
      }
    }
  }

  getConfig(): TestDatabaseConfig | null {
    return this.config;
  }

  getPrisma(): PrismaClient | null {
    return this.config?.prisma || null;
  }
}

export default TestDatabaseManager;
