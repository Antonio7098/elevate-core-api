-- AlterTable
ALTER TABLE "LearningBlueprint" ADD COLUMN     "description" TEXT,
ADD COLUMN     "folderId" INTEGER,
ADD COLUMN     "title" TEXT;

-- CreateIndex
CREATE INDEX "LearningBlueprint_folderId_idx" ON "LearningBlueprint"("folderId");

-- AddForeignKey
ALTER TABLE "LearningBlueprint" ADD CONSTRAINT "LearningBlueprint_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
