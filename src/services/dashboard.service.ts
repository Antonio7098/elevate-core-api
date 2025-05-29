import prisma from '../lib/prisma';
import { Prisma, QuestionSet } from '@prisma/client';

// --- Interfaces for the final response structure ---
interface DueTodaySet {
  id: number;
  name: string;
  folderId?: number | null; // folderId is directly on QuestionSet
  nextReviewAt: Date | null;
  questionCount: number;
}

interface RecentProgressSet {
  id: number;
  name: string;
  folderId?: number | null; // folderId is directly on QuestionSet
  currentTotalMasteryScore: number | null;
  understandScore: number | null;
  useScore: number | null;
  exploreScore: number | null;
  lastReviewedAt: Date | null;
  questionCount: number;
}

interface OverallStats {
  totalSets: number;
  averageMastery: number;
  setsDueCount: number;
}

export interface DashboardDetails {
  dueToday: DueTodaySet[];
  recentProgress: RecentProgressSet[];
  overallStats: OverallStats;
}

// Type for Prisma's result when _count is included
// Assumes Prisma returns the full QuestionSet object plus _count
type QuestionSetWithCount = QuestionSet & {
  _count: { questions: number };
};

// Type for Prisma's result for calculating overall stats (no _count needed here)
type UserSetForStats = Prisma.QuestionSetGetPayload<{
  select: { currentTotalMasteryScore: true };
}>;

const fetchDashboardDetails = async (userId: number): Promise<DashboardDetails> => {
  const today = new Date();
  const endOfToday = new Date(today.setHours(23, 59, 59, 999));

  // 1. Fetch "Due Today" Question Sets
  const dueTodayArgs: Prisma.QuestionSetFindManyArgs = {
    where: {
      folder: { 
        userId: userId, 
      },
      nextReviewAt: { lte: endOfToday },
    },
    select: { // Select specific fields for efficiency, even if type expects full QuestionSet + _count
      id: true,
      name: true,
      folderId: true,
      nextReviewAt: true,
      _count: { select: { questions: true } },
    },
    orderBy: { nextReviewAt: 'asc' },
  };
  // Cast to the type that includes all QuestionSet fields plus _count
  const dueTodayPrisma = (await prisma.questionSet.findMany(dueTodayArgs)) as QuestionSetWithCount[];

  const formattedDueToday: DueTodaySet[] = dueTodayPrisma.map(set => ({
    id: set.id,
    name: set.name,
    folderId: set.folderId, // folderId is directly available
    nextReviewAt: set.nextReviewAt,
    questionCount: set._count.questions,
  }));

  // 2. Fetch "Recent Progress" Question Sets
  const recentProgressArgs: Prisma.QuestionSetFindManyArgs = {
    where: {
      folder: { 
        userId: userId, 
      },
      lastReviewedAt: { not: null },
    },
    select: { // Select specific fields for efficiency
      id: true,
      name: true,
      folderId: true,
      currentTotalMasteryScore: true,
      understandScore: true,
      useScore: true,
      exploreScore: true,
      lastReviewedAt: true,
      _count: { select: { questions: true } },
    },
    orderBy: { lastReviewedAt: 'desc' },
    take: 5,
  };
  const recentProgressPrisma = (await prisma.questionSet.findMany(recentProgressArgs)) as QuestionSetWithCount[];

  const formattedRecentProgress: RecentProgressSet[] = recentProgressPrisma.map(set => ({
    id: set.id,
    name: set.name,
    folderId: set.folderId, // folderId is directly available
    currentTotalMasteryScore: set.currentTotalMasteryScore ?? null,
    understandScore: set.understandScore ?? null,
    useScore: set.useScore ?? null,
    exploreScore: set.exploreScore ?? null,
    lastReviewedAt: set.lastReviewedAt ?? null,
    questionCount: set._count.questions,
  }));

  // 3. Calculate "Overall Stats"
  const allUserSetsArgs: Prisma.QuestionSetFindManyArgs = {
    where: { 
      folder: { 
        userId: userId, 
      },
    },
    select: { currentTotalMasteryScore: true }, // Only need mastery score here
  };
  // UserSetForStats type is fine as it doesn't involve _count complexity
  const allUserSetsForStats = (await prisma.questionSet.findMany(allUserSetsArgs)) as UserSetForStats[];

  const totalSets = allUserSetsForStats.length;
  let averageMastery = 0;
  if (totalSets > 0) {
    const sumOfMastery = allUserSetsForStats.reduce(
      (sum: number, set) => sum + (set.currentTotalMasteryScore || 0),
      0
    );
    averageMastery = sumOfMastery / totalSets;
  }

  const overallStats: OverallStats = {
    totalSets,
    averageMastery: parseFloat(averageMastery.toFixed(2)),
    setsDueCount: formattedDueToday.length,
  };

  return {
    dueToday: formattedDueToday,
    recentProgress: formattedRecentProgress,
    overallStats,
  };
};

export default {
  fetchDashboardDetails,
};
