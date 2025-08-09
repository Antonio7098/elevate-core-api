---
id: ER-PERF-003
area: Performance
severity: Medium
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-22
---

## Title
Heavy console logging (headers/bodies) on every request impacts performance

## Context
- `app.ts` logs full headers and body for all requests; several controllers log verbose payloads.

## Impact
- Increased CPU/IO, larger log volumes, potential latency spikes under load.

## Recommendation
- Use structured logger with log levels; disable verbose logs in prod; sample logs; avoid body dumps.

## Acceptance Criteria
- [ ] Default log level info; debug only in non-prod
- [ ] No request body logs by default
