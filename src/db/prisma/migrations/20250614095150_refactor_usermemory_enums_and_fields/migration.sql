/*
  Warnings:

  - You are about to drop the column `learningStyles` on the `UserMemory` table. All the data in the column will be lost.
  - You are about to drop the column `preferredAiTone` on the `UserMemory` table. All the data in the column will be lost.
  - You are about to drop the column `preferredAiVerbosity` on the `UserMemory` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CognitiveApproach" AS ENUM ('TOP_DOWN', 'BOTTOM_UP', 'ADAPTIVE');

-- CreateEnum
CREATE TYPE "ExplanationStyle" AS ENUM ('ANALOGY_DRIVEN', 'PRACTICAL_EXAMPLES', 'TEXTUAL_DETAILED');

-- CreateEnum
CREATE TYPE "InteractionStyle" AS ENUM ('DIRECT', 'SOCRATIC');

-- AlterTable
ALTER TABLE "UserMemory" DROP COLUMN "learningStyles",
DROP COLUMN "preferredAiTone",
DROP COLUMN "preferredAiVerbosity",
ADD COLUMN     "cognitiveApproach" "CognitiveApproach",
ADD COLUMN     "explanationStyles" "ExplanationStyle"[],
ADD COLUMN     "interactionStyle" "InteractionStyle";

-- DropEnum
DROP TYPE "AiTone";

-- DropEnum
DROP TYPE "AiVerbosity";

-- DropEnum
DROP TYPE "LearningStyle";
