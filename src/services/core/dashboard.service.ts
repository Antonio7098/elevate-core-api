import prisma from '../../lib/prisma';
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
  select: { 
    id: true;
    title: true;
  };
}>;

const fetchDashboardDetails = async (userId: number): Promise<DashboardDetails> => {
  // TEMPORARY FIX: Return minimal dashboard data since the old schema fields don't exist
  // TODO: Update dashboard to use primitive-centric approach from Sprint 29
  
  // For now, return empty/default data to prevent server crashes
  const formattedDueToday: DueTodaySet[] = [];

  // 2. Recently Reviewed - temporarily empty
  const formattedRecentProgress: RecentProgressSet[] = [];

  // 3. Overall stats - temporarily use default values
  const allUserSetsForStats: UserSetForStats[] = [];

  const totalSets = 0;
  const totalMasteryScore = 0;
  const averageMasteryScore = 0;

  const overallStats: OverallStats = {
    totalSets,
    averageMastery: parseFloat(averageMasteryScore.toFixed(2)),
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
