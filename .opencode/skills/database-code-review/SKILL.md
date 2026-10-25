---
name: database-code-review
description: Review schema, migration, query, index, and data-lifecycle changes.
---

# Database Code Review

Load only when the diff changes database schema/migrations, queries, indexes, persistence models, or data lifecycle.

Check migration safety and existing-data compatibility; nullability/defaults; uniqueness and foreign keys; transaction/atomicity expectations; query cost; race conditions/idempotency; deletion/retention semantics; and relevant missing, duplicate, and failure cases. Verify actual database/ORM conventions; TypeScript types alone do not establish production data shape.

Use the finding format defined by the Reviewer agent.
