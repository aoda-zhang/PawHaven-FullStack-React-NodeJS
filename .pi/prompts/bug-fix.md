---
description: Reproduce, root-cause, fix, and verify a bug with runtime evidence
---

# Bug Fix

You own this task. Plan, review, verify. Delegate investigation and the fix to subagents, stay in the lead.

Be scientific. Every shipped line traces to runtime evidence. Reproduce first, then root-cause, then fix, then verify on the same surface. A bug you cannot reproduce, you cannot prove fixed.

> **Complexity classification**: bug fixes are typically **Standard** (multi-file, cross-module) or
> **Trivial** (single-file, one-liner). Classify before starting, and name the principle that drove
> the call.
>
> **Trivial path**: If the bug is a single-file fix (typo, null check, missing import, off-by-one, safe config change), you may run a **lightweight pipeline**: reproduce → fix → validate (lint + typecheck + test) → handoff. Skip the architect, skip the testing agent, skip the two-pass code-review loop. You still write the handoff summary with Doc Impact = `none` or `update`.
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

1. **Reproduce it yourself** on the matching surface. Don't hand the repro to the user. Won't reproduce? Force it: synthesize the trigger, instrument until it fires. If the bug is truly environmental (device, account, backend), capture the closest repro you can and say exactly what is missing.
2. **Binary-search the cause.** Form candidate hypotheses and rule them out with runtime evidence (logs, breakpoints, data inspection). Seed hypotheses by reading the relevant code path and, if useful, the regression history. Fan out parallel investigation subagents when the surface is wide; converge on the root cause.
3. **Plan the fix.** If the fix crosses a component, package, or API boundary, run the `/architecture-change` command first. Otherwise design the smallest fix that addresses the root cause per **fix-root-causes** (via the `principles` skill) and **subtract-before-you-add** (via the `principles` skill). A belt-and-suspenders change that "might help" is a hypothesis, not a fix; it does not ship.
4. **Implement.** Delegate to a subagent with a named data shape and explicit success criteria; review the diff yourself. Model the state per **model-the-domain** (via the `principles` skill); guard at boundaries per **boundary-discipline** (via the `principles` skill).
5. **Verify on the same surface.** The original repro now passes, on the same surface that failed. Inconclusive or wrong-surface is not a pass. Run `pnpm typecheck` and the targeted tests; for UI bugs, dispatch `browser-verifier` to confirm the rendered output and re-run the journey that failed. Paste failing-then-passing evidence verbatim in the reply.
6. **Reconcile the docs, last.** A fixed defect is a row in the _Known defects_ table that is now wrong. Once the fix is verified, update the affected `docs/features/<feature>.md` section and remove or amend the index row — routed to the lane that wrote the fix. If the fix closed a _What Does Not Exist_ gap, say so there instead. If nothing in the docs described the defect, Doc Impact is `none`; if the doc described it wrongly in the other direction, that is a finding to report.
7. **Propose the commit split** so the failing repro would land before the fix, per **sequence-verifiable-units** (TDD cadence when there is a cheap test path). Leave the changes in the working tree — committing is the user's.
8. **Run the review handoff** (`/handoff`). Include Doc Impact classification (`none` / `update` / `create`). Stop at the handoff: nothing is pushed, no PR is opened. The human reviews the diff and opens the PR.

## Reply

What was broken, the root cause, the fix, and how you verified it. Paste the failing-then-passing repro output verbatim. Name the principles that changed a decision. Also list: which subagents you dispatched, each subagent's Step Completion Checklist status, and the local-repro evidence or an explicit note of what environment is missing that prevented reproduction.
