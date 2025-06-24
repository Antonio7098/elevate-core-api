-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "generatedFromBlueprintId" INTEGER;

-- AlterTable
ALTER TABLE "QuestionSet" ADD COLUMN     "generatedFromBlueprintId" INTEGER;

-- CreateTable
CREATE TABLE "LearningBlueprint" (
    "id" SERIAL NOT NULL,
    "sourceText" TEXT NOT NULL,
    "blueprintJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "LearningBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LearningBlueprint_userId_idx" ON "LearningBlueprint"("userId");

-- CreateIndex
CREATE INDEX "Note_generatedFromBlueprintId_idx" ON "Note"("generatedFromBlueprintId");

-- CreateIndex
CREATE INDEX "QuestionSet_generatedFromBlueprintId_idx" ON "QuestionSet"("generatedFromBlueprintId");

-- AddForeignKey
ALTER TABLE "LearningBlueprint" ADD CONSTRAINT "LearningBlueprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSet" ADD CONSTRAINT "QuestionSet_generatedFromBlueprintId_fkey" FOREIGN KEY ("generatedFromBlueprintId") REFERENCES "LearningBlueprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_generatedFromBlueprintId_fkey" FOREIGN KEY ("generatedFromBlueprintId") REFERENCES "LearningBlueprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;
