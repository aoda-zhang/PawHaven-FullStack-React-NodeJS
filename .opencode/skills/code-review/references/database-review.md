# Database Code Review Reference

Load only when the diff changes database schema/migrations, queries, indexes, persistence models, or data lifecycle.

## Review checklist

- Migration safety and existing-data compatibility: reversible, backfill, defaults
- Nullability / defaults: NOT NULL with default, partial indexes
- Uniqueness and foreign keys: constraint names, deferrable, cascading
- Transaction / atomicity expectations: isolation level, retry, deadlock handling
- Query cost: EXPLAIN, index usage, N+1, pagination, cursor vs offset
- Race conditions / idempotency: optimistic locking, upsert semantics, deduplication
- Deletion / retention semantics: soft delete, cascade, GDPR, archival
- Relevant missing, duplicate, and failure cases: constraint violations, timeouts, deadlocks

## Verification

Verify actual database/ORM conventions; TypeScript types alone do not establish production data shape.

## Canonical docs

- `docs/context/backend-architecture.md` (persistence section)
- `docs/context/backend-development-patterns.md` (database patterns)
