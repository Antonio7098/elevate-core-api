# Sprint 19: RAG - Core Schema & API Foundations

**Signed off** DO NOT PROCEED UNLESS SIGNED OFF BY ANTONIO
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - RAG System Database Schema & Foundational API Structures
**Overview:** This sprint focuses on establishing the core database schema changes required for the Retrieval Augmented Generation (RAG) system. This includes defining the `LearningBlueprint` model, updating `QuestionSet`, `Note`, and `User` models with new relations, generating and applying database migrations. It also involves defining DTOs for new RAG-related endpoints and stubbing out controller methods and service interfaces in the Core API.

---

## I. Planned Tasks & To-Do List

*Instructions for Antonio: Review the proposed tasks below. Modify, add, or remove as needed. These tasks are based on our recent discussions about the RAG system's data model.*

- [ ] **Task 1: Finalize and Implement `LearningBlueprint` Prisma Model**
    - Sub-task 1.1: Define `LearningBlueprint` model in `schema.prisma` with fields: `id`, `userId` (relation to `User`), `sourceText` (String), `blueprintJson` (Json), `createdAt`, `updatedAt`.
    - Sub-task 1.2: Add `generatedNotes: Note[]` and `generatedQuestionSets: QuestionSet[]` relations to `LearningBlueprint`.
    - Sub-task 1.3: Add `@@index([userId])` to `LearningBlueprint`.
- [ ] **Task 2: Update `User` Prisma Model**
    - Sub-task 2.1: Add `learningBlueprints: LearningBlueprint[]` relation to the `User` model in `schema.prisma`.
- [ ] **Task 3: Update `QuestionSet` Prisma Model**
    - Sub-task 3.1: Add optional `generatedFromBlueprintId: Int?` foreign key to `QuestionSet`.
    - Sub-task 3.2: Add optional `generatedFromBlueprint: LearningBlueprint?` relation to `QuestionSet` using `generatedFromBlueprintId`, with `onDelete: SetNull`.
    - Sub-task 3.3: Review and decide on deprecation/removal strategy for any existing `sourceText` field on `QuestionSet` (if present) to ensure `LearningBlueprint.sourceText` is the single source of truth.
- [ ] **Task 4: Update `Note` Prisma Model**
    - Sub-task 4.1: Add optional `generatedFromBlueprintId: Int?` foreign key to `Note`.
    - Sub-task 4.2: Add optional `generatedFromBlueprint: LearningBlueprint?` relation to `Note` using `generatedFromBlueprintId`, with `onDelete: SetNull`.
- [ ] **Task 5: Database Migration**
    - Sub-task 5.1: Run `prisma migrate dev --name rag_schema_foundations` (or similar) to generate the SQL migration.
    - Sub-task 5.2: Review the generated SQL migration for correctness.
    - Sub-task 5.3: Apply the migration to the development database.
    - Sub-task 5.4: Regenerate Prisma Client (`prisma generate`).
- [ ] **Task 6: Define Core DTOs for RAG Endpoints**
    - Sub-task 6.1: Create `CreateLearningBlueprintDto` (e.g., for `sourceText`, optional `folderId`).
    - Sub-task 6.2: Create `GenerateQuestionsFromBlueprintDto` (e.g., for `questionOptions`, `folderId`).
    - Sub-task 6.3: Create `GenerateNoteFromBlueprintDto` (e.g., for `noteOptions`, `folderId`).
    - Sub-task 6.4: Create `ChatMessageDto` (e.g., for `messageContent`, `chatHistory`, `blueprintId` or `questionSetId` for context).
    - Sub-task 6.5: Define basic response DTOs for these operations.
- [ ] **Task 7: Stub out RAG Controller and Service Interfaces**
    - Sub-task 7.1: Create `AiRAGController` (or similar name) with placeholder methods for:
        - `POST /learning-blueprints`
        - `POST /learning-blueprints/:blueprintId/question-sets`
        - `POST /learning-blueprints/:blueprintId/notes`
        - `POST /chat/message`
    - Sub-task 7.2: Create `AiRAGService` (or similar) interface with corresponding method signatures.
    - Sub-task 7.3: Ensure controllers are correctly set up for DI with the new service interface.
    - Sub-task 7.4: Add basic OpenAPI/Swagger documentation stubs for the new endpoints.

---

## II. Agent's Implementation Summary & Notes

*Instructions for AI Agent (Cascade): For each planned task you complete from Section I, please provide a summary below. If multiple tasks are done in one go, you can summarize them together but reference the task numbers.*

**(Agent will fill this section as tasks are completed)**

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
