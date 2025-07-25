# Sprint 28: Primitive-Centric SR - Algorithms & Services

**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Service Layer Refactoring
**Overview:** This sprint focuses on refactoring the backend service layer to implement the new algorithms for the primitive-centric spaced repetition system. This includes the "Today's Tasks" generation logic, the new fixed-interval scheduling algorithm, and the UEE ladder progression logic. This work is critical for moving the application's core learning mechanics to the new, more granular model.

---

## I. Planned Tasks & To-Do List

- [ ] **Task 1: Refactor `todaysTasks.service.ts` for Primitive-Based Task Generation**
    - *Sub-task 1.1:* Rewrite `getDueSetsForUser` to become `getDuePrimitivesForUser`. The query logic must be updated to fetch `UserPrimitiveProgress` records for the current user where `KnowledgePrimitive.isTracking` is `true`.
    - *Sub-task 1.2:* Implement the **"Critical Tasks"** bucket.
        - **Pool:** Union of overdue primitives (`nextReviewAt < TODAY`) and primitives with `consecutiveFailures >= 2`.
        - **Sorting:** Primary sort by days overdue (desc), secondary by UEE Level (asc).
    - *Sub-task 1.3:* Implement the **"Core Tasks"** bucket.
        - **Pool:** Union of primitives due today, due tomorrow, and new primitives never reviewed.
        - **Sorting:** Primary sort by score of the last attempt (asc), calculated from the most recent `userQuestionAnswer`. New primitives are treated as having a 100% score. Secondary sort by UEE Level (asc).
    - *Sub-task 1.4:* Implement the **"Plus Tasks"** bucket.
        - **Pool:** Union of UEE Progression Previews and Long-Term Reinforcement primitives.
        - **Sorting:** Primary sort by UEE Level (asc), secondary by `lastReviewedAt` (asc).
    - *Sub-task 1.5:* Implement the final assembly logic to fill a target task count from the sorted buckets in order (Critical -> Core -> Plus).
    - *Sub-task 1.6:* Rewrite all unit tests in `todaysTasks.service.test.ts` to use the new primitive-based models and assert the correctness of the new bucketing and sorting logic.

- [ ] **Task 2: Implement the "Fixed-Interval v3" Spaced Repetition Scheduling Algorithm**
    - *Sub-task 2.1:* Create a new service `primitiveSR.service.ts` (or refactor `advancedSpacedRepetition.service.ts`) to house the new logic.
    - *Sub-task 2.2:* The core logic will operate on the `UserPrimitiveProgress` model.
    - *Sub-task 2.3:* Implement the interval ladder: `INTERVALS = [1, 3, 7, 21]`. The user's position is tracked by `UserPrimitiveProgress.currentIntervalStep`.
    - *Sub-task 2.4:* Implement review logic:
        - **Correct on First Attempt:** Increment `currentIntervalStep`, set `nextReviewAt` to `now() + INTERVALS[new_step]`.
        - **Incorrect Answer:** Decrement `currentIntervalStep` (floor at 0), set `nextReviewAt` to `now() + 1 day`.
        - **Same-Day Correction:** Restore `currentIntervalStep` to its pre-session value, set `nextReviewAt` to `now() + INTERVALS[current_step]`.
    - *Sub-task 2.5:* Write comprehensive unit tests for the new scheduling logic, covering all cases.

- [ ] **Task 3: Implement UEE Ladder Progression Logic**
    - *Sub-task 3.1:* In `primitiveSR.service.ts`, create a function that is called after a successful review.
    - *Sub-task 3.2:* This function checks if all `MasteryCriterion` for a primitive's current `ueeLevel` have `isMastered = true` in the `UserCriterionMastery` table.
    - *Sub-task 3.3:* If all criteria for a level are met, update `UserPrimitiveProgress.currentUeeLevel` to the next level (e.g., "Understand" -> "Use").
    - *Sub-task 3.4:* Upon leveling up, reset the SR state for that primitive: `currentIntervalStep` to 0, and `nextReviewAt` to `now() + INTERVALS[0]`.
    - *Sub-task 3.5:* Write unit tests to verify the UEE progression and SR state reset.

- [ ] **Task 4: Refactor Supporting Services**
    - *Sub-task 4.1:* Refactor `reviewScheduling.service.ts` (if kept) to schedule reviews for `KnowledgePrimitive` instead of `QuestionSet`.
    - *Sub-task 4.2:* Refactor `stats.service.ts` to report on primitive-level mastery, progress, and review statistics by querying the new `UserPrimitiveProgress` and `UserCriterionMastery` models.
    - *Sub-task 4.3:* Update all associated unit tests for these services.

---

## II. Agent's Implementation Summary & Notes
*(Agent will fill this section out as work is completed)*

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)
*(This section to be filled out upon sprint completion)*
