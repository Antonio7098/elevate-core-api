# Sprint ##: Backend - AI Note Generation Endpoint

**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Implementing AI-Powered Note Generation
**Overview:** This sprint focuses on building the backend infrastructure for the AI Note Generation feature. The primary goal is to create a new API endpoint that accepts source text, calls the Python AI Service to generate structured notes, and then creates and saves a new `Note` record in the database.

---

## I. Planned Tasks & To-Do List

*Instructions for the agent: This sprint requires close coordination with the Python AI Service's contract. The new endpoint will be responsible for orchestrating the entire note generation flow.*

- [ ] **Task 1: API Endpoint Creation (`note.routes.ts` & `note.controller.ts`)**
    - [ ] **Sub-task 1.1:** Create a new route: **`POST /api/notes/generate-from-source`**.
    - [ ] **Sub-task 1.2:** This route must be protected by the authentication middleware.
    - [ ] **Sub-task 1.3:** Create a new controller function, `generateNoteFromSource`, to handle the request.

- [ ] **Task 2: Service Logic Implementation (`note.service.ts` or `aiService.ts`)**
    - [ ] **Sub-task 2.1:** Create a new service function, e.g., `createNoteFromAI(userId, sourceText, title, folderId?, questionSetId?)`.
    - [ ] **Sub-task 2.2 (Fetch Context):** This service must first fetch the user's `UserMemory` record to get their learning preferences (e.g., `preferredAiVerbosity`, `learningStyles`).
    - [ ] **Sub-task 2.3 (Call AI Service):** Construct the payload and call the Python AI Service's `/api/ai/generate-notes` endpoint. The payload must include the `sourceText` and the user's preferences in the `context` object.
    - [ ] **Sub-task 2.4 (Process Response):** Receive the structured note content (the BlockNote-compatible JSON array) from the Python AI service.

- [ ] **Task 3: Database Interaction**
    - [ ] **Sub-task 3.1:** After receiving a successful response from the AI service, the service function must create a new `Note` record in the database using `prisma.note.create`.
    - [ ] **Sub-task 3.2:** The `data` for the new note should include:
        * The `title` provided by the user (or an AI-generated one).
        * The `content` (the JSON array from the AI).
        * A `plainText` version of the content for previews.
        * The correct `userId`, `folderId` (if provided), and `questionSetId` (if provided).
    - [ ] **Sub-task 3.3:** The controller should return the newly created `Note` object with a `201 Created` status.

- [ ] **Task 4: Integration Testing**
    - [ ] **Sub-task 4.1:** In `note.routes.test.ts`, add a new test suite for the `POST /api/notes/generate-from-source` endpoint.
    - [ ] **Sub-task 4.2:** The test should verify that unauthenticated requests fail.
    - [ ] **Sub-task 4.3:** The main test should mock the call to the Python AI service, provide a sample structured note response, and then assert that a new `Note` record is correctly created in the test database with the expected content and associations.

---

## II. Agent's Implementation Summary & Notes

*Instructions for AI Agent (Cascade): For each planned task you complete from Section I, please provide a summary below, including notes on key files modified and any challenges or decisions made.*

**(Agent will fill this section out as work is completed)**

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)

**(This section to be filled out upon sprint completion)**

---
**Signed off:** DO NOT PROCEED WITH THE SPRINT UNLESS SIGNED OFF