---
id: ER-API-002
area: API
severity: Medium
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-29
---

## Title
Inconsistent request validation across routes

## Context
- Mix of `express-validator` (folders, auth) and `class-validator` (ai-rag). Some routes validate params manually in controllers.

## Impact
- Drift and gaps in input validation; inconsistent error contracts.

## Recommendation
- Standardize validation: prefer `class-validator` + DTOs or uniformly use `express-validator` with shared schemas. Ensure consistent 4xx error shape.

## Acceptance Criteria
- [ ] All routes covered by validation middleware
- [ ] Unified error response format documented and enforced
