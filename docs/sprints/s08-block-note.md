# Sprint ##: Backend - Verification for BlockNote Editor

**Signed off** DO NOT PROCEED UNLESS SIGNED OFF BY ANTONIO
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Verification
**Overview:** This is a verification sprint to confirm that the existing backend `Note` model and its CRUD API endpoints are ready to support the new BlockNote rich text editor on the frontend. No major code changes are expected, as the schema was designed to be flexible.

---

## I. Planned Tasks & To-Do List

- [ ] **Task 1: Verify Prisma Schema (`schema.prisma`)**
    - [ ] **Sub-task 1.1:** Confirm that the `Note` model's `content` field is of type `Json`. This is required to store the structured JSON output from BlockNote.
    - [ ] **Sub-task 1.2:** Confirm that the `Note` model has all necessary relations (to `User`, `Folder`, `QuestionSet`) and that the `InsightCatalyst` model is ready to be used.

- [ ] **Task 2: Review Note Service (`src/services/noteService.ts`)**
    - [ ] **Sub-task 2.1:** Review the `createNote` and `updateNote` functions. Confirm they correctly accept a JSON object for the `content` field and pass it to Prisma without issue.
    - [ ] **Sub-task 2.2:** Verify the `plainText` generation logic. This may need a minor update to correctly parse a BlockNote JSON structure (an array of block objects) to generate a plain-text summary for search and previews.

- [ ] **Task 3: Verify API Endpoints & Tests**
    - [ ] **Sub-task 3.1:** Briefly review the controllers for `POST /api/notes` and `PUT /api/notes/:noteId`. Confirm they pass the `content` field from `req.body` directly to the service.
    - [ ] **Sub-task 3.2:** Review the integration tests in `note.routes.test.ts`. Update one or two tests to send a mock BlockNote-style JSON array as the `content` to ensure the backend handles it gracefully.

---

## II. Agent's Implementation Summary & Notes

*Instructions for AI Agent (Cascade): Please perform the verification tasks. Only make changes to the `plainText` generation logic if necessary. Update one test to use a mock BlockNote payload. Confirm the backend is ready.*

**(Agent will fill this section out as work is completed)**

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)

**(This section to be filled out upon sprint completion)**