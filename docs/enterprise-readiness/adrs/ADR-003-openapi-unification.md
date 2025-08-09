# ADR-003: Unify API Documentation with OpenAPI
Date: 2025-08-08
Status: Proposed

## Context
Only ai-rag endpoints are documented via Nest Swagger; most Express routes lack OpenAPI.

## Decision
Create and maintain an OpenAPI spec covering all `/api/*` routes. Continue using Nest for ai-rag schema generation and merge specs or author manually for Express routes. Publish at `/api-docs`.

## Consequences
- Positive: discoverability, client generation, testing and governance.
- Negative: maintenance overhead.

## Alternatives Considered
- Per-route inline docs only: rejected (incomplete coverage).

## Links
- Related Finding: ER-API-001

