-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "QuestionSet" ADD COLUMN     "isPinned" BOOLEAN NOT NULL DEFAULT false;
