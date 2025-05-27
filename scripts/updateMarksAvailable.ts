/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting script to update marksAvailable for questions...');

  const questionsToUpdate = await prisma.question.findMany({
    where: {
      marksAvailable: null,
    },
  });

  if (questionsToUpdate.length === 0) {
    console.log('No questions found with null marksAvailable. Exiting.');
    return;
  }

  console.log(`Found ${questionsToUpdate.length} questions to update.`);

  let updatedCount = 0;
  for (const question of questionsToUpdate) {
    try {
      await prisma.question.update({
        where: { id: question.id },
        data: { marksAvailable: 1 }, // Set default marksAvailable to 1
      });
      updatedCount++;
    } catch (error) {
      console.error(`Failed to update question with ID ${question.id}:`, error);
    }
  }

  console.log(`Successfully updated marksAvailable for ${updatedCount} questions.`);
}

main()
  .catch((e) => {
    console.error('Error running script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
