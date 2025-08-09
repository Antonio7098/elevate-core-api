---
id: ER-PERF-002
area: Performance
severity: High
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-22
---

## Title
Multiple PrismaClient instances instantiated in controllers

## Context
- `src/controllers/questionset.controller.ts` and `src/controllers/primitiveSR.controller.ts` create new `PrismaClient()` instead of using `src/lib/prisma`.

## Impact
- Connection pool pressure, higher memory footprint, and potential event loop contention in high-traffic scenarios.

## Recommendation
- Use the shared Prisma client from `src/lib/prisma` everywhere. Guard it for hot-reload in dev if needed.

## Acceptance Criteria
- [ ] No `new PrismaClient()` in controllers/services (except a single factory)
- [ ] Load testing shows stable connection counts
