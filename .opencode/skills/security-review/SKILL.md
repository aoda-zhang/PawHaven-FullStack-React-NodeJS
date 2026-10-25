---
name: security-review
description: Review authentication, authorization, secrets, untrusted input, trust boundaries, and security-sensitive behavior.
---

# Security review

Load when the diff touches identity/session/token handling, authorization, untrusted input/output, file uploads/downloads, sensitive data, secrets, permissions, network boundaries, or security config. Check authentication versus authorization; deny-by-default behavior; validation/output encoding; secret/token exposure; SSRF/path traversal/injection risks where relevant; unsafe deserialization; sensitive logging; CORS/CSRF/session handling; permission expansion; and abuse/resource exhaustion. Tie each concern to a reachable path and concrete impact. Do not label theoretical concerns confirmed vulnerabilities without evidence.

## Finding format

Severity (critical/high/medium/low); confidence; file and line; trigger/condition; evidence; impact; recommended fix; verification status or uncertainty.
