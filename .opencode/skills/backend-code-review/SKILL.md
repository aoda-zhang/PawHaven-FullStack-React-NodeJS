---
name: backend-code-review
description: Review NestJS services, API handlers, validation, errors, authentication, and service integration changes.
---

# Backend code review

Review changed backend behavior against `docs/context/backend-architecture.md` and `docs/context/backend-development-patterns.md` where relevant. Check request validation and schemas; auth/public-route intent and claims; HTTP status and response envelope behavior; error normalization and trace IDs; service-to-service calls and timeout/error handling; config ownership; resource cleanup; persistence consistency and failure branches; observability; and regression coverage. Confirm behavior from source/tests rather than assuming framework defaults. Shared/browser-visible contracts also require `contract-code-review`.

## Finding format

Severity (critical/high/medium/low); confidence; file and line; trigger/condition; evidence; impact; recommended fix; verification status or uncertainty.
