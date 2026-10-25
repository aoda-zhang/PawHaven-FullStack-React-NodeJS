---
name: backend-development
description: Implement backend changes using PawHaven's canonical backend patterns.
---

# Backend Development

Load for NestJS services, APIs, authentication, persistence, service calls, or backend runtime configuration.

## Required actions

1. Read relevant sections of `docs/context/backend-architecture.md` and `docs/context/backend-development-patterns.md`. These documents own architecture and implementation rules; do not duplicate them here.
2. Implement only the approved change. If a required decision is not covered by the canonical docs, choose the smallest evidence-based addition and report it.
3. For browser-facing payloads or shared schemas/types, trace the producer and consumers and read the corresponding frontend patterns.
4. Treat auth, persistence, cross-service calls, deployment, and configuration changes as high-risk; select verification accordingly.
5. Inspect actual package scripts before choosing checks. Do not invent commands or test infrastructure.
6. Hand off changed files, affected contracts/services, exact checks and results, and unverified runtime assumptions.
