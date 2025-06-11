-- AlterTable
ALTER TABLE "Folder" ADD COLUMN     "imageUrls" TEXT[];

-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "imageUrls" TEXT[];

-- AlterTable
ALTER TABLE "QuestionSet" ADD COLUMN     "imageUrls" TEXT[];

-- CreateTable
CREATE TABLE "InsightCatalyst" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "explanation" TEXT,
    "imageUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "noteId" INTEGER,
    "questionId" INTEGER,

    CONSTRAINT "InsightCatalyst_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InsightCatalyst_userId_idx" ON "InsightCatalyst"("userId");

-- CreateIndex
CREATE INDEX "InsightCatalyst_noteId_idx" ON "InsightCatalyst"("noteId");

-- CreateIndex
CREATE INDEX "InsightCatalyst_questionId_idx" ON "InsightCatalyst"("questionId");

-- AddForeignKey
ALTER TABLE "InsightCatalyst" ADD CONSTRAINT "InsightCatalyst_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightCatalyst" ADD CONSTRAINT "InsightCatalyst_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightCatalyst" ADD CONSTRAINT "InsightCatalyst_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;
