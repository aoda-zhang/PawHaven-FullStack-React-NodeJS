# Workflows

The **procedure layer** of the Harness. A workflow is a numbered, evidence-gated procedure for one kind of task. Workflow steps must be copied **word-for-word** into the agent's todo list (verbatim-todo discipline); skipped steps stay as `skip: <reason>`.

Every workflow ends the same way: Step 1 verified work → Step 2 **Review Handoff** ([handoff](./handoff.md)) → Step 3 STOP. The human reviews and opens the PR manually — nothing is pushed automatically.

## Entry Workflow

| Workflow                                        | Entry            | Purpose                                                                                                                                                  |
| ----------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [feature-development](./feature-development.md) | New feature task | End-to-end feature delivery: Step 1 requirement → Step 2 architect → Step 3 implement (frontend/backend) → Step 4 test → Step 5 review → Step 6 handoff. |

## Specialist Workflows

| Workflow                                        | Entry                 | Purpose                                                                                                               |
| ----------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| [bug-fix](./bug-fix.md)                         | Bug report            | Step 1 reproduce first → Step 2 fix root cause → Step 3 verify the failing repro passes on the same surface.          |
| [refactoring](./refactoring.md)                 | Refactor request      | Change structure without changing behavior: Step 1 pin behavior first → Step 2 keep tests green.                      |
| [perf-issue](./perf-issue.md)                   | Performance issue     | Step 1 baseline trace first → Step 2 targeted fix → Step 3 post-fix trace proves the improvement.                     |
| [architecture-change](./architecture-change.md) | Architecture change   | Step 1 design decision with impact analysis → Step 2 ADR when needed → Step 3 migrate-callers-then-delete discipline. |
| [design-decision](./design-decision.md)         | Design decision       | Step 1 enumerate options & trade-offs → Step 2 apply named principles → Step 3 record the outcome.                    |
| [investigation](./investigation.md)             | "Why is X happening?" | Step 1 root-cause investigation → Step 2 fix (after the cause is proven).                                             |

## Terminal Workflow

| Workflow                | Entry                 | Purpose                                                                                                                                 |
| ----------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [handoff](./handoff.md) | End of most workflows | Step 1 ordered commits → Step 2 typecheck · tests · build green → Step 3 handoff summary → Step 4 stop. Human reviews and opens the PR. |

## Pipeline

```
Step 1: Requirement
Step 2: Architect
Step 3: Implementation
Step 4: Testing
Step 5: Review (TECH + PATTERN)
Step 6: Knowledge Update
Step 7: Review Handoff
```

Routing into the right workflow happens in `../dispatcher.md`; the orchestrator (`../AGENT.md`) dispatches agents per workflow segment.

**Related**: [Mode](../dispatcher.md) · [Agents](../agents/README.md) · [Task Log](../docs/task-log.md) · [Root README](../README.md)
