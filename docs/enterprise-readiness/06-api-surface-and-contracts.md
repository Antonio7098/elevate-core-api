# API Surface & Contracts

## Inventory (initial)
- Express routers under `/api/*`: users, folders, ai, dashboard, todays-tasks, stats, notes, insight-catalysts, user memory, learning-blueprints, blueprints alias, chat, primitives, ai/primitives, ai-rag, questions

## Standards
- Swagger available only for ai-rag via temporary Nest app at `/api-docs`
- Error contract: global handler returns `{ message, error }` (500) in `app.ts`

## Findings
- ER-API-001: Majority of Express routes are not in OpenAPI; no single source of truth

## Recommendations
- Generate or author OpenAPI for all routes; serve versioned docs
- Ensure consistent error response schema; document pagination, filtering, and idempotency where applicable

