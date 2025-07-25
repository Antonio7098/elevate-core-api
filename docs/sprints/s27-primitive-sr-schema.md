# Sprint 27: Primitive-Centric SR - Schema and Migration

**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Database Schema & Data Migration
**Overview:** This sprint focuses on implementing the foundational database schema changes required to transition from a `QuestionSet`-based spaced repetition system to a `KnowledgePrimitive`-centric one. It includes creating four new models, modifying several existing ones to support the new system, and developing a data migration script to transition existing SR data to the new structure.

---

## I. Planned Tasks & To-Do List

- [ ] **Task 1: Implement New Prisma Models (`src/db/prisma/schema.prisma`)**
    - *Sub-task 1.1:* Create `KnowledgePrimitive` model. This will be the atomic unit of knowledge.
        ```prisma
        model KnowledgePrimitive {
          id        Int      @id @default(autoincrement())
          userId    Int
          user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
          // Fields to define the primitive itself, e.g., title, content
          isTracking      Boolean  @default(true)
          masteryCriteria MasteryCriterion[]
          progress        UserPrimitiveProgress[]
          createdAt DateTime @default(now())
          updatedAt DateTime @updatedAt
        }
        ```
    - *Sub-task 1.2:* Create `MasteryCriterion` model. This defines what it means to master a primitive.
        ```prisma
        model MasteryCriterion {
          id          Int      @id @default(autoincrement())
          userId      Int
          user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
          primitiveId Int
          primitive   KnowledgePrimitive @relation(fields: [primitiveId], references: [id])
          description String
          ueeLevel    String   // "Understand", "Use", or "Explore"
          questions   Question[]
          mastery     UserCriterionMastery[]
          createdAt DateTime @default(now())
          updatedAt DateTime @updatedAt
        }
        ```
    - *Sub-task 1.3:* Create `UserPrimitiveProgress` model. This tracks a user's SR progress on a primitive.
        ```prisma
        model UserPrimitiveProgress {
          id        Int      @id @default(autoincrement())
          userId    Int
          user      User     @relation(fields: [userId], references: [id])
          primitiveId Int
          primitive   KnowledgePrimitive @relation(fields: [primitiveId], references: [id])
          currentUeeLevel String   @default("Understand")
          nextReviewAt    DateTime?
          lastReviewedAt  DateTime?
          currentIntervalStep Int @default(0)
          consecutiveFailures Int @default(0)
          answeredQuestionId Int?
          answeredQuestion   Question? @relation(fields: [answeredQuestionId], references: [id])
          @@unique([userId, primitiveId])
        }
        ```
    - *Sub-task 1.4:* Create `UserCriterionMastery` model. This tracks mastery of individual criteria.
        ```prisma
        model UserCriterionMastery {
          id              Int      @id @default(autoincrement())
          userId          Int
          user            User     @relation(fields: [userId], references: [id])
          criterionId     Int
          criterion       MasteryCriterion @relation(fields: [criterionId], references: [id])
          isMastered      Boolean  @default(false)
          masteredAt      DateTime?
          masteringQuestionId Int?
          masteringQuestion Question? @relation(fields: [masteringQuestionId], references: [id])
          @@unique([userId, criterionId])
        }
        ```

- [ ] **Task 2: Modify Existing Prisma Models (`src/db/prisma/schema.prisma`)**
    - *Sub-task 2.1:* Update `Question` model to link to `MasteryCriterion`.
        - Add `masteryCriterionId: Int?` and `masteryCriterion: MasteryCriterion? @relation(...)`.
        - Remove `uueFocus`.
    - *Sub-task 2.2:* Deprecate SR fields in `QuestionSet` model.
        - Remove all SR-related fields: `nextReviewAt`, `lastReviewedAt`, `srStage`, `easeFactor`, `lapses`, `trackingMode`, `isTracked`, etc.
    - *Sub-task 2.3:* Update `UserQuestionAnswer` model to link to primitives.
        - Add `primitiveId: Int?` and `masteryCriterionId: Int?`.
        - Make `questionSetId` optional.
    - *Sub-task 2.4:* Update `Note`, `InsightCatalyst`, and `ScheduledReview` models to allow optional linking to primitives.
        - Add `primitiveId: Int?` to each.
        - Make `questionSetId` optional where applicable.

- [ ] **Task 3: Database Migration**
    - *Sub-task 3.1:* Run `npx prisma migrate dev --name "feat_primitive_sr_schema"` to generate and apply the migration.
    - *Sub-task 3.2:* Verify the generated SQL migration for correctness and ensure the Prisma Client is regenerated (`npx prisma generate`).

- [ ] **Task 4: Develop Data Migration Script (`scripts/migrate-to-primitive-sr.ts`)**
    - *Sub-task 4.1:* Create a script that fetches all `QuestionSet`s with existing SR data (`isTracked = true`).
    - *Sub-task 4.2:* For each `QuestionSet`, create a corresponding `KnowledgePrimitive`.
    - *Sub-task 4.3:* For each `Question` within the set, create a `MasteryCriterion`, mapping the old `uueFocus` to the new `ueeLevel`.
    - *Sub-task 4.4:* Create a `UserPrimitiveProgress` record for each user, migrating `nextReviewAt`, `lastReviewedAt`, `srStage`, etc., from the `QuestionSet`.
    - *Sub-task 4.5:* Analyze `UserQuestionAnswer` history to populate `UserCriterionMastery` records.
    - *Sub-task 4.6:* Update foreign keys in `UserQuestionAnswer` and `ScheduledReview` to point to the new primitive/criterion records.

- [ ] **Task 5: Write Tests for Migration Script**
    - *Sub-task 5.1:* Create a test setup with a dedicated test database seeded with legacy `QuestionSet`-based SR data.
    - *Sub-task 5.2:* Write a test that executes the migration script against the test database.
    - *Sub-task 5.3:* Assert that the new `KnowledgePrimitive`, `MasteryCriterion`, `UserPrimitiveProgress`, and `UserCriterionMastery` tables are populated with the correct data.
    - *Sub-task 5.4:* Assert that relationships and foreign keys are correctly updated.

---

## II. Agent's Implementation Summary & Notes
*(Agent will fill this section out as work is completed)*

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)
*(This section to be filled out upon sprint completion)*
