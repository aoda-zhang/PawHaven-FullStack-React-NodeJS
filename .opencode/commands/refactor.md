---
description: Plan and obtain approval before a behavior-preserving refactor
agent: orchestrator
---

# Refactor

Refactor $ARGUMENTS while preserving externally observable behavior.

1. Inspect target code, callers, tests, package boundaries, and existing patterns. Establish behavior that must remain unchanged.
2. Present a plan with motivation, observed behavior, proposed structure, exact scope, risks, acceptance criteria, and regression checks.
3. Wait for explicit user approval before modifying files.
4. After approval, implement only the approved refactor. Do not add features or fix unrelated defects. If scope materially changes, stop for renewed approval.
5. Run relevant behavior/regression tests and review the complete diff. Report actual evidence and checks not run.
6. Stop at handoff. Do not commit, push, or create a PR unless explicitly requested.
