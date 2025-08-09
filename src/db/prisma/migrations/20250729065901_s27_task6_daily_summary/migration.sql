-- CreateTable
CREATE TABLE "UserPrimitiveDailySummary" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "primitiveId" TEXT NOT NULL,
    "primitiveTitle" TEXT NOT NULL,
    "masteryLevel" TEXT NOT NULL,
    "nextReviewAt" TIMESTAMP(3),
    "totalCriteria" INTEGER NOT NULL,
    "masteredCriteria" INTEGER NOT NULL,
    "weightedMasteryScore" DOUBLE PRECISION NOT NULL,
    "canProgressToNext" BOOLEAN NOT NULL,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPrimitiveDailySummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserPrimitiveDailySummary_userId_nextReviewAt_idx" ON "UserPrimitiveDailySummary"("userId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "UserPrimitiveDailySummary_userId_weightedMasteryScore_idx" ON "UserPrimitiveDailySummary"("userId", "weightedMasteryScore");

-- CreateIndex
CREATE UNIQUE INDEX "UserPrimitiveDailySummary_userId_primitiveId_key" ON "UserPrimitiveDailySummary"("userId", "primitiveId");

-- AddForeignKey
ALTER TABLE "UserPrimitiveDailySummary" ADD CONSTRAINT "UserPrimitiveDailySummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrimitiveDailySummary" ADD CONSTRAINT "UserPrimitiveDailySummary_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("primitiveId") ON DELETE CASCADE ON UPDATE CASCADE;
