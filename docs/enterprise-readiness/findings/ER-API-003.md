---
id: ER-API-003
area: API
severity: Medium
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-29
---

## Title
Inconsistent error response shapes and HTTP codes across controllers

## Context
- Some use `throw new Error` with `express-async-handler`, others return `{ message }` JSON directly.
- 404/403/401 vary; 500 often returns generic message. Deprecations use 410 in ai.controller but inconsistent elsewhere.

## Impact
- Hard for clients to handle errors; less testable and predictable.

## Recommendation
- Centralize error handling with a typed error class hierarchy; standardize error contract `{ statusCode, code, message, details }`.
- Document in OpenAPI and enforce in middleware.

## Acceptance Criteria
- [ ] Error contract documented and enforced in middleware
- [ ] Controllers use typed errors; tests updated
