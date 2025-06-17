# Sprint 20: RAG - Learning Blueprint Lifecycle

**Signed off** DO NOT PROCEED UNLESS SIGNED OFF BY ANTONIO
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Learning Blueprint Creation and Management
**Overview:** This sprint implements the lifecycle of Learning Blueprints. It includes creating the `POST /api/learning-blueprints` endpoint (or equivalent), developing Core API logic to call the AI Service's `/deconstruct` endpoint, saving `LearningBlueprint` records, and potentially implementing basic GET/LIST/DELETE endpoints for Learning Blueprints.

---

## I. Planned Tasks & To-Do List

*Instructions for Antonio: Review the proposed tasks below. Modify, add, or remove as needed.*

- [ ] **Task 1: Implement `POST /api/learning-blueprints` Endpoint**
    - Sub-task 1.1: Define route and link to `AiRAGController.createLearningBlueprint` method.
    - Sub-task 1.2: Implement request validation using `CreateLearningBlueprintDto`.
    - Sub-task 1.3: Ensure user authentication and authorization.
- [ ] **Task 2: Develop `AiRAGService.createLearningBlueprint` Method**
    - Sub-task 2.1: Accept `sourceText` and `userId` (and optional `folderId`).
    - Sub-task 2.2: Implement HTTP call to the internal AI Service's `/deconstruct` endpoint, passing `sourceText`.
        - Handle API key management/injection for the AI service call.
        - Handle potential errors from the AI service (e.g., network issues, invalid input, AI processing errors).
    - Sub-task 2.3: Receive `blueprintJson` from the AI Service.
- [ ] **Task 3: Persist `LearningBlueprint` Record**
    - Sub-task 3.1: Use Prisma client to create a new `LearningBlueprint` record.
    - Sub-task 3.2: Store `userId`, `sourceText` (from original request), and `blueprintJson` (from AI service).
    - Sub-task 3.3: Return the created `LearningBlueprint` object or its ID.
- [ ] **Task 4: (Optional) Implement `GET /api/learning-blueprints/:id` Endpoint**
    - Sub-task 4.1: Define route and controller method.
    - Sub-task 4.2: Implement service logic to fetch a `LearningBlueprint` by its ID, ensuring user ownership.
- [ ] **Task 5: (Optional) Implement `GET /api/learning-blueprints` (List) Endpoint**
    - Sub-task 5.1: Define route and controller method.
    - Sub-task 5.2: Implement service logic to list `LearningBlueprint`s for the authenticated user, with pagination.
- [ ] **Task 6: (Optional) Implement `DELETE /api/learning-blueprints/:id` Endpoint**
    - Sub-task 6.1: Define route and controller method.
    - Sub-task 6.2: Implement service logic to delete a `LearningBlueprint` by its ID, ensuring user ownership. Consider cascade behavior for related generated materials if any exist (though typically linking is `SetNull`).
- [ ] **Task 7: Unit/Integration Tests for Learning Blueprint Lifecycle**
    - Sub-task 7.1: Write tests for successful blueprint creation.
    - Sub-task 7.2: Write tests for error handling (e.g., AI service failure, invalid input).
    - Sub-task 7.3: Write tests for optional GET/LIST/DELETE endpoints if implemented.

---

## II. Agent's Implementation Summary & Notes

**(Agent will fill this section as tasks are completed)**

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio after work is done)

**(Standard review template sections)**
