import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function insertMasteryHistory() {
  // 1. Find the user
  const user = await prisma.user.findUnique({
    where: { email: 'test@example.com' },
    include: { folders: true }
  });
  if (!user) throw new Error('User not found');

  // 2. Find a folder for the user
  const folder = user.folders[0];
  if (!folder) throw new Error('No folder found for user');

  // 3. Find a questionset in the folder
  const questionSet = await prisma.questionSet.findFirst({
    where: { folderId: folder.id }
  });
  if (!questionSet) throw new Error('No QuestionSet found for folder');

  // 4. Prepare masteryHistory entries (example)
  const masteryHistory = [
    {
      timestamp: new Date('2025-08-01T12:00:00Z'),
      totalMasteryScore: 0.9,
      understandScore: 0.9,
      useScore: 0.9,
      exploreScore: 0.9,
      intervalDays: 2
    },
    {
      timestamp: new Date('2025-09-05T12:00:00Z'),
      totalMasteryScore: 1.0,
      understandScore: 1.0,
      useScore: 1.0,
      exploreScore: 1.0,
      intervalDays: 3
    }
  ];

  // 5. Update the QuestionSet's masteryHistory
  await prisma.questionSet.update({
    where: { id: questionSet.id },
    data: { masteryHistory: masteryHistory as any }
  });

  console.log('Inserted mastery history for QuestionSet', questionSet.id);
}

insertMasteryHistory()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());