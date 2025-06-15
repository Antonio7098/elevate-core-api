# Sprint ##: AI Generation Endpoint Refactor

**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API & AI Service - Enhancing Question Generation
**Overview:** This sprint focuses on a complete refactor of the AI question generation pipeline. The goal is to update the `POST /api/ai/generate-from-source` endpoint to leverage new fields on the `QuestionSet` model (like `instructions`) and the `UserMemory` model (user preferences). This will make the AI-generated questions more targeted, relevant, and personalized.

---

## I. Planned Tasks & To-Do List

- [ ] **Task 1: Update Prisma Schema (`schema.prisma`)**
    - [ ] **Sub-task 1.1:** Review the `QuestionSet` model. Confirm it has the `instructions: String?` and `source: String?` fields. The `source` field will be used to store the user's input text after generation for future reference.

- [ ] **Task 2: Refactor Core API Endpoint (`ai.controller.ts`)**
    - [ ] **Sub-task 2.1:** Wipe and rebuild the `generateQuestionsFromSource` controller function, as well as its tests.
    - [ ] **Sub-task 2.2:** The request body should now be simplified. Instead of sending the full `sourceText`, the frontend will first create an empty `QuestionSet` with the `source` and `instructions`. The request to this endpoint will then just need the `questionSetId`.
    - [ ] **Sub-task 2.3 (New Flow):**
        1.  The controller receives a `questionSetId` and `questionCount`.
        2.  It fetches the `QuestionSet` from the database, ensuring the user has ownership.
        3.  It fetches the user's `UserMemory` profile to get their learning preferences.
        4.  It calls a refactored `aiService.generateQuestions` function, passing the `source`, `instructions`, and the `userMemory` preferences as context.

- [ ] **Task 3: Refactor Core API Service (`aiService.ts` in Node.js)**
    - [ ] **Sub-task 3.1:** Update the `generateQuestions` function. It no longer needs to simulate anything.
    - [ ] **Sub-task 3.2:** It will construct a detailed `GenerateQuestionsRequest` payload for the Python service. This payload will now include:
        * `sourceText` (from the `QuestionSet.source` field).
        * `questionCount`.
        * `instructions` (from the `QuestionSet.instructions` field).
        * A `context` object containing the user's preferences from their `UserMemory` profile (`learningStyles`, `preferredAiTone`, etc.).
    - [ ] **Sub-task 3.3:** After receiving the generated questions from the Python service, this function will now save them directly to the database, linking them to the `questionSetId`. It will also set the `aiGenerated: true` flag on each new question.

- [ ] **Task 4: Update Integration Tests**
    - [ ] **Sub-task 4.1:** Wipe and rebuild the tests for `POST /api/ai/generate-from-source`.
    - [ ] **Sub-task 4.2:** The tests must now simulate the new flow: create a `QuestionSet` with `source` and `instructions` first, then call the endpoint with the `questionSetId`.
    - [ ] **Sub-task 4.3:** The tests should verify that the `aiService` is called with the correct payload, including the `instructions` and user preference `context`.

---