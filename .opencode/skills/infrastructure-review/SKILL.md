---
name: infrastructure-review
description: Review CI workflows, deployment configuration, build tooling, environment wiring, and runtime operations.
---

# Infrastructure review

Load when the diff changes CI/CD, deployment config, build tooling, runtime entrypoints, environment variables, permissions, release steps, or operational behavior. Check trigger coverage; trusted/untrusted PR execution; token permissions and credential persistence; branch/ref selection; secret exposure; dependency/runtime compatibility; environment variable propagation; artifact/build paths; timeout/retry semantics; rollback/recovery; and whether workflow commands exist. Avoid unrelated redesign.

## Finding format

Severity (critical/high/medium/low); confidence; file and line; trigger/condition; evidence; impact; recommended fix; verification status or uncertainty.
