# Sprint 19: RAG - Core Schema & API Foundations

**Signed off** Antonio
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - RAG System Database Schema & Foundational API Structures
**Overview:** This sprint focuses on establishing the core database schema changes required for the Retrieval Augmented Generation (RAG) system. This includes defining the `LearningBlueprint` model, updating `QuestionSet`, `Note`, and `User` models with new relations, generating and applying database migrations. It also involves defining DTOs for new RAG-related endpoints and stubbing out controller methods and service interfaces in the Core API.

---

## I. Planned Tasks & To-Do List

*Instructions for Antonio: Review the proposed tasks below. Modify, add, or remove as needed. These tasks are based on our recent discussions about the RAG system's data model.*

- [x] **Task 1: Finalize and Implement `LearningBlueprint` Prisma Model** (Verified existing model meets all requirements as of 2025-06-20)
    - [x] Sub-task 1.1: Define `LearningBlueprint` model in `schema.prisma` with fields: `id`, `userId` (relation to `User`), `sourceText` (String), `blueprintJson` (Json), `createdAt`, `updatedAt`. (Verified)
    - [x] Sub-task 1.2: Add `generatedNotes: Note[]` and `generatedQuestionSets: QuestionSet[]` relations to `LearningBlueprint`. (Verified)
    - [x] Sub-task 1.3: Add `@@index([userId])` to `LearningBlueprint`. (Verified)
    - [x] Sub-task 1.4: Ensure the `User` model has the necessary `id` and relation field for `LearningBlueprint.user` to connect to (this should already exist, just a verification). (Verified)
- [ ] **Task 2: Update `QuestionSet` Prisma Model**
    - [x] Sub-task 2.1: Add optional `generatedFromBlueprintId: Int?` foreign key to `QuestionSet`. (Verified existing field)
    - [x] Sub-task 2.2: Add optional `generatedFromBlueprint: LearningBlueprint?` relation to `QuestionSet` using `generatedFromBlueprintId`, with `onDelete: SetNull`. (Verified existing relation)
    - [x] Sub-task 2.3: Review and decide on deprecation/removal strategy for any existing `sourceText` field on `QuestionSet` (if present) to ensure `LearningBlueprint.sourceText` is the single source of truth. (Decided to remove `QuestionSet.source` field)
- [ ] **Task 3: Update `Note` Prisma Model**
    - [x] Sub-task 3.1: Add optional `generatedFromBlueprintId: Int?` foreign key to `Note`. (Verified existing field)
    - [x] Sub-task 3.2: Add optional `generatedFromBlueprint: LearningBlueprint?` relation to `Note` using `generatedFromBlueprintId`, with `onDelete: SetNull`. (Verified existing relation)
- [ ] **Task 4: Database Migration**
    - [x] Sub-task 4.1: Run `prisma migrate dev --name rag_schema_foundations` (or similar) to generate the SQL migration. (Completed)
    - [x] Sub-task 4.2: Review the generated SQL migration for correctness. (SQL confirmed to drop QuestionSet.source)
    - [x] Sub-task 4.3: Apply the migration to the development database. (Completed as part of `migrate dev`)
    - [x] Sub-task 4.4: Regenerate Prisma Client (`prisma generate`). (Completed as part of `migrate dev`)
- [ ] **Task 5: Define Core DTOs for RAG Endpoints**
    - [x] Sub-task 5.1: Create `CreateLearningBlueprintDto` (e.g., for `sourceText`, optional `folderId`). (Completed)
    - [x] Sub-task 5.2: Create `GenerateQuestionsFromBlueprintDto` (e.g., for `questionOptions`, `folderId`). (Completed)
    - [x] Sub-task 5.3: Create `GenerateNoteFromBlueprintDto` (e.g., for `noteOptions`, `folderId`). (Completed)
    - [x] Sub-task 5.4: Create `ChatMessageDto` (e.g., for `messageContent`, `chatHistory`, `blueprintId` or `questionSetId` for context). (Completed)
    - [x] Sub-task 5.5: Define basic response DTOs for these operations. (Completed)
- [x] **Task 6: Stub out RAG Controller and Service Interfaces** (All sub-tasks completed)
    - [x] Sub-task 6.0: Fix existing AI controller tests to serve as a reference for new RAG controller tests.
    - [x] Sub-task 6.1: Create `AiRAGController` (or similar name) with placeholder methods for: (Completed)
        - `POST /learning-blueprints`
        - `POST /learning-blueprints/:blueprintId/question-sets`
        - `POST /learning-blueprints/:blueprintId/notes`
        - `POST /chat/message`
    - [x] Sub-task 6.2: Create `AiRAGService` (or similar) interface with corresponding method signatures. (Completed)
    - [x] Sub-task 6.3: Ensure controllers are correctly set up for DI with the new service interface. (Completed)
    - [x] Sub-task 6.4: Add basic OpenAPI/Swagger documentation stubs for the new endpoints. (Completed)

---

## II. Agent's Implementation Summary & Notes

*Instructions for AI Agent (Cascade): For each planned task you complete from Section I, please provide a summary below. If multiple tasks are done in one go, you can summarize them together but reference the task numbers.*

### June 18, 2025 - Fixed AI Controller Tests

**Preparatory Work for Task 6: Stub out RAG Controller and Service Interfaces**

Before implementing the new RAG system components, we needed to fix the existing AI controller tests that were failing. These tests will serve as a reference for how the new RAG controller tests should be structured.

Key changes made:

1. **Updated `ChatContext` Interface**: Added `folderId` property to support folder-based context in the AI simulation.

2. **Enhanced Question Generation Simulation**: Modified `simulateAIQuestionGeneration` to include required fields that the tests expect:
   - Added `totalMarksAvailable` (set to 10)
   - Added `markingCriteria` with two criteria (Correctness and Clarity)

3. **Fixed Chat Response Simulation**: Updated `simulateAIChatResponse` to correctly generate context strings for both `questionSetId` and `folderId` scenarios, ensuring the tests pass.

All AI controller tests are now passing. This work provides a foundation for implementing the new RAG controller and service interfaces, as the existing AI controller will eventually be deprecated in favor of the new RAG-based system.

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio after work is done)

**1. Key Accomplishments this Sprint:**
    * [List what was successfully completed and tested]
    * [Highlight major breakthroughs or features implemented]

**2. Deviations from Original Plan/Prompt (if any):**
    * [Describe any tasks that were not completed, or were changed from the initial plan. Explain why.]
    * [Note any features added or removed during the sprint.]

**3. New Issues, Bugs, or Challenges Encountered:**
    * [List any new bugs found, unexpected technical hurdles, or unresolved issues.]

**4. Key Learnings & Decisions Made:**
    * [What did you learn during this sprint? Any important architectural or design decisions made?]

**5. Blockers (if any):**
    * [Is anything preventing progress on the next steps?]

**6. Next Steps Considered / Plan for Next Sprint:**
    * [Briefly outline what seems logical to tackle next based on this sprint's outcome.]

**Sprint Status:** [e.g., Fully Completed, Partially Completed - X tasks remaining, Completed with modifications, Blocked]
