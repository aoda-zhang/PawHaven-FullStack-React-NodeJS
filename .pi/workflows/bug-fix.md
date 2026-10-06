---
description: Reproduce, root-cause, fix, and verify a bug with runtime evidence
---

# Bug Fix

You own this task. Plan, review, verify. Delegate investigation and the fix to subagents, stay in the lead.

Be scientific. Every shipped line traces to runtime evidence. Reproduce first, then root-cause, then fix, then verify on the same surface.

> **Complexity classification**: bug fixes are typically **Standard** or **Trivial**, and
> [`task-classification`](../skills/task-classification/SKILL.md) defines what each one means.
> Classify before starting, and name the principle that drove the call.
>
> **Trivial path**: A `Trivial` or `low`-complexity bug fix runs reproduce → fix → self-test with named
> evidence → hand the diff to `reviewer` → `/handoff`. Which stages that path leaves out is the [gate
> sequence](./harness-process.md#the-gate-sequence)'s call, keyed on the
> classification, and record a one-line `skip: <reason>` for each one you leave out. How few files the
> diff touches is not the trigger: a one-line edit across a contract boundary is not Trivial, and a
> Trivial fix is still a Trivial fix however it is spaced. Stage 7 is not one you may leave out.
> Independent review is not negotiable, because a single-file bug fix is still a mutating change and the
> root `AGENTS.md` says every mutating change gets an independent review — a fix reviewed by the lane
> that wrote it is the self-approval this harness exists to prevent. So reproduce the failure, fix it,
> run your own checks and name the output, then send the diff to `reviewer` for a verdict, then
> `/handoff` with Doc Impact = `none` or `update`.
>
> **Standard path**: Follow all steps below. If the bug touches API contracts, database entities, or requires a new module, it is Standard (not Trivial).

> **Step 0 — Classify.** Run the [`task-classification`](../skills/task-classification/SKILL.md)
> skill and show the user its JSON before this workflow starts. `taskType` must be `bug-fix`; a
> slow-but-correct surface is `performance` and a "where does this live" question is
> `investigation`, and both route elsewhere. A UI, routing, form, or auth surface puts
> `browser-verifier` in `requiredVerification` — it re-runs the repro on the same surface.

> **Read order.** Architecture docs and code first; `docs/features/**` last, and only for what is
> already known. A bug is frequently one of the _Known defects_ the index already tabulates — read
> that to avoid re-reporting a known issue, never to decide what the code does.

## Steps

1. **Reproduce it yourself** on the matching surface. Don't hand the repro to the user. Won't reproduce? Force it: synthesize the trigger, instrument until it fires. Every repro attempt ends in exactly one of three outcomes, and each one permits a different next step:
   - **Bug reproduced.** The failing case runs. You have a surface, an input, and an output to compare against. Continue to step 2.
   - **Bug not reproduced.** The trigger does not fire on any surface you tried. You may not ship a fix on this evidence alone. Either keep hunting for the trigger, or say plainly that the report could not be reproduced and stop; a speculative patch against an unreproduced report is a guess that lands as a permanent code change.
   - **Unable to verify.** The surface is environmental and you cannot reach it: a device, an account, a backend state, a production-only condition. Ship nothing. Capture the closest repro you can, name exactly what is missing, and hand that to the human. **Inability to reproduce is not evidence the bug does not exist.** It is evidence about the surface, not about the report.
2. **Binary-search the cause.** Form candidate hypotheses and rule them out with runtime evidence (logs, breakpoints, data inspection). Seed hypotheses by reading the relevant code path and, if useful, the regression history. Fan out parallel investigation subagents when the surface is wide; converge on the root cause.
3. **Plan the fix.** If the fix crosses a component, package, or API boundary, run the `/architecture-change` command first. Otherwise design the smallest fix that addresses the root cause per **fix-root-causes** (via the `principles` skill) and **subtract-before-you-add** (via the `principles` skill). A belt-and-suspenders change that "might help" is a hypothesis, not a fix; it does not ship. When the diagnosis implies a boundary change the first sentence did not catch, write the plan artifact and dispatch `critic` for an independent read, and do not implement until it reads `VERDICT: PASS`. See the [gate sequence](./harness-process.md#the-gate-sequence).
4. **Implement.** Delegate to a subagent with a named data shape and explicit success criteria; review the diff yourself. Model the state per **model-the-domain** (via the `principles` skill); guard at boundaries per **boundary-discipline** (via the `principles` skill).
5. **Verify on the same surface.** The original repro now passes, **on the same surface that failed**. That phrase is the whole rule: a check that runs against a different surface, or a different build path, or a different browser proves something else, and reporting it as a pass is the failure this step exists to prevent. Inconclusive or wrong-surface is not a pass. Run `pnpm typecheck` and the targeted tests; for UI bugs, dispatch `browser-verifier` to confirm the rendered output and re-run the journey that failed. Paste failing-then-passing evidence verbatim in the reply. What each check must report before it counts as passed is in [Evidence](../skills/project-rules/references/orchestrator.md#evidence-what-a-pass-requires). A failed check goes back to the writing lane through the [bounded fix loop](./harness-process.md#the-bounded-fix-loop).
6. **Get an independent review.** Dispatch `reviewer` on the diff. A fix verified by the lane that wrote it is the self-approval this harness exists to prevent, and a Standard bug fix is a mutating change like any other. Hand it the repro, the fix, and the same-surface evidence from step 5; hold it to `VERDICT: PASS` or `VERDICT: FAIL`. On `FAIL`, the findings go back through the [bounded fix loop](./harness-process.md#the-bounded-fix-loop). Only a `PASS` moves to the next step. It runs before the handoff because `/handoff` reports a verdict it does not produce.
7. **Reconcile the docs, last.** A fixed defect is a row in the _Known defects_ table that is now wrong. Once the fix is verified, update the affected `docs/features/<feature>.md` section and remove or amend the index row — routed to the lane that wrote the fix. If the fix closed a _What Does Not Exist_ gap, say so there instead. If nothing in the docs described the defect, Doc Impact is `none`; if the doc described it wrongly in the other direction, that is a finding to report.
8. **Propose the commit split** so the failing repro would land before the fix, per **sequence-verifiable-units** (TDD cadence when there is a cheap test path). Leave the changes in the working tree — committing is the user's.
9. **Run the review handoff** (`/handoff`). Include Doc Impact classification (`none` / `update` / `create`). Stop at the handoff: nothing is pushed, no PR is opened. The human reviews the diff and opens the PR.

## Reply

What was broken, the root cause, the fix, and how you verified it. Paste the failing-then-passing repro output verbatim. Name the principles that changed a decision. Also list: which subagents you dispatched, each subagent's Step Completion Checklist status, and the local-repro evidence or an explicit note of what environment is missing that prevented reproduction.
