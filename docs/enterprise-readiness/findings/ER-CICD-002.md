---
id: ER-CICD-002
area: CI/CD
severity: Medium
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-22
---

## Title
`tsconfig.json` has `noEmit: true`; production build artifacts not produced

## Context
- `build` script runs `tsc`, but `noEmit: true` prevents output. `start` uses `ts-node`.

## Impact
- No compiled JS for production; increases cold start and risk in prod.

## Recommendation
- Create a separate `tsconfig.build.json` without `noEmit`, emit to `dist/`, and run `node dist/server.js` in prod. Add CI build/test/publish pipeline.

## Acceptance Criteria
- [ ] Build produces `dist/` JS
- [ ] Prod start uses compiled JS
