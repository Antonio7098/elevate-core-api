---
id: ER-DEVEX-001
area: CI/CD
severity: Low
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-29
---

## Title
Configuration env var naming inconsistency (AI API)

## Context
- `src/config.ts` uses `AI_SERVICE_*` keys; `AIAPIClientService` uses `AI_API_*`.

## Impact
- Misconfiguration risk across environments.

## Recommendation
- Standardize env var names; deprecate aliases with clear migration notes.

## Acceptance Criteria
- [ ] Single canonical env var naming for AI API config documented and enforced
