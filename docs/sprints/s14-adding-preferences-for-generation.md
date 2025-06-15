# Sprint ##: Backend - Advanced AI Generation Controls

**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API & Python AI Service - Implementing User-Guided Generation
**Overview:** This sprint focuses on a major refactor of the AI generation pipeline. The goal is to enhance the question and note generation endpoints to accept a rich set of user-defined parameters, allowing for highly personalized and targeted content creation. This involves coordinated changes to the Python AI Service and the Node.js Core API.

---

## I. Planned Tasks & To-Do List

*Instructions for the agent: This sprint requires careful updates to the API contract between the Node.js and Python services. The most critical part is updating the prompt engineering in Python and ensuring type safety across the Node.js codebase.*

- [ ] **Task 1: Update Core API Types & Service Contract (Meticulous Task)**
    - [ ] **Sub-task 1.1:** In `src/types/`, create a new file `aiGeneration.types.ts` to serve as the single source of truth for these new features.
    - [ ] **Sub-task 1.2:** In this new file, define new `enum` types for all the user-selectable options:
        * `enum NoteStyle { CONCISE, THOROUGH, EXPLORATIVE }`
        * `enum SourceFidelity { STRICT, CREATIVE }`
        * `enum QuestionScope { ESSENCE, THOROUGH }`
        * `enum QuestionTone { ENCOURAGING, FORMAL, ... }`
    - [ ] **Sub-task 1.3:** Define the new `GenerateNoteRequest` and `GenerateQuestionRequest` interfaces that will be used by the Node.js `aiService` to call the Python service.
    - [ ] **Sub-task 1.4 (Search & Replace):** Meticulously search the entire Core API project for any old type definitions or inline types related to AI generation and update them to import from and use these new, centralized types. This includes controllers, services, and tests.

- [ ] **Task 2: Refactor Core API Controllers & Services**
    - [ ] **Sub-task 2.1 (Update `generateQuestionsFromSource`):** Refactor the controller and service for `POST /api/ai/generate-from-source`. It should now accept the new parameters (`uueFocus`, `scope`, etc.) in its request body.
    - [ ] **Sub-task 2.2 (Create `generateNoteFromSource`):** Implement the controller and service for the new `POST /api/ai/generate-note` endpoint.
    - [ ] **Sub-task 2.3 (Update `aiService.ts`):** The service functions that call the Python AI service must now construct the request body using the new, detailed interfaces from Task 2, passing along all the user-selected options.

- [ ] **Task 3: Update Integration Tests**
    - [ ] **Sub-task 3.1:** Update the tests for the question generation endpoint. They must now send payloads with the new parameters and verify that the mocked call to the Python service includes these parameters.
    - [ ] **Sub-task 3.2:** Create a new test suite for the `POST /api/ai/generate-note` endpoint, testing various combinations of `noteStyle` and `sourceFidelity`.

---

## II. Agent's Implementation Summary & Notes

*Instructions for AI Agent (Cascade): For each planned task you complete from Section I, please provide a summary below, including notes on key files modified and any challenges or decisions made.*

**(Agent will fill this section out as work is completed)**

### Agent's Implementation Notes (Sprint 14)

**Task 1: Update Core API Types & Service Contract**
*   **Sub-tasks 1.1, 1.2, 1.3 (Completed):**
    *   `src/types/aiGeneration.types.ts` was created.
    *   Enums `NoteStyle`, `SourceFidelity`, `QuestionScope`, and `QuestionTone` were defined.
    *   Interfaces `GenerateNoteRequest` and `GenerateQuestionRequest` were defined.
    *   Key changes:
        *   `userId` was removed from `GenerateNoteRequest` and the validation schema for `generateQuestionsFromSource`. The system now relies on `req.user.userId` from the authenticated user context.
        *   `questionCount` was made optional in `GenerateQuestionRequest`.
*   **Sub-task 1.4 (In Progress):** Types have been updated in `ai.controller.ts`, `src/middleware/validation.ts`, and `src/routes/__tests__/ai.routes.test.ts` iteratively as changes were made. Full verification pending controller stabilization.

**Task 2: Refactor Core API Controllers & Services**
*   **Sub-task 2.1 (Update `generateQuestionsFromSource`) (In Progress):**
    *   Controller refactored to accept new parameters (`questionScope`, `questionTone`, optional `questionCount`).
    *   Associated validation middleware (`validateGenerateFromSource`) updated.
    *   The function body was recently restored after a significant erroneous edit. It currently has compilation errors that need to be resolved.
*   **Sub-task 2.2 (Create `generateNoteFromSource`) (In Progress):**
    *   Controller and service logic for `POST /api/ai/generate-note` implemented.
    *   Validation middleware (`validateGenerateNote`) created, and its schema defined in `validation.ts`.
    *   `userId` is taken from `req.user.userId`, not the request body.
    *   Authorization check implemented to ensure the authenticated user owns the source note.
    *   This function also has compilation errors after the recent large edit aimed at restoration.
*   **Sub-task 2.3 (Update `aiService.ts`) (Completed):**
    *   `aiService.generateQuestions` and `aiService.generateNote` methods were updated to propagate the new parameters.
    *   Prisma typings for `Folder.questionSets` and `QuestionSet.questions` (e.g., ensuring `include: { questions: true }`) were addressed in `ai.controller.ts` for related functionalities like `chatWithAI`.

**Task 3: Update Integration Tests**
*   **Sub-task 3.1 (Update tests for `generateQuestionsFromSource`) (In Progress):**
    *   Test data in `ai.routes.test.ts` updated to include required fields like `questionType` and `questionSet` for question creation.
    *   Prisma test client initialization is configured.
    *   Payloads and assertions for `/api/ai/generate-from-source` tests were adjusted (e.g., adding `Note` creation/cleanup, `questionCount`).
    *   Further updates are pending controller stabilization.
*   **Sub-task 3.2 (Create tests for `generateNoteFromSource`) (In Progress):**
    *   Supertest integration tests were created for `/api/ai/generate-note`.
    *   These tests will need updates to reflect the removal of `userId` from the request body and once the controller is stable.

**Current Major Issues & Blockers:**
1.  **`ai.controller.ts` Compilation Errors:** The file `src/controllers/ai.controller.ts` is currently not compiling due to syntax, scope, and type errors. This was a result of a large `replace_file_content` operation intended to restore `generateQuestionsFromSource` and `generateNoteFromSource`. Stabilizing this file is the top priority.
2.  **`chatWithAI` Function Issues:** The `chatWithAI` controller function still has pending fixes:
    *   Correcting Prisma `include` clauses for fetching question sets and their related questions.
    *   Removing an invalid `userId` filter from a Prisma query.
    *   Resolving a `ChatContext` property mismatch (e.g., `questionSets` vs. `questionSetId`).
3.  **Finalizing Integration Tests:** All integration tests for the AI endpoints need to be reviewed, updated, and confirmed passing once the controllers are stable and all TypeScript/lint errors are resolved.

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)

**(This section to be filled out upon sprint completion)**

---
**Signed off:** DO NOT PROCEED WITH THE SPRINT UNLESS SIGNED OFF