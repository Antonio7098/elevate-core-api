-- AlterTable
ALTER TABLE "InsightCatalyst" ADD COLUMN     "primitiveId" TEXT;

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "criterionId" TEXT;

-- AlterTable
ALTER TABLE "ScheduledReview" ADD COLUMN     "primitiveId" TEXT;

-- AlterTable
ALTER TABLE "UserQuestionAnswer" ADD COLUMN     "blueprintId" INTEGER,
ADD COLUMN     "primitiveId" TEXT;

-- CreateIndex
CREATE INDEX "InsightCatalyst_primitiveId_idx" ON "InsightCatalyst"("primitiveId");

-- CreateIndex
CREATE INDEX "Question_criterionId_idx" ON "Question"("criterionId");

-- CreateIndex
CREATE INDEX "ScheduledReview_primitiveId_idx" ON "ScheduledReview"("primitiveId");

-- CreateIndex
CREATE INDEX "UserQuestionAnswer_primitiveId_idx" ON "UserQuestionAnswer"("primitiveId");

-- AddForeignKey
ALTER TABLE "UserQuestionAnswer" ADD CONSTRAINT "UserQuestionAnswer_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("primitiveId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledReview" ADD CONSTRAINT "ScheduledReview_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("primitiveId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightCatalyst" ADD CONSTRAINT "InsightCatalyst_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("primitiveId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "MasteryCriterion"("criterionId") ON DELETE SET NULL ON UPDATE CASCADE;
