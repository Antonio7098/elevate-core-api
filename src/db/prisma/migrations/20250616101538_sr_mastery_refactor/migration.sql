-- AlterTable
ALTER TABLE "UserQuestionAnswer" ADD COLUMN     "marksAchieved" INTEGER,
ADD COLUMN     "marksAvailable" INTEGER;

-- CreateTable
CREATE TABLE "QuestionSetStudySession" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "sessionId" INTEGER NOT NULL,
    "questionSetId" INTEGER NOT NULL,
    "sessionMarksAchieved" INTEGER NOT NULL,
    "sessionMarksAvailable" INTEGER NOT NULL,
    "srStageBefore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionSetStudySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_QuestionToQuestionSetStudySession" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_QuestionToQuestionSetStudySession_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "QuestionSetStudySession_userId_idx" ON "QuestionSetStudySession"("userId");

-- CreateIndex
CREATE INDEX "QuestionSetStudySession_questionSetId_idx" ON "QuestionSetStudySession"("questionSetId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSetStudySession_sessionId_questionSetId_key" ON "QuestionSetStudySession"("sessionId", "questionSetId");

-- CreateIndex
CREATE INDEX "_QuestionToQuestionSetStudySession_B_index" ON "_QuestionToQuestionSetStudySession"("B");

-- AddForeignKey
ALTER TABLE "QuestionSetStudySession" ADD CONSTRAINT "QuestionSetStudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSetStudySession" ADD CONSTRAINT "QuestionSetStudySession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserStudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSetStudySession" ADD CONSTRAINT "QuestionSetStudySession_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestionToQuestionSetStudySession" ADD CONSTRAINT "_QuestionToQuestionSetStudySession_A_fkey" FOREIGN KEY ("A") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestionToQuestionSetStudySession" ADD CONSTRAINT "_QuestionToQuestionSetStudySession_B_fkey" FOREIGN KEY ("B") REFERENCES "QuestionSetStudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
