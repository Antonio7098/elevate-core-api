/*
  Warnings:

  - You are about to drop the column `explanation` on the `InsightCatalyst` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrls` on the `InsightCatalyst` table. All the data in the column will be lost.
  - You are about to drop the column `questionId` on the `InsightCatalyst` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `InsightCatalyst` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `InsightCatalyst` table. All the data in the column will be lost.
  - You are about to drop the column `plainText` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `questionSetId` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `aiGenerated` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `answer` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `autoMark` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `conceptTags` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `currentMasteryScore` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `difficultyScore` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrls` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `inCat` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `lastAnswerCorrect` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `markingCriteria` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `options` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `questionType` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `selfMark` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `timesAnsweredCorrectly` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `timesAnsweredIncorrectly` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `uueFocus` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `currentForgottenPercentage` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `currentIntervalDays` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `currentTotalMasteryScore` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `currentUUESetStage` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `easeFactor` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `exploreScore` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `forgettingCurveParams` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `instructions` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `isTracked` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `lapses` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `lastReviewedAt` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `masteryHistory` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `nextReviewAt` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `reviewCount` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `srStage` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `trackingMode` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `understandScore` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `useScore` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `QuestionSetStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `QuestionSetStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `sessionMarksAchieved` on the `QuestionSetStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `sessionMarksAvailable` on the `QuestionSetStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `srStageBefore` on the `QuestionSetStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `reviewDate` on the `ScheduledReview` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ScheduledReview` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ScheduledReview` table. All the data in the column will be lost.
  - You are about to drop the column `answeredAt` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `confidence` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `questionSetStudySessionId` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `scoreAchieved` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `timeSpent` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `userAnswerText` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `answeredQuestionsCount` on the `UserStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `UserStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `sessionEndedAt` on the `UserStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `sessionStartedAt` on the `UserStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `timeSpentSeconds` on the `UserStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserStudySession` table. All the data in the column will be lost.
  - You are about to drop the `_QuestionToQuestionSetStudySession` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `content` to the `InsightCatalyst` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `InsightCatalyst` table without a default value. This is not possible if the table is not empty.
  - Made the column `noteId` on table `InsightCatalyst` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `questionText` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `QuestionSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `QuestionSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scheduledFor` to the `ScheduledReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ScheduledReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserQuestionAnswer` table without a default value. This is not possible if the table is not empty.
  - Made the column `questionSetId` on table `UserQuestionAnswer` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `questionSetId` to the `UserStudySession` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TrackingIntensity" AS ENUM ('DENSE', 'NORMAL', 'SPARSE');

-- CreateEnum
CREATE TYPE "MasteryThresholdLevel" AS ENUM ('SURVEY', 'PROFICIENT', 'EXPERT');

-- DropForeignKey
ALTER TABLE "InsightCatalyst" DROP CONSTRAINT "InsightCatalyst_noteId_fkey";

-- DropForeignKey
ALTER TABLE "InsightCatalyst" DROP CONSTRAINT "InsightCatalyst_questionId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_questionSetId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionSetStudySession" DROP CONSTRAINT "QuestionSetStudySession_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "UserQuestionAnswer" DROP CONSTRAINT "UserQuestionAnswer_questionSetId_fkey";

-- DropForeignKey
ALTER TABLE "UserQuestionAnswer" DROP CONSTRAINT "UserQuestionAnswer_questionSetStudySessionId_fkey";

-- DropForeignKey
ALTER TABLE "_QuestionToQuestionSetStudySession" DROP CONSTRAINT "_QuestionToQuestionSetStudySession_A_fkey";

-- DropForeignKey
ALTER TABLE "_QuestionToQuestionSetStudySession" DROP CONSTRAINT "_QuestionToQuestionSetStudySession_B_fkey";

-- DropIndex
DROP INDEX "InsightCatalyst_questionId_idx";

-- DropIndex
DROP INDEX "Note_questionSetId_idx";

-- DropIndex
DROP INDEX "Question_uueFocus_idx";

-- DropIndex
DROP INDEX "QuestionSetStudySession_sessionId_questionSetId_key";

-- DropIndex
DROP INDEX "ScheduledReview_userId_reviewDate_idx";

-- DropIndex
DROP INDEX "UserQuestionAnswer_answeredAt_idx";

-- DropIndex
DROP INDEX "UserQuestionAnswer_questionSetStudySessionId_idx";

-- DropIndex
DROP INDEX "UserStudySession_sessionEndedAt_idx";

-- AlterTable
ALTER TABLE "InsightCatalyst" DROP COLUMN "explanation",
DROP COLUMN "imageUrls",
DROP COLUMN "questionId",
DROP COLUMN "text",
DROP COLUMN "type",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "noteId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Note" DROP COLUMN "plainText",
DROP COLUMN "questionSetId",
ADD COLUMN     "imageUrls" TEXT[],
ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "content" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "aiGenerated",
DROP COLUMN "answer",
DROP COLUMN "autoMark",
DROP COLUMN "conceptTags",
DROP COLUMN "createdAt",
DROP COLUMN "currentMasteryScore",
DROP COLUMN "difficultyScore",
DROP COLUMN "imageUrls",
DROP COLUMN "inCat",
DROP COLUMN "lastAnswerCorrect",
DROP COLUMN "markingCriteria",
DROP COLUMN "options",
DROP COLUMN "questionType",
DROP COLUMN "selfMark",
DROP COLUMN "text",
DROP COLUMN "timesAnsweredCorrectly",
DROP COLUMN "timesAnsweredIncorrectly",
DROP COLUMN "updatedAt",
DROP COLUMN "uueFocus",
ADD COLUMN     "answerText" TEXT,
ADD COLUMN     "questionText" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "QuestionSet" DROP COLUMN "currentForgottenPercentage",
DROP COLUMN "currentIntervalDays",
DROP COLUMN "currentTotalMasteryScore",
DROP COLUMN "currentUUESetStage",
DROP COLUMN "easeFactor",
DROP COLUMN "exploreScore",
DROP COLUMN "forgettingCurveParams",
DROP COLUMN "instructions",
DROP COLUMN "isTracked",
DROP COLUMN "lapses",
DROP COLUMN "lastReviewedAt",
DROP COLUMN "masteryHistory",
DROP COLUMN "name",
DROP COLUMN "nextReviewAt",
DROP COLUMN "reviewCount",
DROP COLUMN "srStage",
DROP COLUMN "trackingMode",
DROP COLUMN "understandScore",
DROP COLUMN "useScore",
ADD COLUMN     "imageUrls" TEXT[],
ADD COLUMN     "marksAvailable" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "QuestionSetStudySession" DROP COLUMN "createdAt",
DROP COLUMN "sessionId",
DROP COLUMN "sessionMarksAchieved",
DROP COLUMN "sessionMarksAvailable",
DROP COLUMN "srStageBefore",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "correctAnswers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "difficultyLevel" TEXT,
ADD COLUMN     "marksAwarded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "masteryScore" DOUBLE PRECISION,
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "timeSpentMinutes" INTEGER,
ADD COLUMN     "totalMarks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalQuestions" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ScheduledReview" DROP COLUMN "reviewDate",
DROP COLUMN "status",
DROP COLUMN "type",
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "scheduledFor" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "UserQuestionAnswer" DROP COLUMN "answeredAt",
DROP COLUMN "confidence",
DROP COLUMN "questionSetStudySessionId",
DROP COLUMN "scoreAchieved",
DROP COLUMN "timeSpent",
DROP COLUMN "userAnswerText",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "marksAwarded" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userAnswer" TEXT,
ALTER COLUMN "isCorrect" DROP NOT NULL,
ALTER COLUMN "questionSetId" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserStudySession" DROP COLUMN "answeredQuestionsCount",
DROP COLUMN "createdAt",
DROP COLUMN "sessionEndedAt",
DROP COLUMN "sessionStartedAt",
DROP COLUMN "timeSpentSeconds",
DROP COLUMN "updatedAt",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "correctAnswers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "marksAwarded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "questionSetId" INTEGER NOT NULL,
ADD COLUMN     "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "totalMarks" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalQuestions" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "_QuestionToQuestionSetStudySession";

-- CreateTable
CREATE TABLE "KnowledgePrimitive" (
    "id" SERIAL NOT NULL,
    "primitiveId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "primitiveType" TEXT NOT NULL,
    "difficultyLevel" TEXT NOT NULL,
    "estimatedTimeMinutes" INTEGER,
    "userId" INTEGER NOT NULL,
    "blueprintId" INTEGER NOT NULL,
    "trackingIntensity" "TrackingIntensity" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgePrimitive_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasteryCriterion" (
    "id" SERIAL NOT NULL,
    "criterionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ueeLevel" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "userId" INTEGER NOT NULL,
    "primitiveId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "difficulty" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MasteryCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPrimitiveProgress" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "primitiveId" TEXT NOT NULL,
    "blueprintId" INTEGER NOT NULL,
    "masteryLevel" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "trackingIntensity" "TrackingIntensity" NOT NULL DEFAULT 'NORMAL',
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "successfulReviews" INTEGER NOT NULL DEFAULT 0,
    "difficultyMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPrimitiveProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCriterionMastery" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "criterionId" TEXT NOT NULL,
    "primitiveId" TEXT NOT NULL,
    "blueprintId" INTEGER NOT NULL,
    "isMastered" BOOLEAN NOT NULL DEFAULT false,
    "masteredAt" TIMESTAMP(3),
    "lastAttemptedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "successfulAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCriterionMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PinnedReview" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "primitiveId" TEXT NOT NULL,
    "reviewAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PinnedReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBucketPreferences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "criticalSize" INTEGER NOT NULL DEFAULT 10,
    "coreSize" INTEGER NOT NULL DEFAULT 15,
    "plusSize" INTEGER NOT NULL DEFAULT 5,
    "addMoreIncrement" INTEGER NOT NULL DEFAULT 5,
    "maxDailyLimit" INTEGER NOT NULL DEFAULT 50,
    "masteryThresholdLevel" "MasteryThresholdLevel" NOT NULL DEFAULT 'PROFICIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBucketPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePrimitive_primitiveId_key" ON "KnowledgePrimitive"("primitiveId");

-- CreateIndex
CREATE INDEX "KnowledgePrimitive_userId_idx" ON "KnowledgePrimitive"("userId");

-- CreateIndex
CREATE INDEX "KnowledgePrimitive_blueprintId_idx" ON "KnowledgePrimitive"("blueprintId");

-- CreateIndex
CREATE INDEX "KnowledgePrimitive_primitiveId_idx" ON "KnowledgePrimitive"("primitiveId");

-- CreateIndex
CREATE UNIQUE INDEX "MasteryCriterion_criterionId_key" ON "MasteryCriterion"("criterionId");

-- CreateIndex
CREATE INDEX "MasteryCriterion_userId_idx" ON "MasteryCriterion"("userId");

-- CreateIndex
CREATE INDEX "MasteryCriterion_primitiveId_idx" ON "MasteryCriterion"("primitiveId");

-- CreateIndex
CREATE INDEX "MasteryCriterion_criterionId_idx" ON "MasteryCriterion"("criterionId");

-- CreateIndex
CREATE INDEX "UserPrimitiveProgress_userId_idx" ON "UserPrimitiveProgress"("userId");

-- CreateIndex
CREATE INDEX "UserPrimitiveProgress_primitiveId_idx" ON "UserPrimitiveProgress"("primitiveId");

-- CreateIndex
CREATE INDEX "UserPrimitiveProgress_blueprintId_idx" ON "UserPrimitiveProgress"("blueprintId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPrimitiveProgress_userId_primitiveId_blueprintId_key" ON "UserPrimitiveProgress"("userId", "primitiveId", "blueprintId");

-- CreateIndex
CREATE INDEX "UserCriterionMastery_userId_idx" ON "UserCriterionMastery"("userId");

-- CreateIndex
CREATE INDEX "UserCriterionMastery_criterionId_idx" ON "UserCriterionMastery"("criterionId");

-- CreateIndex
CREATE INDEX "UserCriterionMastery_primitiveId_idx" ON "UserCriterionMastery"("primitiveId");

-- CreateIndex
CREATE INDEX "UserCriterionMastery_blueprintId_idx" ON "UserCriterionMastery"("blueprintId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCriterionMastery_userId_criterionId_primitiveId_bluepri_key" ON "UserCriterionMastery"("userId", "criterionId", "primitiveId", "blueprintId");

-- CreateIndex
CREATE INDEX "PinnedReview_userId_idx" ON "PinnedReview"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PinnedReview_userId_primitiveId_key" ON "PinnedReview"("userId", "primitiveId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBucketPreferences_userId_key" ON "UserBucketPreferences"("userId");

-- CreateIndex
CREATE INDEX "QuestionSet_userId_idx" ON "QuestionSet"("userId");

-- CreateIndex
CREATE INDEX "ScheduledReview_userId_idx" ON "ScheduledReview"("userId");

-- CreateIndex
CREATE INDEX "ScheduledReview_questionSetId_idx" ON "ScheduledReview"("questionSetId");

-- CreateIndex
CREATE INDEX "ScheduledReview_scheduledFor_idx" ON "ScheduledReview"("scheduledFor");

-- CreateIndex
CREATE INDEX "UserStudySession_questionSetId_idx" ON "UserStudySession"("questionSetId");

-- AddForeignKey
ALTER TABLE "KnowledgePrimitive" ADD CONSTRAINT "KnowledgePrimitive_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryCriterion" ADD CONSTRAINT "MasteryCriterion_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("primitiveId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryCriterion" ADD CONSTRAINT "MasteryCriterion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrimitiveProgress" ADD CONSTRAINT "UserPrimitiveProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrimitiveProgress" ADD CONSTRAINT "UserPrimitiveProgress_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("primitiveId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCriterionMastery" ADD CONSTRAINT "UserCriterionMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCriterionMastery" ADD CONSTRAINT "UserCriterionMastery_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("primitiveId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCriterionMastery" ADD CONSTRAINT "UserCriterionMastery_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "MasteryCriterion"("criterionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestionAnswer" ADD CONSTRAINT "UserQuestionAnswer_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStudySession" ADD CONSTRAINT "UserStudySession_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightCatalyst" ADD CONSTRAINT "InsightCatalyst_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSet" ADD CONSTRAINT "QuestionSet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinnedReview" ADD CONSTRAINT "PinnedReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinnedReview" ADD CONSTRAINT "PinnedReview_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("primitiveId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBucketPreferences" ADD CONSTRAINT "UserBucketPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
