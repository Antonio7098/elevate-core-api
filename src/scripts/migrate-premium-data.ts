import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function migratePremiumData(): Promise<void> {
  try {
    console.log('🚀 Starting premium data migration...');

    // Get all existing users
    const users = await prisma.user.findMany({
      include: {
        knowledgePrimitives: {
          include: {
            masteryCriteria: true,
            userPrimitiveProgresses: true,
          },
        },
        userMemory: true,
      },
    });

    console.log(`📊 Found ${users.length} users to migrate`);

    for (const user of users) {
      console.log(`🔄 Migrating user ${user.id} (${user.email})...`);

      // 1. Update KnowledgePrimitive with premium fields
      await migrateUserKnowledgePrimitives(user);

      // 2. Initialize UserMemory with premium fields if not exists
      await initializeUserMemory(user);

      // 3. Create initial learning paths for active users
      await createInitialLearningPaths(user);

      // 4. Initialize daily analytics
      await initializeDailyAnalytics(user);

      console.log(`✅ Completed migration for user ${user.id}`);
    }

    console.log('🎉 Premium data migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during premium data migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function migrateUserKnowledgePrimitives(user: any): Promise<void> {
  const primitives = user.knowledgePrimitives;
  
  for (const primitive of primitives) {
    const updatedFields: any = {};

    // Calculate complexity score
    const criteriaCount = primitive.masteryCriteria?.length || 0;
    const difficultyMultiplier = getDifficultyMultiplier(primitive.difficultyLevel);
    updatedFields.complexityScore = Math.min(10, Math.max(1, criteriaCount * difficultyMultiplier));

    // Determine if it's a core concept
    updatedFields.isCoreConcept = criteriaCount >= 3 || primitive.primitiveType === 'concept';

    // Generate concept tags
    updatedFields.conceptTags = generateConceptTags(primitive.title, primitive.description);

    // Calculate estimated prerequisites
    updatedFields.estimatedPrerequisites = Math.ceil(updatedFields.complexityScore / 2);

    // Update the primitive
    await prisma.knowledgePrimitive.update({
      where: { id: primitive.id },
      data: updatedFields,
    });
  }

  console.log(`  📚 Updated ${primitives.length} knowledge primitives for user ${user.id}`);
}

async function initializeUserMemory(user: any): Promise<void> {
  if (!user.userMemory) {
    await prisma.userMemory.create({
      data: {
        userId: user.id,
        cognitiveApproach: 'ADAPTIVE',
        explanationStyles: ['ANALOGY_DRIVEN', 'PRACTICAL_EXAMPLES'],
        interactionStyle: 'SOCRATIC',
        primaryGoal: 'Master complex concepts through active learning',
      },
    });
    console.log(`  🧠 Created user memory profile for user ${user.id}`);
  }
}

async function createInitialLearningPaths(user: any): Promise<void> {
  // Only create learning paths for users with active knowledge primitives
  const activePrimitives = user.knowledgePrimitives.filter((kp: any) => 
    kp.userPrimitiveProgresses.some((progress: any) => 
      progress.masteryLevel !== 'NOT_STARTED'
    )
  );

  if (activePrimitives.length === 0) {
    return;
  }

  // Create a "Core Concepts" learning path
  const corePath = await prisma.learningPath.create({
    data: {
      userId: user.id,
      pathName: 'Core Concepts Mastery',
      description: 'Master the fundamental concepts in your learning journey',
      targetMasteryLevel: 'EXPLORE',
      estimatedDurationDays: 30,
    },
  });

  // Add core concepts as steps
  const coreConcepts = activePrimitives.filter((kp: any) => kp.isCoreConcept);
  for (let i = 0; i < Math.min(coreConcepts.length, 5); i++) {
    const concept = coreConcepts[i];
    await prisma.learningPathStep.create({
      data: {
        learningPathId: corePath.id,
        primitiveId: concept.primitiveId,
        stepOrder: i + 1,
        estimatedTimeMinutes: Math.ceil((concept.complexityScore || 5) * 10),
      },
    });
  }

  console.log(`  🛤️  Created learning path with ${Math.min(coreConcepts.length, 5)} steps for user ${user.id}`);
}

async function initializeDailyAnalytics(user: any): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if analytics already exist for today
  const existingAnalytics = await prisma.userLearningAnalytics.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: today,
      },
    },
  });

  if (!existingAnalytics) {
    // Calculate initial analytics from existing data
    const totalStudyTime = user.knowledgePrimitives.reduce((sum: number, kp: any) => {
      return sum + (kp.userPrimitiveProgresses.reduce((progressSum: number, progress: any) => {
        return progressSum + (progress.reviewCount || 0) * 5; // Estimate 5 minutes per review
      }, 0));
    }, 0);

    const conceptsReviewed = user.knowledgePrimitives.filter((kp: any) => 
      kp.userPrimitiveProgresses.some((progress: any) => progress.reviewCount > 0)
    ).length;

    const conceptsMastered = user.knowledgePrimitives.filter((kp: any) => 
      kp.userPrimitiveProgresses.some((progress: any) => progress.masteryLevel === 'EXPLORE')
    ).length;

    await prisma.userLearningAnalytics.create({
      data: {
        userId: user.id,
        date: today,
        totalStudyTimeMinutes: totalStudyTime,
        conceptsReviewed,
        conceptsMastered,
        averageMasteryScore: conceptsMastered / Math.max(conceptsReviewed, 1),
        learningEfficiency: 0.7, // Default efficiency
        focusAreas: [],
        achievements: [],
      },
    });

    console.log(`  📊 Created initial daily analytics for user ${user.id}`);
  }
}

function getDifficultyMultiplier(difficultyLevel: string): number {
  switch (difficultyLevel) {
    case 'beginner':
      return 1.0;
    case 'intermediate':
      return 1.5;
    case 'advanced':
      return 2.0;
    default:
      return 1.0;
  }
}

function generateConceptTags(title: string, description?: string): string[] {
  const tags: string[] = [];
  
  // Extract key terms from title
  const titleWords = title.toLowerCase().split(/\s+/);
  tags.push(...titleWords.filter(word => word.length > 3));

  // Extract key terms from description
  if (description) {
    const descWords = description.toLowerCase().split(/\s+/);
    tags.push(...descWords.filter(word => word.length > 3));
  }

  // Remove duplicates and limit to 10 tags
  return [...new Set(tags)].slice(0, 10);
}

// CLI entry point
if (require.main === module) {
  migratePremiumData()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}
