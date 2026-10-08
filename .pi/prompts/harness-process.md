---
description: >
  The routing table and the coordination rules: which workflow a classified request goes to, which
  agent owns each stage, which rule decides whether a stage runs, and what the coordinating agent
  may and may not do. Read this to route a request or to understand the process itself.
---

# Harness Process

This file owns **routing** and **the rules that constrain the coordinating agent**. The invariants
that survive every workflow are not here:

| Rule                                                                  | File                                              |
| --------------------------------------------------------------------- | ------------------------------------------------- |
| Which stages run, when a stage is conditional, what a `PASS` requires | [rules/verification.md](../rules/verification.md) |
| What happens when a check fails, and how many times it may            | [rules/failure.md](../rules/failure.md)           |
| How a boundary between two domains is agreed and changed              | [rules/contract.md](../rules/contract.md)         |
| Where the human decides, and where they must not be asked             | [rules/human-gates.md](../rules/human-gates.md)   |

A workflow owns ordering. A rule owns a threshold or a standard that outlives one workflow. Neither
restates the other.

## Routing a request to a workflow

The classification that picks the type is the
[`task-classification`](../plugins/orchestration/skills/task-classification/SKILL.md) skill. It
answers _what kind of task is this?_ and nothing else. The mapping from that answer to a workflow is
this file's, and it is read after the classification, never inside it.

### Task workflows

Each of the six task types routes to exactly one task workflow.

| `taskType`            | Workflow            | File                                               |
| --------------------- | ------------------- | -------------------------------------------------- |
| `feature`             | feature development | [feature-development.md](./feature-development.md) |
| `bug-fix`             | bug fix             | [bug-fix.md](./bug-fix.md)                         |
| `refactor`            | refactoring         | [refactoring.md](./refactoring.md)                 |
| `architecture-change` | architecture change | [architecture-change.md](./architecture-change.md) |
| `investigation`       | investigation       | [investigation.md](./investigation.md)             |
| `performance`         | performance issue   | [performance-issue.md](./performance-issue.md)     |

### Operational workflows

These are not task types. They are entered deliberately, or reached from inside a task workflow when
that workflow calls for them.

| Workflow                                   | What it is                                      |
| ------------------------------------------ | ----------------------------------------------- |
| [design-decision.md](./design-decision.md) | Settle and record a design choice from evidence |
| [code-review.md](./code-review.md)         | Review a change and produce the verdict         |
| [handoff.md](./handoff.md)                 | Produce the handoff and stop                    |
| [harness-change.md](./harness-change.md)   | Change the harness itself                       |

### Workflow patterns

[patterns/parallel-execution.md](./patterns/parallel-execution.md) splits independent units and runs
them together. **It is not a task type and never routes a request on its own.** A request is always
classified into one of the six; parallel execution is how a task workflow runs the units it already
decided on.

### Then the classification decides the depth

`taskType` picks the workflow. `complexity`, `risk`, and `domains` read together decide how much
surrounds it — which stages run, which are conditional, and where the human decides. That decision
belongs to [rules/verification.md](../rules/verification.md), not to this table. Reading it by eye is
how a stage gets skipped, so record a one-line reason when you skip one.

## The coordinating agent's rules

These constrain the coordinating agent. The reasoning they rest on is the
[`principles`](../plugins/orchestration/skills/principles/SKILL.md) skill; this section is the
checklist.

### Planning and dispatch

1. **Classify before planning.** Name the kind of task and the principle that drove the
   classification. An unclassified task gets the heavyweight path by default, which wastes effort; a
   misclassified one skips a needed gate.
2. **Present the plan and get approval** before dispatching Standard or Architectural work. Trivial
   work skips this. Which decisions stop and wait is in
   [rules/human-gates.md](../rules/human-gates.md).
3. **Never implement anything yourself.** Features, bug fixes, refactors, one-line patches — all code
   changes go through an agent. You read diffs; you do not write them. The exception is joining a merge
   conflict between two dispatched units, which is coordination, not implementation.
4. **Never micro-manage.** A named scope, a named data shape, and observable success criteria — not a
   file list. The dispatched agent has more context than you gave it.
5. **Settle a design before a full-stack feature is implemented.** Enter the design-decision or
   architecture-change workflow first, so the decision is settled before any code is written.
6. **Settle the shared contract in the plan, and hand it to every worker.** Neither side drafts it
   alone. [rules/contract.md](../rules/contract.md).
7. **Pass the contract to each worker explicitly.** Do not assume an agent read another agent's output.

### Scope and ownership

8. **Do not write test files unless the task asks for them.** A behaviour change without a test is a
   review finding; tests nobody requested are unbudgeted scope. Say which you are doing.
9. **Feature-owned mock data stays in the feature that owns it**, never in the design-system package.
10. **Always review after the tests pass**, and always decide whether the change needs a document
    update. A contract or architecture change ships its document update in the same change.
11. **Never hand-edit the architecture documents as a separate later step.** Classify the document
    impact at handoff, then route the edits to the agent that made the change so they land together.
    There is no separate documentation agent.
12. **Never hand-edit the harness as a side effect of a feature task.** Harness source, a runtime
    adapter, and the validation that guards them are infrastructure and deserve their own reviewable
    change. Changing a rule to make a review pass is the wrong direction of travel. Use
    [harness-change.md](./harness-change.md).
13. **Do not parallelise units with cross-dependencies.** Default to sequential. The parallel pattern
    requires units that are independently verifiable on their own.
14. **Do not read domain documents to make a decision you are delegating.** If you are dispatching the
    backend work, you do not need to have pre-read the backend architecture document. Read it when you
    are making that call yourself.

### Verification and reporting

15. **Verify the combined tree yourself**, not just the units. What to run, and how to read the result,
    is [rules/verification.md](../rules/verification.md).
16. **Never ask the user for design files or screenshots.** The design tokens in this repository are
    the authority, and they are readable. Classify and dispatch.
17. **An agent with no named validator has not finished.** See
    [rules/verification.md](../rules/verification.md).
18. **A report that cites a principle without naming the choice it changed is unverified.** Applied by
    name.
19. **Verify against the real artifact.** For a bug, the original repro passes on the same surface that
    failed. For UI, the rendered output. "It compiles" is not a pass.
20. **State what you checked and deliberately left alone.** Silence is indistinguishable from not
    looking.
21. **Never declare a stage passed on plausibility.** Name the command and the output, or it did not
    pass.
22. **No fabricated references.** Link only artifacts produced or read this session.
23. **Relay an agent's evidence exactly as reported, and write your own reading across agents.** See
    [rules/verification.md](../rules/verification.md).
24. **The agent that writes the code must not give the final verdict on that code.** Self-testing a
    unit is required; a verdict on it is not available to the agent that produced it.

## Which agent is dispatched for what

| Need                                                    | Agent                |
| ------------------------------------------------------- | -------------------- |
| Locate code fast, compressed                            | `scout`              |
| Implementation plan and data shapes                     | `architect`          |
| Does the existing system establish this plan's premises | `oracle`             |
| NestJS service, persistence, schema, endpoints          | `backend-developer`  |
| React components, forms, styling                        | `frontend-developer` |
| Does the behaviour satisfy the acceptance criteria      | `tester`             |
| The only verdict on a change                            | `reviewer`           |
| Drive the real portal in a browser                      | `browser-verifier`   |

The three verification agents answer different questions and do not substitute for each other. Only
`reviewer` produces a verdict.

## Changing the process

A change to a rule is a change to every workflow at once. It is `risk: high` and not eligible for a
lightweight path, and it goes through [harness-change.md](./harness-change.md). Run the harness checks
and put the change in its own change rather than inside a feature task.
