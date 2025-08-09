# ADR-001: Centralized Logging with Redaction and Correlation IDs
Date: 2025-08-08
Status: Proposed

## Context
Console logging prints headers and bodies, risking PII/token exposure. Winston exists but is inconsistently used; no correlation IDs.

## Decision
Adopt Winston as the single logger with: structured JSON, request-scoped correlation IDs, and redaction of sensitive fields (Authorization, cookies, tokens, emails, PII markers). Replace console calls across the app.

## Consequences
- Positive: safer logs, better observability, easier incident response.
- Negative: small runtime overhead; initial refactor effort.

## Alternatives Considered
- Keep console logs + grep: rejected (risk remains).
- Third-party APM only: insufficient without baseline hygiene.

## Links
- Related Finding: ER-SEC-001

