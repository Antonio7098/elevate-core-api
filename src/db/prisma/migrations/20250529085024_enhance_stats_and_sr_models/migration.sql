/*
  Warnings:

  - You are about to drop the column `timesAnswered` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `timesAnsweredWrong` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `forgettingScore` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `masteryOverTime` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `overallMasteryScore` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `userAnswer` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `UserQuestionSetReview` table. All the data in the column will be lost.
  - You are about to drop the column `exploreScore` on the `UserQuestionSetReview` table. All the data in the column will be lost.
  - You are about to drop the column `overallScore` on the `UserQuestionSetReview` table. All the data in the column will be lost.
  - You are about to drop the column `understandScore` on the `UserQuestionSetReview` table. All the data in the column will be lost.
  - You are about to drop the column `useScore` on the `UserQuestionSetReview` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_userId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_questionSetId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionSet" DROP CONSTRAINT "QuestionSet_folderId_fkey";

-- DropForeignKey
ALTER TABLE "UserQuestionAnswer" DROP CONSTRAINT "UserQuestionAnswer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "UserQuestionAnswer" DROP CONSTRAINT "UserQuestionAnswer_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserQuestionSetReview" DROP CONSTRAINT "UserQuestionSetReview_questionSetId_fkey";

-- DropForeignKey
ALTER TABLE "UserQuestionSetReview" DROP CONSTRAINT "UserQuestionSetReview_userId_fkey";

-- DropIndex
DROP INDEX "UserQuestionSetReview_completedAt_idx";

-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "currentMasteryScore" DOUBLE PRECISION,
ADD COLUMN     "masteryHistory" JSONB[];

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "timesAnswered",
DROP COLUMN "timesAnsweredWrong",
ADD COLUMN     "currentMasteryScore" DOUBLE PRECISION,
ADD COLUMN     "difficultyScore" DOUBLE PRECISION,
ADD COLUMN     "timesAnsweredCorrectly" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timesAnsweredIncorrectly" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "QuestionSet" DROP COLUMN "forgettingScore",
DROP COLUMN "masteryOverTime",
DROP COLUMN "overallMasteryScore",
ADD COLUMN     "currentForgottenPercentage" DOUBLE PRECISION,
ADD COLUMN     "currentTotalMasteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "currentUUESetStage" TEXT NOT NULL DEFAULT 'Understand',
ADD COLUMN     "forgettingCurveParams" JSONB,
ADD COLUMN     "masteryHistory" JSONB[],
ALTER COLUMN "currentIntervalDays" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dailyStudyTimeMinutes" INTEGER NOT NULL DEFAULT 30;

-- AlterTable
ALTER TABLE "UserQuestionAnswer" DROP COLUMN "userAnswer",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "feedbackFromAI" TEXT,
ADD COLUMN     "questionSetId" INTEGER,
ADD COLUMN     "reviewSessionId" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userAnswerText" TEXT,
ADD COLUMN     "uueFocusTested" TEXT,
ALTER COLUMN "scoreAchieved" DROP DEFAULT,
ALTER COLUMN "scoreAchieved" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "UserQuestionSetReview" DROP COLUMN "completedAt",
DROP COLUMN "exploreScore",
DROP COLUMN "overallScore",
DROP COLUMN "understandScore",
DROP COLUMN "useScore",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "questionsReviewedInSession" JSONB[],
ADD COLUMN     "sessionEndedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sessionStartedAt" TIMESTAMP(3),
ADD COLUMN     "setExploreScoreAfter" DOUBLE PRECISION,
ADD COLUMN     "setIntervalAfter" DOUBLE PRECISION,
ADD COLUMN     "setNextReviewAtAfter" TIMESTAMP(3),
ADD COLUMN     "setTotalMasteryScoreAfter" DOUBLE PRECISION,
ADD COLUMN     "setUnderstandScoreAfter" DOUBLE PRECISION,
ADD COLUMN     "setUseScoreAfter" DOUBLE PRECISION,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "UserQuestionAnswer_questionSetId_idx" ON "UserQuestionAnswer"("questionSetId");

-- CreateIndex
CREATE INDEX "UserQuestionAnswer_reviewSessionId_idx" ON "UserQuestionAnswer"("reviewSessionId");

-- CreateIndex
CREATE INDEX "UserQuestionSetReview_sessionEndedAt_idx" ON "UserQuestionSetReview"("sessionEndedAt");

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSet" ADD CONSTRAINT "QuestionSet_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestionAnswer" ADD CONSTRAINT "UserQuestionAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestionAnswer" ADD CONSTRAINT "UserQuestionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestionAnswer" ADD CONSTRAINT "UserQuestionAnswer_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestionAnswer" ADD CONSTRAINT "UserQuestionAnswer_reviewSessionId_fkey" FOREIGN KEY ("reviewSessionId") REFERENCES "UserQuestionSetReview"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestionSetReview" ADD CONSTRAINT "UserQuestionSetReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestionSetReview" ADD CONSTRAINT "UserQuestionSetReview_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
