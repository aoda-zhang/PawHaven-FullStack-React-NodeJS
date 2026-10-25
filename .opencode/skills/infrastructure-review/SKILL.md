---
name: infrastructure-review
description: Review CI/CD, deployment, build, runtime configuration, and operational changes.
---

# Infrastructure Review

Load only when the diff changes CI/CD, deployment configuration, build tooling, runtime entry points, environment wiring, permissions, release steps, or operational behavior.

Check applicable trigger coverage; trusted/untrusted PR execution; token permissions and credential persistence; branch/ref selection; secret exposure; dependency/runtime compatibility; environment propagation; artifact paths; timeout/retry behavior; rollback/recovery; and whether referenced workflow commands exist.

Avoid unrelated redesign. Use the finding format defined by the Reviewer agent.
