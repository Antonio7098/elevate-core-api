# Sprint 21: RAG - Material Generation from Blueprints

**Signed off** DO NOT PROCEED UNLESS SIGNED OFF BY ANTONIO
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Generating Question Sets and Notes from Learning Blueprints
**Overview:** This sprint focuses on enabling the generation of `QuestionSet`s and `Note`s from existing Learning Blueprints. It involves implementing `POST /api/learning-blueprints/:blueprintId/question-sets` and `POST /api/learning-blueprints/:blueprintId/notes` endpoints. This includes developing Core API logic to call the AI Service's `/generate/questions` and `/generate/notes` endpoints (passing `sourceText`, `blueprintJson`, and options), and then saving the new `QuestionSet` and `Note` records, linking them via `generatedFromBlueprintId`.

---

## I. Planned Tasks & To-Do List

*Instructions for Antonio: Review the proposed tasks below. Modify, add, or remove as needed.*

- [ ] **Task 1: Implement `POST /api/learning-blueprints/:blueprintId/question-sets` Endpoint**
    - Sub-task 1.1: Define route and link to `AiRAGController.generateQuestionSetFromBlueprint` method.
    - Sub-task 1.2: Implement request validation using `GenerateQuestionsFromBlueprintDto` (including `questionOptions`, `folderId`).
    - Sub-task 1.3: Ensure user authentication and authorization (user must own the `blueprintId`).
- [ ] **Task 2: Develop `AiRAGService.generateQuestionSetFromBlueprint` Method**
    - Sub-task 2.1: Accept `blueprintId`, `userId`, `questionOptions`, and `folderId`.
    - Sub-task 2.2: Fetch the `LearningBlueprint` (to get its `sourceText` and `blueprintJson`). Verify ownership.
    - Sub-task 2.3: Implement HTTP call to the internal AI Service's `/generate/questions` endpoint.
        - Pass `sourceText`, `blueprintJson`, and `questionOptions`.
        - Handle API key management and AI service error responses.
    - Sub-task 2.4: Receive generated questions data from the AI Service.
- [ ] **Task 3: Persist New `QuestionSet` and Associated `Question` Records**
    - Sub-task 3.1: Create a new `QuestionSet` record using Prisma.
        - Assign to the specified `folderId` and `userId`.
        - Set its `generatedFromBlueprintId` to the `blueprintId` from the request.
        - Populate other relevant `QuestionSet` fields (e.g., name based on blueprint or options).
    - Sub-task 3.2: For each question received from the AI service, create new `Question` records.
        - Link these questions to the newly created `QuestionSet`.
        - Populate all necessary fields for each `Question` (e.g., `text`, `answer`, `totalMarksAvailable`, `markingCriteria` if provided by AI).
    - Sub-task 3.3: Return the created `QuestionSet` (with its questions) or its ID.
- [ ] **Task 4: Implement `POST /api/learning-blueprints/:blueprintId/notes` Endpoint**
    - Sub-task 4.1: Define route and link to `AiRAGController.generateNoteFromBlueprint` method.
    - Sub-task 4.2: Implement request validation using `GenerateNoteFromBlueprintDto` (including `noteOptions`, `folderId` or `questionSetId` for context).
    - Sub-task 4.3: Ensure user authentication and authorization (user must own the `blueprintId`).
- [ ] **Task 5: Develop `AiRAGService.generateNoteFromBlueprint` Method**
    - Sub-task 5.1: Accept `blueprintId`, `userId`, `noteOptions`, and context (e.g., `folderId`).
    - Sub-task 5.2: Fetch the `LearningBlueprint` (to get its `sourceText` and `blueprintJson`). Verify ownership.
    - Sub-task 5.3: Implement HTTP call to the internal AI Service's `/generate/notes` endpoint.
        - Pass `sourceText`, `blueprintJson`, and `noteOptions`.
        - Handle API key management and AI service error responses.
    - Sub-task 5.4: Receive generated note data from the AI Service.
- [ ] **Task 6: Persist New `Note` Record**
    - Sub-task 6.1: Create a new `Note` record using Prisma.
        - Assign to the `userId` and relevant context (e.g., `folderId`).
        - Set its `generatedFromBlueprintId` to the `blueprintId`.
        - Populate `title`, `content`, and other fields from AI service response.
    - Sub-task 6.2: Return the created `Note` object or its ID.
- [ ] **Task 7: Unit/Integration Tests for Material Generation**
    - Sub-task 7.1: Write tests for successful Question Set generation from a blueprint.
    - Sub-task 7.2: Write tests for successful Note generation from a blueprint.
    - Sub-task 7.3: Test error handling (e.g., blueprint not found, AI service failure).

---

## II. Agent's Implementation Summary & Notes

**(Agent will fill this section as tasks are completed)**

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio after work is done)

**(Standard review template sections)**
