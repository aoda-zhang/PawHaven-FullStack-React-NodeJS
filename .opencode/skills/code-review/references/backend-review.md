# Backend Code Review Reference

Load when the diff affects backend code (NestJS services, APIs, authentication, persistence, service calls, or backend runtime configuration).

## Review checklist

- Request validation: DTOs, pipes, guards, and manual checks
- Auth / public-route intent: guards, decorators, JWT claims, role checks
- HTTP status and response envelopes: consistent shape, error codes, trace IDs
- Error normalization and trace IDs: exception filters, logging correlation
- Service calls and timeout/error mapping: circuit breakers, retries, fallback
- Configuration ownership: ConfigModule, env validation, secret handling
- Resource cleanup: connection pools, subscribers, interval/timer disposal
- Persistence consistency: transactions, isolation, optimistic locking, idempotency
- Observability: logs, metrics, traces, structured logging keys
- Regression coverage: unit, integration, contract tests for changed paths

## Canonical docs

- `docs/context/backend-architecture.md`
- `docs/context/backend-development-patterns.md`

Do not duplicate their rules here. Verify changed behavior from source and tests, not assumed framework defaults.

## Cross-reference

For changed producer-consumer contracts, also load `references/contract-review.md`.
