-- CreateEnum
CREATE TYPE "LearningStyle" AS ENUM ('ANALOGY_BASED', 'VISUAL_EXPLANATIONS', 'PRACTICAL_EXAMPLES');

-- CreateEnum
CREATE TYPE "AiTone" AS ENUM ('ENCOURAGING', 'FORMAL_ACADEMIC', 'DIRECT');

-- CreateEnum
CREATE TYPE "AiVerbosity" AS ENUM ('CONCISE', 'DETAILED');

-- CreateTable
CREATE TABLE "UserMemory" (
    "id" SERIAL NOT NULL,
    "learningStyles" "LearningStyle"[],
    "primaryGoal" TEXT,
    "preferredAiTone" "AiTone" NOT NULL DEFAULT 'ENCOURAGING',
    "preferredAiVerbosity" "AiVerbosity" NOT NULL DEFAULT 'CONCISE',
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMemory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserMemory_userId_key" ON "UserMemory"("userId");

-- CreateIndex
CREATE INDEX "UserMemory_userId_idx" ON "UserMemory"("userId");

-- AddForeignKey
ALTER TABLE "UserMemory" ADD CONSTRAINT "UserMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
