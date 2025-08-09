import { GenericContainer, StartedTestContainer } from 'testcontainers';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { execSync } from 'child_process';

jest.setTimeout(180_000); // containers + migrations may take a while

describe('Primitive-SR data migration', () => {
  let container: StartedTestContainer | null = null;
  let dockerAvailable = true;
  let prisma: PrismaClient;

  beforeAll(async () => {
    // Try to spin up a disposable Postgres instance. If Docker is unavailable, fall back to a temp SQLite DB
    let dbUrl: string;
    try {
      container = await new GenericContainer('postgres:16-alpine')
        .withEnvironment({ POSTGRES_PASSWORD: 'test' })
        .withExposedPorts(5432)
        .start();

      const port = container.getMappedPort(5432);
      const host = container.getHost();
      dbUrl = `postgresql://postgres:test@${host}:${port}/postgres?schema=public`;
    } catch (err) {
      dockerAvailable = false;
      // Fallback to SQLite file DB
      const dbFile = path.join(os.tmpdir(), `prisma-test-${crypto.randomUUID()}.db`);
      fs.writeFileSync(dbFile, '');
      dbUrl = `file:${dbFile}`;
      console.warn('[migration-test] Docker unavailable – falling back to SQLite at', dbFile);
    }

    process.env.DATABASE_URL = dbUrl;

    if (dockerAvailable) {
      // Apply migrations to the fresh DB
      execSync('npx prisma migrate deploy', {
      cwd: path.resolve(__dirname, '../../'),
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: dbUrl },
      });
    }

    if (dockerAvailable) {
      prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });
      await prisma.$connect();
    }

    // TODO: Seed legacy data and call the actual migration script once implemented
  });

  afterAll(async () => {
    if (dockerAvailable) {
      await prisma?.$disconnect();
    }
    if (container) {
      await container.stop();
    }
  });

  const itFn = dockerAvailable ? it : it.skip;
  itFn('should run placeholder assertion', () => {
    expect(true).toBe(true);
  });
});
