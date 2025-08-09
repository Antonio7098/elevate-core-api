# Sprint 27: Primitive-Centric SR - Schema and Migration

**Date Range:** [Start Date] - [End Date]
**Primary Focus:** Core API - Database Schema & Data Migration
**Overview:** This sprint focuses on implementing the foundational database schema changes required to transition from a `QuestionSet`-based spaced repetition system to a `KnowledgePrimitive`-centric one. It includes creating four new models, modifying several existing ones to support the new system, and developing a data migration script to transition existing SR data to the new structure.

---

## I. Planned Tasks & To-Do List

- [x] **Task 1: Implement New Prisma Models (`src/db/prisma/schema.prisma`)** *(models & enums implemented and migrated)*
    - *Sub-task 1.1:* Create `KnowledgePrimitive` model.
        ```prisma
        model KnowledgePrimitive {
          id          Int      @id @default(autoincrement())
          userId      Int
          user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
          title       String
          description String
          isTracking  Boolean  @default(false)
          trackingIntensity TrackingIntensity @default(NORMAL)
          
          // ... other fields ...
        }

        enum TrackingIntensity {
          DENSE   // More frequent reviews (0.75× standard interval)
          NORMAL  // Standard review frequency (1×)
          SPARSE  // Less frequent reviews (1.5× standard interval)
        }
        ```
    - *Sub-task 1.2:* Create `MasteryCriterion` model with weighted progression support.
        ```prisma
        model MasteryCriterion {
          id          Int      @id @default(autoincrement())
          userId      Int
          user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
          primitiveId Int
          primitive   KnowledgePrimitive @relation(fields: [primitiveId], references: [id])
          
          description String   // e.g., "Can state the definition of Photosynthesis"
          ueeLevel    String   // "Understand", "Use", or "Explore"
          weight      Int      @default(3) // 1-5 scale (5 = most critical for progression)
          difficulty  Int      @default(2) // 1-3 scale (3 = hardest to master)
          
          questions   Question[] // Questions that test this criterion
          mastery     UserCriterionMastery[]
          
          createdAt DateTime @default(now())
          updatedAt DateTime @updatedAt
        }
        ```
    - *Sub-task 1.3:* Create `UserPrimitiveProgress` model.
        ```prisma
        model UserPrimitiveProgress {
          id               Int      @id @default(autoincrement())
          userId           Int
          user             User     @relation(fields: [userId], references: [id])
          primitiveId      Int
          primitive        KnowledgePrimitive @relation(fields: [primitiveId], references: [id])
          currentUeeLevel  String
          nextReviewAt     DateTime?
          lastReviewAt     DateTime?
          lastAnswerCorrect Boolean? // null: never answered, false: last was incorrect, true: last was correct
          lastAnswerAt     DateTime?
          streak           Int      @default(0)
          totalReviews     Int      @default(0)
          totalCorrect     Int      @default(0)
          totalIncorrect   Int      @default(0)
          totalSkipped     Int      @default(0)
          totalPostponed   Int      @default(0)
          totalDismissed   Int      @default(0)
          totalRescheduled Int      @default(0)
          totalDue         Int      @default(0)
          totalOverdue     Int      @default(0)
          totalMastery     Int      @default(0)
          totalWeight      Int      @default(0)
          weightedMasteryScore Float    // Pre-calculated weighted mastery
          canProgressToNext Boolean  // Pre-calculated progression eligibility
          lastCalculated    DateTime @default(now())
          
          @@unique([userId, primitiveId])
          @@index([userId, nextReviewAt])  // Critical for daily tasks query
          @@index([userId, weightedMasteryScore]) // For progress tracking
        }
        ```
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
    - *Sub-task 1.5:* Create `PinnedReview` model.
        ```prisma
        model PinnedReview {
          id          Int      @id @default(autoincrement())
          userId      Int
          user        User     @relation(fields: [userId], references: [id])
          primitiveId Int
          primitive   KnowledgePrimitive @relation(fields: [primitiveId], references: [id])
          reviewAt    DateTime
          createdAt   DateTime @default(now())
          updatedAt   DateTime @updatedAt

          @@unique([userId, primitiveId])
        }
        ```
    - *Sub-task 1.6:* Create clean PinnedReview model after UserCriterionMastery
        ```prisma
        }
        ```
    - [ ] **Task 2: Modify Existing Prisma Models (`src/db/prisma/schema.prisma`)**
    - *Sub-task 2.1:* Update `Question` model to link to `MasteryCriterion`.
    - *Sub-task 2.2:* Keep SR fields in `QuestionSet` model in case we use them later.
    - *Sub-tast 2.3:* Update `UserQuestionAnswer` model to link to primitives.
    - *Sub-task 2.4:* Update `InsightCatalyst`, and `ScheduledReview` models to allow optional linking to primitives.

- [x] **Task 3: Database Migration** *(initial migrations completed)*
    - [x] *Sub-task 3.1:* Generated and applied prisma migration.
    - [x] *Sub-task 3.2:* Verified SQL, regenerated Prisma Client.

- [x] **Task 4: Update create_test_user** *(script enhanced with rich primitive SR seeding)*
    - [x] *Sub-task 4.1:* Create a `KnowledgePrimitive` for each tracked `QuestionSet` (`isTracked = true`).
    - [x] *Sub-task 4.2:* Create a `MasteryCriterion` for each `Question` within the set.
    - [x] *Sub-task 4.3:* Create a `UserPrimitiveProgress` record for each user.
    - [x] *Sub-task 4.4:* Populate `UserCriterionMastery` stubs analysing historical answers.
    - [x] *Sub-task 4.5:* Update foreign keys in `UserQuestionAnswer` and `ScheduledReview`.

- [x] **Task 5: Data Migration Tests** *(N/A – decided to reset DB rather than migrate legacy data)*
    - *Note:* Existing legacy data will be discarded during environment reset. Migration tests are no longer required.

- [ ] **Task 6: Performance Optimization Schema Additions**
    - *Sub-task 6.1:* Create `UserPrimitiveDailySummary` model for denormalized daily task queries.
        ```prisma
        model UserPrimitiveDailySummary {
          id                    Int      @id @default(autoincrement())
          userId                Int
          primitiveId           Int
          primitiveTitle        String
          currentUeeLevel       String
          nextReviewAt          DateTime?
          totalCriteria         Int
          masteredCriteria      Int
          totalWeight           Int
          masteredWeight        Int
          weightedMasteryScore  Float    // Pre-calculated weighted mastery
          canProgressToNext     Boolean  // Pre-calculated progression eligibility
          lastCalculated        DateTime @default(now())
          
          @@unique([userId, primitiveId])
          @@index([userId, nextReviewAt])  // Critical for daily tasks query
          @@index([userId, weightedMasteryScore]) // For progress tracking
        }
        ```
    - *Sub-task 6.2:* Add essential database indexes for performance optimization.
        ```sql
        -- Critical indexes for daily task generation
        CREATE INDEX idx_primitive_progress_due ON UserPrimitiveProgress(userId, nextReviewAt, currentUeeLevel);
        CREATE INDEX idx_criterion_mastery_lookup ON UserCriterionMastery(userId, criterionId, isMastered);
        CREATE INDEX idx_primitive_tracking ON KnowledgePrimitive(userId, isTracking);
        ```
    - *Sub-task 6.3:* Create triggers or stored procedures to maintain denormalized summary data.

- [x] **Task 7: Enhanced Tracking Intensity Schema** *(enum updated, fields added, migrated)*
    - *Sub-task 7.1:* Replace legacy `LOW`/`NORMAL`/`HIGH` enum with the new `DENSE`/`NORMAL`/`SPARSE` values.
    - *Sub-task 7.2:* Add `trackingIntensity` field to `KnowledgePrimitive` with default `NORMAL`.
    - *Sub-task 7.3:* Add `trackingIntensity` snapshot field to `UserPrimitiveProgress` to capture the setting at review time.
    - *Sub-task 7.4:* Generate a Prisma migration that updates existing rows, defaulting all primitives to `NORMAL`.
    - *Sub-task 7.5:* Create an index on `(userId, trackingIntensity)` in `KnowledgePrimitive` for faster bucket queries.
    - *Sub-task 7.6:* Document update logic in the data-migration script so historical primitives receive an appropriate intensity based on past review frequency.

- [x] **Task 8: User Bucket Preferences Model** *(model added & migrated)*
    - *Sub-task 8.1:* Create `UserBucketPreferences` model.
        ```prisma
        model UserBucketPreferences {
          id              Int      @id @default(autoincrement())
          userId          Int      @unique
          user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
          
          criticalSize    Int      @default(10)
          coreSize        Int      @default(15)
          plusSize        Int      @default(5)
          
          addMoreIncrement Int     @default(5)
          maxDailyLimit   Int      @default(50)
          
          surveyThreshold Int      @default(60)
          proficientThreshold Int  @default(80)
          expertThreshold  Int     @default(95)
          
          createdAt       DateTime @default(now())
          updatedAt       DateTime @updatedAt
        }
        ```

- [x] **Task 9: Mastery Threshold Level Integration** *(enum added, integrated in service)*
    - *Sub-task 9.1:* Introduce `MasteryThresholdLevel` enum with values `SURVEY (60%)`, `PROFICIENT (80%)`, and `EXPERT (95%)`.
    - *Sub-task 9.2:* Add `masteryThresholdLevel` field to `UserBucketPreferences`, defaulting to `PROFICIENT`.
    - *Sub-task 9.3:* Update algorithms to reference the enum when checking U→U→E progression eligibility.
    - *Sub-task 9.4:* Expose this preference via `GET/PATCH /api/user/bucket-preferences`.
    - *Sub-task 9.5:* Include unit tests covering different threshold selections and progression behaviour.

---

## Clarifications

## II. Agent's Implementation Summary & Notes

- All schema changes for primitive-centric SR are now implemented and migrated (migration `20250729055201_s27_primitive_sr_additions`).
- Added `PinnedReview`, `UserBucketPreferences`; updated `TrackingIntensity` & `MasteryThresholdLevel` enums; added relation fields.
- Prisma Client regenerated; DB reset and synced successfully.
- Next sprint items: Task 2 FK updates, Task 3–6 data migration & tests, Task 9 API integration.
- Rich seeding now includes tracked sets, primitives, criteria, progress, mastery, and linked FKs.

---

## III. Overall Sprint Summary & Review (To be filled out by Antonio)
*(This section to be filled out upon sprint completion)*
