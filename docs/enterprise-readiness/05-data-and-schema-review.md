# Data & Schema Review

## Model Overview
- Prisma schema at `src/db/prisma/schema.prisma`; multiple migrations present
- Classification of PII to be completed; identify tables/columns with user data

## Lifecycle
- Migrations checked in; backup/restore and rollback procedures to document

## Security
- At-rest encryption is DB-managed; app-level encryption not present

## Findings
- ER-DATA-001: PII inventory and retention policy not documented in repo

