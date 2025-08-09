# Code Quality & Maintainability

## Standards
- TypeScript config: `strict: false` (needs a plan to enable). ESLint/Prettier not yet confirmed in repo.
- Centralized error class exists (`utils/errorHandler.ts`), global error handler implemented in `app.ts`.

## Findings
- ER-CODE-001: Excessive console logging including headers/body (PII risk)
- ER-CODE-002: TypeScript strict mode disabled; risk of runtime issues

## Metrics (initial)
- Coverage reporting disabled in `jest.config.js` (collectCoverage: false)

## Recommendations
- Introduce ESLint + Prettier with strict rules; enable TS strict incrementally
- Replace console logs with Winston logger; add field redaction and correlation IDs
- Adopt module boundaries and DTO validation across all routes consistently

