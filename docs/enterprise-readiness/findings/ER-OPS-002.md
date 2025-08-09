---
id: ER-OPS-002
area: Ops
severity: Medium
status: Open
owner: Backend
created: 2025-08-08
due: 2025-08-29
---

## Title
No metrics/tracing instrumentation

## Context
- No OpenTelemetry or metrics library integration observed.

## Impact
- Limited visibility into performance and errors; harder SLO compliance.

## Recommendation
- Add OpenTelemetry SDK for HTTP/Prisma; export traces/metrics; define minimal RED metrics.

## Acceptance Criteria
- [ ] Metrics and traces exported in non-prod env; dashboards linked
