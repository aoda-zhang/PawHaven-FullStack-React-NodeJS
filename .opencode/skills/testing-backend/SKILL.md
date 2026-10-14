---
name: testing-backend
description: Verify backend services, APIs, authentication, persistence, shared contracts, and service integration.
---

# Backend verification

Load for backend, API, shared-contract, or service integration changes. Inspect the affected service's actual scripts and test conventions before choosing checks.

## Choose the appropriate checks

- **Business logic:** unit tests for validation, transformations, authorization decisions, and failure branches.
- **HTTP/API behaviour:** integration tests for routes, status codes, request validation, response shape, and error mapping.
- **Authentication and permissions:** verify both permitted and denied requests, token/claims expectations, and service-to-service boundaries when affected.
- **Persistence:** verify reads/writes, transaction or consistency expectations, duplicate/missing records, and failure handling.
- **Shared contracts:** verify producers and consumers agree at runtime where possible. Typechecking alone does not prove payload/schema compatibility.
- **Cross-service changes:** check the direct service and relevant consumers; include integration/contract evidence when a shared boundary changes.
- **Configuration, dependency, build, or deployment changes:** inspect runtime entry points and deployment assumptions. Use the higher verification mode when blast radius is broad.

## Commands

Inspect root and package package.json files. Prefer affected-service tests and typechecks first, then the broader checks required by the mode selected by Tester. Never invent a script or infer that a check passed because it was skipped.

## Report

Capture exact commands, exit codes, relevant output, and any unavailable environment dependencies. Separate product failures from infrastructure failures only when the evidence supports the distinction. Do not modify tests or application code during verification.
