/*
  Warnings:

  - You are about to drop the column `createdAt` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `feedbackFromAI` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `marksAchieved` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `marksAvailable` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `userStudySessionId` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `uueFocusTested` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to alter the column `scoreAchieved` on the `UserQuestionAnswer` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- DropForeignKey
ALTER TABLE "UserQuestionAnswer" DROP CONSTRAINT "UserQuestionAnswer_questionSetId_fkey";

-- DropForeignKey
ALTER TABLE "UserQuestionAnswer" DROP CONSTRAINT "UserQuestionAnswer_userStudySessionId_fkey";

-- DropIndex
DROP INDEX "UserQuestionAnswer_userStudySessionId_idx";

-- AlterTable
ALTER TABLE "UserQuestionAnswer" DROP COLUMN "createdAt",
DROP COLUMN "feedbackFromAI",
DROP COLUMN "marksAchieved",
DROP COLUMN "marksAvailable",
DROP COLUMN "updatedAt",
DROP COLUMN "userStudySessionId",
DROP COLUMN "uueFocusTested",
ADD COLUMN     "questionSetStudySessionId" INTEGER,
ALTER COLUMN "scoreAchieved" SET DATA TYPE INTEGER;

-- CreateIndex
CREATE INDEX "UserQuestionAnswer_questionSetStudySessionId_idx" ON "UserQuestionAnswer"("questionSetStudySessionId");

-- AddForeignKey
ALTER TABLE "UserQuestionAnswer" ADD CONSTRAINT "UserQuestionAnswer_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestionAnswer" ADD CONSTRAINT "UserQuestionAnswer_questionSetStudySessionId_fkey" FOREIGN KEY ("questionSetStudySessionId") REFERENCES "QuestionSetStudySession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
