---
name: testing-backend
description: Choose backend-specific checks for APIs, services, persistence, auth, and shared contracts.
---

# Backend Verification

Load for backend, API, shared-contract, persistence, or service-integration changes. Use `verify` for shared check-selection, evidence, and status rules.

## Backend-specific checks

- Business logic: validation, transformations, authorization decisions, and failure branches.
- HTTP/API: route behavior, status codes, request validation, response shape, and error mapping.
- Authentication: permitted and denied paths, claims, token expectations, and service-to-service boundaries.
- Persistence: reads/writes, transaction or consistency behavior, duplicate/missing records, and failure handling.
- Shared contracts: producer-consumer compatibility at runtime where possible; typechecking alone is insufficient.
- Cross-service changes: test the direct service and relevant consumers.
- Configuration/dependency/deployment changes: inspect entry points and deployment assumptions; raise verification depth when blast radius is broad.

Inspect actual package scripts and test conventions before choosing commands. Report exact commands, exit codes, evidence, and unavailable dependencies. Do not modify application code or tests during verification.
