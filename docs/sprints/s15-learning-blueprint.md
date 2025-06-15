# Sprint ##: Backend - Learning Blueprint Foundation

**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Database Schema & Orchestration Endpoint for Source Deconstruction
**Overview:** This sprint focuses on building the backend foundation for the new "Learning Blueprint" feature. The goal is to create the database model to store the structured blueprint JSON and to implement the Core API endpoint that will orchestrate the two-phase generation process.

---

## I. Planned Tasks & To-Do List

- [ ] **Task 1: Update Prisma Schema (`schema.prisma`)**
    - [ ] **Sub-task 1.1:** Create a new `LearningBlueprint` model.
        * Fields: `id`, `content: Json`, and a **unique one-to-one relationship** with `QuestionSet` via `questionSetId`.
    - [ ] **Sub-task 1.2:** Add the inverse relation `learningBlueprint: LearningBlueprint?` to the `QuestionSet` model.
    - [ ] **Sub-task 1.3:** Run the migration: `npx prisma migrate dev --name "feat_learning_blueprint"` and regenerate the Prisma Client.

- [ ] **Task 2: Create New "Deconstruction" Endpoint & Service**
    - [ ] **Sub-task 2.1:** Create a new route: `POST /api/ai/deconstruct-source`. This will be the main endpoint the frontend calls to start the whole process.
    - [ ] **Sub-task 2.2:** The controller for this endpoint will accept `sourceText`, `title`, and a `folderId`.
    - [ ] **Sub-task 2.3 (Service Logic):** The service function will orchestrate the two-phase process:
        1.  First, it creates an empty `QuestionSet` to act as a container.
        2.  It then calls the **Python AI Service's** new `/api/ai/create-blueprint` endpoint, sending the `sourceText`.
        3.  Upon receiving the blueprint JSON, it creates a `LearningBlueprint` record in the database, linking it to the newly created `QuestionSet`.
        4.  It returns the `QuestionSet` (now with its associated blueprint) to the frontend.

- [ ] **Task 3: Refactor Existing Generation Endpoints**
    - [ ] **Sub-task 3.1:** Modify the existing `POST /api/ai/generate-questions` endpoint. It should now accept a `blueprintId` instead of raw source text. Its logic will now fetch the blueprint and send relevant parts to the Python AI service.
    - [ ] **Sub-task 3.2:** Do the same for the new "Generate Notes" endpoint. It will also be powered by the pre-existing blueprint.

- [ ] **Task 4: Write Integration Tests**
    - [ ] **Sub-task 4.1:** Write tests for the new `POST /api/ai/deconstruct-source` endpoint, mocking the call to the Python service.
    - [ ] **Sub-task 4.2:** Update tests for question/note generation to reflect that they are now powered by a blueprint.

---
**Signed off:** DO NOT PROCEED WITH THE SPRINT UNLESS SIGNED OFF