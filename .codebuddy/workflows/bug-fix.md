# Bug Fix

You own this task. Plan, review, verify. Delegate investigation and the fix to subagents, stay in the lead.

Be scientific. Every shipped line traces to runtime evidence. Reproduce first, then root-cause, then fix, then verify on the same surface. A bug you cannot reproduce, you cannot prove fixed.

> **Complexity classification** (per pawhaven.md §3.0): Bug fixes are typically **Standard** (multi-file, cross-module) or **Trivial** (single-file, one-liner). pawhaven classifies before starting this workflow.
>
> **Trivial path**: If the bug is a single-file fix (typo, null check, missing import, off-by-one, safe config change), you may run a **lightweight pipeline**: reproduce → fix → validate (lint + typecheck + test) → handoff. Skip the architect, skip the testing agent, skip the two-pass code-review loop. You still write the handoff summary with Doc Impact = `none` or `update`.
>
> **Standard path**: Follow all steps below. If the bug touches API contracts, database entities, or requires a new module, it is Standard (not Trivial).

## Steps

1. **Reproduce it yourself** on the matching surface. Don't hand the repro to the user. Won't reproduce? Force it: synthesize the trigger, instrument until it fires. If the bug is truly environmental (device, account, backend), capture the closest repro you can and say exactly what is missing.
2. **Binary-search the cause.** Form candidate hypotheses and rule them out with runtime evidence (logs, breakpoints, data inspection). Seed hypotheses by reading the relevant code path and, if useful, the regression history. Fan out parallel investigation subagents when the surface is wide; converge on the root cause.
3. **Plan the fix.** If the fix crosses a component, package, or API boundary, run the architecture-change workflow first. Otherwise design the smallest fix that addresses the root cause per **principle-fix-root-causes** and **principle-subtract-before-you-add**. A belt-and-suspenders change that "might help" is a hypothesis, not a fix; it does not ship.
4. **Implement.** Delegate to a subagent with a named data shape and explicit success criteria; review the diff yourself. Model the state per **principle-model-the-domain**; guard at boundaries per **principle-boundary-discipline**.
5. **Verify on the same surface.** The original repro now passes, on the same surface that failed. Inconclusive or wrong-surface is not a pass. Run `pnpm typecheck` and the targeted tests; for UI bugs, confirm the rendered output. Paste failing-then-passing evidence verbatim in the reply.
6. **Stage the commits** so the failing repro lands before the fix, per **principle-sequence-verifiable-units** (TDD cadence when there is a cheap test path).
7. **Run the review handoff** (`workflows/handoff.md`). Include Doc Impact classification (`none` / `update` / `create`). Stop at the handoff: nothing is pushed, no PR is opened. The human reviews the diff and opens the PR.

## Reply

What was broken, the root cause, the fix, and how you verified it. Paste the failing-then-passing repro output verbatim. Name the principles that changed a decision. Also list: which subagents you dispatched, each subagent's Step Completion Checklist status, and the local-repro evidence or an explicit note of what environment is missing that prevented reproduction.
