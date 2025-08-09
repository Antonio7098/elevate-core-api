---
id: ER-SEC-004
area: Security
severity: High
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-22
---

## Title
AI client uses default API key and logs sensitive payloads

## Context
- `AIAPIClientService` defaults `AI_API_KEY` to `test_api_key_123` and logs request payloads (including blueprint content).

## Impact
- Potential secret misuse in prod; leakage of sensitive content to logs.

## Recommendation
- Require `AI_API_KEY` via config validation; remove verbose payload logs or redact.

## Acceptance Criteria
- [ ] App fails to start without AI API key in prod
- [ ] No verbose payload logs in production level
