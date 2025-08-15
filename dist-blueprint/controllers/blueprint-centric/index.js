"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeGraphController = exports.questionInstanceController = exports.QuestionInstanceController = exports.enhancedTodaysTasksController = exports.EnhancedTodaysTasksController = exports.enhancedSpacedRepetitionController = exports.EnhancedSpacedRepetitionController = exports.masteryCriterionController = exports.MasteryCriterionController = exports.noteSectionController = exports.NoteSectionController = exports.blueprintSectionController = exports.BlueprintSectionController = void 0;
// Core Blueprint Section Management
var blueprintSection_controller_1 = require("./blueprintSection.controller");
Object.defineProperty(exports, "BlueprintSectionController", { enumerable: true, get: function () { return blueprintSection_controller_1.default; } });
var blueprintSection_controller_2 = require("./blueprintSection.controller");
Object.defineProperty(exports, "blueprintSectionController", { enumerable: true, get: function () { return blueprintSection_controller_2.BlueprintSectionController; } });
// Note Section Management
var noteSection_controller_1 = require("./noteSection.controller");
Object.defineProperty(exports, "NoteSectionController", { enumerable: true, get: function () { return noteSection_controller_1.NoteSectionController; } });
Object.defineProperty(exports, "noteSectionController", { enumerable: true, get: function () { return noteSection_controller_1.noteSectionController; } });
// Mastery Criterion Management
var masteryCriterion_controller_1 = require("./masteryCriterion.controller");
Object.defineProperty(exports, "MasteryCriterionController", { enumerable: true, get: function () { return masteryCriterion_controller_1.MasteryCriterionController; } });
Object.defineProperty(exports, "masteryCriterionController", { enumerable: true, get: function () { return masteryCriterion_controller_1.masteryCriterionController; } });
// Enhanced Spaced Repetition
var enhancedSpacedRepetition_controller_1 = require("./enhancedSpacedRepetition.controller");
Object.defineProperty(exports, "EnhancedSpacedRepetitionController", { enumerable: true, get: function () { return enhancedSpacedRepetition_controller_1.EnhancedSpacedRepetitionController; } });
Object.defineProperty(exports, "enhancedSpacedRepetitionController", { enumerable: true, get: function () { return enhancedSpacedRepetition_controller_1.enhancedSpacedRepetitionController; } });
// Enhanced Today's Tasks
var enhancedTodaysTasks_controller_1 = require("./enhancedTodaysTasks.controller");
Object.defineProperty(exports, "EnhancedTodaysTasksController", { enumerable: true, get: function () { return enhancedTodaysTasks_controller_1.EnhancedTodaysTasksController; } });
Object.defineProperty(exports, "enhancedTodaysTasksController", { enumerable: true, get: function () { return enhancedTodaysTasks_controller_1.enhancedTodaysTasksController; } });
// Question Instance Management
var questionInstance_controller_1 = require("./questionInstance.controller");
Object.defineProperty(exports, "QuestionInstanceController", { enumerable: true, get: function () { return questionInstance_controller_1.QuestionInstanceController; } });
Object.defineProperty(exports, "questionInstanceController", { enumerable: true, get: function () { return questionInstance_controller_1.questionInstanceController; } });
// Knowledge Graph (already exists)
var knowledgeGraph_controller_1 = require("./knowledgeGraph.controller");
Object.defineProperty(exports, "KnowledgeGraphController", { enumerable: true, get: function () { return knowledgeGraph_controller_1.default; } });
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
