---
description:
  The harness process — workflow routing, the nine-stage gate sequence, and where a failed
  check goes next
---

# Harness Process

The workflow layer of this harness. It owns **when** something happens and **in what order**: which
workflow a request routes to, which lane holds each stage, and where a failed check goes.

How each role must behave is a rule, and a rule lives in
[`project-rules`](../skills/project-rules/SKILL.md). A skill teaches a capability and does not own
the process. This file is the harness's single copy of the sequence, so the rule files link here
rather than restating it: a sequence written in two places drifts from its copy.

Invoke this with `/harness-process` when you want to read the sequence itself rather than follow it
from inside a workflow.

## Routing a request to a workflow

Each of the six task types routes to exactly one workflow. The classification that picks the type is
[`task-classification`](../skills/task-classification/SKILL.md); the mapping lives here.

| `taskType`            | `workflow`            | Prompt                                          |
| --------------------- | --------------------- | ----------------------------------------------- |
| `feature`             | `feature`             | [feature-development](./feature-development.md) |
| `bug-fix`             | `bug-fix`             | [bug-fix](./bug-fix.md)                         |
| `refactor`            | `refactor`            | [refactoring](./refactoring.md)                 |
| `architecture-change` | `architecture-change` | [architecture-change](./architecture-change.md) |
| `investigation`       | `investigation`       | [investigation](./investigation.md)             |
| `performance`         | `performance`         | [perf-issue](./perf-issue.md)                   |

`design-decision`, `parallel-execution`, and `handoff` are not task types. They are stages inside the
workflows above; reach them from the routed workflow, not instead of it.

## The gate sequence

Nine stages, in this order.

| #   | Stage                      | Lane                          | When it runs                                 |
| --- | -------------------------- | ----------------------------- | -------------------------------------------- |
| 1   | Plan                       | `scout`, `architect`          | Always beyond Trivial                        |
| 2   | Plan review                | `oracle`                      | Conditional, skipped for Trivial scope       |
| 3   | Human plan approval        | the human                     | Standard and Architectural scope             |
| 4   | Implementation             | `frontend-dev`, `backend-dev` | Always beyond Trivial                        |
| 5   | Developer self-test        | the writing lane              | Every implementation lane, before it reports |
| 6   | Independent verification   | `tester`                      | Conditional, `medium` or `high` complexity   |
| 7   | Independent review         | `reviewer`                    | Every mutating change                        |
| 8   | Combined-tree verification | the orchestrator              | After the units are joined                   |
| 9   | Human final review         | the human                     | Every change that survives to a handoff      |

Three of the nine numbered stages are conditional on task risk: plan review, human plan approval, and
independent verification. A `browser-verifier` pass is a fourth conditional act and is described below,
but it is not one of the nine numbered stages, so the count of conditional stages is three.

**Plan review is skipped when the task classified as Trivial, and the classification is the entire
trigger.** A plan that reads small is not a reason to skip it, and a plan that reads large does not
promote a Trivial task into a reviewed one. Human plan approval is skipped for Trivial scope, because
there is nothing to weigh. Independent verification runs when the task classified at `medium` or `high`
complexity, and is skipped for a Trivial or `low`-complexity task. At that complexity the work is
localized to one layer with a straight verification, so an independent acceptance lane costs more than
it returns; a task that classified higher gets it whatever its diff looks like. A `browser-verifier`
pass runs when the change touches a surface a user touches and is skipped for a backend-only change.

**Stage 2 answers an evidence question, not a design one.** `oracle` is the evidence advisor about the
existing system. The question it answers is **what does the existing system actually establish about
this plan's premises** — does the abstraction already exist, where the behaviour lives today, which
packages depend on the interface, whether this contract change reaches another domain. It cites a
file, a line, or a command for every claim, and reports what it cannot ground as unverified with the
check that would settle it. It **refuses to design**: asked how to build something, it answers with
what the code establishes and hands the design question back to stage 1. It is therefore not a second
`architect`, and dispatching it as one spends the lane on a design opinion instead of on evidence.
`VERDICT: PASS` means no premise is contradicted by the evidence, not that the design is approved.

The rest are unconditional. Stage 5 runs on every implementation, because a lane that has not run its
own checks has no evidence to hand on. Stage 7 runs on every mutating change, no matter how small,
because a change nobody independent has read has not been reviewed.

Stages 5, 6, and 7 are separate contexts for that reason. The rule they exist to enforce — the
agent that writes the code must not give the final verdict on that code — is owned by
[orchestrator.md](../skills/project-rules/references/orchestrator.md#verification-and-reporting).

Stage 8 verifies the joined tree, because a change that typechecks per file and does not package is
not done. The orchestrator owns it. A developer owns its own unit, and stage 5 already covers that.
See [Evidence](../skills/project-rules/references/orchestrator.md#evidence-what-a-pass-requires) for
what a stage must report before it counts as passed.

### Lane shapes

The gate sequence specialised to a classification. `taskType` picks the workflow; `complexity`, `risk`,
and `domains` read together pick this shape. `domains` decides which workers appear, and the other two
decide how much surrounds them.

**`low` complexity, `low` risk, `domains: [frontend]`.** `orchestrator` → `frontend-dev` → `tester` →
`reviewer` → the human. No planner and no plan review, because the work sits in one layer with a
straight verification. The developer self-test still runs, since a lane that has not checked its own
work has no evidence to hand on.

**`medium` complexity, `medium` risk, `domains: [frontend, backend]`.** `orchestrator` → `architect` as
the planner → **the shared contract** → `frontend-dev` and `backend-dev`, in parallel only where the
dependencies permit → `tester` → `browser-verifier` on a user-facing surface → `reviewer` →
combined-tree verification. `oracle` plan review is conditional; the human plan approval is not,
because a two-domain feature is Standard work at minimum. A full-stack task is **composed** from two
domains, and no `fullstack-dev` worker exists or should be created for it. Composition is what the
orchestrator already does, and a role for it would be a role with nothing of its own to check.

**`low` complexity, `high` risk, `domains: [backend]`.** The strong path in full: planner, plan
review, a named validator per unit, independent review, and the human gate, because high risk forces
every one of them however small the diff is. This is the shape the routing has to get right.

### The shared contract

When `domains` interact, the shared contract is settled before the independent implementation starts,
so neither worker is guessing at the boundary the other is about to land.

A contract is a durable handoff artifact that describes a boundary. It is not an agent, not a skill, and
not a subsystem. At the code level that boundary is
[`packages/shared/types`](../../packages/shared/types), the types and Zod schemas both sides import
instead of re-declaring.

## The bounded fix loop

Verification or review fails. The finding goes back to the lane that wrote the code, which fixes it and
re-runs its own self-test. Independent review runs again on the new code, and independent verification
runs again if it ran the first time. That is one cycle.

**Maximum 3 cycles.** On the third failure, stop. Report `WORKFLOW BLOCKED` with every unresolved
finding, the command output behind each one, and what each remaining finding would need. Hand it to the
human. Do not dispatch a fourth cycle. A loop that never terminates is not diligence, it is a task that
has stopped reporting.

**The reviewer does not fix. It reports, and the developer fixes.** A review lane that edits the diff
is no longer independent, and it also leaves the fix unverified by the pass that followed it. The
separation is what the loop depends on, so it holds even when the fix looks trivial.

The loop handles a defect in the implementation. A finding that says the plan is wrong is not a defect,
and running it through the loop produces more of the wrong thing. That is
[When to return to planning](#when-to-return-to-planning).

## When to return to planning

Not every failure belongs in the fix loop. The discriminator is the finding's own claim.

Route it to the fix loop when the finding says **the implementation is wrong**: a behaviour defect, a
missing test, a broken build, a finding scoped to the files that were approved.

Return to planning when the finding says **the plan is wrong**:

- the architecture is wrong, or a boundary the plan assumed does not hold in the code
- the approved scope is insufficient to finish the task
- a new API is needed, public or shared, and it does not exist yet
- the data model must change
- the requirements changed while the work was in flight
- the implementation needs a materially different approach from the approved one

Return to planning means re-entering stage 1 with the finding as the new input, not patching around it
inside the current approval. If the re-plan changes scope or risk, the human gate at stage 3 applies
again, because the thing being approved is a different thing.

Reworking a wrong plan inside a fix loop produces more of the wrong thing. Each cycle looks bounded and
none of them address the finding.

## When combined-tree verification fails

This section refines the router above rather than replacing it. Classify the failure before routing it,
because the same failing check carries a different owner depending on which of these it is.

| Category                                | What it means                                                   | Route                                                                                                                            |
| --------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `IMPLEMENTATION_FAILURE`                | This domain's code is wrong                                     | Back to that domain's implementation worker, through [the bounded fix loop](#the-bounded-fix-loop).                              |
| `TEST_FAILURE`                          | A test is wrong or stale                                        | The orchestrator decides first whether the test or the implementation is at fault, then routes to whichever one owns it.         |
| `INTEGRATION_FAILURE`                   | The domains disagree at the boundary                            | Back to the orchestrator, re-routed through contract analysis to **every** affected domain. Never to a single developer.         |
| `SCOPE_OR_REQUIREMENT_FAILURE`          | The implementation does not meet the agreed requirement         | That is the "the plan is wrong" branch, so back to [planning](#when-to-return-to-planning).                                      |
| `ENVIRONMENT_OR_INFRASTRUCTURE_FAILURE` | The code may be correct and the environment blocks verification | Report it as-is. Do **not** route an application-code change to an implementation worker, because nothing in the diff is broken. |

**When a failure could be classified either way, take the more specific category and say why.** A
frontend/backend contract disagreement is also arguably a requirement failure, but `INTEGRATION_FAILURE`
names the boundary that broke rather than the intent and carries the route that reaches **every**
affected domain, so it is the one that governs; the report states the category it took and the reason.

The fix loop stays bounded wherever a branch lands in it. Maximum 3 cycles, then `WORKFLOW BLOCKED`, as
[the bounded fix loop](#the-bounded-fix-loop) states. An escalation carries the failure, its evidence,
the attempts made so far, the affected domain, the suspected root cause, and what is still uncertain.

**The writing lane authors the test.** When `TEST_FAILURE` lands on a test that is missing rather than
wrong, `tester` has already reported that criterion as `unverifiable` and named the check that would
settle it. That report is the authorisation that surfaces the need, not the authority to write it. The
task prompt or the bounded fix loop decides whether a test gets written, and the implementation lane
owning that domain authors it. `tester` is not a second developer, and a check its author wrote is not
independent evidence.

## The contract change route

The rule that triggers this route is
[the contract change gate](../skills/project-rules/references/orchestrator.md#the-contract-change-gate):
a worker must not silently redefine an agreed contract, and stops with `CONTRACT_CHANGE_REQUIRED`
instead. This is the route the signal takes once it has been emitted.

1. The orchestrator reads the signal and decides whether the proposed change is a design question, an
   evidence question, or both.
2. **Design.** `architect` for a design question.
3. **Evidence.** `oracle` establishes what the existing system actually supports in the proposal,
   before it is adopted. It is asked for the evidence the proposal assumes, not for a second design,
   and it answers that question even when the proposal is sound.
4. **Human gate.** A material change triggers it, the same way any other scope decision does.
5. **Re-synchronise.** Every affected lane is re-synchronised on the new contract before work
   continues, so no unit keeps building against the one it was handed.

The failure this prevents is a boundary that moves in two directions at once. A frontend lane quietly
changes an API expectation, a backend lane quietly changes the response shape, and the mismatch surfaces
only at final verification, by which point both lanes have reported a self-test pass.
