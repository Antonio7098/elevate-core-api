# Security Assessment

## Focus Areas
- AuthN/AuthZ: JWT verification in middleware; dev test token with header override
- Input validation: mix of `express-validator` and `class-validator` middleware
- Secrets: `.env` load; JWT secret non-null asserted
- Transport/headers: not enforced at app level; to be configured at proxy/ingress
- Dependency risk: to review; SBOM planned

## Findings
- ER-SEC-001: Request logging prints headers and bodies (PII/token exposure risk)
- ER-SEC-002: `jwt.verify` uses non-null assertion for `JWT_SECRET`; startup should fail fast if missing
- ER-SEC-003: No security headers middleware (HSTS, CSP, frameguard, etc.) detected

## Recommendations
- Sanitize logs, never log Authorization; add redaction helper
- Validate required env vars at startup; fail if `JWT_SECRET` missing
- Add `helmet`, rate limiting, and request size limits; define CORS policy explicitly

