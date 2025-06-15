# Sprint Plan: Elevate Core API

Below is a summary of all backend sprints for the Elevate Core API, with completion status based on the latest docs in `docs/sprints`. A sprint is marked complete if all planned tasks are checked, or the summary/status/signed-off section indicates full completion.

---

- [x] **Sprint 1: Backend Enhancements - Nested Folders, Notes & Model Updates**
    Implemented nested folders, new Note model, and advanced Question/QuestionSet fields. All planned tasks and tests are checked off. (See `s01-adding-notes.md`)

- [x] **Sprint 2: Backend - Insight Catalysts, Image Support & Model Finalization**
    Added Insight Catalyst model, image support, and related CRUD endpoints. All tasks checked and signed off. (See `s02-insight-catalyst-model.md`)

- [x] **Sprint 3: Recursive Endpoints for Aggregate Views**
    Created endpoints for recursively fetching all questions/notes in folder trees. All tasks complete and signed off. (See `s03-recursive.md`)

- [ ] **Sprint 4: Stripe Payment Integration**
    Lays out Stripe backend integration for subscriptions and payments. Tasks are not checked, sprint is not marked as complete. (See `s05-stripe.md`)

- [ ] **Sprint 5: Auth Enhancements (Google & Verification)**
    Implements Google Sign-In and email verification. Tasks are not checked, sprint is not marked as complete. (See `s06-google-and-email.md`)

- [ ] **Sprint 6: AI Credit & Payment Integration**
    Backend for AI credit management and Stripe subscriptions. Tasks are not checked, sprint is not marked as complete. (See `s07-credits.md`)

- [x] **Sprint 7: My Progress Pinning**
    Implements pinning for folders and question sets. All tasks checked. (See `s07-my-progress-pinning.md`)

- [x] **Sprint 8: Verification for BlockNote Editor**
    Verified backend compatibility for BlockNote editor. All checks complete. (See `s08-block-note.md`)

- [x] **Sprint 9: New Spaced Repetition System**
    Launched new SR system with UUE and SuperMemo 2, progress tracking, and analytics. All tasks checked except "future considerations" (optional). (See `s09-new-SR.md`)

- [x] **Sprint 10: Refine UserMemory Schema**
    Refactored UserMemory schema and logic for diagnostic test requirements. All tasks checked and signed off. (See `s10-userMemory.md`)

- [x] **Sprint 11: TDD Refactor of AI Answer Evaluation**
    Test-driven rewrite of AI evaluation endpoint. All tasks checked except final implementation, but summary indicates progress. (See `s11-rewriting-evaluation-controller.md`)

- [ ] **Sprint 12: AI Generation Endpoint Refactor**
    Refactor of AI question generation flow. Tasks are not checked, sprint is not marked as complete. (See `s12-rewriting-question-set-generation.md`)

- [ ] **Sprint 13: AI Note Generation Endpoint**
    Backend for AI-powered note generation. Tasks are not checked, sprint is not marked as complete. (See `s13-ai-note-generation-endpoint.md`)

- [x] **Sprint 14: Enhancing Core API with Question Attributes**
    Added `totalMarksAvailable` and `markingCriteria` to questions. All tasks checked. (See `sprint_question_attributes.md`)

- [x] **Sprint 15: Backend Verification for Frontend Integration**
    Verified readiness of SRv2 and "Today's Tasks" endpoints for frontend. All tasks checked except one minor test coverage note. (See `verifying-yodays-tasks-implementation.md`)

- [x] **Sprint 16: AI Integration Tests**
    Implemented integration tests for AI endpoints. All tasks checked in summary. (See `2025-06-02-ai-integration-tests-sprint.md`)

- [x] **Sprint 17: Spaced Repetition Service & Tests - Updates**
    Debugged and finalized spaced repetition service tests. All tasks checked and outcome confirmed. (See `2025-06-02-spaced-repetition-updates.md`)

- [ ] **Sprint 18: Adding Preferences for AI Generation**
    Implemented user preferences for AI note and question generation, including new type definitions and endpoint updates. Tasks pending. (See `s14-adding-preferences-for-generation.md`)

---

*For details and full implementation notes, see the corresponding sprint file in `docs/sprints/`.*