---
id: ER-OPS-001
area: Ops
severity: Medium
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-29
---

## Title
No correlation IDs and inconsistent structured logging

## Context
- Winston configured but console logs widely used; no request ID propagation.

## Impact
- Difficult incident triage and tracing across services.

## Recommendation
- Add middleware to generate/propagate correlation IDs; use Winston across app; include request metadata and redaction.

## Acceptance Criteria
- [ ] All logs structured with correlation IDs
