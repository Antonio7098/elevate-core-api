/*
  Warnings:

  - You are about to drop the column `content` on the `InsightCatalyst` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `InsightCatalyst` table. All the data in the column will be lost.
  - The `primitiveId` column on the `InsightCatalyst` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `folderId` on the `LearningBlueprint` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedDurationDays` on the `LearningPath` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `LearningPath` table. All the data in the column will be lost.
  - You are about to drop the column `pathName` on the `LearningPath` table. All the data in the column will be lost.
  - You are about to drop the column `targetMasteryLevel` on the `LearningPath` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `LearningPathStep` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedTimeMinutes` on the `LearningPathStep` table. All the data in the column will be lost.
  - You are about to drop the column `isCompleted` on the `LearningPathStep` table. All the data in the column will be lost.
  - You are about to drop the column `stepOrder` on the `LearningPathStep` table. All the data in the column will be lost.
  - You are about to drop the column `criterionId` on the `MasteryCriterion` table. All the data in the column will be lost.
  - You are about to drop the column `isRequired` on the `MasteryCriterion` table. All the data in the column will be lost.
  - You are about to drop the column `primitiveId` on the `MasteryCriterion` table. All the data in the column will be lost.
  - You are about to drop the column `ueeLevel` on the `MasteryCriterion` table. All the data in the column will be lost.
  - You are about to drop the column `reviewAt` on the `PinnedReview` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PinnedReview` table. All the data in the column will be lost.
  - The `primitiveId` column on the `PinnedReview` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `answerText` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `criterionId` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `questionText` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `folderId` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrls` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `isTracked` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `marksAvailable` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `QuestionSet` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `QuestionSetStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `correctAnswers` on the `QuestionSetStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `difficultyLevel` on the `QuestionSetStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `marksAwarded` on the `QuestionSetStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `masteryScore` on the `QuestionSetStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `QuestionSetStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `timeSpentMinutes` on the `QuestionSetStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `totalMarks` on the `QuestionSetStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `totalQuestions` on the `QuestionSetStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `completed` on the `ScheduledReview` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `ScheduledReview` table. All the data in the column will be lost.
  - You are about to drop the column `scheduledFor` on the `ScheduledReview` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ScheduledReview` table. All the data in the column will be lost.
  - The `primitiveId` column on the `ScheduledReview` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `googleId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `stripeCustomerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionEndDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionStatus` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `addMoreIncrement` on the `UserBucketPreferences` table. All the data in the column will be lost.
  - You are about to drop the column `coreSize` on the `UserBucketPreferences` table. All the data in the column will be lost.
  - You are about to drop the column `criticalSize` on the `UserBucketPreferences` table. All the data in the column will be lost.
  - You are about to drop the column `masteryThresholdLevel` on the `UserBucketPreferences` table. All the data in the column will be lost.
  - You are about to drop the column `maxDailyLimit` on the `UserBucketPreferences` table. All the data in the column will be lost.
  - You are about to drop the column `plusSize` on the `UserBucketPreferences` table. All the data in the column will be lost.
  - The primary key for the `UserCriterionMastery` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `attemptCount` on the `UserCriterionMastery` table. All the data in the column will be lost.
  - You are about to drop the column `blueprintId` on the `UserCriterionMastery` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `UserCriterionMastery` table. All the data in the column will be lost.
  - You are about to drop the column `criterionId` on the `UserCriterionMastery` table. All the data in the column will be lost.
  - You are about to drop the column `lastAttemptedAt` on the `UserCriterionMastery` table. All the data in the column will be lost.
  - You are about to drop the column `masteredAt` on the `UserCriterionMastery` table. All the data in the column will be lost.
  - You are about to drop the column `primitiveId` on the `UserCriterionMastery` table. All the data in the column will be lost.
  - You are about to drop the column `successfulAttempts` on the `UserCriterionMastery` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserCriterionMastery` table. All the data in the column will be lost.
  - You are about to drop the column `achievements` on the `UserLearningAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `averageMasteryScore` on the `UserLearningAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `conceptsMastered` on the `UserLearningAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `conceptsReviewed` on the `UserLearningAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `UserLearningAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `focusAreas` on the `UserLearningAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `learningEfficiency` on the `UserLearningAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `totalStudyTimeMinutes` on the `UserLearningAnalytics` table. All the data in the column will be lost.
  - You are about to drop the column `confidenceScore` on the `UserMemoryInsight` table. All the data in the column will be lost.
  - You are about to drop the column `content` on the `UserMemoryInsight` table. All the data in the column will be lost.
  - You are about to drop the column `insightType` on the `UserMemoryInsight` table. All the data in the column will be lost.
  - You are about to drop the column `isActionable` on the `UserMemoryInsight` table. All the data in the column will be lost.
  - You are about to drop the column `relatedPrimitiveIds` on the `UserMemoryInsight` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `UserMemoryInsight` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserMemoryInsight` table. All the data in the column will be lost.
  - You are about to drop the column `canProgressToNext` on the `UserPrimitiveDailySummary` table. All the data in the column will be lost.
  - You are about to drop the column `lastCalculated` on the `UserPrimitiveDailySummary` table. All the data in the column will be lost.
  - You are about to drop the column `masteredCriteria` on the `UserPrimitiveDailySummary` table. All the data in the column will be lost.
  - You are about to drop the column `masteryLevel` on the `UserPrimitiveDailySummary` table. All the data in the column will be lost.
  - You are about to drop the column `nextReviewAt` on the `UserPrimitiveDailySummary` table. All the data in the column will be lost.
  - You are about to drop the column `primitiveTitle` on the `UserPrimitiveDailySummary` table. All the data in the column will be lost.
  - You are about to drop the column `totalCriteria` on the `UserPrimitiveDailySummary` table. All the data in the column will be lost.
  - You are about to drop the column `weightedMasteryScore` on the `UserPrimitiveDailySummary` table. All the data in the column will be lost.
  - You are about to drop the column `blueprintId` on the `UserPrimitiveProgress` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `UserPrimitiveProgress` table. All the data in the column will be lost.
  - You are about to drop the column `masteryLevel` on the `UserPrimitiveProgress` table. All the data in the column will be lost.
  - You are about to drop the column `reviewCount` on the `UserPrimitiveProgress` table. All the data in the column will be lost.
  - You are about to drop the column `successfulReviews` on the `UserPrimitiveProgress` table. All the data in the column will be lost.
  - You are about to drop the column `trackingIntensity` on the `UserPrimitiveProgress` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserPrimitiveProgress` table. All the data in the column will be lost.
  - You are about to drop the column `blueprintId` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `marksAwarded` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `questionSetId` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `userAnswer` on the `UserQuestionAnswer` table. All the data in the column will be lost.
  - The `primitiveId` column on the `UserQuestionAnswer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `completedAt` on the `UserStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `correctAnswers` on the `UserStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `marksAwarded` on the `UserStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `questionSetId` on the `UserStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `UserStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `totalMarks` on the `UserStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `totalQuestions` on the `UserStudySession` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `VerificationToken` table. All the data in the column will be lost.
  - You are about to drop the `Folder` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Note` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[learningPathId,orderIndex]` on the table `LearningPathStep` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[sessionId,questionSetId]` on the table `QuestionSetStudySession` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `UserLearningAnalytics` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,primitiveId,date]` on the table `UserPrimitiveDailySummary` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,primitiveId]` on the table `UserPrimitiveProgress` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `text` to the `InsightCatalyst` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `InsightCatalyst` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `LearningPath` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderIndex` to the `LearningPathStep` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `primitiveId` on the `LearningPathStep` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `blueprintSectionId` to the `MasteryCriterion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `knowledgePrimitiveId` to the `MasteryCriterion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionType` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `text` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `QuestionSet` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionId` to the `QuestionSetStudySession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionMarksAchieved` to the `QuestionSetStudySession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sessionMarksAvailable` to the `QuestionSetStudySession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `srStageBefore` to the `QuestionSetStudySession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reviewDate` to the `ScheduledReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `ScheduledReview` table without a default value. This is not possible if the table is not empty.
  - Added the required column `blueprintSectionId` to the `UserCriterionMastery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `masteryCriterionId` to the `UserCriterionMastery` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data` to the `UserLearningAnalytics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UserLearningAnalytics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insight` to the `UserMemoryInsight` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `UserPrimitiveDailySummary` table without a default value. This is not possible if the table is not empty.
  - Added the required column `summary` to the `UserPrimitiveDailySummary` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `primitiveId` on the `UserPrimitiveDailySummary` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `primitiveId` on the `UserPrimitiveProgress` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `isCorrect` on table `UserQuestionAnswer` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `answeredQuestionsCount` to the `UserStudySession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeSpentSeconds` to the `UserStudySession` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires` to the `VerificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "UueStage" AS ENUM ('UNDERSTAND', 'USE', 'EXPLORE');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('QUESTION_BASED', 'EXPLANATION_BASED', 'APPLICATION_BASED', 'COMPARISON_BASED', 'CREATION_BASED');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('PREREQUISITE', 'RELATED', 'SIMILAR', 'ADVANCES_TO', 'DEMONSTRATES', 'CONTRADICTS', 'SYNONYMOUS', 'PART_OF');

-- CreateEnum
CREATE TYPE "CriterionRelationshipType" AS ENUM ('PREREQUISITE', 'ADVANCES_TO', 'RELATED', 'SIMILAR', 'PART_OF', 'DEMONSTRATES', 'SYNONYMOUS');

-- CreateEnum
CREATE TYPE "RelationshipSource" AS ENUM ('AI_GENERATED', 'USER_CREATED', 'EXPERT_VERIFIED', 'SYSTEM_INFERRED');

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_parentId_fkey";

-- DropForeignKey
ALTER TABLE "Folder" DROP CONSTRAINT "Folder_userId_fkey";

-- DropForeignKey
ALTER TABLE "InsightCatalyst" DROP CONSTRAINT "InsightCatalyst_noteId_fkey";

-- DropForeignKey
ALTER TABLE "InsightCatalyst" DROP CONSTRAINT "InsightCatalyst_primitiveId_fkey";

-- DropForeignKey
ALTER TABLE "LearningBlueprint" DROP CONSTRAINT "LearningBlueprint_folderId_fkey";

-- DropForeignKey
ALTER TABLE "LearningPathStep" DROP CONSTRAINT "LearningPathStep_primitiveId_fkey";

-- DropForeignKey
ALTER TABLE "MasteryCriterion" DROP CONSTRAINT "MasteryCriterion_primitiveId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_folderId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_generatedFromBlueprintId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_userId_fkey";

-- DropForeignKey
ALTER TABLE "PinnedReview" DROP CONSTRAINT "PinnedReview_primitiveId_fkey";

-- DropForeignKey
ALTER TABLE "Question" DROP CONSTRAINT "Question_criterionId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionSet" DROP CONSTRAINT "QuestionSet_folderId_fkey";

-- DropForeignKey
ALTER TABLE "QuestionSet" DROP CONSTRAINT "QuestionSet_userId_fkey";

-- DropForeignKey
ALTER TABLE "ScheduledReview" DROP CONSTRAINT "ScheduledReview_primitiveId_fkey";

-- DropForeignKey
ALTER TABLE "UserCriterionMastery" DROP CONSTRAINT "UserCriterionMastery_criterionId_fkey";

-- DropForeignKey
ALTER TABLE "UserCriterionMastery" DROP CONSTRAINT "UserCriterionMastery_primitiveId_fkey";

-- DropForeignKey
ALTER TABLE "UserPrimitiveDailySummary" DROP CONSTRAINT "UserPrimitiveDailySummary_primitiveId_fkey";

-- DropForeignKey
ALTER TABLE "UserPrimitiveProgress" DROP CONSTRAINT "UserPrimitiveProgress_primitiveId_fkey";

-- DropForeignKey
ALTER TABLE "UserPrimitiveProgress" DROP CONSTRAINT "UserPrimitiveProgress_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserQuestionAnswer" DROP CONSTRAINT "UserQuestionAnswer_primitiveId_fkey";

-- DropForeignKey
ALTER TABLE "UserQuestionAnswer" DROP CONSTRAINT "UserQuestionAnswer_questionId_fkey";

-- DropForeignKey
ALTER TABLE "UserQuestionAnswer" DROP CONSTRAINT "UserQuestionAnswer_questionSetId_fkey";

-- DropForeignKey
ALTER TABLE "UserStudySession" DROP CONSTRAINT "UserStudySession_questionSetId_fkey";

-- DropIndex
DROP INDEX "LearningBlueprint_folderId_idx";

-- DropIndex
DROP INDEX "LearningPath_userId_isActive_idx";

-- DropIndex
DROP INDEX "LearningPathStep_learningPathId_isCompleted_idx";

-- DropIndex
DROP INDEX "LearningPathStep_learningPathId_stepOrder_key";

-- DropIndex
DROP INDEX "MasteryCriterion_criterionId_idx";

-- DropIndex
DROP INDEX "MasteryCriterion_criterionId_key";

-- DropIndex
DROP INDEX "MasteryCriterion_primitiveId_idx";

-- DropIndex
DROP INDEX "PinnedReview_userId_primitiveId_key";

-- DropIndex
DROP INDEX "Question_criterionId_idx";

-- DropIndex
DROP INDEX "QuestionSet_folderId_idx";

-- DropIndex
DROP INDEX "QuestionSet_userId_idx";

-- DropIndex
DROP INDEX "ScheduledReview_questionSetId_idx";

-- DropIndex
DROP INDEX "ScheduledReview_scheduledFor_idx";

-- DropIndex
DROP INDEX "ScheduledReview_userId_idx";

-- DropIndex
DROP INDEX "User_googleId_key";

-- DropIndex
DROP INDEX "User_stripeCustomerId_key";

-- DropIndex
DROP INDEX "User_subscriptionId_key";

-- DropIndex
DROP INDEX "UserCriterionMastery_blueprintId_idx";

-- DropIndex
DROP INDEX "UserCriterionMastery_criterionId_idx";

-- DropIndex
DROP INDEX "UserCriterionMastery_primitiveId_idx";

-- DropIndex
DROP INDEX "UserCriterionMastery_userId_criterionId_primitiveId_bluepri_key";

-- DropIndex
DROP INDEX "UserLearningAnalytics_userId_date_idx";

-- DropIndex
DROP INDEX "UserLearningAnalytics_userId_date_key";

-- DropIndex
DROP INDEX "UserMemoryInsight_userId_confidenceScore_idx";

-- DropIndex
DROP INDEX "UserMemoryInsight_userId_insightType_idx";

-- DropIndex
DROP INDEX "UserPrimitiveDailySummary_userId_nextReviewAt_idx";

-- DropIndex
DROP INDEX "UserPrimitiveDailySummary_userId_primitiveId_key";

-- DropIndex
DROP INDEX "UserPrimitiveDailySummary_userId_weightedMasteryScore_idx";

-- DropIndex
DROP INDEX "UserPrimitiveProgress_blueprintId_idx";

-- DropIndex
DROP INDEX "UserPrimitiveProgress_userId_primitiveId_blueprintId_key";

-- DropIndex
DROP INDEX "UserQuestionAnswer_questionSetId_idx";

-- DropIndex
DROP INDEX "UserStudySession_questionSetId_idx";

-- DropIndex
DROP INDEX "VerificationToken_expiresAt_idx";

-- AlterTable
ALTER TABLE "InsightCatalyst" DROP COLUMN "content",
DROP COLUMN "title",
ADD COLUMN     "explanation" TEXT,
ADD COLUMN     "imageUrls" TEXT[],
ADD COLUMN     "masteryCriterionId" INTEGER,
ADD COLUMN     "questionId" INTEGER,
ADD COLUMN     "text" TEXT NOT NULL,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "noteId" DROP NOT NULL,
DROP COLUMN "primitiveId",
ADD COLUMN     "primitiveId" INTEGER;

-- AlterTable
ALTER TABLE "KnowledgePrimitive" ADD COLUMN     "blueprintSectionId" INTEGER;

-- AlterTable
ALTER TABLE "LearningBlueprint" DROP COLUMN "folderId";

-- AlterTable
ALTER TABLE "LearningPath" DROP COLUMN "estimatedDurationDays",
DROP COLUMN "isActive",
DROP COLUMN "pathName",
DROP COLUMN "targetMasteryLevel",
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "LearningPathStep" DROP COLUMN "completedAt",
DROP COLUMN "estimatedTimeMinutes",
DROP COLUMN "isCompleted",
DROP COLUMN "stepOrder",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "orderIndex" INTEGER NOT NULL,
DROP COLUMN "primitiveId",
ADD COLUMN     "primitiveId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "MasteryCriterion" DROP COLUMN "criterionId",
DROP COLUMN "isRequired",
DROP COLUMN "primitiveId",
DROP COLUMN "ueeLevel",
ADD COLUMN     "assessmentType" "AssessmentType" NOT NULL DEFAULT 'QUESTION_BASED',
ADD COLUMN     "attemptsAllowed" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "blueprintSectionId" INTEGER NOT NULL,
ADD COLUMN     "complexityScore" DOUBLE PRECISION,
ADD COLUMN     "knowledgePrimitiveId" TEXT NOT NULL,
ADD COLUMN     "masteryThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
ADD COLUMN     "timeLimit" INTEGER,
ADD COLUMN     "uueStage" "UueStage" NOT NULL DEFAULT 'UNDERSTAND',
ALTER COLUMN "weight" SET DEFAULT 1.0;

-- AlterTable
ALTER TABLE "PinnedReview" DROP COLUMN "reviewAt",
DROP COLUMN "updatedAt",
DROP COLUMN "primitiveId",
ADD COLUMN     "primitiveId" INTEGER;

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "answerText",
DROP COLUMN "criterionId",
DROP COLUMN "questionText",
ADD COLUMN     "aiGenerated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "answer" TEXT,
ADD COLUMN     "autoMark" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "conceptTags" TEXT[],
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "currentMasteryScore" DOUBLE PRECISION,
ADD COLUMN     "difficultyScore" DOUBLE PRECISION,
ADD COLUMN     "imageUrls" TEXT[],
ADD COLUMN     "inCat" TEXT,
ADD COLUMN     "lastAnswerCorrect" BOOLEAN,
ADD COLUMN     "markingCriteria" JSONB,
ADD COLUMN     "masteryCriterionId" INTEGER,
ADD COLUMN     "options" TEXT[],
ADD COLUMN     "questionType" TEXT NOT NULL,
ADD COLUMN     "selfMark" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "text" TEXT NOT NULL,
ADD COLUMN     "timesAnsweredCorrectly" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "timesAnsweredIncorrectly" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "QuestionSet" DROP COLUMN "folderId",
DROP COLUMN "imageUrls",
DROP COLUMN "isTracked",
DROP COLUMN "marksAvailable",
DROP COLUMN "title",
DROP COLUMN "userId",
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "QuestionSetStudySession" DROP COLUMN "completedAt",
DROP COLUMN "correctAnswers",
DROP COLUMN "difficultyLevel",
DROP COLUMN "marksAwarded",
DROP COLUMN "masteryScore",
DROP COLUMN "startedAt",
DROP COLUMN "timeSpentMinutes",
DROP COLUMN "totalMarks",
DROP COLUMN "totalQuestions",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sessionId" INTEGER NOT NULL,
ADD COLUMN     "sessionMarksAchieved" INTEGER NOT NULL,
ADD COLUMN     "sessionMarksAvailable" INTEGER NOT NULL,
ADD COLUMN     "srStageBefore" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ScheduledReview" DROP COLUMN "completed",
DROP COLUMN "completedAt",
DROP COLUMN "scheduledFor",
DROP COLUMN "updatedAt",
ADD COLUMN     "reviewDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "questionSetId" DROP NOT NULL,
DROP COLUMN "primitiveId",
ADD COLUMN     "primitiveId" INTEGER;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "googleId",
DROP COLUMN "isVerified",
DROP COLUMN "plan",
DROP COLUMN "stripeCustomerId",
DROP COLUMN "subscriptionEndDate",
DROP COLUMN "subscriptionId",
DROP COLUMN "subscriptionStatus";

-- AlterTable
ALTER TABLE "UserBucketPreferences" DROP COLUMN "addMoreIncrement",
DROP COLUMN "coreSize",
DROP COLUMN "criticalSize",
DROP COLUMN "masteryThresholdLevel",
DROP COLUMN "maxDailyLimit",
DROP COLUMN "plusSize",
ADD COLUMN     "bucketSize" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "reviewInterval" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "UserCriterionMastery" DROP CONSTRAINT "UserCriterionMastery_pkey",
DROP COLUMN "attemptCount",
DROP COLUMN "blueprintId",
DROP COLUMN "createdAt",
DROP COLUMN "criterionId",
DROP COLUMN "lastAttemptedAt",
DROP COLUMN "masteredAt",
DROP COLUMN "primitiveId",
DROP COLUMN "successfulAttempts",
DROP COLUMN "updatedAt",
ADD COLUMN     "blueprintSectionId" INTEGER NOT NULL,
ADD COLUMN     "consecutiveFailures" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "consecutiveIntervals" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "currentIntervalStep" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastReviewedAt" TIMESTAMP(3),
ADD COLUMN     "lastThresholdCheckDate" TIMESTAMP(3),
ADD COLUMN     "lastTwoAttempts" DOUBLE PRECISION[],
ADD COLUMN     "masteryCriterionId" INTEGER NOT NULL,
ADD COLUMN     "masteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "nextReviewAt" TIMESTAMP(3),
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "successfulReviews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trackingIntensity" "TrackingIntensity" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN     "uueStage" "UueStage" NOT NULL DEFAULT 'UNDERSTAND',
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "UserCriterionMastery_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "UserCriterionMastery_id_seq";

-- AlterTable
ALTER TABLE "UserLearningAnalytics" DROP COLUMN "achievements",
DROP COLUMN "averageMasteryScore",
DROP COLUMN "conceptsMastered",
DROP COLUMN "conceptsReviewed",
DROP COLUMN "date",
DROP COLUMN "focusAreas",
DROP COLUMN "learningEfficiency",
DROP COLUMN "totalStudyTimeMinutes",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "data" JSONB NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "UserMemoryInsight" DROP COLUMN "confidenceScore",
DROP COLUMN "content",
DROP COLUMN "insightType",
DROP COLUMN "isActionable",
DROP COLUMN "relatedPrimitiveIds",
DROP COLUMN "title",
DROP COLUMN "updatedAt",
ADD COLUMN     "insight" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UserPrimitiveDailySummary" DROP COLUMN "canProgressToNext",
DROP COLUMN "lastCalculated",
DROP COLUMN "masteredCriteria",
DROP COLUMN "masteryLevel",
DROP COLUMN "nextReviewAt",
DROP COLUMN "primitiveTitle",
DROP COLUMN "totalCriteria",
DROP COLUMN "weightedMasteryScore",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "summary" JSONB NOT NULL,
DROP COLUMN "primitiveId",
ADD COLUMN     "primitiveId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UserPrimitiveProgress" DROP COLUMN "blueprintId",
DROP COLUMN "createdAt",
DROP COLUMN "masteryLevel",
DROP COLUMN "reviewCount",
DROP COLUMN "successfulReviews",
DROP COLUMN "trackingIntensity",
DROP COLUMN "updatedAt",
ADD COLUMN     "currentUeeLevel" TEXT NOT NULL DEFAULT 'Understand',
ADD COLUMN     "easeFactor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
ADD COLUMN     "interval" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
ADD COLUMN     "lapses" INTEGER NOT NULL DEFAULT 0,
DROP COLUMN "primitiveId",
ADD COLUMN     "primitiveId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "UserQuestionAnswer" DROP COLUMN "blueprintId",
DROP COLUMN "marksAwarded",
DROP COLUMN "questionSetId",
DROP COLUMN "updatedAt",
DROP COLUMN "userAnswer",
ADD COLUMN     "answerText" TEXT,
ADD COLUMN     "masteryCriterionId" INTEGER,
ADD COLUMN     "timeSpentSeconds" INTEGER,
ALTER COLUMN "isCorrect" SET NOT NULL,
DROP COLUMN "primitiveId",
ADD COLUMN     "primitiveId" INTEGER;

-- AlterTable
ALTER TABLE "UserStudySession" DROP COLUMN "completedAt",
DROP COLUMN "correctAnswers",
DROP COLUMN "marksAwarded",
DROP COLUMN "questionSetId",
DROP COLUMN "startedAt",
DROP COLUMN "totalMarks",
DROP COLUMN "totalQuestions",
ADD COLUMN     "answeredQuestionsCount" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sessionEndedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "sessionStartedAt" TIMESTAMP(3),
ADD COLUMN     "timeSpentSeconds" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "VerificationToken" DROP COLUMN "expiresAt",
ADD COLUMN     "expires" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "Folder";

-- DropTable
DROP TABLE "Note";

-- CreateTable
CREATE TABLE "BlueprintSection" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "blueprintId" INTEGER NOT NULL,
    "parentSectionId" INTEGER,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "difficulty" "DifficultyLevel" NOT NULL DEFAULT 'BEGINNER',
    "estimatedTimeMinutes" INTEGER,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlueprintSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteSection" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentBlocks" JSONB,
    "contentHtml" TEXT,
    "plainText" TEXT,
    "contentVersion" INTEGER NOT NULL DEFAULT 2,
    "blueprintSectionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoteSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionInstance" (
    "id" SERIAL NOT NULL,
    "questionText" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "explanation" TEXT,
    "context" TEXT,
    "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MEDIUM',
    "masteryCriterionId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuestionInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeRelationship" (
    "id" SERIAL NOT NULL,
    "sourcePrimitiveId" INTEGER NOT NULL,
    "targetPrimitiveId" INTEGER NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "source" "RelationshipSource" NOT NULL DEFAULT 'AI_GENERATED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasteryCriterionRelationship" (
    "id" SERIAL NOT NULL,
    "sourceCriterionId" INTEGER NOT NULL,
    "targetCriterionId" INTEGER NOT NULL,
    "relationshipType" "CriterionRelationshipType" NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "source" "RelationshipSource" NOT NULL DEFAULT 'AI_GENERATED',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MasteryCriterionRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_QuestionToQuestionSetStudySession" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_QuestionToQuestionSetStudySession_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "BlueprintSection_blueprintId_idx" ON "BlueprintSection"("blueprintId");

-- CreateIndex
CREATE INDEX "BlueprintSection_parentSectionId_idx" ON "BlueprintSection"("parentSectionId");

-- CreateIndex
CREATE INDEX "BlueprintSection_userId_idx" ON "BlueprintSection"("userId");

-- CreateIndex
CREATE INDEX "BlueprintSection_depth_idx" ON "BlueprintSection"("depth");

-- CreateIndex
CREATE UNIQUE INDEX "BlueprintSection_blueprintId_parentSectionId_orderIndex_key" ON "BlueprintSection"("blueprintId", "parentSectionId", "orderIndex");

-- CreateIndex
CREATE INDEX "NoteSection_blueprintSectionId_idx" ON "NoteSection"("blueprintSectionId");

-- CreateIndex
CREATE INDEX "NoteSection_userId_idx" ON "NoteSection"("userId");

-- CreateIndex
CREATE INDEX "NoteSection_createdAt_idx" ON "NoteSection"("createdAt");

-- CreateIndex
CREATE INDEX "QuestionInstance_masteryCriterionId_idx" ON "QuestionInstance"("masteryCriterionId");

-- CreateIndex
CREATE INDEX "QuestionInstance_userId_idx" ON "QuestionInstance"("userId");

-- CreateIndex
CREATE INDEX "QuestionInstance_difficulty_idx" ON "QuestionInstance"("difficulty");

-- CreateIndex
CREATE INDEX "KnowledgeRelationship_sourcePrimitiveId_idx" ON "KnowledgeRelationship"("sourcePrimitiveId");

-- CreateIndex
CREATE INDEX "KnowledgeRelationship_targetPrimitiveId_idx" ON "KnowledgeRelationship"("targetPrimitiveId");

-- CreateIndex
CREATE INDEX "KnowledgeRelationship_relationshipType_idx" ON "KnowledgeRelationship"("relationshipType");

-- CreateIndex
CREATE INDEX "KnowledgeRelationship_strength_idx" ON "KnowledgeRelationship"("strength");

-- CreateIndex
CREATE INDEX "KnowledgeRelationship_confidence_idx" ON "KnowledgeRelationship"("confidence");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgeRelationship_sourcePrimitiveId_targetPrimitiveId_r_key" ON "KnowledgeRelationship"("sourcePrimitiveId", "targetPrimitiveId", "relationshipType");

-- CreateIndex
CREATE INDEX "MasteryCriterionRelationship_sourceCriterionId_idx" ON "MasteryCriterionRelationship"("sourceCriterionId");

-- CreateIndex
CREATE INDEX "MasteryCriterionRelationship_targetCriterionId_idx" ON "MasteryCriterionRelationship"("targetCriterionId");

-- CreateIndex
CREATE INDEX "MasteryCriterionRelationship_relationshipType_idx" ON "MasteryCriterionRelationship"("relationshipType");

-- CreateIndex
CREATE INDEX "MasteryCriterionRelationship_strength_idx" ON "MasteryCriterionRelationship"("strength");

-- CreateIndex
CREATE INDEX "MasteryCriterionRelationship_confidence_idx" ON "MasteryCriterionRelationship"("confidence");

-- CreateIndex
CREATE UNIQUE INDEX "MasteryCriterionRelationship_sourceCriterionId_targetCriter_key" ON "MasteryCriterionRelationship"("sourceCriterionId", "targetCriterionId", "relationshipType");

-- CreateIndex
CREATE INDEX "_QuestionToQuestionSetStudySession_B_index" ON "_QuestionToQuestionSetStudySession"("B");

-- CreateIndex
CREATE INDEX "InsightCatalyst_questionId_idx" ON "InsightCatalyst"("questionId");

-- CreateIndex
CREATE INDEX "InsightCatalyst_primitiveId_idx" ON "InsightCatalyst"("primitiveId");

-- CreateIndex
CREATE INDEX "InsightCatalyst_masteryCriterionId_idx" ON "InsightCatalyst"("masteryCriterionId");

-- CreateIndex
CREATE INDEX "KnowledgePrimitive_blueprintSectionId_idx" ON "KnowledgePrimitive"("blueprintSectionId");

-- CreateIndex
CREATE INDEX "LearningPath_userId_idx" ON "LearningPath"("userId");

-- CreateIndex
CREATE INDEX "LearningPathStep_learningPathId_idx" ON "LearningPathStep"("learningPathId");

-- CreateIndex
CREATE INDEX "LearningPathStep_primitiveId_idx" ON "LearningPathStep"("primitiveId");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPathStep_learningPathId_orderIndex_key" ON "LearningPathStep"("learningPathId", "orderIndex");

-- CreateIndex
CREATE INDEX "MasteryCriterion_knowledgePrimitiveId_idx" ON "MasteryCriterion"("knowledgePrimitiveId");

-- CreateIndex
CREATE INDEX "MasteryCriterion_blueprintSectionId_idx" ON "MasteryCriterion"("blueprintSectionId");

-- CreateIndex
CREATE INDEX "MasteryCriterion_uueStage_idx" ON "MasteryCriterion"("uueStage");

-- CreateIndex
CREATE INDEX "MasteryCriterion_weight_idx" ON "MasteryCriterion"("weight");

-- CreateIndex
CREATE INDEX "MasteryCriterion_complexityScore_idx" ON "MasteryCriterion"("complexityScore");

-- CreateIndex
CREATE INDEX "PinnedReview_primitiveId_idx" ON "PinnedReview"("primitiveId");

-- CreateIndex
CREATE INDEX "Question_masteryCriterionId_idx" ON "Question"("masteryCriterionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSetStudySession_sessionId_questionSetId_key" ON "QuestionSetStudySession"("sessionId", "questionSetId");

-- CreateIndex
CREATE INDEX "ScheduledReview_userId_reviewDate_idx" ON "ScheduledReview"("userId", "reviewDate");

-- CreateIndex
CREATE INDEX "ScheduledReview_primitiveId_idx" ON "ScheduledReview"("primitiveId");

-- CreateIndex
CREATE INDEX "UserBucketPreferences_userId_idx" ON "UserBucketPreferences"("userId");

-- CreateIndex
CREATE INDEX "UserCriterionMastery_masteryCriterionId_idx" ON "UserCriterionMastery"("masteryCriterionId");

-- CreateIndex
CREATE INDEX "UserCriterionMastery_blueprintSectionId_idx" ON "UserCriterionMastery"("blueprintSectionId");

-- CreateIndex
CREATE INDEX "UserCriterionMastery_uueStage_idx" ON "UserCriterionMastery"("uueStage");

-- CreateIndex
CREATE UNIQUE INDEX "UserLearningAnalytics_userId_key" ON "UserLearningAnalytics"("userId");

-- CreateIndex
CREATE INDEX "UserLearningAnalytics_userId_idx" ON "UserLearningAnalytics"("userId");

-- CreateIndex
CREATE INDEX "UserMemoryInsight_userId_idx" ON "UserMemoryInsight"("userId");

-- CreateIndex
CREATE INDEX "UserMemoryInsight_createdAt_idx" ON "UserMemoryInsight"("createdAt");

-- CreateIndex
CREATE INDEX "UserPrimitiveDailySummary_userId_idx" ON "UserPrimitiveDailySummary"("userId");

-- CreateIndex
CREATE INDEX "UserPrimitiveDailySummary_primitiveId_idx" ON "UserPrimitiveDailySummary"("primitiveId");

-- CreateIndex
CREATE INDEX "UserPrimitiveDailySummary_date_idx" ON "UserPrimitiveDailySummary"("date");

-- CreateIndex
CREATE UNIQUE INDEX "UserPrimitiveDailySummary_userId_primitiveId_date_key" ON "UserPrimitiveDailySummary"("userId", "primitiveId", "date");

-- CreateIndex
CREATE INDEX "UserPrimitiveProgress_primitiveId_idx" ON "UserPrimitiveProgress"("primitiveId");

-- CreateIndex
CREATE INDEX "UserPrimitiveProgress_nextReviewAt_idx" ON "UserPrimitiveProgress"("nextReviewAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPrimitiveProgress_userId_primitiveId_key" ON "UserPrimitiveProgress"("userId", "primitiveId");

-- CreateIndex
CREATE INDEX "UserQuestionAnswer_createdAt_idx" ON "UserQuestionAnswer"("createdAt");

-- CreateIndex
CREATE INDEX "UserQuestionAnswer_masteryCriterionId_idx" ON "UserQuestionAnswer"("masteryCriterionId");

-- CreateIndex
CREATE INDEX "UserQuestionAnswer_primitiveId_idx" ON "UserQuestionAnswer"("primitiveId");

-- CreateIndex
CREATE INDEX "UserStudySession_sessionEndedAt_idx" ON "UserStudySession"("sessionEndedAt");

-- CreateIndex
CREATE INDEX "VerificationToken_token_idx" ON "VerificationToken"("token");

-- AddForeignKey
ALTER TABLE "BlueprintSection" ADD CONSTRAINT "BlueprintSection_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "LearningBlueprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlueprintSection" ADD CONSTRAINT "BlueprintSection_parentSectionId_fkey" FOREIGN KEY ("parentSectionId") REFERENCES "BlueprintSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlueprintSection" ADD CONSTRAINT "BlueprintSection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSection" ADD CONSTRAINT "NoteSection_blueprintSectionId_fkey" FOREIGN KEY ("blueprintSectionId") REFERENCES "BlueprintSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSection" ADD CONSTRAINT "NoteSection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryCriterion" ADD CONSTRAINT "MasteryCriterion_knowledgePrimitiveId_fkey" FOREIGN KEY ("knowledgePrimitiveId") REFERENCES "KnowledgePrimitive"("primitiveId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryCriterion" ADD CONSTRAINT "MasteryCriterion_blueprintSectionId_fkey" FOREIGN KEY ("blueprintSectionId") REFERENCES "BlueprintSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionInstance" ADD CONSTRAINT "QuestionInstance_masteryCriterionId_fkey" FOREIGN KEY ("masteryCriterionId") REFERENCES "MasteryCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionInstance" ADD CONSTRAINT "QuestionInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePrimitive" ADD CONSTRAINT "KnowledgePrimitive_blueprintId_fkey" FOREIGN KEY ("blueprintId") REFERENCES "LearningBlueprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePrimitive" ADD CONSTRAINT "KnowledgePrimitive_blueprintSectionId_fkey" FOREIGN KEY ("blueprintSectionId") REFERENCES "BlueprintSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCriterionMastery" ADD CONSTRAINT "UserCriterionMastery_masteryCriterionId_fkey" FOREIGN KEY ("masteryCriterionId") REFERENCES "MasteryCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCriterionMastery" ADD CONSTRAINT "UserCriterionMastery_blueprintSectionId_fkey" FOREIGN KEY ("blueprintSectionId") REFERENCES "BlueprintSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestionAnswer" ADD CONSTRAINT "UserQuestionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "QuestionInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestionAnswer" ADD CONSTRAINT "UserQuestionAnswer_masteryCriterionId_fkey" FOREIGN KEY ("masteryCriterionId") REFERENCES "MasteryCriterion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserQuestionAnswer" ADD CONSTRAINT "UserQuestionAnswer_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrimitiveProgress" ADD CONSTRAINT "UserPrimitiveProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrimitiveProgress" ADD CONSTRAINT "UserPrimitiveProgress_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSetStudySession" ADD CONSTRAINT "QuestionSetStudySession_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserStudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightCatalyst" ADD CONSTRAINT "InsightCatalyst_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "NoteSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightCatalyst" ADD CONSTRAINT "InsightCatalyst_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightCatalyst" ADD CONSTRAINT "InsightCatalyst_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsightCatalyst" ADD CONSTRAINT "InsightCatalyst_masteryCriterionId_fkey" FOREIGN KEY ("masteryCriterionId") REFERENCES "MasteryCriterion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledReview" ADD CONSTRAINT "ScheduledReview_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinnedReview" ADD CONSTRAINT "PinnedReview_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrimitiveDailySummary" ADD CONSTRAINT "UserPrimitiveDailySummary_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPathStep" ADD CONSTRAINT "LearningPathStep_primitiveId_fkey" FOREIGN KEY ("primitiveId") REFERENCES "KnowledgePrimitive"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRelationship" ADD CONSTRAINT "KnowledgeRelationship_sourcePrimitiveId_fkey" FOREIGN KEY ("sourcePrimitiveId") REFERENCES "KnowledgePrimitive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeRelationship" ADD CONSTRAINT "KnowledgeRelationship_targetPrimitiveId_fkey" FOREIGN KEY ("targetPrimitiveId") REFERENCES "KnowledgePrimitive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryCriterionRelationship" ADD CONSTRAINT "MasteryCriterionRelationship_sourceCriterionId_fkey" FOREIGN KEY ("sourceCriterionId") REFERENCES "MasteryCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasteryCriterionRelationship" ADD CONSTRAINT "MasteryCriterionRelationship_targetCriterionId_fkey" FOREIGN KEY ("targetCriterionId") REFERENCES "MasteryCriterion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_masteryCriterionId_fkey" FOREIGN KEY ("masteryCriterionId") REFERENCES "MasteryCriterion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestionToQuestionSetStudySession" ADD CONSTRAINT "_QuestionToQuestionSetStudySession_A_fkey" FOREIGN KEY ("A") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_QuestionToQuestionSetStudySession" ADD CONSTRAINT "_QuestionToQuestionSetStudySession_B_fkey" FOREIGN KEY ("B") REFERENCES "QuestionSetStudySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
