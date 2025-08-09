---
id: ER-SEC-003
area: Security
severity: Medium
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-29
---

## Title
Missing security headers and abuse controls

## Context
- No `helmet` middleware; CORS set to default `cors()`; no rate limiting or body size limits configured.

## Impact
- Increased exposure to clickjacking, MIME sniffing, CSRF surfaces, and abuse.

## Recommendation
- Add `helmet` with CSP tuned; define strict CORS origins; add `express-rate-limit`; set `express.json({ limit })` and `bodyParser` limits.

## Acceptance Criteria
- [ ] Helmet applied with HSTS, frameguard, noSniff, and CSP
- [ ] CORS restricted to approved origins
- [ ] Global rate limiter configured with per-route overrides
