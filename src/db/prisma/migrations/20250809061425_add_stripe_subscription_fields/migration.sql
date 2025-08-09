/*
  Warnings:

  - You are about to drop the column `difficulty` on the `MasteryCriterion` table. All the data in the column will be lost.
  - You are about to drop the column `difficultyMultiplier` on the `UserPrimitiveProgress` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subscriptionId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "KnowledgePrimitive" ADD COLUMN     "complexityScore" DOUBLE PRECISION,
ADD COLUMN     "conceptTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "estimatedPrerequisites" INTEGER,
ADD COLUMN     "isCoreConcept" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "prerequisiteIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "relatedConceptIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "MasteryCriterion" DROP COLUMN "difficulty";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" TEXT DEFAULT 'free',
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT;

-- AlterTable
ALTER TABLE "UserPrimitiveProgress" DROP COLUMN "difficultyMultiplier";

-- CreateTable
CREATE TABLE "LearningPath" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "pathName" TEXT NOT NULL,
    "description" TEXT,
    "targetMasteryLevel" TEXT NOT NULL,
    "estimatedDurationDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPath_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPathStep" (
    "id" SERIAL NOT NULL,
    "learningPathId" INTEGER NOT NULL,
    "primitiveId" TEXT NOT NULL,
    "stepOrder" INTEGER NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "estimatedTimeMinutes" INTEGER,

    CONSTRAINT "LearningPathStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserMemoryInsight" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "insightType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "relatedPrimitiveIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "isActionable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMemoryInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLearningAnalytics" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalStudyTimeMinutes" INTEGER NOT NULL DEFAULT 0,
    "conceptsReviewed" INTEGER NOT NULL DEFAULT 0,
    "conceptsMastered" INTEGER NOT NULL DEFAULT 0,
    "averageMasteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "learningEfficiency" DOUBLE PRECISION,
    "focusAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "UserLearningAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_Prerequisites" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_Prerequisites_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RelatedConcepts" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RelatedConcepts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "LearningPath_userId_isActive_idx" ON "LearningPath"("userId", "isActive");

-- CreateIndex
CREATE INDEX "LearningPathStep_learningPathId_isCompleted_idx" ON "LearningPathStep"("learningPathId", "isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathStep_learningPathId_stepOrder_key" ON "LearningPathStep"("learningPathId", "stepOrder");

-- CreateIndex
CREATE INDEX "UserMemoryInsight_userId_insightType_idx" ON "UserMemoryInsight"("userId", "insightType");

-- CreateIndex
CREATE INDEX "UserMemoryInsight_userId_confidenceScore_idx" ON "UserMemoryInsight"("userId", "confidenceScore");

-- CreateIndex
CREATE INDEX "UserLearningAnalytics_userId_date_idx" ON "UserLearningAnalytics"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserLearningAnalytics_userId_date_key" ON "UserLearningAnalytics"("userId", "date");

-- CreateIndex
CREATE INDEX "_Prerequisites_B_index" ON "_Prerequisites"("B");

-- CreateIndex
CREATE INDEX "_RelatedConcepts_B_index" ON "_RelatedConcepts"("B");

-- CreateIndex
CREATE INDEX "KnowledgePrimitive_conceptTags_idx" ON "KnowledgePrimitive"("conceptTags");

-- CreateIndex
CREATE INDEX "KnowledgePrimitive_isCoreConcept_idx" ON "KnowledgePrimitive"("isCoreConcept");

-- CreateIndex
CREATE INDEX "KnowledgePrimitive_complexityScore_idx" ON "KnowledgePrimitive"("complexityScore");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_subscriptionId_key" ON "User"("subscriptionId");

-- AddForeignKey
ALTER TABLE "LearningPath" ADD CONSTRAINT "LearningPath_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathStep" ADD CONSTRAINT "LearningPathStep_learningPathId_fkey" FOREIGN KEY ("learningPathId") REFERENCES "LearningPath"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathStep" ADD CONSTRAINT "LearningPathStep_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("primitiveId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserMemoryInsight" ADD CONSTRAINT "UserMemoryInsight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserLearningAnalytics" ADD CONSTRAINT "UserLearningAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Prerequisites" ADD CONSTRAINT "_Prerequisites_A_fkey" FOREIGN KEY ("A") REFERENCES "KnowledgePrimitive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_Prerequisites" ADD CONSTRAINT "_Prerequisites_B_fkey" FOREIGN KEY ("B") REFERENCES "KnowledgePrimitive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RelatedConcepts" ADD CONSTRAINT "_RelatedConcepts_A_fkey" FOREIGN KEY ("A") REFERENCES "KnowledgePrimitive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RelatedConcepts" ADD CONSTRAINT "_RelatedConcepts_B_fkey" FOREIGN KEY ("B") REFERENCES "KnowledgePrimitive"("id") ON DELETE CASCADE ON UPDATE CASCADE;
