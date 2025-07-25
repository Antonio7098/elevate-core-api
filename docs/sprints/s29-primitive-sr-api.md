# Sprint 29: Primitive-Centric SR - API, AI Integration & Deprecation

**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - API Endpoints & AI Integration
**Overview:** This sprint focuses on exposing the new primitive-centric SR system through the API. It involves creating new endpoints for handling primitive-based reviews, updating controllers to use the new services, integrating the AI service to generate primitives directly into the new database structure, and formally deprecating the old `QuestionSet`-based review system.

---

## I. Planned Tasks & To-Do List

- [ ] **Task 1: Create New Primitive-Centric API Endpoints**
    - *Sub-task 1.1:* Create a new `primitive.controller.ts` and `primitive.routes.ts`.
    - *Sub-task 1.2:* Implement `POST /api/primitives/review`. This endpoint will accept review outcomes for one or more primitives and use the new `primitiveSR.service.ts` to process them.
    - *Sub-task 1.3:* Implement `POST /api/primitives/:id/tracking` to allow users to toggle the `isTracking` flag for a specific primitive.
    - *Sub-task 1.4:* Implement `GET /api/primitives` to list all primitives for a user and `GET /api/primitives/:id/details` to get detailed information for a single primitive, including its criteria and progress.

- [ ] **Task 2: Update Existing Controllers and Routes**
    - *Sub-task 2.1:* Refactor `todaysTasks.controller.ts` to use the new `getDuePrimitivesForUser` service. The `GET /api/todays-tasks` endpoint will now return a list of questions derived from the due primitives.
    - *Sub-task 2.2:* Refactor `review.controller.ts` and its routes (`/api/reviews/*`) for deprecation. The controller methods should be updated to return a `410 Gone` status with a message pointing to the new `/api/primitives/review` endpoint.
    - *Sub-task 2.3:* Update `stats.controller.ts` to call the new primitive-centric stats service methods and return primitive-based statistics.

- [ ] **Task 3: Evolve AI API Integration**
    - *Sub-task 3.1:* Refactor the `ai-rag.service.ts` (or equivalent AI generation service).
    - *Sub-task 3.2:* Modify the blueprint processing logic. When the AI deconstructs a source material, the service will now create `KnowledgePrimitive` and `MasteryCriterion` records directly in the database.
    - *Sub-task 3.3:* Generated `Question` records will be linked to their corresponding `MasteryCriterion`.
    - *Sub-task 3.4:* Update the `ai.controller.ts` or `ai-rag.controller.ts` to trigger this new, more integrated generation flow.

- [ ] **Task 4: Integration and End-to-End Testing**
    - *Sub-task 4.1:* Create a new integration test file `primitive.routes.test.ts`.
    - *Sub-task 4.2:* Write tests for all new primitive endpoints (`POST /review`, `POST /:id/tracking`, `GET /`, `GET /:id/details`), covering success cases, authorization, and error handling.
    - *Sub-task 4.3:* Update the integration tests for `todaysTasks.routes.test.ts` to assert on the new response structure.
    - *Sub-task 4.4:* Create a new end-to-end test that covers the entire lifecycle:
        1. AI generates a primitive from source text.
        2. The primitive appears in "Today's Tasks".
        3. The user submits a review for the primitive.
        4. Verify the `UserPrimitiveProgress` and `UserCriterionMastery` are updated correctly.

- [ ] **Task 5: Deprecation and Documentation**
    - *Sub-task 5.1:* Mark all routes under `/api/reviews/` as deprecated in the Swagger/OpenAPI documentation.
    - *Sub-task 5.2:* Add logging to the deprecated endpoints to monitor any continued usage.
    - *Sub-task 5.3:* Update the API documentation to reflect the new primitive-centric endpoints and deprecate the old ones.

---

## II. Agent's Implementation Summary & Notes
*(Agent will fill this section out as work is completed)*

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)
*(This section to be filled out upon sprint completion)*
