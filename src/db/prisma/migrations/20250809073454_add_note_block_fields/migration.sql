-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "contentBlocks" JSONB,
ADD COLUMN     "contentHtml" TEXT,
ADD COLUMN     "contentVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "plainText" TEXT;
