/*
  Warnings:

  - You are about to drop the column `reviewSessionId` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the `UserQuestionSetReview` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `marksAvailable` on table `Question` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "UserQuestionAnswer" DROP CONSTRAINT "UserQuestionAnswer_reviewSessionId_fkey";

-- DropForeignKey
ALTER TABLE "UserQuestionSetReview" DROP CONSTRAINT "UserQuestionSetReview_questionSetId_fkey";

-- DropForeignKey
ALTER TABLE "UserQuestionSetReview" DROP CONSTRAINT "UserQuestionSetReview_userId_fkey";

-- DropIndex
DROP INDEX "UserQuestionAnswer_reviewSessionId_idx";

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "markingCriteria" JSONB,
ALTER COLUMN "marksAvailable" SET NOT NULL,
ALTER COLUMN "marksAvailable" SET DEFAULT 1;

-- AlterTable
ALTER TABLE "UserQuestionAnswer" DROP COLUMN "reviewSessionId",
ADD COLUMN     "userStudySessionId" INTEGER;

-- DropTable
DROP TABLE "UserQuestionSetReview";

-- CreateTable
CREATE TABLE "UserStudySession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionStartedAt" TIMESTAMP(3),
    "sessionEndedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeSpentSeconds" INTEGER NOT NULL,
    "answeredQuestionsCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStudySession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserStudySession_userId_idx" ON "UserStudySession"("userId");

-- CreateIndex
CREATE INDEX "UserStudySession_sessionEndedAt_idx" ON "UserStudySession"("sessionEndedAt");

-- CreateIndex
CREATE INDEX "UserQuestionAnswer_userStudySessionId_idx" ON "UserQuestionAnswer"("userStudySessionId");

-- AddForeignKey
ALTER TABLE "UserQuestionAnswer" ADD CONSTRAINT "UserQuestionAnswer_userStudySessionId_fkey" FOREIGN KEY ("userStudySessionId") REFERENCES "UserStudySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStudySession" ADD CONSTRAINT "UserStudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
