---
id: ER-SEC-006
area: Security
severity: Low
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-29
---

## Title
Brittle public path skip logic in auth middleware wrapper

## Context
- In `app.ts`, `publicPaths` matching uses `req.path.startsWith('/api/auth/')` inside a middleware mounted at `/api`, leading to mismatches. Current route order masks the issue.

## Impact
- Confusing behavior; risk of accidental exposure or denial if order changes.

## Recommendation
- Remove path-based skip logic; rely on explicit router placement for public endpoints or robust matcher using `req.originalUrl`.

## Acceptance Criteria
- [ ] Public route handling is explicit and tested
