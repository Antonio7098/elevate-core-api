// ============================================================================
// BLUEPRINT-CENTRIC CONTROLLERS INDEX
// ============================================================================
// 
// 🆕 NEW ARCHITECTURE - REPLACES LEGACY FOLDER/QUESTION SET SYSTEM
//
// This module exports all the new blueprint-centric controllers:
// - BlueprintSectionController: Replaces folder.controller.ts
// - NoteSectionController: Replaces note.controller.ts
// - MasteryCriterionController: Replaces primitive.controller.ts
// - EnhancedSpacedRepetitionController: Replaces primitiveSR.controller.ts
// - EnhancedTodaysTasksController: Replaces todaysTasks.controller.ts
// - QuestionInstanceController: Replaces question.controller.ts
//
// ============================================================================

// Core Blueprint Section Management
export { default as BlueprintSectionController } from './blueprintSection.controller';

// Note Section Management
export { NoteSectionController, noteSectionController } from './noteSection.controller';

// Mastery Criterion Management
export { MasteryCriterionController, masteryCriterionController } from './masteryCriterion.controller';

// Enhanced Spaced Repetition
export { EnhancedSpacedRepetitionController, enhancedSpacedRepetitionController } from './enhancedSpacedRepetition.controller';

// Enhanced Today's Tasks
export { EnhancedTodaysTasksController, enhancedTodaysTasksController } from './enhancedTodaysTasks.controller';

// Question Instance Management
export { QuestionInstanceController, questionInstanceController } from './questionInstance.controller';

// Knowledge Graph (already exists)
export { default as KnowledgeGraphController } from './knowledgeGraph.controller';

// ============================================================================
// LEGACY REPLACEMENT MAPPING
// ============================================================================
//
// OLD CONTROLLER                    → NEW CONTROLLER
// ─────────────────────────────────────────────────────────────────────────────
// folder.controller.ts               → BlueprintSectionController
// note.controller.ts                 → NoteSectionController
// primitive.controller.ts            → MasteryCriterionController
// primitiveSR.controller.ts          → EnhancedSpacedRepetitionController
// todaysTasks.controller.ts          → EnhancedTodaysTasksController
// question.controller.ts             → QuestionInstanceController
//
// ============================================================================

// ============================================================================
// API ENDPOINT MAPPING
// ============================================================================
//
// OLD ENDPOINTS                     → NEW ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────
// /api/folders/*                    → /api/blueprint-section/*
// /api/notes/*                      → /api/note-section/*
// /api/primitives/*                 → /api/mastery-criterion/*
// /api/primitive-sr/*               → /api/enhanced-sr/*
// /api/todays-tasks/*               → /api/enhanced-todays-tasks/*
// /api/questions/*                  → /api/question-instance/*
//
// ============================================================================




