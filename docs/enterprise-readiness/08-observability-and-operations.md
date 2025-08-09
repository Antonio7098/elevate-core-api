# Observability & Operations

## Logging, Metrics, Tracing
- Winston configured but not consistently used; heavy console logging including sensitive fields
- No metrics/tracing wiring detected

## Health & Readiness
- `/health` and `/ping` endpoints; graceful shutdown for AI client

## SLOs & Alerts
- Not documented

## Runbooks
- To be added under `./templates/runbook.md`

## Findings
- ER-OPS-001: No correlation IDs/structured logging adoption across app
- ER-OPS-002: No metrics/tracing; add OpenTelemetry or equivalent

