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
  // currentTotalMasteryScore: number; // Field removed from schema
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

  if (!questionSet.folder) {
    throw createError(404, `QuestionSet with ID ${questionSetId} has no associated folder.`);
  }

  if (questionSet.folder.userId !== userId) {
    throw createError(403, 'User does not have access to this QuestionSet.');
  }

  const answersInSet = await prisma.userQuestionAnswer.findMany({
    where: {
      userId,
      questionSetId,
    },
    select: {
      id: true, // questionSetStudySessionId doesn't exist, use id instead
    },
  });

  const uniqueSessionIds = [...new Set(answersInSet.map(a => a.id).filter(id => id !== null))] as number[];

  const reviewSessions = await prisma.userStudySession.findMany({
    where: {
      id: {
        in: uniqueSessionIds,
      },
      userId,
    },
    orderBy: {
      startedAt: 'asc', // sessionEndedAt doesn't exist, use startedAt
    },
    select: {
      startedAt: true, // sessionEndedAt doesn't exist, use startedAt
    },
  });

  const reviewDates = reviewSessions.map((rs: { startedAt: Date }) => rs.startedAt);

  return {
    masteryHistory: [], // masteryHistory doesn't exist in current schema
    reviewCount: 0, // reviewCount doesn't exist in current schema
    reviewDates,
    currentSRStatus: {
      lastReviewedAt: null, // lastReviewedAt doesn't exist in current schema
      nextReviewAt: null, // nextReviewAt doesn't exist in current schema
      currentIntervalDays: 1, // currentIntervalDays doesn't exist in current schema
      currentForgottenPercentage: 0, // currentForgottenPercentage doesn't exist in current schema
      forgettingCurveParams: null, // forgettingCurveParams doesn't exist in current schema
    },
    understandScore: 0, // understandScore doesn't exist in current schema
    useScore: 0, // useScore doesn't exist in current schema
    exploreScore: 0, // exploreScore doesn't exist in current schema
    // currentTotalMasteryScore: questionSet.currentTotalMasteryScore,
  };
};

export interface QuestionSetSummary {
  id: number;
  name: string;
  // currentTotalMasteryScore: number | null; // Field removed from schema
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
    // Note: These fields don't exist in current schema, so we use defaults
    totalUnderstandScoreSum += 0; // understandScore doesn't exist
    totalUseScoreSum += 0; // useScore doesn't exist
    totalExploreScoreSum += 0; // exploreScore doesn't exist

    // Since mastery tracking fields don't exist, we use a simple default
    const mastery = 0; // Default since currentTotalMasteryScore doesn't exist
    if (mastery >= 90) {
      masteredSets++;
    } else if (mastery > 0 && mastery < 90) {
      inProgressSets++;
    } else {
      notStartedSets++;
    }

    // Since nextReviewAt doesn't exist, we consider all sets as due
    dueSets++;
  });

  const totalSets = allQuestionSets.length;
  
  // Note: masteryHistory doesn't exist in current schema, so we use empty history
  const overallMasteryHistory: Array<{ timestamp: Date; score: number }> = [];

  return {
    masteryScore: 0, // totalMasteryScoreSum doesn't exist in current schema
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
): Promise<any> => {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
  });

  if (!folder) {
    throw createError(404, `Folder with ID ${folderId} not found.`);
  }

  if (folder.userId !== userId) {
    throw createError(403, 'User does not have access to this Folder.');
  }

  // Get direct question sets in the folder
  const questionSets = await prisma.questionSet.findMany({
    where: { folderId: folderId },
    select: {
      id: true,
      title: true, // name doesn't exist, use title
      // currentTotalMasteryScore: true, // Field removed from schema
      // nextReviewAt: true, // Field doesn't exist in current schema
    },
  });

  // Get direct subfolders
  const subfolders = await prisma.folder.findMany({
    where: { parentId: folderId, userId },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      imageUrls: true,
      isPinned: true,
    },
  });

  // Calculate total review sessions in the folder (for direct question sets only)
  const questionSetIds = questionSets.map(qs => qs.id);
  const totalReviewSessionsInFolder = questionSetIds.length > 0 ? await prisma.questionSetStudySession.count({
    where: {
      questionSetId: {
        in: questionSetIds,
      },
      userId: userId,
    },
  }) : 0;

  return {
    questionSets,
    subfolders,
    masteryHistory: [], // masteryHistory doesn't exist in current schema
    totalReviewSessionsInFolder,
  };
};
