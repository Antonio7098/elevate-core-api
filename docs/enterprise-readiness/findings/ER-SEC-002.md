---
id: ER-SEC-002
area: Security
severity: High
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-22
links:
  - related: ./../13-risk-register.md#r-001
---

## Title
JWT secret handling uses non-null assertion; app should fail fast on missing secrets

## Context
- `src/middleware/auth.middleware.ts` verifies JWT with `process.env.JWT_SECRET!` (non-null assertion).
- Some utility code checks the secret, but middleware path can still run with undefined env in certain setups.

## Impact
- Runtime auth bypass or crashes; security misconfiguration may go unnoticed until runtime.

## Recommendation
- Add centralized config validation at boot that asserts required envs (JWT_SECRET, DB URL, AI keys) and exits process with clear error.
- Remove non-null assertions in security-critical code paths.

## Acceptance Criteria
- [ ] App refuses to start if `JWT_SECRET` is missing
- [ ] No non-null assertions on secrets in codebase
