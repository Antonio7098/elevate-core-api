# Testing & Quality Engineering

## Pyramid (observed)
- Unit/integration/e2e tests present under `test/` and `src/__tests__/`

## Coverage & Gates
- Jest configured; coverage disabled; no explicit thresholds in CI documented here

## Test Data & Isolation
- Testcontainers dependency present; migration tests exist

## Findings
- ER-TEST-001: Coverage disabled; no enforced thresholds
- ER-TEST-002: Schema drift not covered by tests; several controllers reference non-existent fields (see ER-DATA-003)

## Recommendations
- Enable coverage with thresholds (global 75% initially), add JUnit reporter for CI
- Add contract tests for OpenAPI once spec unified
- Add regression tests for auth middleware behaviors (public paths, dev tokens)
- Add tests ensuring Prisma schema-field parity for key models (notes, questions, question sets)

