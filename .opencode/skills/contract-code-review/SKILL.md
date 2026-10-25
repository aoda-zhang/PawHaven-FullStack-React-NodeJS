---
name: contract-code-review
description: Review API and shared-schema changes across producers and consumers.
---

# Contract Code Review

Load when a diff changes API payloads, shared schemas/types, serialization, or a producer-consumer boundary.

Trace each changed contract from its canonical definition through affected producers and consumers. Check optionality/nullability, enums, validation, serialization, status/error shape, backward compatibility, and boundary tests. For service calls, check prefixes, auth claims, timeout/error mapping, and payload shape when implicated.

Name the affected producer-consumer pair and any breaking change. Use the finding format defined by the Reviewer agent.
