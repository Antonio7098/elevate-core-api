import prisma from '../lib/prisma';
import { QuestionSet, UserStudySession, Prisma } from '@prisma/client';
import createError from 'http-errors';

export interface QuestionSetStatsDetails {
  masteryHistory: Prisma.JsonValue[];
  reviewCount: number;
  reviewDates: Date[];
  currentSRStatus: {
    lastReviewedAt: Date | null;
    nextReviewAt: Date | null;
    currentIntervalDays: number | null;
    currentForgottenPercentage: number | null;
    forgettingCurveParams: Prisma.JsonValue | null;
  };
  understandScore: number;
  useScore: number;
  exploreScore: number;
  currentTotalMasteryScore: number;
}

export const fetchQuestionSetStatsDetails = async (
  userId: number,
  questionSetId: number
): Promise<QuestionSetStatsDetails> => {
  const questionSet = await prisma.questionSet.findUnique({
    where: { id: questionSetId },
    include: {
      folder: true, // To check ownership
    },
  });

  if (!questionSet) {
    throw createError(404, `QuestionSet with ID ${questionSetId} not found.`);
  }

  if (questionSet.folder.userId !== userId) {
    throw createError(403, 'User does not have access to this QuestionSet.');
  }

  const reviewSessions = await prisma.userStudySession.findMany({
    where: {
      userId,
      userQuestionAnswers: {
        some: {
          questionSetId: questionSetId,
        },
      },
    },
    orderBy: {
      sessionEndedAt: 'asc',
    },
    select: {
      sessionEndedAt: true,
    },
  });

  const reviewDates = reviewSessions.map((rs: { sessionEndedAt: Date }) => rs.sessionEndedAt);

  return {
    masteryHistory: questionSet.masteryHistory.filter((h: Prisma.JsonValue | null) => h !== null) as Prisma.JsonValue[], // Ensure no nulls
    reviewCount: questionSet.reviewCount,
    reviewDates,
    currentSRStatus: {
      lastReviewedAt: questionSet.lastReviewedAt,
      nextReviewAt: questionSet.nextReviewAt,
      currentIntervalDays: questionSet.currentIntervalDays,
      currentForgottenPercentage: questionSet.currentForgottenPercentage,
      forgettingCurveParams: questionSet.forgettingCurveParams,
    },
    understandScore: questionSet.understandScore,
    useScore: questionSet.useScore,
    exploreScore: questionSet.exploreScore,
    currentTotalMasteryScore: questionSet.currentTotalMasteryScore,
  };
};

export interface QuestionSetSummary {
  id: number;
  name: string;
  currentTotalMasteryScore: number | null;
  nextReviewAt: Date | null;
}

export interface OverallStats {
  masteryScore: number;
  understandScore: number;
  useScore: number;
  exploreScore: number;
  totalSets: number;
  masteredSets: number;
  inProgressSets: number;
  notStartedSets: number;
  dueSets: number;
  masteryHistory: Array<{ timestamp: Date; score: number }>;
}

export interface FolderStatsDetails {
  masteryHistory: Prisma.JsonValue[];
  totalReviewSessionsInFolder: number;
  questionSetSummaries: QuestionSetSummary[];
}

type UserWithFoldersAndSets = Prisma.UserGetPayload<{
  include: {
    folders: {
      include: {
        questionSets: true;
      };
    };
  };
}>;

export const getOverallStats = async (userId: number): Promise<OverallStats> => {
  const userWithFoldersAndSets: UserWithFoldersAndSets | null = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      folders: {
        include: {
          questionSets: true,
        },
      },
    },
  });

  if (!userWithFoldersAndSets) {
    throw createError(404, 'User not found.');
  }

  const allQuestionSets: QuestionSet[] = [];
  userWithFoldersAndSets.folders.forEach(folder => {
    folder.questionSets.forEach(qs => allQuestionSets.push(qs as QuestionSet));
  });

  if (allQuestionSets.length === 0) {
    return {
      masteryScore: 0,
      understandScore: 0,
      useScore: 0,
      exploreScore: 0,
      totalSets: 0,
      masteredSets: 0,
      inProgressSets: 0,
      notStartedSets: 0,
      dueSets: 0,
      masteryHistory: [],
    };
  }

  let totalMasteryScoreSum = 0;
  let totalUnderstandScoreSum = 0;
  let totalUseScoreSum = 0;
  let totalExploreScoreSum = 0;
  let masteredSets = 0;
  let inProgressSets = 0;
  let notStartedSets = 0;
  let dueSets = 0;
  const now = new Date();

  allQuestionSets.forEach(qs => {
    totalMasteryScoreSum += qs.currentTotalMasteryScore || 0;
    totalUnderstandScoreSum += qs.understandScore || 0;
    totalUseScoreSum += qs.useScore || 0;
    totalExploreScoreSum += qs.exploreScore || 0;

    const mastery = qs.currentTotalMasteryScore || 0;
    if (mastery >= 90) {
      masteredSets++;
    } else if (mastery > 0 && mastery < 90) {
      inProgressSets++;
    } else {
      notStartedSets++;
    }

    if (qs.nextReviewAt && new Date(qs.nextReviewAt) <= now) {
      dueSets++;
    }
  });

  const totalSets = allQuestionSets.length;
  // For overall mastery history, we'll return an empty array for now.
  // A more meaningful aggregation could be complex (e.g., average scores over time points).
  const overallMasteryHistory: Array<{ timestamp: Date; score: number }> = []; 

  return {
    masteryScore: totalSets > 0 ? Math.round(totalMasteryScoreSum / totalSets) : 0,
    understandScore: totalSets > 0 ? Math.round(totalUnderstandScoreSum / totalSets) : 0,
    useScore: totalSets > 0 ? Math.round(totalUseScoreSum / totalSets) : 0,
    exploreScore: totalSets > 0 ? Math.round(totalExploreScoreSum / totalSets) : 0,
    totalSets,
    masteredSets,
    inProgressSets,
    notStartedSets,
    dueSets,
    masteryHistory: overallMasteryHistory,
  };
};

export const fetchFolderStatsDetails = async (
  userId: number,
  folderId: number
): Promise<FolderStatsDetails> => {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  if (!folder) {
    throw createError(404, `Folder with ID ${folderId} not found.`);
  }

  if (folder.userId !== userId) {
    throw createError(403, 'User does not have access to this Folder.');
  }

  // Get all question sets in the folder
  const questionSetsInFolder = await prisma.questionSet.findMany({
    where: {
      folderId: folderId,
    },
    select: {
      id: true,
      name: true,
      currentTotalMasteryScore: true,
      nextReviewAt: true,
    },
  });

  const questionSetSummaries: QuestionSetSummary[] = questionSetsInFolder.map(qs => ({ // qs is implicitly typed by Prisma based on the select statement
    id: qs.id,
    name: qs.name,
    currentTotalMasteryScore: qs.currentTotalMasteryScore,
    nextReviewAt: qs.nextReviewAt,
  }));

  // Calculate total review sessions in the folder
  const questionSetIds = questionSetsInFolder.map(qs => qs.id);
  const totalReviewSessionsInFolder = await prisma.userStudySession.count({
    where: {
      userId,
      userQuestionAnswers: {
        some: {
          questionSetId: {
            in: questionSetIds,
          },
        },
      },
    },
  });

  return {
    masteryHistory: folder.masteryHistory.filter((h: Prisma.JsonValue | null) => h !== null) as Prisma.JsonValue[], // Ensure no nulls
    totalReviewSessionsInFolder,
    questionSetSummaries,
  };
};
