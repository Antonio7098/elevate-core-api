# Sprint 23: RAG - Testing, Refinement & Old AI Deprecation

**Signed off** DO NOT PROCEED UNLESS SIGNED OFF BY ANTONIO
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - RAG System Testing, Code Refinement, and Legacy AI Cleanup
**Overview:** This sprint is dedicated to ensuring the robustness and quality of the newly implemented RAG system. It involves writing comprehensive integration tests for all new RAG-related Core API endpoints, refactoring and polishing the new services and controllers, and beginning the systematic deprecation and removal of old AI controller code, routes, and associated tests.

---

## I. Planned Tasks & To-Do List

*Instructions for Antonio: Review the proposed tasks below. Modify, add, or remove as needed.*

- [ ] **Task 1: Comprehensive Integration Testing for RAG Endpoints**
    - Sub-task 1.1: Write integration tests for `LearningBlueprint` lifecycle (create, get, list, delete if implemented).
        - Mock AI Service `/deconstruct` responses.
    - Sub-task 1.2: Write integration tests for material generation from blueprints (`/question-sets`, `/notes`).
        - Mock AI Service `/generate/questions` and `/generate/notes` responses.
        - Verify correct creation and linking of `QuestionSet`, `Question`, and `Note` records.
    - Sub-task 1.3: Write integration tests for the `/chat/message` endpoint.
        - Mock AI Service `/chat` responses.
        - Verify correct request formation to AI service and response handling.
    - Sub-task 1.4: Ensure tests cover various scenarios, including error conditions and edge cases.
- [ ] **Task 2: Code Refinement and Polishing**
    - Sub-task 2.1: Review all new RAG-related controllers (`AiRAGController`) and services (`AiRAGService`).
    - Sub-task 2.2: Refactor for clarity, efficiency, and adherence to best practices.
    - Sub-task 2.3: Improve error handling and logging.
    - Sub-task 2.4: Ensure DTOs are well-defined and consistently used.
    - Sub-task 2.5: Verify all OpenAPI/Swagger documentation for new endpoints is accurate and complete.
- [ ] **Task 3: Identify Legacy AI Components for Deprecation**
    - Sub-task 3.1: List all old AI-related controllers, services, DTOs, and routes that are superseded by the new RAG system.
    - Sub-task 3.2: Identify any utility functions or helper classes related to the old AI system.
- [ ] **Task 4: Plan and Begin Deprecation of Legacy AI Components**
    - Sub-task 4.1: Mark old routes with a deprecation notice (e.g., in Swagger, or by responding with a deprecation warning).
    - Sub-task 4.2: Start removing internal usages of old AI services if new RAG services provide equivalent functionality.
    - Sub-task 4.3: Identify and list old AI-related tests that will need to be removed or rewritten.
- [ ] **Task 5: (Stretch Goal) Initial Removal of Simple Legacy Components**
    - Sub-task 5.1: If time permits, remove a small, isolated piece of legacy AI code and its tests.
    - Sub-task 5.2: Ensure no regressions are introduced by the removal.

---

## II. Agent's Implementation Summary & Notes

**(Agent will fill this section as tasks are completed)**

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio after work is done)

**(Standard review template sections)**
