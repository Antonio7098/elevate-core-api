# Checklist: Security

- [ ] JWT validation and token rotation policies documented
- [ ] Authorization checks on all protected routes
- [ ] Input validation (DTOs) applied to all endpoints
- [ ] Secrets not in repo; runtime injection; rotation policy
- [ ] Security headers (`helmet`), CORS policy defined
- [ ] Abuse controls: rate limiting, IP throttling, brute-force protection
- [ ] Scanning: SAST, SCA, secret scanning in CI; SBOM generated
- [ ] Threat model documented; top risks tracked in risk register

