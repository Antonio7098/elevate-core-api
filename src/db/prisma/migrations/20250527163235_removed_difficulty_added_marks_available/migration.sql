/*
  Warnings:

  - You are about to drop the column `difficultyScore` on the `Question` table. All the data in the column will be lost.
  - You are about to alter the column `scoreAchieved` on the `UserQuestionAnswer` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "Question" DROP COLUMN "difficultyScore",
ADD COLUMN     "marksAvailable" INTEGER;

-- AlterTable
ALTER TABLE "UserQuestionAnswer" ALTER COLUMN "scoreAchieved" SET DEFAULT 0,
ALTER COLUMN "scoreAchieved" SET DATA TYPE INTEGER;
