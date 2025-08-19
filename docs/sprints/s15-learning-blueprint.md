# Sprint ##: Backend - Learning Blueprint & Unified Content Generation

**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Implementing the Refined Learning Blueprint Architecture
**Overview:** This sprint focuses on building the backend foundation for the "Learning Blueprint" feature, based on a revised, more robust data model. The goal is to create a central `LearningSource` entity that holds the original text and its AI-deconstructed blueprint, which can then be used to generate standard, editable `Note` and `QuestionSet` records.

---

## I. Planned Tasks & To-Do List

- [ ] **Task 1: Update Prisma Schema (`schema.prisma`)**
    - [ ] **Sub-task 1.1 (Create `LearningSource` Model):** Create the new central model to hold the source text.
        ```prisma
        model LearningSource {
          id                    Int      @id @default(autoincrement())
          title                 String
          sourceText            String
          userId                Int
          folderId              Int
          user                  User     @relation(fields: [userId], references: [id])
          folder                Folder   @relation(fields: [folderId], references: [id])
          
          learningBlueprint     LearningBlueprint?
          questionSets          QuestionSet[]
          notes                 Note[] // A source can generate many notes
          
          createdAt DateTime @default(now())
        }
        ```
    - [ ] **Sub-task 1.2 (Create `LearningBlueprint` Model):** Create the model to hold the AI's analysis, with a one-to-one relationship back to `LearningSource`.
        ```prisma
        model LearningBlueprint {
          id               Int      @id @default(autoincrement())
          content          Json
          learningSourceId Int      @unique
          learningSource   LearningSource @relation(fields: [learningSourceId], references: [id], onDelete: Cascade)
        }
        ```
    - [ ] **Sub-task 1.3 (Refactor `Note` Model):** The `Note` model is now unified. Add an optional relation to link it back to a `LearningSource` if it was AI-generated.
        * Add `learningSourceId: Int?`
        * Add `learningSource: LearningSource? @relation(fields: [learningSourceId], references: [id], onDelete: SetNull)`
        * Add `aiGenerated: Boolean @default(false)`
    - [ ] **Sub-task 1.4 (Refactor `QuestionSet` Model):** Remove the `source` field and add an optional `learningSourceId: Int?` to link it back to a `LearningSource`. Add `aiGenerated: Boolean @default(false)`.
    - [ ] **Sub-task 1.5 (Apply Migration):** Run `npx prisma migrate dev --name "feat_unified_learning_source"` and regenerate the Prisma Client.

- [ ] **Task 2: Implement the Two-Phase Generation Flow**
    - [ ] **Sub-task 2.1 (Phase 1 Endpoint - Deconstruction):**
        * Create a new route: `POST /api/learning-sources`.
        * The controller will accept `sourceText`, `title`, and `folderId`.
        * The service logic will create a new `LearningSource` record, call the Python AI Service's `/api/ai/create-blueprint` endpoint, and update the `LearningSource` with the returned blueprint JSON. It returns the new `LearningSource` object.
    - [ ] **Sub-task 2.2 (Phase 2 Endpoint - Note Generation):**
        * Create a new route: `POST /api/learning-sources/:id/generate-note`.
        * The controller accepts a `learningSourceId` and generation parameters (e.g., `noteStyle`, `instructions`).
        * The service fetches the `LearningSource` (specifically including its blueprint) and `UserMemory`, calls the AI, and then **creates a new record in the standard `Note` table**, linking it to the `learningSourceId` and setting `aiGenerated: true`.
    - [ ] **Sub-task 2.3 (Phase 2 Endpoint - Question Generation):**
        * Create a new route: `POST /api/learning-sources/:id/generate-questions`.
        * Follows the same logic as note generation, but creates a new `QuestionSet` and its `Question`s, linking the set back to the `learningSourceId` and setting `aiGenerated: true`.

- [ ] **Task 3: Update Integration Tests**
    - [ ] **Sub-task 3.1:** Create a new test suite, `learningSource.routes.test.ts`, to test the new two-phase generation flow.
    - [ ] **Sub-task 3.2:** The tests must verify that `LearningSource` and `LearningBlueprint` are created correctly.
    - [ ] **Sub-task 3.3:** The tests must verify that the generation endpoints correctly create records in the `Note` and `QuestionSet` tables and that they are linked to the parent `LearningSource`.

---

## II. Agent's Implementation Summary & Notes

*Instructions for AI Agent (Cascade): For each planned task you complete from Section I, please provide a summary below, including notes on key files modified and any challenges or decisions made.*

**(Agent will fill this section out as work is completed)**

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)

**(This section to be filled out upon sprint completion)**

---
**Signed off:** DO NOT PROCEED WITH THE SPRINT UNLESS SIGNED OFF