/*
  Warnings:

  - You are about to drop the column `imageUrls` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `isPinned` on the `QuestionSet` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "QuestionSet" DROP CONSTRAINT "QuestionSet_folderId_fkey";

-- DropIndex
DROP INDEX "QuestionSet_nextReviewAt_idx";

-- AlterTable
ALTER TABLE "QuestionSet" DROP COLUMN "imageUrls",
DROP COLUMN "isPinned",
ADD COLUMN     "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "lapses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "srStage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trackingMode" TEXT NOT NULL DEFAULT 'AUTO',
ALTER COLUMN "folderId" DROP NOT NULL,
ALTER COLUMN "currentIntervalDays" DROP DEFAULT,
ALTER COLUMN "currentUUESetStage" SET DEFAULT 'Explore';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "name" TEXT,
ALTER COLUMN "dailyStudyTimeMinutes" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "ScheduledReview" (
    "id" SERIAL NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "userId" INTEGER NOT NULL,
    "questionSetId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduledReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduledReview_userId_reviewDate_idx" ON "ScheduledReview"("userId", "reviewDate");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- AddForeignKey
ALTER TABLE "QuestionSet" ADD CONSTRAINT "QuestionSet_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledReview" ADD CONSTRAINT "ScheduledReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledReview" ADD CONSTRAINT "ScheduledReview_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
