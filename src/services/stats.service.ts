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
      questionSetStudySessionId: true,
    },
  });

  const uniqueSessionIds = [...new Set(answersInSet.map(a => a.questionSetStudySessionId).filter(id => id !== null))] as number[];

  const reviewSessions = await prisma.userStudySession.findMany({
    where: {
      id: {
        in: uniqueSessionIds,
      },
      userId,
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
  
  // Calculate overall mastery history by aggregating from all question sets
  const overallMasteryHistory: Array<{ timestamp: Date; score: number }> = [];
  
  // Get all unique timestamps from all question sets' mastery history
  const allTimestamps = new Set<string>();
  allQuestionSets.forEach(qs => {
    if (qs.masteryHistory && Array.isArray(qs.masteryHistory)) {
      qs.masteryHistory.forEach((entry: any) => {
        if (entry && entry.timestamp) {
          allTimestamps.add(entry.timestamp);
        }
      });
    }
  });
  
  // Sort timestamps chronologically
  const sortedTimestamps = Array.from(allTimestamps).sort();
  
  // Calculate average mastery score for each timestamp
  sortedTimestamps.forEach(timestamp => {
    let totalScore = 0;
    let setCount = 0;
    
    allQuestionSets.forEach(qs => {
      if (qs.masteryHistory && Array.isArray(qs.masteryHistory)) {
        const entry = qs.masteryHistory.find((e: any) => e && typeof e === 'object' && e.timestamp === timestamp);
        if (entry && typeof entry === 'object' && 'totalMasteryScore' in entry && typeof entry.totalMasteryScore === 'number') {
          totalScore += entry.totalMasteryScore;
          setCount++;
        }
      }
    });
    
    if (setCount > 0) {
      overallMasteryHistory.push({
        timestamp: new Date(timestamp),
        score: Math.round(totalScore / setCount)
      });
    }
  });

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
      name: true,
      currentTotalMasteryScore: true,
      nextReviewAt: true,
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
    masteryHistory: folder.masteryHistory.filter((h: Prisma.JsonValue | null) => h !== null) as Prisma.JsonValue[],
    totalReviewSessionsInFolder,
  };
};
