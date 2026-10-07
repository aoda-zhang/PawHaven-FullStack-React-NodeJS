---
description:
  The harness process — workflow routing, the nine-stage gate sequence, and where a failed
  check goes next
---

# Harness Process

The workflow layer of this harness. It owns **when** something happens and **in what order**: which
workflow a request routes to, which lane holds each stage, and where a failed check goes.

How each role must behave is a rule, and the coordination role's rules live in
[the coordination role's rules](#the-coordination-roles-rules) below. A skill teaches a
capability and does not own the process. This file is the harness's single copy of the sequence,
so the workflows link here rather than restating it: a sequence written in two places drifts from
its copy.

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
| 1   | Plan                       | `explorer`, `planner`         | Always beyond Trivial                        |
| 2   | Plan review                | `critic`                      | Conditional, skipped for Trivial scope       |
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

**Stage 2 answers an evidence question, not a design one.** `critic` is the evidence advisor about the
existing system. The question it answers is **what does the existing system actually establish about
this plan's premises** — does the abstraction already exist, where the behaviour lives today, which
packages depend on the interface, whether this contract change reaches another domain. It cites a
file, a line, or a command for every claim, and reports what it cannot ground as unverified with the
check that would settle it. It **refuses to design**: asked how to build something, it answers with
what the code establishes and hands the design question back to stage 1. It is therefore not a second
`planner`, and dispatching it as one spends the lane on a design opinion instead of on evidence.
`VERDICT: PASS` means no premise is contradicted by the evidence, not that the design is approved.

The rest are unconditional. Stage 5 runs on every implementation, because a lane that has not run its
own checks has no evidence to hand on. Stage 7 runs on every mutating change, no matter how small,
because a change nobody independent has read has not been reviewed.

Stages 5, 6, and 7 are separate contexts for that reason. The rule they exist to enforce — the
agent that writes the code must not give the final verdict on that code — is owned by
[Verification and reporting](#verification-and-reporting).

Stage 8 verifies the joined tree, because a change that typechecks per file and does not package is
not done. The orchestrator owns it. A developer owns its own unit, and stage 5 already covers that.
See [Evidence](#evidence-what-a-pass-requires) for
what a stage must report before it counts as passed.

### Lane shapes

The gate sequence specialised to a classification. `taskType` picks the workflow; `complexity`, `risk`,
and `domains` read together pick this shape. `domains` decides which workers appear, and the other two
decide how much surrounds them.

**`low` complexity, `low` risk, `domains: [frontend]`.** `orchestrator` → `frontend-dev` → `tester` →
`reviewer` → the human. No planner and no plan review, because the work sits in one layer with a
straight verification. The developer self-test still runs, since a lane that has not checked its own
work has no evidence to hand on.

**`medium` complexity, `medium` risk, `domains: [frontend, backend]`.** `orchestrator` → `planner` →
**the shared contract** → `frontend-dev` and `backend-dev`, in parallel only where the
dependencies permit → `tester` → `browser-verifier` on a user-facing surface → `reviewer` →
combined-tree verification. `critic` plan review is conditional; the human plan approval is not,
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

## The coordination role's rules

These constrain the coordinating agent. The `principles` skill carries the reasoning; this section
is the checklist. The gate sequence lives above in this file — this section holds the rules that
constrain each role. A rule section that also carried the sequence would have two copies to drift.

> **Why these live here:** a separate `.pi/rules/` directory was considered and rejected. A new
> top-level directory is a larger change than the content warrants; `.pi/workflows/` already holds
> non-command prose (this file itself); and while the workflow/rule boundary tension is real — this
> content constrains a role (human gates, the contract change gate) rather than ordering steps — the
> minimal-change rule wins over the ideal separation. The sequence and the role rules are one file,
> and the workflows link here rather than restating either.

### The autonomy line — read this first

Two rules here look contradictory and are not. The line is **reversibility**, not risk.

| Situation                                     | What to do                                                       |
| --------------------------------------------- | ---------------------------------------------------------------- |
| Trivial, reversible, no contract change       | Just do it. Do not ask. `never-block-on-the-human` applies.      |
| Standard or Architectural scope               | Present the classification and plan, get approval, then execute. |
| Any sub-step after approval, still reversible | Just do it. Do not re-ask. Approval is not per-step.             |

Which decisions stop and wait for a human is in [Human gates](#human-gates).

### Human gates

The human is the final authority. The gate belongs where the decision is meaningful, not everywhere.

**Always ask**, before the work, not after:

- a Standard or Architectural plan
- a product or scope decision
- an architecture decision
- anything irreversible. A commit, a push, a force-push, a destructive migration, a branch deletion.

**Do not ask** about:

- a reversible sub-step after approval was given. Approval is not per-step, and re-asking trains
  the human to answer without reading.
- an ordinary implementation choice inside an approved scope. The lane decides and reports it.

Asking about every step is not rigour, it is friction. Asking before a force-push is rigour.

### Planning and dispatch

1. **Classify before planning** — Trivial, Standard, or Architectural. Name the principle that drove
   the classification. An unclassified task gets the heavyweight path by default, which wastes effort;
   a misclassified one skips a needed gate.
2. **Present the plan and get approval before dispatching** Standard or Architectural work. Trivial
   work skips this.
3. **NEVER implement anything yourself.** Features, bug fixes, refactors, one-line patches — all code
   changes go through a lane. You review diffs; you do not write them. The exception is joining a
   merge conflict between two dispatched units, which is coordination, not implementation.
4. **NEVER micro-manage.** Give a task description with a named scope, a named data shape, and
   observable success criteria — not a file list. The lane analyses and plans its own work. A file
   list is a plan you made for an agent that has more context than you gave it.
5. **For a full-stack feature, settle the design before implementation.** Run `/design-decision` or
   `/architecture-change` first, which settles the decision at stage 1 and reads the evidence it is
   built on at stage 2 of [the gate sequence](#the-gate-sequence).
   The evidence read is not a second design, and critic does not make the design.
6. **Frontend first for full-stack features.** The frontend drafts the API contract it needs; the
   backend then finalises it. Reversing this means the backend builds a contract nobody asked for.
7. **Pass the frontend's contract to the backend explicitly** in the dispatch prompt. Do not assume a
   lane read another lane's output.

### Scope and ownership

8. **Do not write test files unless the task asks for them.** A behaviour change without a test is a
   finding at review time; adding tests nobody requested is scope the user did not budget for. Say
   which you are doing. Which lane authors the test once one is called for is in
   [When combined-tree verification fails](#when-combined-tree-verification-fails).
9. **Figma mock data belongs in the feature that owns it** — `src/features/<FeatureName>/mockData.ts`.
   Never in the design-system package. This is temporary and goes away at real API integration.
10. **Always run the review after tests pass**, and always check whether the change needs a doc
    update. A contract or architecture change ships with the doc update in the same change; a Tier 4
    implementation detail does not.
11. **NEVER hand-edit the architecture docs as a separate, later step.** The main session classifies
    the doc impact at `/handoff`, then routes the `docs/` edits to the lane that made the change so
    they update only what the change actually invalidated and ship in the same change. There is no
    separate documentation agent.
12. **NEVER hand-edit the harness** — `.pi/skills/`, `.pi/workflows/`, `.pi/agents/`,
    or the plugin config — as a side effect of a feature task. Those changes deserve their own
    reviewable commit. Changing a skill to make a review pass is the wrong direction of travel.
13. **Do not parallelise units with cross-dependencies.** Default to sequential. `/parallel-execution`
    requires units that are independently verifiable on their own.
14. **Do not read domain docs to make a decision you are delegating.** If you are dispatching the
    backend work, you do not need to pre-read the backend architecture doc. Read it when you are
    making the architecture call yourself.

### Verification and reporting

15. **The coordinating agent verifies the combined tree, not just the units.** `pnpm typecheck` and
    `pnpm build:local` on the merged result, run by the coordinating agent rather than delegated. A
    developer self-tests its own unit at stage 5 and nothing more, because a change that typechecks
    per-file but does not package is only visible once the units are joined. `pnpm lint`
    already fails from 13 pre-existing errors (3 in `gateway`, 10 in `backend-core`) — diff against
    baseline before calling it a regression.
16. **NEVER ask the user for design files, Figma JSON, or screenshots.** Figma is not used in this
    project; the design tokens in `packages/design-system/src/tokens/` are the authority, and
    `style-doctor` reads them. Classify and dispatch.
17. **A lane with no named validator has not finished.** See
    [Evidence](#evidence-what-a-pass-requires), which holds this rule.
18. **A report that cites a principle without naming the choice it changed is unverified.** The same
    standard as a missing checklist. Applied **by name** — see `principles` for the six that are not
    enforced mechanically.
19. **Verify against the real artifact.** For a bug, the original repro passes **on the same surface
    that failed**. For UI, the rendered output. "It compiles" is not a pass. Route the lane back.
20. **State what you checked and deliberately left alone.** "I looked at these and they were already
    correct" is information. Silence is indistinguishable from not looking.
21. **Never declare a stage passed on plausibility.** See
    [Evidence](#evidence-what-a-pass-requires), which holds this rule.
22. **No fabricated references.** Link only artifacts produced or read this session. An invented
    filename is worse than an admitted gap, because it sends a reader to a dead end with confidence.
23. **The agent that writes the code must not give the final verdict on that code.** A lane reviewing
    its own diff cannot catch a self-consistent mistake, so self-test and review are not the same act
    at two intensities. Self-testing a unit is required; a verdict on it is not available to the lane
    that produced it. Stage 5 is the lane's own check and stage 7 is an independent context, and
    neither is optional. Which stages those are, and which lane holds each, is in
    [the gate sequence](#the-gate-sequence).

### Evidence: what a PASS requires

This section is the whole verification contract. Rules 17 and 21 above point here rather than
restating it, because three copies of one rule is how they drift apart.

**Every verification result names the command that ran and the output it produced.** A check whose
command you cannot name has not been run. Every check reports one of three states:

| State     | Meaning                                                               |
| --------- | --------------------------------------------------------------------- |
| `PASS`    | The command ran and the output supports the claim. Quote the output.  |
| `FAIL`    | The command ran and contradicts the claim. Route it to the fix loop.  |
| `NOT RUN` | The check did not run. Give the reason. Never infer a pass from this. |

"It compiles", "looks good", "everything seems fine", and "should be fine" are not verification. They
are absence of evidence read as evidence.

**An unrun check is `NOT RUN`, never an inferred pass.** A check that was skipped because it was slow,
because the environment lacked a dependency, or because the lane judged it unnecessary is `NOT RUN`
with that reason attached. The one exception is a check that does not apply, and an inapplicable check
is named as inapplicable rather than left blank. Blank is how a skipped check becomes a claimed pass.

**A lane with no named validator has not finished.** The dispatch names who verifies the lane and what
counts as passing, before the lane starts. If the lane cannot name the command it would use, the
prompt is at fault. Fix the prompt and re-dispatch.

Every lane returns a `<verification>` block inside its `<result>`. The implementation roles report on
implementation, the acceptance role on behaviour, and the review role on review. Hold each to that
shape and relay the block through rather than paraphrasing it into vagueness.

**A lane's evidence is relayed exactly as reported. The narrative across lanes is yours.** Two rules
that look opposed and are not. Relay every command a lane names, with the output it produced, at the
strength the lane reported. `FAIL` does not become "worth a look", and a `NOT RUN` does not become
silent. Then write your own reading across lanes, because that part is yours and nobody else's: which
findings interact, what the joined tree is, what no lane checked.

The failure in each direction is named. Substituting your own wording for a lane's evidence launders
it, because the reader can no longer tell whose observation became whose conclusion. Passing a lane's
prose through as your own analysis hands back a list of reports with no cross-lane reading, which is
the one thing the orchestrator exists to add. What a prompt says about writing a summary, and what it
says about relaying evidence, points here rather than restating it.

A bug's repro passes on the same surface that failed. A check that runs against a different surface
proves something else, and reporting it as a pass is the failure this rule exists to prevent.

### The contract change gate

An implementation worker must not silently redefine an agreed contract. When the contract it was
handed turns out to be insufficient to build what was asked, it stops and emits:

```
CONTRACT_CHANGE_REQUIRED
```

carrying the current contract, the proposed change, the reason, the affected domains, the affected
files, and the risk.

**The route that signal takes is in
[the contract change route](#the-contract-change-route).** The rule
is here because it binds the worker that has to stop. The sequence is in
[the gate sequence](#the-gate-sequence) because it describes
who acts next, which is the process's job.

The failure this prevents is a boundary that moves in two directions at once. A frontend lane quietly
changes an API expectation, a backend lane quietly changes the response shape, and the mismatch
surfaces only at final verification, by which point both lanes have reported a self-test pass.

A contract here is a coordination artifact. It is not an agent, not a skill, and not a workflow
subsystem. Where the boundary has a code-level expression, that is
[`packages/shared/types`](../../packages/shared/types), the types and Zod schemas both sides
import instead of re-declaring, and this gate governs the coordination above it. Reuse the artifact
that already exists rather than introducing a second system for the same job.

### What was retired

The previous version of these rules required a daily memory log at
`.codebuddy/memory/YYYY-MM-DD.md`, written before any dispatch, appended after every stage. That
directory never existed and the mechanism is gone. Progress is reported in replies and held in
context; there is no file to maintain and no barrier to honour.

`style-doctor` is the design gate for UI scopes, sequenced by the `code-review` skill in the TECH
pass. A token violation is not separable from the rest of the TECH pass.

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
[the contract change gate](#the-contract-change-gate):
a worker must not silently redefine an agreed contract, and stops with `CONTRACT_CHANGE_REQUIRED`
instead. This is the route the signal takes once it has been emitted.

1. The orchestrator reads the signal and decides whether the proposed change is a design question, an
   evidence question, or both.
2. **Design.** `planner` for a design question.
3. **Evidence.** `critic` establishes what the existing system actually supports in the proposal,
   before it is adopted. It is asked for the evidence the proposal assumes, not for a second design,
   and it answers that question even when the proposal is sound.
4. **Human gate.** A material change triggers it, the same way any other scope decision does.
5. **Re-synchronise.** Every affected lane is re-synchronised on the new contract before work
   continues, so no unit keeps building against the one it was handed.

The failure this prevents is a boundary that moves in two directions at once. A frontend lane quietly
changes an API expectation, a backend lane quietly changes the response shape, and the mismatch surfaces
only at final verification, by which point both lanes have reported a self-test pass.
