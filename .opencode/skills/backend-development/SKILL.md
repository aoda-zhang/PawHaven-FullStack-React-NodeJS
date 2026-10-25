---
name: backend-development
description: Implement NestJS services, APIs, authentication, persistence, and backend integration using PawHaven's canonical patterns.
---

# Backend development entry point

Use for backend services, HTTP/API behavior, authentication, persistence, service calls, or backend runtime configuration.

1. Read `docs/context/backend-architecture.md` for ownership/dependency direction and `docs/context/backend-development-patterns.md` for implementation rules. Read relevant sections only.
2. If browser-facing payloads, shared Zod schemas, or types change, read corresponding frontend patterns and trace both producers and consumers. Do not duplicate shared contracts.
3. Preserve NestJS conventions, Zod validation, status constants, response interceptors, service-client boundaries, and trace propagation as applicable.
4. Treat auth, persistence, cross-service, deployment, and configuration changes as high-risk until evidence establishes otherwise.
5. Add/update tests only within approved scope. Inspect actual package scripts and test conventions before choosing checks.
6. Hand off changed files, API/contract behavior, checks, and unverified runtime assumptions.
