# Sprint 27: Primitive-Centric SR - Schema and Migration

**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Database Schema & Data Migration
**Overview:** This sprint focuses on implementing the foundational database schema changes required to transition from a `QuestionSet`-based spaced repetition system to a `KnowledgePrimitive`-centric one. It includes creating four new models, modifying several existing ones to support the new system, and developing a data migration script to transition existing SR data to the new structure.

---

## I. Planned Tasks & To-Do List

- [ ] **Task 1: Implement New Prisma Models (`src/db/prisma/schema.prisma`)**
    - *Sub-task 1.1:* Create `KnowledgePrimitive` model.
    - *Sub-task 1.2:* Create `MasteryCriterion` model.
    - *Sub-task 1.3:* Create `UserPrimitiveProgress` model.
    - *Sub-task 1.4:* Create `UserCriterionMastery` model. This tracks mastery of individual criteria.
        ```prisma
        model UserCriterionMastery {
          id                 Int      @id @default(autoincrement())
          userId             Int
          user               User     @relation(fields: [userId], references: [id])
          criterionId        Int
          criterion          MasteryCriterion @relation(fields: [criterionId], references: [id])
          isMastered         Boolean  @default(false)
          masteredAt         DateTime?
          lastAttemptCorrect Boolean? // null: never answered, false: last was incorrect, true: last was correct
          masteringQuestionId Int?
          masteringQuestion  Question? @relation(fields: [masteringQuestionId], references: [id])

          @@unique([userId, criterionId])
        }
        ```

- [ ] **Task 2: Modify Existing Prisma Models (`src/db/prisma/schema.prisma`)**
    - *Sub-task 2.1:* Update `Question` model to link to `MasteryCriterion`.
    - *Sub-task 2.2:* Keep SR fields in `QuestionSet` model in case we use them later.
    - *Sub-tast 2.3:* Update `UserQuestionAnswer` model to link to primitives.
    - *Sub-task 2.4:* Update `InsightCatalyst`, and `ScheduledReview` models to allow optional linking to primitives.

- [ ] **Task 3: Database Migration**
    - *Sub-task 3.1:* Run `npx prisma migrate dev --name "feat_primitive_sr_schema"` to generate and apply the migration.
    - *Sub-task 3.2:* Verify the generated SQL migration for correctness and ensure the Prisma Client is regenerated (`npx prisma generate`).

- [ ] **Task 4: Develop Data Migration Script (`scripts/migrate-to-primitive-sr.ts`)**
    - *Sub-task 4.1:* Create a script that fetches all `QuestionSet`s with existing SR data (`isTracked = true`).
    - *Sub-task 4.2:* For each `QuestionSet`, create a corresponding `KnowledgePrimitive`.
    - *Sub-task 4.3:* For each `Question` within the set, create a `MasteryCriterion`.
    - *Sub-task 4.4:* Create a `UserPrimitiveProgress` record for each user.
    - *Sub-task 4.5:* Analyze `UserQuestionAnswer` history to populate `UserCriterionMastery` records.
    - *Sub-task 4.6:* Update foreign keys in `UserQuestionAnswer` and `ScheduledReview`.

- [ ] **Task 5: Write Tests for Migration Script**
    - *Sub-task 5.1:* Setup a test database with legacy data.
    - *Sub-task 5.2:* Run the migration script.
    - *Sub-task 5.3:* Assert correct data population in new models.
    - *Sub-task 5.4:* Assert correct foreign key relationships.

---

## Clarifications
What is an insight catalyst now linked to? A primitive? A question? Both.

## II. Agent's Implementation Summary & Notes
*(Agent will fill this section out as work is completed)*

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)
*(This section to be filled out upon sprint completion)*
