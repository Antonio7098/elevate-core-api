---
id: ER-DATA-003
area: Data
severity: Medium
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-29
---

## Title
Schema drift: controllers reference fields removed or differing from Prisma models

## Context
- Several controllers/services reference fields like `Question.uueFocus`, `Question.totalMarksAvailable`, `QuestionSet.name/currentUUESetStage/currentTotalMasteryScore`, `UserStudySession.timeSpentSeconds`, which are not present in current Prisma models (fields renamed or removed in migrations).

## Impact
- Runtime errors or logic inconsistencies; hard to maintain and test.

## Recommendation
- Run a repository-wide audit mapping code references to Prisma schema. Update code to match schema or reintroduce fields via migration as needed. Add compile-time DTOs and repository layer to encapsulate schema.

## Acceptance Criteria
- [ ] No TypeScript references to non-existent Prisma fields
- [ ] Tests cover critical model interactions
