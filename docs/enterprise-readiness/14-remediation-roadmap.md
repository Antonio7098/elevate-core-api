# Remediation Roadmap

## Priority Matrix
Critical and High issues first; balance quick wins vs strategic refactors.

## Work Items (initial)
- ER-SEC-001 → Replace console logs; introduce Winston with redaction; remove header/body dumps. Owner: Backend. ETA: 2d
- ER-CODE-002 → Enable TS `noImplicitAny`, `strictNullChecks`; full `strict: true` by milestone. Owner: Backend. ETA: 1w
- ER-API-001 → Author OpenAPI for all Express routes; publish `/api-docs` v1. Owner: Backend. ETA: 1w
- ER-SEC-002 → Validate required env vars at startup; fail fast. Owner: Backend. ETA: 1d
- ER-OPS-002 → Add OpenTelemetry metrics/tracing baseline. Owner: Backend. ETA: 3d

## Tracking
Translate items to issues/epics with acceptance criteria and evidence links.

