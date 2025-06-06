// One-off script to backfill nextReviewAt for all QuestionSets where it is null
// Usage: node scripts/backfill-nextReviewAt.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for consistency

  const setsToUpdate = await prisma.questionSet.findMany({
    where: { nextReviewAt: null },
    select: { id: true },
  });

  if (setsToUpdate.length === 0) {
    console.log('No QuestionSets found with nextReviewAt = null. No updates needed.');
    return;
  }

  const updatePromises = setsToUpdate.map(set =>
    prisma.questionSet.update({
      where: { id: set.id },
      data: { nextReviewAt: today },
    })
  );

  await Promise.all(updatePromises);

  console.log(`Updated ${setsToUpdate.length} QuestionSets to have nextReviewAt = ${today.toISOString()}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
