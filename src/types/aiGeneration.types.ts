export enum NoteStyle {
  CONCISE = 'CONCISE',
  THOROUGH = 'THOROUGH',
  EXPLORATIVE = 'EXPLORATIVE'
}

export enum SourceFidelity {
  STRICT = 'STRICT',
  CREATIVE = 'CREATIVE'
}

export enum QuestionScope {
  ESSENCE = 'ESSENCE',
  THOROUGH = 'THOROUGH'
}

export enum QuestionTone {
  ENCOURAGING = 'ENCOURAGING',
  FORMAL = 'FORMAL'
}

// Sprint 53: Enhanced AI Generation Types
export enum GenerationStyle {
  CONCISE = 'concise',
  THOROUGH = 'thorough',
  EXPLORATIVE = 'explorative'
}

export enum GenerationFocus {
  UNDERSTAND = 'understand',
  USE = 'use',
  EXPLORE = 'explore'
}

export enum GenerationDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  FILL_BLANK = 'fill_blank',
  EXPLANATION = 'explanation',
  APPLICATION = 'application'
}

export enum NoteFormat {
  BULLET = 'bullet',
  PARAGRAPH = 'paragraph',
  MINDMAP = 'mindmap'
}

// Comprehensive Generation Instructions
export interface GenerationInstructions {
  style: GenerationStyle;
  focus: GenerationFocus;
  difficulty: GenerationDifficulty;
  targetAudience: string;
  customPrompts: string[];
  includeExamples: boolean;
  noteFormat: NoteFormat;
}

// Question Family System
export interface QuestionFamily {
  id: string;
  masteryCriterionId: string;
  baseQuestion: string;
  variations: QuestionVariation[];
  difficulty: GenerationDifficulty;
  questionType: QuestionType;
  tags: string[];
  learningObjectives: string[];
  estimatedTimeMinutes: number;
}

export interface QuestionVariation {
  id: string;
  questionText: string;
  answer: string;
  explanation: string;
  difficulty: GenerationDifficulty;
  context: string;
  hints: string[];
  learningObjectives: string[];
}

// AI Blueprint Generation
export interface AIBlueprintGenerationRequest {
  content: string;
  instructions: GenerationInstructions;
  userId: string;
  sourceId?: string;
  existingBlueprintId?: string;
}

export interface AIBlueprintGenerationResponse {
  blueprint: LearningBlueprint;
  sections: BlueprintSection[];
  primitives: KnowledgePrimitive[];
  questionFamilies: QuestionFamily[];
  generationMetadata: {
    processingTime: number;
    modelUsed: string;
    confidence: number;
    costEstimate: number;
  };
}

// Learning Blueprint Interface
export interface LearningBlueprint {
  id: string;
  name: string;
  description: string;
  difficulty: GenerationDifficulty;
  estimatedTimeMinutes: number;
  learningObjectives: string[];
  prerequisites: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Blueprint Section Interface
export interface BlueprintSection {
  id: string;
  blueprintId: string;
  name: string;
  description: string;
  order: number;
  difficulty: GenerationDifficulty;
  estimatedTimeMinutes: number;
  learningObjectives: string[];
  prerequisites: string[];
}

// Knowledge Primitive Interface
export interface KnowledgePrimitive {
  id: string;
  sectionId: string;
  name: string;
  description: string;
  content: string;
  difficulty: GenerationDifficulty;
  learningObjectives: string[];
  prerequisites: string[];
  relatedPrimitives: string[];
  masteryCriteria: string[];
}

// Legacy interfaces for backward compatibility
export interface GenerateNoteRequest {
  sourceId: string;
  // userId will be derived from the authenticated user (req.user.userId)
  noteStyle: NoteStyle;
  sourceFidelity: SourceFidelity;
}

export interface GenerateQuestionRequest {
  sourceId: string;
  // userId is removed as it should be derived from the authenticated user (AuthRequest)
  questionScope: QuestionScope;
  questionTone: QuestionTone;
  questionCount?: number; // Optional: Number of questions to generate
}
