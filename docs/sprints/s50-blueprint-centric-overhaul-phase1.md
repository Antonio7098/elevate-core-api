# Sprint 50: Blueprint-Centric Overhaul - Phase 1 Foundation

**Signed off** Antonio
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Database Schema Overhaul & Foundation Services
**Overview:** Implement the foundational database schema changes and core services for the blueprint-centric system transformation. This sprint establishes the new data model that eliminates folders and question sets in favor of blueprint sections and primitive-based organization.

**Key Simplification:** MasteryCriterion = Question Family (eliminates unnecessary QuestionFamily layer)

---

## I. Sprint Goals & Objectives

### Primary Goals:
1. **Database Schema Transformation**: Remove obsolete models (Folder, QuestionSet, Question) and implement new blueprint-centric models
2. **Core Service Foundation**: Create new services for blueprint, section, and note management
3. **Data Migration Preparation**: Set up migration scripts and test data transformation
4. **API Endpoint Foundation**: Implement basic CRUD operations for new models

### Success Criteria:
- New database schema deployed and tested
- Core services (BlueprintService, SectionService, NoteService) functional
- Basic API endpoints responding correctly
- Migration scripts ready for testing
- No breaking changes to existing functionality during transition

---

## II. Detailed Technical Architecture

### A. Simplified Architecture Overview

**The Key Insight: MasteryCriterion = Question Family**

Instead of having separate QuestionFamily and MasteryCriterion models, we've simplified to:
- **MasteryCriterion**: Contains the question family title, UUE stage, and mastery tracking
- **QuestionInstance**: Individual question variations that link directly to MasteryCriterion
- **UserCriterionMastery**: Tracks mastery progress for each criterion

**Benefits of This Approach:**
1. **Simpler Data Model**: Fewer tables and relationships
2. **Clearer Mental Model**: One criterion = one set of questions
3. **Better Performance**: Fewer joins and queries
4. **Easier to Understand**: Mastery tracking is straightforward
5. **Cleaner API**: Simpler endpoints and logic

### B. New Database Schema Models

#### 1. BlueprintSection (Replaces Folder)
```prisma
model BlueprintSection {
  id                    String                @id @default(cuid())
  title                 String                // Section name
  description          String?               // Section description
  blueprintId          String                // Reference to parent blueprint
  parentSectionId      String?               // For hierarchical nesting
  depth                Int                   @default(0) // Nesting depth
  orderIndex           Int                   @default(0) // Display order
  difficulty           DifficultyLevel       @default(BEGINNER)
  userId               Int                   // Owner
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt
  
  // Relations
  blueprint            LearningBlueprint     @relation(fields: [blueprintId], references: [id], onDelete: Cascade)
  parent               BlueprintSection?     @relation("SectionHierarchy", fields: [parentSectionId], references: [id])
  children             BlueprintSection[]    @relation("SectionHierarchy")
  notes                NoteSection[]
  knowledgePrimitives  KnowledgePrimitive[]
  user                 User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Indexes for performance
  @@index([blueprintId])
  @@index([parentSectionId])
  @@index([userId])
  @@index([depth])
  @@unique([blueprintId, orderIndex])
}

enum DifficultyLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
}
```

#### 2. NoteSection (Replaces Note)
```prisma
model NoteSection {
  id                    String                @id @default(cuid())
  title                 String                // Note title
  content              String                // Note content
  contentBlocks        Json?                 // Structured content blocks
  contentVersion       Int                   @default(2)
  blueprintSectionId   String                // Links to blueprint section
  userId               Int                   // Owner
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt
  
  // Relations
  blueprintSection     BlueprintSection      @relation(fields: [blueprintSectionId], references: [id], onDelete: Cascade)
  user                 User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Indexes
  @@index([blueprintSectionId])
  @@index([userId])
  @@index([createdAt])
}
```

#### 3. QuestionInstance (Question Variations)
```prisma
model QuestionInstance {
  id                    String                @id @default(cuid())
  questionText         String                // Specific question variation
  answer               String                // Correct answer
  explanation          String?               // Answer explanation
  context              String?               // Additional context
  difficulty           QuestionDifficulty    @default(MEDIUM)
  masteryCriterionId   String                // Direct link to mastery criterion
  userId               Int                   // Owner
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt
  
  // Relations
  masteryCriterion     MasteryCriterion      @relation(fields: [masteryCriterionId], references: [id], onDelete: Cascade)
  user                 User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  userAnswers          UserQuestionAnswer[]
  
  // Indexes
  @@index([masteryCriterionId])
  @@index([userId])
  @@index([difficulty])
}

enum QuestionDifficulty {
  EASY
  MEDIUM
  HARD
}

enum AssessmentType {
  QUESTION_BASED         // Multiple choice, fill-in-blank
  EXPLANATION_BASED      // Written explanations
  APPLICATION_BASED      // Practical applications
  COMPARISON_BASED       // Compare and contrast
  CREATION_BASED         // Create new content
}

enum UueStage {
  UNDERSTAND
  USE
  EXPLORE
}
```

#### 4. Enhanced MasteryCriterion (Question Family + Mastery Tracking)
```prisma
model MasteryCriterion {
  id                    String                @id @default(cuid())
  title                 String                // "What is a derivative?" - The question family
  description           String                // "Understand the basic concept of derivatives"
  weight                Float                 @default(1.0) // Importance weight
  uueStage             UueStage              @default(UNDERSTAND) // FOUNDATIONAL: UUE stage for SR and learning pathways
  knowledgePrimitiveId String                // Links to knowledge primitive
  blueprintSectionId   String                // Links to blueprint section
  userId               Int                   // Owner
  createdAt            DateTime              @default(now())
  updatedAt            DateTime              @updatedAt
  
  // Enhanced Fields
  assessmentType        AssessmentType        @default(QUESTION_BASED)
  masteryThreshold      Float                 @default(0.8) // Score needed to master
  timeLimit             Int?                  // Time limit in seconds
  attemptsAllowed       Int                   @default(3) // Number of attempts allowed
  
  // Relations
  knowledgePrimitive    KnowledgePrimitive    @relation(fields: [knowledgePrimitiveId], references: [id], onDelete: Cascade)
  blueprintSection      BlueprintSection      @relation(fields: [blueprintSectionId], references: [id], onDelete: Cascade)
  questionInstances     QuestionInstance[]    // Direct question variations (no QuestionFamily layer)
  userCriterionMasteries UserCriterionMastery[]
  user                 User                  @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([knowledgePrimitiveId])
  @@index([blueprintSectionId])
  @@index([userId])
  @@index([uueStage])
  @@index([weight])
  @@index([complexityScore])
}
```

### C. Service Architecture

#### 1. BlueprintSectionService
```typescript
interface BlueprintSectionService {
  // Core CRUD operations
  createSection(data: CreateSectionData): Promise<BlueprintSection>;
  getSection(id: string): Promise<BlueprintSectionWithChildren>;
  updateSection(id: string, data: UpdateSectionData): Promise<BlueprintSection>;
  deleteSection(id: string): Promise<void>;
  
  // Hierarchical operations
  getSectionTree(blueprintId: string): Promise<BlueprintSectionTree>;
  moveSection(id: string, newParentId: string | null): Promise<BlueprintSection>;
  reorderSections(blueprintId: string, orderData: SectionOrderData[]): Promise<void>;
  
  // Content aggregation
  getSectionContent(id: string): Promise<SectionContent>;
  getSectionStats(id: string): Promise<SectionStats>;
}

interface CreateSectionData {
  title: string;
  description?: string;
  blueprintId: string;
  parentSectionId?: string;
  difficulty?: DifficultyLevel;
  estimatedTimeMinutes?: number;
  userId: number;
}

interface BlueprintSectionTree {
  id: string;
  title: string;
  description?: string;
  depth: number;
  orderIndex: number;
  difficulty: DifficultyLevel;
  children: BlueprintSectionTree[];
  stats: {
    noteCount: number;
    questionCount: number;
    masteryProgress: number;
  };
}
```

#### 2. NoteSectionService
```typescript
interface NoteSectionService {
  // Core operations
  createNote(data: CreateNoteData): Promise<NoteSection>;
  getNote(id: string): Promise<NoteSection>;
  updateNote(id: string, data: UpdateNoteData): Promise<NoteSection>;
  deleteNote(id: string): Promise<void>;
  
  // Section-based operations
  getNotesBySection(sectionId: string): Promise<NoteSection[]>;
  moveNote(noteId: string, newSectionId: string): Promise<NoteSection>;
  
  // Content operations
  updateContent(noteId: string, content: string, blocks?: any[]): Promise<NoteSection>;
  getNoteHistory(noteId: string): Promise<NoteVersion[]>;
}

interface CreateNoteData {
  title: string;
  content: string;
  contentBlocks?: any[];
  blueprintSectionId: string;
  userId: number;
}
```

#### 3. MasteryCriterionService (Question Family + Mastery Management)
```typescript
interface MasteryCriterionService {
  // Core operations
  createCriterion(data: CreateCriterionData): Promise<MasteryCriterion>;
  getCriterion(id: string): Promise<MasteryCriterionWithInstances>;
  updateCriterion(id: string, data: UpdateCriterionData): Promise<MasteryCriterion>;
  deleteCriterion(id: string): Promise<void>;
  
  // Question instance management
  addQuestionInstance(criterionId: string, data: CreateInstanceData): Promise<QuestionInstance>;
  updateQuestionInstance(id: string, data: UpdateInstanceData): Promise<QuestionInstance>;
  deleteQuestionInstance(id: string): Promise<void>;
  
  // Section-based operations
  getCriteriaBySection(sectionId: string): Promise<MasteryCriterion[]>;
  getCriteriaByUueStage(sectionId: string, uueStage: UueStage): Promise<MasteryCriterion[]>;
  
  // AI integration
  generateQuestionVariations(criterionId: string, count: number, instructions: GenerationInstructions): Promise<QuestionInstance[]>;
  
  // UUE Stage Management
  getUueStageProgression(userId: number, sectionId: string): Promise<UueStageProgress>;
  canProgressToNextUueStage(userId: number, criterionId: string): Promise<boolean>;
  
  // Mastery tracking
  calculateCriterionMastery(criterionId: string, userId: number): Promise<CriterionMasteryResult>;
  updateMasteryProgress(criterionId: string, userId: number, performance: PerformanceData): Promise<void>;
}

interface CreateCriterionData {
  title: string;                    // "What is a derivative?"
  description: string;              // "Understand the basic concept of derivatives"
  weight: number;                   // Importance weight
  uueStage: UueStage;              // FOUNDATIONAL: UUE stage for SR algorithm and learning pathways
  assessmentType: AssessmentType;   // Type of assessment
  masteryThreshold: number;         // Score needed to master (0.8)
  knowledgePrimitiveId: string;     // Links to knowledge primitive
  blueprintSectionId: string;       // Links to blueprint section
  userId: number;
}

interface UueStageProgress {
  understand: { total: number; mastered: number; progress: number };
  use: { total: number; mastered: number; progress: number };
  explore: { total: number; mastered: number; progress: number };
  currentStage: UueStage;
  canProgress: boolean;
  nextStageRequirements: string[];
}

interface CriterionMasteryResult {
  criterionId: string;
  userId: number;
  isMastered: boolean;
  masteryScore: number;
  questionBreakdown: QuestionInstanceMastery[];
  lastUpdated: Date;
}

interface QuestionInstanceMastery {
  instanceId: string;
  questionText: string;
  lastAttempt: Date;
  isCorrect: boolean;
  score: number;
  attempts: number;
}
```

### D. Algorithmic Specifications

#### 1. Section Hierarchy Algorithm
```typescript
class SectionHierarchyManager {
  /**
   * Builds a complete section tree from flat section array
   * Time Complexity: O(n) where n = number of sections
   * Space Complexity: O(n) for the tree structure
   */
  buildSectionTree(sections: BlueprintSection[]): BlueprintSectionTree[] {
    const sectionMap = new Map<string, BlueprintSection>();
    const rootSections: BlueprintSectionTree[] = [];
    
    // First pass: create lookup map
    sections.forEach(section => {
      sectionMap.set(section.id, { ...section, children: [] });
    });
    
    // Second pass: build hierarchy
    sections.forEach(section => {
      if (section.parentSectionId) {
        const parent = sectionMap.get(section.parentSectionId);
        if (parent) {
          parent.children.push(sectionMap.get(section.id)!);
        }
      } else {
        rootSections.push(sectionMap.get(section.id)!);
      }
    });
    
    // Sort by orderIndex at each level
    const sortSections = (sections: BlueprintSectionTree[]): BlueprintSectionTree[] => {
      return sections.sort((a, b) => a.orderIndex - b.orderIndex)
        .map(section => ({
          ...section,
          children: sortSections(section.children)
        }));
    };
    
    return sortSections(rootSections);
  }
  
  /**
   * Calculates optimal section depth and prevents circular references
   * Time Complexity: O(n) where n = number of sections
   */
  calculateSectionDepth(sections: BlueprintSection[]): Map<string, number> {
    const depthMap = new Map<string, number>();
    const visited = new Set<string>();
    
    const calculateDepth = (sectionId: string, currentDepth: number = 0): number => {
      if (visited.has(sectionId)) {
        throw new Error(`Circular reference detected in section ${sectionId}`);
      }
      
      if (depthMap.has(sectionId)) {
        return depthMap.get(sectionId)!;
      }
      
      visited.add(sectionId);
      const section = sections.find(s => s.id === sectionId);
      
      if (!section) {
        visited.delete(sectionId);
        return 0;
      }
      
      let maxChildDepth = 0;
      if (section.parentSectionId) {
        maxChildDepth = calculateDepth(section.parentSectionId, currentDepth + 1);
      }
      
      const depth = Math.max(currentDepth, maxChildDepth);
      depthMap.set(sectionId, depth);
      visited.delete(sectionId);
      
      return depth;
    };
    
    sections.forEach(section => {
      if (!depthMap.has(section.id)) {
        calculateDepth(section.id);
      }
    });
    
    return depthMap;
  }
}
```

#### 2. Content Aggregation Algorithm
```typescript
class ContentAggregator {
  /**
   * Aggregates all content within a section and its children
   * Time Complexity: O(n + m) where n = sections, m = content items
   */
  async aggregateSectionContent(sectionId: string): Promise<SectionContent> {
    const section = await this.getSectionWithChildren(sectionId);
    const content = await this.recursiveContentAggregation(section);
    
    return {
      section: section,
      notes: content.notes,
      questions: content.questions,
      masteryProgress: await this.calculateMasteryProgress(sectionId),
      estimatedTime: this.calculateEstimatedTime(content),
      difficulty: this.calculateAverageDifficulty(content)
    };
  }
  
  /**
   * Recursively aggregates content from all child sections
   */
  private async recursiveContentAggregation(section: BlueprintSectionWithChildren): Promise<AggregatedContent> {
    let notes: NoteSection[] = [];
    let questions: MasteryCriterion[] = [];
    
    // Get direct content
    notes.push(...await this.getNotesBySection(section.id));
    questions.push(...await this.getMasteryCriteriaBySection(section.id));
    
    // Recursively get child content
    for (const child of section.children) {
      const childContent = await this.recursiveContentAggregation(child);
      notes.push(...childContent.notes);
      questions.push(...childContent.questions);
    }
    
    return { notes, questions };
  }
  
  /**
   * Calculates mastery progress across all content in section
   */
  private async calculateMasteryProgress(sectionId: string): Promise<MasteryProgress> {
    const criteria = await this.getMasteryCriteriaBySection(sectionId);
    const userMasteries = await this.getUserMasteries(criteria.map(c => c.id));
    
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    const masteredWeight = userMasteries.reduce((sum, m) => {
      const criterion = criteria.find(c => c.id === m.masteryCriterionId);
      return sum + (m.isMastered ? (criterion?.weight || 0) : 0);
    }, 0);
    
    return {
      overall: totalWeight > 0 ? masteredWeight / totalWeight : 0,
      byStage: this.calculateProgressByStage(criteria, userMasteries),
      totalCriteria: criteria.length,
      masteredCriteria: userMasteries.filter(m => m.isMastered).length
    };
  }
  
  /**
   * Calculates UUE stage progression for a section
   * FOUNDATIONAL: Essential for spaced repetition and learning pathways
   */
  private async calculateUueStageProgress(sectionId: string, userId: number): Promise<UueStageProgress> {
    const masteryCriteria = await this.getMasteryCriteriaBySection(sectionId);
    const userMasteries = await this.getUserMasteriesForCriteria(
      masteryCriteria.map(mc => mc.id), 
      userId
    );
    
    const stageProgress = {
      understand: { total: 0, mastered: 0, progress: 0 },
      use: { total: 0, mastered: 0, progress: 0 },
      explore: { total: 0, mastered: 0, progress: 0 }
    };
    
    // Calculate progress for each UUE stage
    for (const criterion of masteryCriteria) {
      const mastery = userMasteries.find(m => m.masteryCriterionId === criterion.id);
      const stage = criterion.uueStage.toLowerCase() as keyof typeof stageProgress;
      
      stageProgress[stage].total++;
      if (mastery?.isMastered) {
        stageProgress[stage].mastered++;
      }
    }
    
    // Calculate progress percentages
    Object.values(stageProgress).forEach(stage => {
      stage.progress = stage.total > 0 ? stage.mastered / stage.total : 0;
    });
    
    // Determine current stage and progression ability
    const currentStage = this.determineCurrentUueStage(stageProgress);
    const canProgress = this.canProgressToNextStage(stageProgress, currentStage);
    const nextStageRequirements = this.getNextStageRequirements(stageProgress, currentStage);
    
    return {
      ...stageProgress,
      currentStage,
      canProgress,
      nextStageRequirements
    };
  }
  
  /**
   * Determines current UUE stage based on mastery progress
   */
  private determineCurrentUueStage(stageProgress: any): UueStage {
    if (stageProgress.explore.progress >= 0.8) return 'EXPLORE';
    if (stageProgress.use.progress >= 0.8) return 'USE';
    if (stageProgress.understand.progress >= 0.8) return 'UNDERSTAND';
    return 'UNDERSTAND';
  }
  
  /**
   * Checks if user can progress to next UUE stage
   */
  private canProgressToNextStage(stageProgress: any, currentStage: UueStage): boolean {
    switch (currentStage) {
      case 'UNDERSTAND':
        return stageProgress.understand.progress >= 0.8;
      case 'USE':
        return stageProgress.use.progress >= 0.8;
      case 'EXPLORE':
        return stageProgress.explore.progress >= 0.8;
      default:
        return false;
    }
  }
}
```

---

## III. Implementation Tasks

### A. Database Schema Updates
- [ ] **Create new Prisma schema** with blueprint-centric models
- [ ] **Generate migration scripts** for schema transformation
- [ ] **Create data migration scripts** to transform existing data
- [ ] **Add database indexes** for performance optimization
- [ ] **Test migration scripts** with sample data

### B. Core Services Implementation
- [ ] **BlueprintSectionService**: Complete CRUD and hierarchy management
- [ ] **NoteSectionService**: Section-based note management
- [ ] **MasteryCriterionService**: Question family + mastery management (simplified!)
- [ ] **ContentAggregator**: Recursive content aggregation
- [ ] **SectionHierarchyManager**: Tree building and validation

### C. API Endpoints
- [ ] **Blueprint Section Management**: `GET/POST/PUT/DELETE /api/sections`
- [ ] **Section Hierarchy**: `GET /api/sections/:id/tree`
- [ ] **Section Content**: `GET /api/sections/:id/content`
- [ ] **Note Management**: `GET/POST/PUT/DELETE /api/sections/:id/notes`
- [ ] **Mastery Criterion Management**: `GET/POST/PUT/DELETE /api/sections/:id/criteria`
- [ ] **Question Instance Management**: `GET/POST/PUT/DELETE /api/criteria/:id/questions`

### D. Data Migration
- [ ] **Folder to Section Migration**: Transform folder hierarchy to blueprint sections
- [ ] **Note Migration**: Link existing notes to appropriate sections
- [ ] **Question Migration**: Transform questions to question families
- [ ] **Progress Migration**: Preserve user progress and mastery data
- [ ] **Validation Scripts**: Verify data integrity after migration

---

## IV. Service Modification Details

### A. Existing Services to Modify

#### 1. Spaced Repetition Service (`primitiveSR.service.ts`)
**Current Functionality**: Operates on `UserPrimitiveProgress` and `MasteryCriterion`
**Required Changes**:
- Update to work with new `QuestionInstance` model
- Modify `generateDailyTasks()` to use `BlueprintSection` instead of folders
- Update `selectQuestionsForPrimitive()` to work with `MasteryCriterion` and `QuestionInstance`
- Adapt bucket categorization to use section-based organization
- **UUE Stage Integration**: Balance questions across Understand, Use, and Explore stages
- **Stage Progression**: Track UUE stage advancement for each mastery criterion
- **Learning Paths**: Ensure questions support UUE stage progression

**Modification Details**:
```typescript
// OLD: Folder-based question selection
const questions = await prisma.question.findMany({
  where: { questionSet: { folderId: folderId } }
});

// NEW: Section-based question selection
const questions = await prisma.questionInstance.findMany({
  where: { 
    masteryCriterion: { 
      blueprintSection: { 
        id: sectionId 
      } 
    } 
  } 
});
```

#### 2. Daily Tasks Service (`todaysTasks.service.ts`)
**Current Functionality**: Generates daily tasks based on question sets and folders
**Required Changes**:
- Replace folder-based logic with section-based logic
- Update `getDueSetsForUser()` to work with blueprint sections
- Modify task categorization to use section hierarchy
- Adapt time estimation to use section `estimatedTimeMinutes`
- **UUE Stage Balancing**: Ensure daily tasks include questions from all UUE stages
- **Stage Progression**: Prioritize questions that advance UUE stage progression
- **Learning Path Support**: Align daily tasks with UUE learning pathways

**Modification Details**:
```typescript
// OLD: Folder-based due set calculation
const dueSets = await getDueSetsForUser(userId);

// NEW: Section-based due set calculation
const dueSections = await getDueSectionsForUser(userId);
const dueContent = await Promise.all(
  dueSections.map(section => 
    contentAggregator.aggregateSectionContent(section.id)
  )
);
```

#### 3. Recursive Folder Service (`recursiveFolder.service.ts`)
**Current Functionality**: Builds folder trees with questions and notes
**Required Changes**:
- Replace with `SectionHierarchyManager`
- Update `getAllQuestionsInFolderTree()` to use section-based aggregation
- Modify `getAllNotesInFolderTree()` to work with `NoteSection`
- Adapt tree building logic to use new hierarchy structure

**Modification Details**:
```typescript
// OLD: Folder tree building
const buildFolderTree = async (currentFolderId: number): Promise<FolderWithQuestions> => {
  const folder = await prisma.folder.findUnique({
    where: { id: currentFolderId },
    include: { questionSets: { include: { questions: true } } }
  });
  // ... folder logic
};

// NEW: Section tree building
const buildSectionTree = async (sectionId: string): Promise<BlueprintSectionTree> => {
  const section = await prisma.blueprintSection.findUnique({
    where: { id: sectionId },
    include: { children: true, notes: true, knowledgePrimitives: true }
  });
  // ... section logic
};
```

### B. New Services to Create

#### 1. BlueprintSectionService
**Purpose**: Manage blueprint sections and their hierarchy
**Key Methods**:
- `createSection()`, `updateSection()`, `deleteSection()`
- `getSectionTree()`, `moveSection()`, `reorderSections()`
- `getSectionContent()`, `getSectionStats()`

#### 2. ContentAggregator
**Purpose**: Recursively aggregate content from sections and subsections
**Key Methods**:
- `aggregateSectionContent()`, `recursiveContentAggregation()`
- `calculateMasteryProgress()`, `calculateEstimatedTime()`

#### 3. SectionHierarchyManager
**Purpose**: Build and validate section hierarchies
**Key Methods**:
- `buildSectionTree()`, `calculateSectionDepth()`
- `validateHierarchy()`, `preventCircularReferences()`

---

## V. Performance Considerations

### A. Database Optimization
- **Indexing Strategy**: Composite indexes on frequently queried combinations
- **Query Optimization**: Use recursive CTEs for hierarchy queries
- **Caching Strategy**: Cache section trees and content aggregation results

### B. Algorithmic Efficiency
- **Tree Building**: O(n) time complexity for section tree construction
- **Content Aggregation**: Lazy loading for large content trees
- **Hierarchy Validation**: O(n) time complexity for circular reference detection

### C. Scalability
- **Section Limits**: Maximum depth of 10 levels to prevent deep nesting
- **Content Limits**: Maximum 1000 sections per blueprint
- **Batch Operations**: Process large migrations in batches of 1000

---

## VI. Testing Strategy

### A. Unit Tests
- [ ] **Service Tests**: Test all service methods with mocked dependencies
- [ ] **Algorithm Tests**: Test hierarchy building and content aggregation
- [ ] **Validation Tests**: Test data validation and error handling

### B. Integration Tests
- [ ] **Database Tests**: Test schema and migration scripts
- [ ] **API Tests**: Test all endpoints with real database
- [ ] **Migration Tests**: Test data transformation scripts

### C. Performance Tests
- [ ] **Tree Building**: Test section tree construction with 1000+ sections
- [ ] **Content Aggregation**: Test content aggregation with large sections
- [ ] **Database Queries**: Test query performance with realistic data volumes

---

## VII. Dependencies & Risks

### A. Dependencies
- **Prisma Schema**: New schema must be compatible with existing data
- **Migration Scripts**: Data transformation must preserve user progress
- **Existing Services**: Must maintain backward compatibility during transition

### B. Risks & Mitigation
1. **Data Loss Risk**: Complex migration could lose user data
   - **Mitigation**: Extensive testing, rollback scripts, data validation
2. **Performance Risk**: New queries could be slower than folder-based queries
   - **Mitigation**: Optimized indexes, query optimization, caching
3. **Breaking Changes**: New API could break existing frontend
   - **Mitigation**: Backward compatibility layer, gradual migration

---

## VIII. Deliverables

### A. Code Deliverables
- [ ] Complete database schema with new models
- [ ] Core services (BlueprintSectionService, NoteSectionService, MasteryCriterionService)
- [ ] Content aggregation and hierarchy management services
- [ ] API endpoints for all CRUD operations
- [ ] Data migration scripts and validation tools

### B. Documentation Deliverables
- [ ] Updated API documentation
- [ ] Database schema documentation
- [ ] Migration guide for existing data
- [ ] Service architecture documentation

### C. Testing Deliverables
- [ ] Comprehensive test suite
- [ ] Performance benchmarks
- [ ] Migration validation reports
- [ ] API endpoint test results

---

## IX. Sprint Retrospective

**Sprint Status:** [e.g., Fully Completed, Partially Completed - X tasks remaining, Completed with modifications, Blocked]

**What Went Well:**
- ...

**What Could Be Improved:**
- ...

**Action Items for Next Sprint:**
- ...

**Team Velocity:** [X story points completed]
