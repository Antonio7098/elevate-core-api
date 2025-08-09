---
id: ER-SEC-001
area: Security
severity: High
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-22
links:
  - evidence: ./../assets/evidence/
  - related: ./../13-risk-register.md#r-001
---

## Title
PII exposure risk via request logging

## Context
- `src/app.ts` logs full request headers and body for every request.
- `src/middleware/auth.middleware.ts` logs Authorization header and other headers.

## Impact
- Tokens and PII may be written to logs, risking credential leakage and compliance violations.

## Recommendation
- Replace console logs with Winston and add redaction for sensitive fields (Authorization, cookies, tokens, emails, PII).
- Limit request/response logging to metadata; add correlation IDs.

## Acceptance Criteria
- [ ] No logs contain Authorization or request bodies with PII by default
- [ ] Logger utility with redaction and correlation IDs used across app
- [ ] Security review of logging config

