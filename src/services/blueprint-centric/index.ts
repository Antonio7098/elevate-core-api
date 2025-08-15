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
//
// ============================================================================

export { default as BlueprintSectionService } from './blueprintSection.service';
export { default as NoteSectionService } from './noteSection.service';
export { default as MasteryCriterionService } from './masteryCriterion.service';
export { default as ContentAggregator } from './contentAggregator.service';
export { default as SectionHierarchyManager } from './sectionHierarchyManager.service';

// Sprint 51: Knowledge Graph & RAG Services
export { default as KnowledgeGraphTraversal } from './knowledgeGraphTraversal.service';
export { default as ContextAssemblyService } from './contextAssembly.service';
export { default as IntelligentContextBuilder } from './intelligentContextBuilder.service';
export { default as VectorStoreService } from './vectorStore.service';
export { default as RAGResponseGenerator } from './ragResponseGenerator.service';
export { default as RelationshipDiscoveryService } from './relationshipDiscovery.service';
export { default as LearningPathService } from './learningPath.service';

// Sprint 53: AI Integration & Advanced Features
export { default as AIBlueprintGenerator } from '../aiBlueprintGenerator.service';
export { default as LearningPathwaysService } from '../learningPathways.service';

// Export all interfaces and types
export * from './blueprintSection.service';
export * from './noteSection.service';
export * from './masteryCriterion.service';
export * from './contentAggregator.service';
export * from './sectionHierarchyManager.service';

// Sprint 51: Knowledge Graph & RAG Interfaces
export * from './knowledgeGraphTraversal.service';
export * from './contextAssembly.service';
export * from './intelligentContextBuilder.service';
export * from './vectorStore.service';
export * from './ragResponseGenerator.service';
export * from './relationshipDiscovery.service';
export * from './learningPath.service';

// Sprint 53: AI Integration & Advanced Features
export * from '../aiBlueprintGenerator.service';
export * from '../learningPathways.service';

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
