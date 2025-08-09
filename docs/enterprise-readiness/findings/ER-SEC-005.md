---
id: ER-SEC-005
area: Security
severity: Medium
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-22
---

## Title
CORS is open by default

## Context
- `app.use(cors())` with no origin restriction.

## Impact
- Increases risk of unintended cross-origin access.

## Recommendation
- Restrict CORS to trusted origins; vary by environment.

## Acceptance Criteria
- [ ] CORS configured with explicit origin allowlist
