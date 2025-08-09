# Dependencies & Licensing

## Inventory
- To generate SBOM (CycloneDX) and list licenses

## Risk
- Express 5 in use; `fastify` declared but not used (candidate for removal)

## Findings
- ER-DEPS-001: Unused dependency `fastify`; license inventory not tracked in repo

## Recommendations
- Remove unused dependencies; add SBOM generation in CI; monitor CVEs

