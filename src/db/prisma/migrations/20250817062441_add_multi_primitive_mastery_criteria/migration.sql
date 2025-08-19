/*
  Warnings:

  - You are about to drop the column `title` on the `LearningPath` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `LearningPathStep` table. All the data in the column will be lost.
  - You are about to drop the column `orderIndex` on the `LearningPathStep` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `UserLearningAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `data` on the `UserLearningAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserLearningAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `insight` on the `UserMemoryInsight` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[learningPathId,stepOrder]` on the table `LearningPathStep` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[subscriptionId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,date]` on the table `UserLearningAnalytics` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pathName` to the `LearningPath` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetMasteryLevel` to the `LearningPath` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stepOrder` to the `LearningPathStep` table without a default value. This is not possible if the table is not empty.
  - Added the required column `confidenceScore` to the `UserMemoryInsight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `UserMemoryInsight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insightType` to the `UserMemoryInsight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `UserMemoryInsight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserMemoryInsight` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PrimitiveRelationshipType" AS ENUM ('PRIMARY', 'SECONDARY', 'CONTEXTUAL');

-- CreateEnum
CREATE TYPE "RelationshipStrength" AS ENUM ('WEAK', 'MODERATE', 'STRONG');

-- DropForeignKey
ALTER TABLE "LearningPathStep" DROP CONSTRAINT "LearningPathStep_primitiveId_fkey";

-- DropIndex
DROP INDEX "LearningPath_userId_idx";

-- DropIndex
DROP INDEX "LearningPathStep_learningPathId_orderIndex_key";

-- DropIndex
DROP INDEX "UserLearningAnalytics_userId_idx";

-- DropIndex
DROP INDEX "UserLearningAnalytics_userId_key";

-- DropIndex
DROP INDEX "UserMemoryInsight_createdAt_idx";

-- DropIndex
DROP INDEX "UserMemoryInsight_userId_idx";

-- AlterTable
ALTER TABLE "LearningPath" DROP COLUMN "title",
ADD COLUMN     "estimatedDurationDays" INTEGER,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pathName" TEXT NOT NULL,
ADD COLUMN     "targetMasteryLevel" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LearningPathStep" DROP COLUMN "createdAt",
DROP COLUMN "orderIndex",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "estimatedTimeMinutes" INTEGER,
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stepOrder" INTEGER NOT NULL,
ALTER COLUMN "primitiveId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "MasteryCriterion" ADD COLUMN     "estimatedPrimitiveCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "maxPrimitives" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "relationshipComplexity" DOUBLE PRECISION NOT NULL DEFAULT 1.0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "subscriptionStatus" TEXT;

-- AlterTable
ALTER TABLE "UserLearningAnalytics" DROP COLUMN "createdAt",
DROP COLUMN "data",
DROP COLUMN "updatedAt",
ADD COLUMN     "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "averageMasteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "conceptsMastered" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "conceptsReviewed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "focusAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "learningEfficiency" DOUBLE PRECISION,
ADD COLUMN     "totalStudyTimeMinutes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "UserMemoryInsight" DROP COLUMN "insight",
ADD COLUMN     "confidenceScore" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "insightType" TEXT NOT NULL,
ADD COLUMN     "isActionable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "relatedPrimitiveIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "MasteryCriterionPrimitive" (
    "id" SERIAL NOT NULL,
    "criterionId" INTEGER NOT NULL,
    "primitiveId" TEXT NOT NULL,
    "relationshipType" "PrimitiveRelationshipType" NOT NULL DEFAULT 'PRIMARY',
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasteryCriterionPrimitive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MasteryCriterionPrimitive_criterionId_idx" ON "MasteryCriterionPrimitive"("criterionId");

-- CreateIndex
CREATE INDEX "MasteryCriterionPrimitive_primitiveId_idx" ON "MasteryCriterionPrimitive"("primitiveId");

-- CreateIndex
CREATE INDEX "MasteryCriterionPrimitive_relationshipType_idx" ON "MasteryCriterionPrimitive"("relationshipType");

-- CreateIndex
CREATE UNIQUE INDEX "MasteryCriterionPrimitive_criterionId_primitiveId_key" ON "MasteryCriterionPrimitive"("criterionId", "primitiveId");

-- CreateIndex
CREATE INDEX "LearningPath_userId_isActive_idx" ON "LearningPath"("userId", "isActive");

-- CreateIndex
CREATE INDEX "LearningPathStep_learningPathId_isCompleted_idx" ON "LearningPathStep"("learningPathId", "isCompleted");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathStep_learningPathId_stepOrder_key" ON "LearningPathStep"("learningPathId", "stepOrder");

-- CreateIndex
CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "User_subscriptionId_key" ON "User"("subscriptionId");

-- CreateIndex
CREATE INDEX "UserLearningAnalytics_userId_date_idx" ON "UserLearningAnalytics"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "UserLearningAnalytics_userId_date_key" ON "UserLearningAnalytics"("userId", "date");

-- CreateIndex
CREATE INDEX "UserMemoryInsight_userId_insightType_idx" ON "UserMemoryInsight"("userId", "insightType");

-- CreateIndex
CREATE INDEX "UserMemoryInsight_userId_confidenceScore_idx" ON "UserMemoryInsight"("userId", "confidenceScore");

-- AddForeignKey
ALTER TABLE "MasteryCriterionPrimitive" ADD CONSTRAINT "MasteryCriterionPrimitive_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "MasteryCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryCriterionPrimitive" ADD CONSTRAINT "MasteryCriterionPrimitive_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("primitiveId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathStep" ADD CONSTRAINT "LearningPathStep_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("primitiveId") ON DELETE CASCADE ON UPDATE CASCADE;
