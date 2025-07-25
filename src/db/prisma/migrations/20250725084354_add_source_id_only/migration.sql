-- Add sourceId column to LearningBlueprint table
-- This field will store the UUID returned by the AI API during indexing

ALTER TABLE "LearningBlueprint" ADD COLUMN "sourceId" TEXT;
