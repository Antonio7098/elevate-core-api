# Sprint ##: AI Integration Tests

**Date Range:** 2025-06-02 - [End Date]
**Primary Focus:** Core API - AI Service Integration Tests
**Overview:** Introduce integration tests that call the actual AI API for question generation, evaluation, and chat functionalities, ensuring the core application correctly interacts with the external AI service.

---

## I. Planned Tasks & To-Do List (Derived from Gemini's Prompt)

*Instructions for Antonio: Review the prompt/instructions provided by Gemini for the current development task. Break down each distinct step or deliverable into a checkable to-do item below. Be specific.*

- [ ] **Task 1:** Create a new integration test file: `src/routes/__tests__/ai.integration.routes.test.ts`.
    - *Sub-task 1.1:* Ensure `AIService` is NOT mocked in this new file.
- [ ] **Task 2:** Implement basic setup in `ai.integration.routes.test.ts`.
    - *Sub-task 2.1:* Include necessary imports (`supertest`, `PrismaClient`, `app`, `jwt`).
    - *Sub-task 2.2:* Replicate `beforeAll` and `afterAll` logic from existing AI tests for test data (users, folders, tokens).
    - *Sub-task 2.3:* Add a `beforeAll` check for essential environment variables (`AI_SERVICE_EXTERNAL_URL`, `AI_SERVICE_EXTERNAL_API_KEY`) and skip tests if not set.
- [ ] **Task 3:** Implement integration tests for the application's endpoint that calls the AI service's `/generate-questions` (e.g., `/api/ai/generate-questions-from-source`).
    - *Sub-task 3.1:* Test happy path: valid request, 2xx response, correct response structure matching AI service, questions saved to DB.
    - *Sub-task 3.2 (Optional):* Test authentication error handling if the core API is configured with an invalid key for the AI service.
    - **Unauthorized Folder Access Test:** Test expects 403 Forbidden but receives 404 Not Found when accessing a folder without permission. Indicates authorization and existence checks order or logic may need review.
      - **FIXED:** Modified `generateQuestionsFromSource` controller to first check for folder existence by ID, then verify user ownership. This ensures a 404 for non-existent folders and a 403 for unauthorized access to existing folders.
- [ ] **Task 4:** Implement integration tests for the application's endpoint that calls the AI service's `/evaluate-answer`.
    - *Sub-task 4.1:* Test happy path for short-answer questions.
    - *Sub-task 4.2:* Test happy path for multiple-choice questions.
    - *Sub-task 4.3 (Optional):* Test authentication error handling.
- [ ] **Task 5:** Implement integration tests for the application's endpoint that calls the AI service's `/chat`.
    - *Sub-task 5.1:* Test happy path for a chat interaction.
    - *Sub-task 5.2 (Optional):* Test authentication error handling.
    - **Chat Endpoint Non-Existent Question Set Context:** Test expects 404 Not Found but receives 200 OK. Suggests missing validation for question set existence or ownership in chat controller.
      - **FIXED:** Updated `chatWithAI` controller to correctly read `questionSetId` from `req.body.context.questionSetId` and validate its existence and user ownership. Ensured fallback simulation logic also uses the correct context variables.
- [ ] **Task 6:** Ensure tests are runnable as a separate suite or can be conditionally skipped (e.g., via environment variable `RUN_AI_INTEGRATION_TESTS`).

---

## II. Agent's Implementation Summary & Notes

*Instructions for AI Agent (Cascade): For each planned task you complete from Section I, please provide a summary below. If multiple tasks are done in one go, you can summarize them together but reference the task numbers.*

**Regarding Task X: [Task X Description from above]**
* **Summary of Implementation:**
    * [Agent describes what was built/changed, key functions created/modified, logic implemented]
* **Key Files Modified/Created:**
    * `src/example/file1.ts`
    * `src/another/example/file2.py`
* **Notes/Challenges Encountered (if any):**
    * [Agent notes any difficulties, assumptions made, or alternative approaches taken]

**Regarding Tasks 1-6 (Debugging & Refinement): AI Integration Test Suite**
* **Summary of Implementation:**
    * **Initial Setup & Route Consolidation:** Created `ai.integration.routes.test.ts`. Addressed initial 404 errors by consolidating AI routes (`/generate-questions-from-source`, `/evaluate-answer`, `/chat`) under a single `aiRouter` in `ai.routes.ts` and `app.ts`. Removed the separate `evaluation.routes.ts`.
    * **Prisma Client Fix:** Resolved Prisma client errors in the test environment by adding `"debian-openssl-3.0.x"` to `binaryTargets` in `schema.prisma`.
    * **Test Assertion Adjustments (Generate Questions):** Updated assertions in `ai.integration.routes.test.ts` for the `POST /api/ai/generate-questions-from-source` success case to correctly expect the `questions` array nested within `res.body.questionSet`. Removed assertion for a non-existent `explanation` field on question objects.
    * **Test Data & Payload Fixes (Evaluate Answer):** Addressed 500 errors for `POST /api/ai/evaluate-answer` by:
        * Creating dedicated `QuestionSet` and `Question` records in `beforeAll` for evaluation tests.
        * Updating test payloads to use these actual `questionId`s.
        * Ensuring `questionId` and `userAnswer` are sent at the root of the request body.
    * **Test Assertion Adjustments (Evaluate Answer):** Updated assertions for `POST /api/ai/evaluate-answer` to expect `feedback` (instead of `feedbackText`) and `correctedAnswer` (instead of `suggestedCorrectAnswer`) in the response, aligning with actual API behavior for both manual and AI-driven evaluations.
* **Key Files Modified/Created:**
    * `src/routes/__tests__/ai.integration.routes.test.ts` (created and multiple updates)
    * `src/db/prisma/schema.prisma` (updated `binaryTargets`)
    * `src/routes/ai.routes.ts` (consolidated routes)
    * `src/app.ts` (updated router mounting)
    * `src/routes/evaluation.routes.ts` (deleted)
    * `src/controllers/evaluation.controller.ts` (viewed for debugging)
* **Notes/Challenges Encountered (if any):**
    * Initial test runs failed due to various reasons: test file not found, Prisma client issues, route mismatches, and incorrect response expectations.
    * Debugging involved iterative test runs, inspecting API responses, and adjusting test assertions or controller logic accordingly.
    * All AI integration tests are now passing. The final issues resolved were:
        * **Unauthorized Folder Access (403 vs 404):** Corrected logic in `generateQuestionsFromSource` to first check folder existence then ownership, ensuring proper 403/404 responses.
        * **Non-existent Question Set Context (404 vs 200 for Chat):** Updated `chatWithAI` to correctly read `questionSetId` from `req.body.context.questionSetId` and validate its existence and user ownership. Also fixed lint errors in fallback simulation logic by using the correct context variables.

**(Agent continues for all completed tasks...)**

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio after work is done)

**1. Key Accomplishments this Sprint:**
    * [List what was successfully completed and tested]
    * [Highlight major breakthroughs or features implemented]

**2. Deviations from Original Plan/Prompt (if any):**
    * [Describe any tasks that were not completed, or were changed from the initial plan. Explain why.]
    * [Note any features added or removed during the sprint.]

**3. New Issues, Bugs, or Challenges Encountered:**
    * [List any new bugs found, unexpected technical hurdles, or unresolved issues.]

**4. Key Learnings & Decisions Made:**
    * [What did you learn during this sprint? Any important architectural or design decisions made?]

**5. Blockers (if any):**
    * [Is anything preventing progress on the next steps?]

**6. Next Steps Considered / Plan for Next Sprint:**
    * [Briefly outline what seems logical to tackle next based on this sprint's outcome.]

**Sprint Status:** [e.g., Fully Completed, Partially Completed - X tasks remaining, Completed with modifications, Blocked]
