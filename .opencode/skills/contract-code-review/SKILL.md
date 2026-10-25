---
name: contract-code-review
description: Review API, shared schema/type, and producer-consumer boundaries for compatibility and runtime correctness.
---

# Contract code review

Trace changed contracts from producer to relevant consumers. Inspect canonical schema/type, serialization and validation, optionality/nullability, enums, error shape, status codes, compatibility, and boundary tests. Typecheck alone does not prove runtime compatibility. For cross-service calls, verify path prefixes, auth claims, timeout/error mapping, and payload shape when implicated.

Identify breaking changes and the affected producer/consumer pair.

## Finding format

Severity (critical/high/medium/low); confidence; file and line; trigger/condition; evidence; impact; recommended fix; verification status or uncertainty.
