# Sprint 28: Primitive-Centric SR - Algorithms & Services

**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Service Layer Refactoring
**Overview:** This sprint focuses on refactoring the backend service layer to implement the new algorithms for the primitive-centric spaced repetition system. This includes the "Today's Tasks" generation logic, the new fixed-interval scheduling algorithm, and the UEE ladder progression logic. This work is critical for moving the application's core learning mechanics to the new, more granular model.

---

## I. Planned Tasks & To-Do List

- [ ] **Task 1: Create `todaysTasksPrimitive.service.ts` for Primitive-Based Task Generation**
    - *Sub-task 1.1:* Rewrite `getDueSetsForUser` from todaysTasks to become `getDuePrimitivesForUser`.
    - *Sub-task 1.2:* Implement the **"Critical Tasks"** bucket.
    - *Sub-task 1.3:* Implement the **"Core Tasks"** bucket.
    - *Sub-task 1.4:* Implement the **"Plus Tasks"** bucket.
    - *Sub-task 1.5:* Implement the final assembly logic.
    - *Sub-task 1.6:* Rewrite all unit tests in `todaysTasks.service.test.ts`.

- [ ] **Task 2: Implement the "Fixed-Interval v3" Spaced Repetition Scheduling Algorithm**
    - *Sub-task 2.1:* Create a new service `primitiveSR.service.ts`.
    - *Sub-task 2.2:* The core logic will operate on the `UserPrimitiveProgress` model.
    - *Sub-task 2.3:* Implement the interval ladder: `INTERVALS = [1, 3, 7, 21]`.
    - *Sub-task 2.4:* Implement review logic.

- [ ] **Task 3: Implement UUE Ladder Progression Logic**
    - *Sub-task 3.1:* In `primitiveSR.service.ts`, create a function that is called after a successful review.
    - *Sub-task 3.2:* This function checks if all `MasteryCriterion` for a primitive's current `uuSeLevel` have `isMastered = true`.
    - *Sub-task 3.3:* If all criteria for a level are met, update `UserPrimitiveProgress.currentUeeLevel`.

- [ ] **Task 4: Implement Mastery Logic**
    - *Sub-task 4.1:* In `primitiveSR.service.ts`, update the review logic to track `lastAttemptCorrect` in `UserCriterionMastery`.
    - *Sub-task 4.2:* When a user answers a question correctly, check if `lastAttemptCorrect` was also true.
    - *Sub-task 4.3:* If both are true, set `isMastered` to `true` and `masteredAt` to the current timestamp.
    - *Sub-task 4.4:* If the answer is incorrect, set `lastAttemptCorrect` to `false`.

- [ ] **Task 5: Refactor Supporting Services**
    - *Sub-task 5.1:* Refactor `reviewScheduling.service.ts` to schedule reviews for `KnowledgePrimitive`.
    - *Sub-task 5.2:* Refactor `stats.service.ts` to report on primitive-level mastery and progress.
    - *Sub-task 5.3:* Update all associated unit tests for these services.

- [ ] **Task 6: Implement Manual SR Date Management**
    - *Sub-task 6.1:* Create a new endpoint: `/api/primitives/:primitiveId/set-review-date`.
    - *Sub-task 6.2:* Create `manuallySetNextReviewDate(userId, primitiveId, newNextReviewAt)` in `primitiveSR.service.ts`.
    - *Sub-task 6.3:* Add a `schedulingMode` to `UserPrimitiveProgress`.
    - *Sub-task 6.4:* The SR algorithm must check `schedulingMode` and not update `nextReviewAt` if `MANUAL`.
    - *Sub-task 6.5:* Write unit tests for manual scheduling.

---

## II. Agent's Implementation Summary & Notes
*(Agent will fill this section out as work is completed)*

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)
*(This section to be filled out upon sprint completion)*