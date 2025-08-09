---
id: ER-API-001
area: API
severity: High
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-29
links:
  - related: ./../13-risk-register.md#r-002
---

## Title
OpenAPI coverage limited to ai-rag endpoints

## Context
- `/api-docs` documents only ai-rag via Nest module; other Express routes lack OpenAPI definitions.

## Impact
- Consumers lack a single source of truth; hinders client generation, security testing, and governance.

## Recommendation
- Author OpenAPI for all Express routes; integrate generation into CI.
- Version the API (e.g., `/v1`) and publish docs.

## Acceptance Criteria
- [ ] OpenAPI spec includes all `/api/*` routes
- [ ] CI validates spec; docs published at `/api-docs`

