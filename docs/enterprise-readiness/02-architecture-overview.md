# Architecture Overview

## Current State
- Runtime: Node.js with Express 5 (TypeScript)
- Swagger/OpenAPI: NestJS temporary app used to generate docs for `ai-rag` only
- Persistence: Prisma ORM (`@prisma/client`) targeting PostgreSQL (migrations present)
- Configuration: `dotenv`; `src/config.ts` exposes `aiService` properties
- Auth: JWT bearer in `src/middleware/auth.middleware.ts`, with dev test token path
- Services: AI API client (`src/services/ai-api-client.service.ts`), RAG service/controllers
- Logging: Winston configured (`src/utils/logger.ts`) but console logging used widely
- Caching: `node-cache` middleware for selective in-memory response caching
- Process: Graceful shutdown hooks for AI client (SIGINT/SIGTERM)

## External Dependencies
- AI service: base URL, API key, version via env (see `src/config.ts`)
- JWT secret via `JWT_SECRET`

## Diagrams (placeholders)
- Context, Container, Component diagrams to be added under `./assets/diagrams/`

## Boundaries & Ownership
- Express route modules under `src/routes/*` and controllers in `src/controllers/*`
- RAG endpoints documented and decorated under `src/ai-rag/*`

