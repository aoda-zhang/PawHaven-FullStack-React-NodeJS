---
name: backend-code-review
description: Review backend diffs for API, auth, service-boundary, error-handling, and persistence regressions.
---

# Backend Code Review

Load only when the diff affects backend code.

Read relevant backend architecture and development patterns; do not duplicate their rules here. Verify changed behavior from source and tests, not assumed framework defaults.

Review applicable areas: request validation; auth/public-route intent and claims; HTTP status and response envelopes; error normalization and trace IDs; service calls and timeout/error mapping; configuration ownership; resource cleanup; persistence consistency; observability; and regression coverage. Load `contract-code-review` for changed producer-consumer contracts.

Report evidence-backed findings using the finding format defined by the Reviewer agent.
