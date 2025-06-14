- [x] **Task 1: Backend - Implement "Pinning" Functionality**
    - [x] **Sub-task 1.1 (Schema):** In `schema.prisma`, add a new field to both the `Folder` model and the `QuestionSet` model:
        ```prisma
        isPinned  Boolean  @default(false)
        ```
    - [x] **Sub-task 1.2 (Migration):** Run `prisma migrate dev --name "add_pinning_feature"` and `prisma generate` to apply the schema changes.
    - [X] **Sub-task 1.3 (API Endpoints):** Create two new `PUT` or `PATCH` endpoints to toggle the pinned status:
        * `/api/folders/:folderId/pin`
        * `/api/questionsets/:setId/pin`
        * These endpoints should be protected, verify user ownership, and accept a payload like `{ "isPinned": true }`.

---

**Note:** Schema and migration complete. Backend API implementation in progress.