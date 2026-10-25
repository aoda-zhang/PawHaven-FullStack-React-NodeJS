---
name: database-code-review
description: Review database schema, migrations, persistence queries, indexes, consistency, and data lifecycle changes.
---

# Database code review

Load only when the diff changes schema/migrations, queries, indexes, persistence models, or data lifecycle. Check migration safety; existing-data compatibility; nullability/defaults; uniqueness and foreign keys; transaction/atomicity expectations; query cost; race conditions/idempotency; deletion/retention semantics; and tests for missing, duplicate, and failure cases. Confirm actual database/ORM conventions. Do not infer production data shape from TypeScript types alone.

## Finding format

Severity (critical/high/medium/low); confidence; file and line; trigger/condition; evidence; impact; recommended fix; verification status or uncertainty.
