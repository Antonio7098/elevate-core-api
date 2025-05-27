/*
  Warnings:

  - You are about to drop the column `learningStage` on the `Question` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Question_learningStage_idx";

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "learningStage",
ADD COLUMN     "uueFocus" TEXT NOT NULL DEFAULT 'Understand';

-- AlterTable
ALTER TABLE "QuestionSet" ADD COLUMN     "masteryOverTime" JSONB;

-- AlterTable
ALTER TABLE "UserQuestionAnswer" ADD COLUMN     "scoreAchieved" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Question_uueFocus_idx" ON "Question"("uueFocus");
