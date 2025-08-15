import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface TestUserOptions {
  email?: string;
  bucketPrefs?: {
    bucketSize?: number;
    reviewInterval?: number;
  };
}

export async function createTestUser(options: TestUserOptions = {}): Promise<{ id: number; token: string }> {
  const { email = 'test@example.com', bucketPrefs = {} } = options;

  await prisma.$connect();

  console.log('🌱 Starting test user creation...');

  // Clean previous test user for idempotence
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('🧹 Cleaning up previous test user...');
    await prisma.user.delete({ where: { id: existing.id } });
    console.log('✅ Previous test user deleted.');
  }

  // Create user
  console.log('👤 Creating test user...');
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Test User',
      password: await bcrypt.hash('password123', 10),
      dailyStudyTimeMinutes: 30,
    },
  });
  console.log(`✅ User created: ${user.email} (ID: ${user.id})`);

  // Bucket preferences
  console.log('⚙️ Creating bucket preferences...');
  await prisma.userBucketPreferences.create({
    data: {
      userId: user.id,
      bucketSize: bucketPrefs.bucketSize ?? 10,
      reviewInterval: bucketPrefs.reviewInterval ?? 1,
    },
  });
  console.log('✅ Bucket preferences created.');

  // User memory profile
  console.log('🧠 Creating user memory profile...');
  await prisma.userMemory.create({
    data: {
      userId: user.id,
      cognitiveApproach: 'ADAPTIVE',
      explanationStyles: ['ANALOGY_DRIVEN', 'PRACTICAL_EXAMPLES'],
      interactionStyle: 'SOCRATIC',
      primaryGoal: 'Master complex concepts through active learning',
    },
  });
  console.log('✅ User memory profile created.');

  // Skip blueprint creation for now to avoid ID conflicts
  console.log('📋 Skipping blueprint creation to avoid ID conflicts...');

  // Generate token
  const token = generateToken(user);

  console.log('🎉 Test user creation completed successfully!');
  return { id: user.id, token };
}

// For direct script execution
if (require.main === module) {
  createTestUser({ email: 'learning-blueprint-test@example.com' })
    .then(({ id, token }) => {
      console.log(`\n✅ Test user created successfully!`);
      console.log(`User ID: ${id}`);
      console.log(`Token: ${token}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error creating test user:', error);
      process.exit(1);
    });
}