---
id: ER-CODE-002
area: Code
severity: Medium
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-29
links:
  - related: ./../13-risk-register.md#r-003
---

## Title
TypeScript strict mode disabled

## Context
- `tsconfig.json` has `strict: false`; potential for implicit any, null/undefined bugs.

## Impact
- Increased runtime error risk; weaker type safety and maintainability.

## Recommendation
- Enable `noImplicitAny`, `noImplicitThis`, `strictNullChecks` first; then `strict: true`.
- Address violations incrementally with clear owners.

## Acceptance Criteria
- [ ] CI enforces strict mode (or staged subset) with zero new violations
- [ ] Existing violations tracked and resolved

