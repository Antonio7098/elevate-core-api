# Sprint ##: Backend - Insight Catalysts, Image Support & Model Finalization
**Signed off** Antonio
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Database & API Logic for Insight Catalysts and Image Support
**Overview:** This sprint focuses on implementing the final set of advanced backend features. The primary goals are to create the new "Insight Catalyst" system with its own API, add image support to core models, and integrate the remaining new attributes (`selfMark`, `autoMark`, etc.) into the application's logic.

---

## I. Planned Tasks & To-Do List

*Instructions for the agent: The first phase is to update the Prisma schema with all the new fields and models. Once migrated, implement the corresponding API logic and tests.*

- [ ] **Task 1: Update Prisma Schema (`schema.prisma`)**
    - [ ] **Sub-task 1.1 (New `InsightCatalyst` Model):** Create the `InsightCatalyst` model.
        * Fields: `id`, `type`, `text`, `explanation?`, `imageUrls?`, `sectionId?`.
        * imageUrl is an array of strings
        * Relations: Link to `User` (required), and **optionally** to a `Note` (via `noteId: Int?`) OR a `Question` (via `questionId: Int?`).
    - [ ] **Sub-task 1.2 (Add Image Fields):** Add a new optional field `imageUrls: String[]?` to the following models: `Folder`, `QuestionSet`, and `Question`.
    - [ ] **Sub-task 1.3 (Inverse Relations):** Add the inverse relation `insightCatalysts: InsightCatalyst[]` to the `User`, `Note`, and `Question` models.

- [ ] **Task 2: Apply Schema Changes & Regenerate Client**
    - [ ] **Sub-task 2.1:** After saving all schema changes, run the migration: `npx prisma migrate dev --name "feature_insight_catalysts_and_images"`
    - [ ] **Sub-task 2.2:** Ensure the Prisma Client is successfully regenerated.

- [ ] **Task 3: Implement Backend Logic & Endpoints**
    - [ ] **Sub-task 3.1 (Insight Catalyst CRUD):**
        * Create new files: `insightCatalyst.routes.ts`, `insightCatalyst.controller.ts`, `insightCatalyst.service.ts`.
        * Implement the full set of CRUD endpoints for `InsightCatalyst`. Creation should likely be nested (e.g., `POST /api/notes/:noteId/insight-catalysts`), while updates/deletes can be direct (`PUT /api/catalysts/:catalystId`). Ensure all operations verify user ownership.
    - [ ] **Sub-task 3.2 (Integrate New Fields into Existing Logic):**
        * Review and update existing services (`aiService.ts`, `spacedRepetition.service.ts`, `folderService.ts`, etc.).
        * All `create` and `update` endpoints for Folders, Question Sets, and Questions must now be able to handle the optional `imageUrl` field.

- [ ] **Task 4: Update Integration Tests**
    - [ ] **Sub-task 4.1:** Create a new test file, `insightCatalyst.routes.test.ts`, with comprehensive tests for all its new CRUD endpoints.
    - [ ] **Sub-task 4.2:** Update existing tests for Folder, Question Set, and Question creation/updates to include checks for the `imageUrl` field.(`aiGenerated`, `selfMark`, `autoMark`) and the use of the `instructions` field.

---

## II. Agent's Implementation Summary & Notes

*Instructions for AI Agent (Cascade): For each planned task you complete from Section I, please provide a summary below, including notes on key files modified and any challenges or decisions made.*

**(Agent will fill this section out as work is completed)**

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)

**(This section to be filled out upon sprint completion)**