---
description: Plan and obtain approval before a behavior-preserving refactor
agent: orchestrator
---

# Refactor

Refactor $ARGUMENTS while preserving externally observable behavior.

1. Inspect the target code, callers, tests, package boundaries, and existing patterns. Establish the behavior that must remain unchanged.
2. Write a plan that identifies the motivation, current behavior, proposed structural change, exact scope, risks, and checks that would detect behavior changes.
3. **Human approval gate:** present the plan and wait for explicit approval in the current conversation. Do not edit files before approval, even for a small or apparently mechanical refactor.
4. After approval, implement only the approved refactor. Do not add features, fix unrelated defects, or broaden scope. If new evidence requires a material change, stop and obtain approval for a revised plan.
5. Run relevant behavior/regression tests and inspect the full diff. Report actual evidence and any checks not run.
6. Stop at handoff. Never commit or push unless explicitly requested.
