# Project: elevate - Core API Development Plan

**Last Updated:** May 24, 2025

This document outlines the architecture, features, and development plan for the **elevate** application's Core API. It serves as a single source of truth for development context.

---

## 1. High-Level Premise

**elevate** is an AI-powered learning application. Users provide source material (notes, articles, etc.), and the AI generates interactive quizzes to test their knowledge. The app uses spaced repetition and mastery scores to create personalized daily study sessions, helping users retain information more effectively.

---

## 2. Target Architecture

The application uses a microservices architecture composed of three distinct services:

* **Frontend (React SPA):** The client-side application built with React. It communicates exclusively with the Core API.
* **Core API (Node.js - THIS PROJECT):** The central hub for business logic, user management, and data persistence. It acts as a gateway to the AI Service. **Tech Stack:** Node.js, Express, PostgreSQL, Prisma.
* **AI Service (Python):** A specialized service for handling computationally intensive AI tasks like question generation and conversational chat.

---

## 3. Core API Feature Backlog

This is the full list of features (user stories and tasks) to be built, organized by Epic.

### Epic: Project Setup & Foundation
- **Task:** Initialize Node.js project with Express.
- **Task:** Configure PostgreSQL database connection with Prisma.
- **Task:** Set up basic project structure (routes, controllers, services).
- **Task:** Implement global error handling middleware.

### Epic: User Authentication
- **Task:** Define User model in Prisma schema.
- **User Story:** As a new user, I want to register with an email and password.
- **User Story:** As a user, I want to log in with my email and password.
- **User Story:** As an authenticated user, I want my API requests to be secure (implement JWT middleware).

### Epic: Core Content Management
- **Task:** Define Folder, QuestionSet, and Question models in Prisma.
- **User Story:** As a user, I want to create, view, update, and delete folders.
- **User Story:** As a user, I want to create, view, update, and delete question sets within a folder.

### Epic: AI Service Integration
- **User Story:** As a user, I want to provide text to create a new question set (requires POST /api/sets endpoint).
- **User Story:** As a user, I want to chat with the AI about my study material (requires POST /api/chat endpoint).

### Epic: Learning & Spaced Repetition
- **Task:** Design and implement the spaced repetition algorithm.
- **User Story:** As a user, I want to get my daily list of questions to review (requires GET /api/reviews/today endpoint).
- **User Story:** As a user, I want to submit my answers to a review quiz (requires POST /api/reviews endpoint).

---

### Sprints



#### Sprint 1

The immediate goal is to complete the **User Authentication** feature. The active tasks are:

1.  **DONE:** `Task: Define User model in Prisma schema`.
2.  **NEXT:** `As a new user, I want to register with an email and password`. This involves creating the `POST /api/auth/register` endpoint.
3.  `As a user, I want to log in with my email and password`.
4.  `As an authenticated user, I want my API requests to be secure`.

#### Sprint 2

# Agent Instructions for Project: elevate - Core API

**Directive:** Implement the full CRUD (Create, Read, Update, Delete) functionality for the `Folder` entity.

**Current Status:**
- User Authentication (`/register`, `/login`) is complete and functional.
- A `protect` middleware exists for securing routes (`src/middleware/auth.middleware.ts`).
- The `User` and `Folder` models have been defined in the Prisma schema (`src/db/prisma/schema.prisma`).
- The database migration `add-folder-model` has been successfully applied. The `folders` table now exists and is related to the `users` table.

---

## Immediate Objective: Build the Folders API

The goal is to create a set of secure API endpoints that allow an authenticated user to manage their own folders.

### Required Endpoints:

All endpoints must be prefixed with `/api/folders` and must be protected by the existing `protect` middleware.

- **[x] `POST /api/folders`**: Create a new folder.
- **[x] `GET /api/folders`**: Get all folders belonging to the logged-in user.
- **[x] `GET /api/folders/:id`**: Get a single folder by its ID.
- **[x] `PUT /api/folders/:id`**: Update a folder's name by its ID.
- **[x] `DELETE /api/folders/:id`**: Delete a folder by its ID.

---

## Immediate Objective: Build the Question Sets API

The goal is to create a set of secure API endpoints that allow an authenticated user to manage their own question sets, which are always associated with one of their folders.

### Required Endpoints:

All endpoints must be prefixed with `/api/folders/:folderId/questionsets` and must be protected by the existing `protect` middleware. The `:folderId` in the path refers to the ID of the folder to which the question set belongs or will belong.

- **[x] `POST /api/folders/:folderId/questionsets`**: Create a new question set within the specified folder.
- **[x] `GET /api/folders/:folderId/questionsets`**: Get all question sets within the specified folder.
- **[x] `GET /api/folders/:folderId/questionsets/:id`**: Get a single question set by its ID from within the specified folder.
- **[x] `PUT /api/folders/:folderId/questionsets/:id`**: Update a question set's name by its ID within the specified folder.
- **[x] `DELETE /api/folders/:folderId/questionsets/:id`**: Delete a question set by its ID from within the specified folder.

---

## Implementation Details & Constraints (Folders):

1.  **Authentication:** Every endpoint in this feature **must** use the `protect` middleware to ensure only authenticated users can access them.
2.  **Authorization:** All database queries must be scoped to the authenticated user's ID (`req.user.userId`). A user must not be able to view, edit, or delete folders belonging to another user.
3.  **Database:** Use the generated `PrismaClient` for all database interactions.
4.  **Validation:** Implement input validation for the `POST` and `PUT` routes. The `name` field for a folder should be a non-empty string.
5.  **Error Handling:** Use the existing global error handling middleware for any exceptions.

---

## Implementation Details & Constraints (Question Sets):

1.  **Authentication:** Every endpoint **must** use the `protect` middleware.
2.  **Authorization:** 
    - All database queries must be scoped to ensure the authenticated user (`req.user.userId`) owns the parent folder specified by `:folderId`.
    - A user must not be able to create, view, edit, or delete question sets in folders belonging to another user.
3.  **Database:** Use `PrismaClient`.
4.  **Validation:** 
    - Implement input validation for `POST` and `PUT` routes. The `name` field for a question set should be a non-empty string.
    - The `:folderId` and `:id` (question set ID) URL parameters must be validated as positive integers.
5.  **Error Handling:** Use existing global error handling.

---

## Suggested File Structure:

-   **Routes:** Create `src/routes/folder.routes.ts` to define the five endpoints.
-   **Controllers:** Create `src/controllers/folder.controller.ts` to house the five controller functions (`createFolder`, `getFolders`, `getFolderById`, `updateFolder`, `deleteFolder`).
-   **Main App:** Update `src/app.ts` to import and use the new `folderRouter`.

---

## Suggested File Structure (Question Sets):

-   **Routes:** `src/routes/questionset.routes.ts` (already created and used).
-   **Controllers:** `src/controllers/questionset.controller.ts` (already created and used).
-   **Main App:** `src/app.ts` already mounts the `folderRouter`, and `questionsetRouter` is nested under it with `mergeParams: true`.

---

## First Task: Create the "Create Folder" Endpoint

**Action:** Implement the `POST /api/folders` endpoint.

**Steps:**
1.  Create the `folder.routes.ts` file and define the `POST /` route, applying the `protect` middleware.
2.  Create the `folder.controller.ts` file with an async `createFolder` function.
3.  Inside `createFolder`:
    -   Extract the `name` from the request body.
    -   Extract the `userId` from the `req.user` object (which is added by the `protect` middleware).
    -   Use `prisma.folder.create` to save a new folder to the database, ensuring you pass both the `name` and the `userId`.
    -   Send a `201 Created` response with the new folder data.
4.  Import and mount the new router in `app.ts` under the path `/api/folders`.

---

## First Task: Create the "Create Question Set" Endpoint

**Action:** Implement the `POST /api/folders/:folderId/questionsets` endpoint.

**Steps:**
1.  Create the `questionset.routes.ts` file and define the `POST /` route, applying the `protect` middleware.
2.  Create the `questionset.controller.ts` file with an async `createQuestionSet` function.
3.  Inside `createQuestionSet`:
    -   Extract the `name` from the request body.
    -   Extract the `folderId` from the URL parameters.
    -   Extract the `userId` from the `req.user` object (which is added by the `protect` middleware).
    -   Use `prisma.questionSet.create` to save a new question set to the database, ensuring you pass both the `name` and the `folderId`, and validate the `folderId` belongs to the `userId`.
    -   Send a `201 Created` response with the new question set data.
4.  Import and mount the new router in `app.ts` under the path `/api/folders/:folderId/questionsets`.
