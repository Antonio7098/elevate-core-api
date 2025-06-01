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

export interface FolderStatsDetails {
  masteryHistory: Prisma.JsonValue[];
  totalReviewSessionsInFolder: number;
  questionSetSummaries: QuestionSetSummary[];
}

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
