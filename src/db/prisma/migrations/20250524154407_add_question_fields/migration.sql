/*
  Warnings:

  - You are about to drop the column `question` on the `Question` table. All the data in the column will be lost.
  - Added the required column `questionType` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `Question` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Question" DROP COLUMN "question",
ADD COLUMN     "masteryScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "nextReviewAt" TIMESTAMP(3),
ADD COLUMN     "options" TEXT[],
ADD COLUMN     "questionType" TEXT NOT NULL,
ADD COLUMN     "text" TEXT NOT NULL;
