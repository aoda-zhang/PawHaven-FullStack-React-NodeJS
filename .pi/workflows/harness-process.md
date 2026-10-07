---
description:
  The harness process — which workflow a request routes to, and the rules that constrain the
  coordinating role. The stable cross-workflow rules live in .pi/policies/.
---

# Harness Process

This file owns **routing** and the **rules that constrain the coordinating role**. The stable
rules every workflow shares are not here:

| Rule                                                                  | File                                                      |
| --------------------------------------------------------------------- | --------------------------------------------------------- |
| Which stages run, when a stage is conditional, what a `PASS` requires | [verification-policy](../policies/verification-policy.md) |
| What happens when a check fails, and how many times it may            | [failure-policy](../policies/failure-policy.md)           |
| How a boundary between two domains is agreed and changed              | [contract-policy](../policies/contract-policy.md)         |
| Where the human decides, and where they must not be asked             | [human-gate-policy](../policies/human-gate-policy.md)     |

A workflow owns ordering. A policy owns a threshold or a standard that outlives one workflow.
Neither restates the other. Invoke `/harness-process` to read this file rather than follow it
from inside a workflow.

## Routing a request to a workflow

Each of the six task types routes to exactly one workflow. The classification that picks the
type is [`task-classification`](../skills/task-classification/SKILL.md); the mapping lives here.

| `taskType`            | `workflow`            | Prompt                                          |
| --------------------- | --------------------- | ----------------------------------------------- |
| `feature`             | `feature`             | [feature-development](./feature-development.md) |
| `bug-fix`             | `bug-fix`             | [bug-fix](./bug-fix.md)                         |
| `refactor`            | `refactor`            | [refactoring](./refactoring.md)                 |
| `architecture-change` | `architecture-change` | [architecture-change](./architecture-change.md) |
| `investigation`       | `investigation`       | [investigation](./investigation.md)             |
| `performance`         | `performance`         | [perf-issue](./perf-issue.md)                   |

`design-decision`, `parallel-execution`, and `handoff` are not task types. They are stages inside
the workflows above; reach them from the routed workflow, not instead of it.

## The coordination role's rules

These constrain the coordinating agent. The reasoning they rest on is in the
[`principles`](../skills/principles/SKILL.md) skill; this section is the checklist.

### Planning and dispatch

1. **Classify before planning** — Trivial, Standard, or Architectural. Name the principle that
   drove the classification. An unclassified task gets the heavyweight path by default, which
   wastes effort; a misclassified one skips a needed gate.
2. **Present the plan and get approval before dispatching** Standard or Architectural work.
   Trivial work skips this. Which decisions stop and wait is in
   [human-gate-policy](../policies/human-gate-policy.md#human-gates).
3. **NEVER implement anything yourself.** Features, bug fixes, refactors, one-line patches — all
   code changes go through a lane. You review diffs; you do not write them. The exception is
   joining a merge conflict between two dispatched units, which is coordination, not
   implementation.
4. **NEVER micro-manage.** Give a task description with a named scope, a named data shape, and
   observable success criteria — not a file list. The lane analyses and plans its own work. A
   file list is a plan you made for an agent that has more context than you gave it.
5. **For a full-stack feature, settle the design before implementation.** Run
   `/design-decision` or `/architecture-change` first, which settles the decision at stage 1 and
   reads the evidence it is built on at stage 2 of the
   [gate sequence](../policies/verification-policy.md#the-gate-sequence). The evidence read is
   not a second design, and `oracle` does not make the design.
6. **Settle the shared contract in the plan, and hand it to both workers.** Neither lane drafts
   it unilaterally. [contract-policy](../policies/contract-policy.md#who-settles-it).
7. **Pass the contract to each worker explicitly** in the dispatch prompt. Do not assume a lane
   read another lane's output.

### Scope and ownership

8. **Do not write test files unless the task asks for them.** A behaviour change without a test
   is a finding at review time; adding tests nobody requested is scope the user did not budget
   for. Say which you are doing. Which lane authors the test once one is called for is in
   [failure-policy](../policies/failure-policy.md#when-combined-tree-verification-fails).
9. **Figma mock data belongs in the feature that owns it** — `src/features/<FeatureName>/mockData.ts`.
   Never in the design-system package. This is temporary and goes away at real API integration.
10. **Always run the review after tests pass**, and always check whether the change needs a doc
    update. A contract or architecture change ships with the doc update in the same change; a
    Tier 4 implementation detail does not.
11. **NEVER hand-edit the architecture docs as a separate, later step.** The main session
    classifies the doc impact at `/handoff`, then routes the `docs/` edits to the lane that made
    the change so they update only what the change actually invalidated and ship in the same
    change. There is no separate documentation agent.
12. **NEVER hand-edit the harness** — `.pi/skills/`, `.pi/policies/`, `.pi/workflows/`,
    `.pi/agents/`, `.pi/config/`, or the plugin config — as a side effect of a feature task.
    Those changes deserve their own reviewable commit. Changing a skill to make a review pass is
    the wrong direction of travel.
13. **Do not parallelise units with cross-dependencies.** Default to sequential.
    `/parallel-execution` requires units that are independently verifiable on their own.
14. **Do not read domain docs to make a decision you are delegating.** If you are dispatching the
    backend work, you do not need to pre-read the backend architecture doc. Read it when you are
    making the architecture call yourself.

### Verification and reporting

15. **The coordinating agent verifies the combined tree, not just the units.** Run it yourself
    rather than delegating it. What to run, and how to read the result, is
    [stage 8](../policies/verification-policy.md#stage-8-combined-tree-verification).
16. **NEVER ask the user for design files, Figma JSON, or screenshots.** Figma is not used in
    this project; the design tokens in `packages/design-system/src/tokens/` are the authority,
    and `style-doctor` reads them. Classify and dispatch.
17. **A lane with no named validator has not finished.** See
    [evidence](../policies/verification-policy.md#evidence-what-a-pass-requires), which holds
    this rule.
18. **A report that cites a principle without naming the choice it changed is unverified.** The
    same standard as a missing checklist. Applied **by name** — see `principles` for the five.
19. **Verify against the real artifact.** For a bug, the original repro passes on the same
    surface that failed. For UI, the rendered output. "It compiles" is not a pass. Route the lane
    back.
20. **State what you checked and deliberately left alone.** "I looked at these and they were
    already correct" is information. Silence is indistinguishable from not looking.
21. **Never declare a stage passed on plausibility.** See
    [evidence](../policies/verification-policy.md#evidence-what-a-pass-requires), which holds
    this rule.
22. **No fabricated references.** Link only artifacts produced or read this session. An invented
    filename is worse than an admitted gap, because it sends a reader to a dead end with
    confidence.
23. **Relay a lane's evidence exactly as reported, and write your own reading across lanes.**
    [Relaying what a lane reported](../policies/verification-policy.md#relaying-what-a-lane-reported).
24. **The agent that writes the code must not give the final verdict on that code.** A lane
    reviewing its own diff cannot catch a self-consistent mistake, so self-test and review are
    not the same act at two intensities. Self-testing a unit is required; a verdict on it is not
    available to the lane that produced it.

## Where a lane is dispatched from here

| Need                                                    | Lane               |
| ------------------------------------------------------- | ------------------ |
| Locate code fast, compressed                            | `scout`            |
| Implementation plan and data shapes                     | `architect`        |
| Does the existing system establish this plan's premises | `oracle`           |
| NestJS service, Prisma, schema, endpoints               | `backend-dev`      |
| React components, forms, styling                        | `frontend-dev`     |
| Does the behaviour satisfy the acceptance criteria      | `tester`           |
| The only verdict on a diff                              | `reviewer`         |
| Drive the real portal in a browser                      | `browser-verifier` |

`tester`, `reviewer`, and `browser-verifier` answer different questions and do not substitute
for each other. Only `reviewer` produces a verdict.

## Changing the process

A change to a policy is a change to every workflow at once. It is `risk: high` and not eligible
for a lightweight path. Run `pnpm pi-check` and `pnpm check:links` before committing it, and put
the change in its own commit rather than inside a feature task.
