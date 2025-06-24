# Sprint 21: RAG - Material Generation from Blueprints

**Signed off** Antonio
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Generating Question Sets and Notes from Learning Blueprints
**Overview:** This sprint focuses on enabling the generation of `QuestionSet`s and `Note`s from existing Learning Blueprints. It involves implementing `POST /api/learning-blueprints/:blueprintId/question-sets` and `POST /api/learning-blueprints/:blueprintId/notes` endpoints. This includes developing Core API logic to call the AI Service's `/generate/questions` and `/generate/notes` endpoints (passing `sourceText`, `blueprintJson`, and options), and then saving the new `QuestionSet` and `Note` records, linking them via `generatedFromBlueprintId`.

---

## I. Planned Tasks & To-Do List

*Instructions for Antonio: Review the proposed tasks below. Modify, add, or remove as needed.*

- [x] **Task 1: Implement `POST /api/learning-blueprints/:blueprintId/question-sets` Endpoint**
    - [x] Sub-task 1.1: Define route and link to `AiRAGController.generateQuestionSetFromBlueprint` method.
    - [x] Sub-task 1.2: Implement request validation using `GenerateQuestionsFromBlueprintDto` (including `questionOptions`, `folderId`).
    - [x] Sub-task 1.3: Ensure user authentication and authorization (user must own the `blueprintId`).
- [x] **Task 2: Develop `AiRAGService.generateQuestionSetFromBlueprint` Method**
    - [x] Sub-task 2.1: Accept `blueprintId`, `userId`, `questionOptions`, and `folderId`.
    - [x] Sub-task 2.2: Fetch the `LearningBlueprint` (to get its `sourceText` and `blueprintJson`). Verify ownership.
    - [x] Sub-task 2.3: Implement HTTP call to the internal AI Service's `/generate/questions` endpoint.
        - [x] Pass `sourceText`, `blueprintJson`, and `questionOptions`.
        - [x] Handle API key management and AI service error responses.
    - [x] Sub-task 2.4: Receive generated questions data from the AI Service.
- [x] **Task 3: Persist New `QuestionSet` and Associated `Question` Records**
    - [x] Sub-task 3.1: Create a new `QuestionSet` record using Prisma.
        - [x] Assign to the specified `folderId` and `userId` (using scalar FKs `userId`, `folderId`, `generatedFromBlueprintId` in `createData`).
        - [x] Set its `generatedFromBlueprintId` to the `blueprintId` from the request.
        - [x] Populate other relevant `QuestionSet` fields (e.g., name based on blueprint or options).
    - [x] Sub-task 3.2: For each question received from the AI service, create new `Question` records.
        - [x] Link these questions to the newly created `QuestionSet` using nested create (`questions: { create: [...] }`).
        - [x] Populate all necessary fields for each `Question` (e.g., `text`, `answer`, `totalMarksAvailable`, `markingCriteria` if provided by AI).
    - [x] Sub-task 3.3: Return the created `QuestionSet` (with its questions) as `QuestionSetResponseDto`.
        - *Note: Resolved persistent Prisma/TypeScript type errors for `QuestionSet` creation with nested `Question` records by removing explicit Prisma types on `createData` object and using `(newQuestionSet as any).fieldName` for scalar field access in DTO mapping as a temporary workaround. Further investigation into Prisma type generation might be needed if issues resurface.*
- [x] **Task 4: Implement `POST /api/learning-blueprints/:blueprintId/notes` Endpoint**
    - [x] Sub-task 4.1: Define route and link to `AiRAGController.generateNoteFromBlueprint` method.
    - [x] Sub-task 4.2: Implement request validation using `GenerateNoteFromBlueprintDto` (including `noteOptions`, `folderId` or `questionSetId` for context).
    - [x] Sub-task 4.3: Ensure user authentication and authorization (user must own the `blueprintId`).
- [x] **Task 5: Develop `AiRAGService.generateNoteFromBlueprint` Method**
    - [x] Sub-task 5.1: Accept `blueprintId`, `userId`, `noteOptions`, and context (e.g., `folderId`).
    - [x] Sub-task 5.2: Fetch the `LearningBlueprint` (to get its `sourceText` and `blueprintJson`). Verify ownership.
    - [x] Sub-task 5.3: Implement HTTP call to the internal AI Service's `/generate/notes` endpoint.
        - [x] Pass `sourceText`, `blueprintJson`, and `noteOptions`.
        - [x] Handle API key management and AI service error responses.
    - [x] Sub-task 5.4: Receive generated note data from the AI Service.
- [x] **Task 6: Persist New `Note` Record**
    - [x] Sub-task 6.1: Create a new `Note` record using Prisma.
        - [x] Assign to the `userId` and relevant context (e.g., `folderId`).
        - [x] Set its `generatedFromBlueprintId` to the `blueprintId`.
        - [x] Populate `title`, `content`, and other fields from AI service response.
    - [x] Sub-task 6.2: Return the created `Note` object or its ID.
- [x] **Task 7: Unit/Integration Tests for Material Generation**
    - [x] Sub-task 7.1: Write tests for successful Question Set generation from a blueprint.
    - [x] Sub-task 7.2: Write tests for successful Note generation from a blueprint.
    - [x] Sub-task 7.3: Test error handling (e.g., blueprint not found, AI service failure).

---

## II. Agent's Implementation Summary & Notes

- **`AiRAGService.generateQuestionsFromBlueprint` Implementation (Tasks 2 & 3):**
    - Successfully implemented the service method to fetch a `LearningBlueprint`, call the external AI service's `/generate/questions` endpoint, and receive generated question data.
    - Implemented persistence logic to create a new `QuestionSet` and its associated `Question` records using Prisma's nested create feature.
    - Resolved complex Prisma and TypeScript type errors related to `QuestionSetCreateInput` by introducing an `AiGeneratedQuestion` interface and using precise Prisma-generated types (`Prisma.QuestionSetCreateInput` and `Prisma.QuestionSetGetPayload`), which eliminated the need for `as any` casts.
    - The method now correctly returns a `QuestionSetResponseDto`.
- **`AiRAGService.generateNoteFromBlueprint` Implementation (Tasks 5 & 6):**
    - Implemented the service method to generate a `Note` from a `LearningBlueprint`, including the AI service call and Prisma persistence logic.
- **Controller & Error Handling (Tasks 1 & 4):**
    - Implemented the `generateQuestionsFromBlueprint` and `generateNoteFromBlueprint` methods in `AiRAGController`.
    - Refactored error handling to be more robust by checking for `instanceof HttpException`, ensuring that specific service-layer exceptions (like `NotFoundException`) are propagated correctly, while other errors result in a `502 Bad Gateway`.
- **Integration Tests (Task 7):**
    - Developed a full suite of integration tests for the content generation endpoints.
    - The tests cover success cases, validation errors (400), authentication (401), resource not found (404), and AI service failures (502).
    - All tests are now passing after fixing the service-layer type errors and controller error handling.

---

## III. Overall Sprint Summary & Review

**Outcome:** **SUCCESS**

This sprint successfully delivered the core functionality for generating educational materials (Question Sets and Notes) from Learning Blueprints. The primary goals of implementing the necessary API endpoints, service logic, and database persistence were achieved.

A key challenge was resolving complex type errors between Prisma and TypeScript during nested data creation. This was overcome by refining the types used in the service layer, leading to a more robust and type-safe implementation without the need for workarounds like `as any`.

Additionally, error handling in the controller was significantly improved to provide more accurate HTTP status codes to the client, which was validated by a comprehensive suite of integration tests. All planned tasks were completed, and all tests are passing.
