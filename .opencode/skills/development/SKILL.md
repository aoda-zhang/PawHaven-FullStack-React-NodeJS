---
name: development
description: Implement code changes using canonical patterns for backend, frontend, or shared layers.
---

# Development

Load for implementing approved changes in backend (NestJS, APIs, auth, persistence), frontend (React, routing, state, UI), or shared contracts/schemas. Also load when review findings require code corrections.

## Required actions

1. Identify the target layer(s) from the approved change or from review findings: backend, frontend, shared contracts.
2. If review findings are provided as input, address each finding per canonical docs before proceeding with new implementation.
3. For each layer, load the corresponding reference under `references/` and follow its workflow.
4. Cross-layer changes (e.g., API + UI) must trace producer-consumer compatibility; load both references.
5. Report changed files, affected contracts/services, exact checks and results, and unverified runtime assumptions.

## Navigation

- `references/backend-development.md` — NestJS services, APIs, auth, persistence, service calls, runtime config
- `references/frontend-development.md` — React UI, routing, client state/data, UI packages, design tokens, i18n

## Boundary

This skill routes and guides implementation. It does not approve scope, make architectural decisions, or verify the result (use `verification` for that).
