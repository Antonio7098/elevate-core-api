# Sprint ##: Backend - TDD Refactor of AI Answer Evaluation

**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Test-Driving the New Evaluation Logic
**Overview:** This sprint focuses on a complete, Test-Driven Development (TDD) refactor of the answer evaluation endpoint (`POST /api/ai/evaluate-answer`). We will start by deleting the old implementation and its tests, then write a new, comprehensive test suite that defines the desired behavior. Finally, we will implement the new controller and service logic with the goal of making all new tests pass.

---

## I. Planned Tasks & To-Do List

- [x] **Task 1: Setup & Cleanup (Clean Slate)**
    - [x] **Sub-task 1.1:** Delete the existing `evaluation.controller.ts` file.
    - [x] **Sub-task 1.2:** Delete the existing `evaluation.routes.test.ts` file (or its equivalent). We will write a new one from scratch.

- [x] **Task 2: Write the Test Suite First (`evaluation.routes.test.ts`)**
    - [x] **Sub-task 2.1 (Test Setup):** Create the new test file. Set up the necessary `beforeAll` and `afterEach` blocks with mock data, including creating a `testUser`, `testFolder`, `testQuestionSet`, and several `Question`s with different configurations (`autoMark: true`, `selfMark: true`, and a standard AI-evaluated question).
    - [x] **Sub-task 2.2 (Write Authentication Tests):**
        * Write a test to ensure an unauthenticated request to `POST /api/ai/evaluate-answer` returns a `401 Unauthorized`.
        * Write a test to ensure a user cannot evaluate a question they do not own, returning a `404 Not Found`.
    - [x] **Sub-task 2.3 (Write "Auto-Mark" Test):**
        * Write a test for a question where `autoMark: true` (e.g., a multiple-choice question).
        * The test should send a correct answer and assert that the response is a success, the `score` is 1.0, and that the Python **AI service was NOT called**.
        * Write a second test with an incorrect answer and assert the `score` is 0.
    - [x] **Sub-task 2.4 (Write "Self-Mark" Test):**
        * Write a test for a question where `selfMark: true`.
        * The test should assert that the API returns a specific response payload indicating that self-marking is required (e.g., `{ "requiresSelfMark": true }`) and that the **AI service was NOT called**.
    - [x] **Sub-task 2.5 (Write "AI Evaluation" Test):**
        * This is the most important test. Write a test for a standard short-answer question that requires AI evaluation.
        * Mock the `aiService.evaluateAnswer` function.
        * The test must assert that this mocked function is called with a `questionContext` payload that **includes the question's `markingCriteria` and `uueFocus` fields**.
        * The test should assert that the final API response correctly reflects the mock data returned from the AI service.

- [ ] **Task 3: Implement the New Controller & Service (Make Tests Pass)**
    - [ ] **Sub-task 3.1 (Create Files):** Create the new, empty `evaluation.controller.ts` and `evaluation.service.ts` files, and a new `evaluation.routes.ts` file.
    - [ ] **Sub-task 3.2 (Implement Logic - One Test at a Time):**
        * Implement the basic route and controller structure to make the `401` and `404` tests pass.
        * In `evaluation.service.ts`, implement the **routing logic**. It must first fetch the `Question` and then check its `autoMark` and `selfMark` flags.
        * Implement the simple string-matching logic for `autoMark` questions to make that test pass.
        * Implement the response for `selfMark` questions to make that test pass.
        * Finally, implement the AI evaluation path. This includes fetching all the necessary context from the `Question` model (including `markingCriteria`, `uueFocus`) and passing it to the `aiService`. This will make the final test pass.
    - [ ] **Sub-task 3.3 (Run All Tests):** Continuously run the test suite until all tests are green.

---

## II. Agent's Implementation Summary & Notes

*Progress Update:*
1. Successfully completed Task 1 (Setup & Cleanup) by removing old files
2. Completed Task 2 (Test Suite) with comprehensive test coverage including:
   - Authentication tests
   - Auto-mark question tests
   - Self-mark question tests
   - AI evaluation tests with proper context verification
3. Next steps:
   - Create new controller and service files
   - Implement authentication and authorization
   - Implement question type routing logic
   - Add AI service integration

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)

**(This section to be filled out upon sprint completion)**

---
**Signed off:** Antonio