---
name: security-review
description: Review changes that affect identity, authorization, secrets, untrusted data, or trust boundaries.
---

# Security Review

Load when the diff touches identity/session/token handling, authorization, untrusted input/output, uploads/downloads, sensitive data, secrets, permissions, network boundaries, or security configuration.

Trace each concern to a reachable path. Check authentication versus authorization, deny-by-default behavior, validation/output encoding, secret/token exposure, SSRF/path traversal/injection, unsafe deserialization, sensitive logging, CORS/CSRF/session handling, permission expansion, and abuse/resource exhaustion when relevant.

Do not label a theoretical concern a confirmed vulnerability without evidence. Use the finding format defined by the Reviewer agent.
