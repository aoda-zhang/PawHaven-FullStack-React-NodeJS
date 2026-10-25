---
description: Reproduce a defect, propose a root-cause fix, wait for approval, then verify
agent: orchestrator
---

# Bug Fix

A defect report authorizes investigation, not implementation.

1. Confirm this is a defect and establish the affected surface.
2. Reproduce where possible and record **Reproduced**, **Not reproduced**, or **Unable to verify**, with observed input/output or the environmental blocker.
3. Use `explorer` for read-only evidence and trace actual boundaries; do not reference an undefined `scout` agent.
4. Propose a plan with evidence, root-cause hypothesis, exact scope, risks, acceptance criteria, and same-surface reproduction/regression checks.
5. Wait for explicit user approval before any modification. If evidence changes the diagnosis or materially expands scope, request approval for a revised plan.
6. After approval, let `implementer` load relevant development Skills dynamically; then run `tester` and `reviewer` in order.
7. Fix and re-verify for at most three cycles. Do not claim success if the original reproduction or regression check was not run.
8. Stop at handoff. Do not commit, push, or create a PR unless explicitly requested.

## Reply

Before approval: evidence, reproduction status, hypothesis, scope, risks, criteria, and checks; then wait. After approval: root cause, changed behavior, exact checks/results, and limitations.
