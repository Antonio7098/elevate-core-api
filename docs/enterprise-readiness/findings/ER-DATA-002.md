---
id: ER-DATA-002
area: Data
severity: Medium
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-29
---

## Title
`Note.content` stored as String while controllers treat it as JSON object

## Context
- Prisma `Note.content` is `String`.
- Validation in `validateNoteCreate` requires `content` to be an object.

## Impact
- Serialization drift; harder querying; potential data inconsistencies.

## Recommendation
- Migrate `Note.content` to `Json` in Prisma; or explicitly serialize/deserialize with clear typing and validators.

## Acceptance Criteria
- [ ] Schema and code aligned on content type
- [ ] Migration script created and tested
