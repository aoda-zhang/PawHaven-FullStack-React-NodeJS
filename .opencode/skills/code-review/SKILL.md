---
name: code-review
description: Review code changes for correctness, regressions, and risks across backend, frontend, database, contracts, security, and infrastructure layers.
---

# Code Review

Load when a diff requires review for correctness, regressions, or risk assessment. The review scope determines which layer-specific reference to follow.

## Required actions

1. Identify the changed layers from the diff: backend/API, frontend/UI, database/schema, shared contracts, security boundaries, infrastructure/CI-CD.
2. For each affected layer, load the corresponding reference under `references/` and follow its checklist.
3. Cross-layer concerns (e.g., contract changes touching both producer and consumer) must be traced end-to-end; load multiple references as needed.
4. Report findings using the finding format defined by the Reviewer agent. Each finding cites the reference rule and the exact diff location.

## Navigation

- `references/backend-review.md` — NestJS services, APIs, auth, persistence, service calls, runtime config
- `references/contract-review.md` — API payloads, shared schemas/types, serialization, producer-consumer boundaries
- `references/database-review.md` — Schema, migrations, queries, indexes, persistence models, data lifecycle
- `references/frontend-review.md` — React UI, routing, state, accessibility, i18n, design system, responsive behavior
- `references/security-review.md` — Identity, authorization, secrets, untrusted data, trust boundaries, injection, SSRF
- `references/infrastructure-review.md` — CI/CD, deployment, build, runtime config, env wiring, secrets, rollback

## Boundary

This skill routes and aggregates reviews. It does not implement fixes, make architectural decisions, or approve merges. The Reviewer agent owns the final verdict.
