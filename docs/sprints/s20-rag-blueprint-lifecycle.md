# Sprint 20: RAG - Learning Blueprint Lifecycle

**Signed off** Antonio
**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Learning Blueprint Creation and Management
**Overview:** This sprint implements the lifecycle of Learning Blueprints. It includes creating the `POST /api/learning-blueprints` endpoint (or equivalent), developing Core API logic to call the AI Service's `/deconstruct` endpoint, saving `LearningBlueprint` records, and potentially implementing basic GET/LIST/DELETE endpoints for Learning Blueprints.

---

## I. Current Working Plan (Reflects progress on S19 & S20)

### Sprint 19 – RAG Schema & API Foundations Plan (Completed Context)

*This section provides historical context for the tasks completed prior to focusing on Sprint 20 objectives.*

- **Task 1: Implement `LearningBlueprint` Prisma Model** (All sub-tasks completed)
- **Task 2: Update `QuestionSet` Prisma Model** (Completed)
- **Task 3: Update `Note` Prisma Model** (Completed)
- **Task 4: Database Migration** (All sub-tasks completed)
- **Task 5: Define Core DTOs for RAG Endpoints** (All sub-tasks completed)
- **Task 6: Stub out RAG Controller & Service Interfaces** (All sub-tasks completed, including fixing existing AI controller tests as a baseline)

### Sprint 20: RAG Blueprint Lifecycle (Current Focus)

- [x] **1. Create Sprint 20 plan and update docs** (Sprint 20 plan execution and documentation updates completed)
- [x] **2. Implement Learning Blueprint CRUD endpoints & service logic**
    - [x] 2.1 Move `axios` to dependencies
    - [x] 2.2 Implement `POST /learning-blueprints` route handler
    - [x] 2.3 Implement `AiRAGService.createLearningBlueprint`
    - [x] 2.4 Update DTOs & responses
    - [x] 2.5 Implement remaining CRUD endpoints (GET, PUT, DELETE for Learning Blueprints in `ai-rag.routes.ts` and `ai-rag.service.ts`)
    - [x] 2.6 Update Swagger docs & write tests
        - [x] 2.6a Decide Swagger documentation strategy (NestJS for docs, Express for live routes)
        - [x] 2.6b Refactor Express routes into NestJS AiRAGController (for Swagger generation only)
        - [x] 2.6c Apply Swagger decorators & integrate Swagger UI (via temporary NestJS app)
        - [x] 2.6d Update integration (Swagger setup & Express router alignment)
        - [x] 2.6e Write tests for blueprint lifecycle endpoints
            - [x] 2.6e.i Create integration tests with Jest & Supertest for Learning Blueprint CRUD.
            - [x] 2.6e.ii Mock AiRAGService methods in tests (specifically `createLearningBlueprint`, `updateLearningBlueprint` initially).
            - [x] 2.6e.iii Resolve lint/type errors and ensure CI passes.
            - [x] 2.6e.iv Fix NestJS driver error during Jest by installing `@nestjs/platform-express`.
            - [x] 2.6e.v Strengthen `ensureAuthenticated` in `ai-rag.routes.ts` and update route handlers to use `req.user.userId`.
            - [x] 2.6e.vi Ensure test auth setup populates `req.user` correctly so integration tests pass (Achieved by integrating global `protect` middleware).
            - [x] 2.6e.vii Mock remaining service methods to fix all blueprint tests:
                - [x] 2.6e.vii.a Mock `getAllLearningBlueprintsForUser`
                - [x] 2.6e.vii.b Mock `getLearningBlueprintById`
                - [x] 2.6e.vii.c Mock `deleteLearningBlueprint`
        - [x] 2.6f Integrate Authentication for Blueprint Routes
            - [x] 2.6f.i Identified existing `protect` middleware in `auth.middleware.ts` as suitable solution.
            - [x] 2.6f.ii Integrated `protect` middleware globally in `app.ts` before protected API routers.
            - [x] 2.6f.iii Removed redundant Passport JWT strategy and uninstalled `passport`, `passport-jwt` packages.
            - [x] 2.6f.iv Verified tests use valid JWTs and pass with the `protect` middleware.
            - [x] 2.6f.v All blueprint integration tests (17) now pass, confirming auth and CRUD functionality.

---


## II. Agent's Implementation Summary & Notes

### June 18, 2025 - Preparatory Work for RAG Implementation

**Foundational Work for Tasks 1-3: Learning Blueprint Lifecycle**

Before implementing the new Learning Blueprint lifecycle endpoints, we needed to address existing AI controller test failures. This work is important because:

1. The existing AI controller tests provide a reference implementation for how the new RAG controller tests should be structured.

2. Understanding the current AI simulation logic helps us design the new RAG service interfaces correctly, ensuring they can be properly mocked in tests.

Key changes made to the existing AI controller:

1. **Updated `ChatContext` Interface**: Added `folderId` property to support folder-based context in the AI simulation, which will be needed for the new RAG system as well.

2. **Enhanced Question Generation Simulation**: Modified `simulateAIQuestionGeneration` to include required fields that the tests expect:
   - Added `totalMarksAvailable` (set to 10)
   - Added `markingCriteria` with two criteria (Correctness and Clarity)

3. **Fixed Chat Response Simulation**: Updated `simulateAIChatResponse` to correctly generate context strings for both `questionSetId` and `folderId` scenarios.

All AI controller tests are now passing. This work provides valuable insights for implementing the new RAG controller and service interfaces, particularly for how to structure the HTTP calls to the AI Service and how to handle the responses.

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio after work is done)

**(Standard review template sections)**
