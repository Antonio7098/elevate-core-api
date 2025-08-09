# ADR-002: Enable TypeScript Strict Mode (Staged)
Date: 2025-08-08
Status: Proposed

## Context
`strict: false` increases runtime risk. Enabling fully may require staged remediation.

## Decision
Enable `noImplicitAny`, `noImplicitThis`, `strictNullChecks` first; resolve violations; then switch to `strict: true`. Enforce in CI.

## Consequences
- Positive: fewer runtime bugs, better contracts.
- Negative: initial typing effort; possible refactors.

## Alternatives Considered
- Keep non-strict: rejected.

## Links
- Related Finding: ER-CODE-002

