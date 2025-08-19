// ============================================================================
// BLUEPRINT-CENTRIC SERVICES INDEX
// ============================================================================
// 
// 🆕 NEW ARCHITECTURE - REPLACES LEGACY FOLDER/QUESTION SET SYSTEM
//
// This module exports all the new blueprint-centric services:
// - BlueprintSectionService: Replaces recursiveFolder.service.ts
// - NoteSectionService: Replaces direct note management
// - MasteryCriterionService: Replaces QuestionSet + QuestionFamily + Question
// - ContentAggregator: New content aggregation and UUE tracking
// - SectionHierarchyManager: New hierarchy management and validation
// - BlueprintCentricService: New multi-primitive mastery criteria management
//
// ============================================================================

export { default as BlueprintSectionService } from './blueprintSection.service';
export { default as NoteSectionService } from './noteSection.service';
export { default as ContentAggregator } from './contentAggregator.service';
export { default as SectionHierarchyManager } from './sectionHierarchyManager.service';
export { default as BlueprintCentricService } from './blueprintCentric.service';

// Sprint 51: Knowledge Graph & RAG Services
export { default as KnowledgeGraphTraversal } from './knowledgeGraphTraversal.service';
export { default as ContextAssemblyService } from './contextAssembly.service';
export { default as IntelligentContextBuilder } from './intelligentContextBuilder.service';
export { default as VectorStoreService } from './vectorStore.service';
export { default as RAGResponseGenerator } from './ragResponseGenerator.service';
export { default as RelationshipDiscoveryService } from './relationshipDiscovery.service';
export { default as LearningPathService } from './learningPath.service';

// Sprint 53: AI Integration & Advanced Features
export { AIBlueprintGeneratorService } from '../ai/aiBlueprintGenerator.service';
export { LearningPathwaysService } from '../mastery/learningPathways.service';

// ============================================================================
// LEGACY REPLACEMENT MAPPING
// ============================================================================
//
// OLD SYSTEM                    → NEW SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
// Folder                        → BlueprintSection
// QuestionSet                   → MasteryCriterion  
// QuestionFamily                → MasteryCriterion (eliminated layer)
// Question                      → QuestionInstance
// Note                          → NoteSection
// recursiveFolder.service.ts    → BlueprintSectionService
//
// ============================================================================
