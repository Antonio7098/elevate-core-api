/*
  Warnings:

  - You are about to drop the column `masteryScore` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `nextReviewAt` on the `Question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Question" DROP COLUMN "masteryScore",
DROP COLUMN "nextReviewAt",
ADD COLUMN     "conceptTags" TEXT[],
ADD COLUMN     "difficultyScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
ADD COLUMN     "lastAnswerCorrect" BOOLEAN,
ADD COLUMN     "learningStage" TEXT NOT NULL DEFAULT 'understand',
ADD COLUMN     "timesAnswered" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timesAnsweredWrong" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "QuestionSet" ADD COLUMN     "currentIntervalDays" DOUBLE PRECISION,
ADD COLUMN     "exploreScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "forgettingScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "nextReviewAt" TIMESTAMP(3),
ADD COLUMN     "overallMasteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "understandScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "useScore" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserQuestionSetReview" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "questionSetId" INTEGER NOT NULL,
    "understandScore" DOUBLE PRECISION NOT NULL,
    "useScore" DOUBLE PRECISION NOT NULL,
    "exploreScore" DOUBLE PRECISION NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL,
    "timeSpent" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserQuestionSetReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserQuestionAnswer" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "questionId" INTEGER NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "confidence" INTEGER,
    "timeSpent" INTEGER NOT NULL,
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserQuestionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserQuestionSetReview_userId_idx" ON "UserQuestionSetReview"("userId");

-- CreateIndex
CREATE INDEX "UserQuestionSetReview_questionSetId_idx" ON "UserQuestionSetReview"("questionSetId");

-- CreateIndex
CREATE INDEX "UserQuestionSetReview_completedAt_idx" ON "UserQuestionSetReview"("completedAt");

-- CreateIndex
CREATE INDEX "UserQuestionAnswer_userId_idx" ON "UserQuestionAnswer"("userId");

-- CreateIndex
CREATE INDEX "UserQuestionAnswer_questionId_idx" ON "UserQuestionAnswer"("questionId");

-- CreateIndex
CREATE INDEX "UserQuestionAnswer_answeredAt_idx" ON "UserQuestionAnswer"("answeredAt");

-- CreateIndex
CREATE INDEX "Question_learningStage_idx" ON "Question"("learningStage");

-- CreateIndex
CREATE INDEX "QuestionSet_nextReviewAt_idx" ON "QuestionSet"("nextReviewAt");

-- AddForeignKey
ALTER TABLE "UserQuestionSetReview" ADD CONSTRAINT "UserQuestionSetReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestionSetReview" ADD CONSTRAINT "UserQuestionSetReview_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestionAnswer" ADD CONSTRAINT "UserQuestionAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestionAnswer" ADD CONSTRAINT "UserQuestionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
