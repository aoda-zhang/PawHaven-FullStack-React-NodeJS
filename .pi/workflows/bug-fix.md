---
description: Reproduce, root-cause, fix, and verify a bug with runtime evidence
---

# Bug Fix

You own this task. Plan, review, verify. Stay in the lead.

Be scientific. Every shipped line traces to runtime evidence. Reproduce first, then root-cause, then
fix, then verify on the same surface.

> **Step 0 — Classify.** Run the [`task-classification`](../skills/task-classification/SKILL.md) skill
> and show the user its JSON before this workflow starts. `taskType` must be `bug-fix`; a slow-but-
> correct surface is `performance` and a "where does this live" question is `investigation`, and both
> route elsewhere. A UI, routing, form, or auth surface puts `browser-verifier` in
> `requiredVerification` — it re-runs the repro on the same surface.

> **Which stages run** is the classification's call, not this file's:
> [the gate sequence](../policies/verification-policy.md#the-gate-sequence). Record a one-line
> `skip: <reason>` for each stage you leave out. How few files the diff touches is not the trigger — a
> one-line edit across a contract boundary is not Trivial, and stage 7 is never one you may leave out.

> **Read order.** Architecture docs and code first; `docs/features/**` last, and only for what is
> already known. A bug is frequently one of the _Known defects_ the index already tabulates — read that
> to avoid re-reporting a known issue, never to decide what the code does.

## Steps

1. **Reproduce it yourself, on the matching surface**, and capture the **before evidence** — the failing
   output, the screenshot, the console or network capture on the reproduction path — because step 5
   replays that same path. Every attempt ends in exactly one of three outcomes:
   - **Reproduced.** You have a surface, an input, and an output to compare against. Continue.
   - **Not reproduced.** You may not ship a fix on this evidence. Keep hunting for the trigger, or say
     plainly that the report could not be reproduced and stop. A speculative patch against an
     unreproduced report is a guess that lands as a permanent code change.
   - **Unable to verify.** The surface is environmental and unreachable. Ship nothing. Capture the
     closest repro you can, name exactly what is missing, and hand that to the human. Inability to
     reproduce is evidence about the surface, not about the report.
2. **Binary-search the cause.** Form candidate hypotheses and rule them out with runtime evidence —
   logs, breakpoints, data inspection. Fan out parallel investigation units when the surface is wide;
   converge on the root cause yourself.
3. **Plan the fix.** If it crosses a component, package, or API boundary, run `/architecture-change`
   first. Otherwise design the smallest fix that addresses the root cause —
   [fix-root-causes](../skills/principles/references/fix-root-causes.md) and
   [subtract-before-you-add](../skills/principles/references/subtract-before-you-add.md). A
   belt-and-suspenders change that might help is a hypothesis, not a fix. Where the diagnosis moves a
   boundary, write the plan and dispatch `oracle` for an independent read before implementing.
4. **Implement.** Delegate with a scope, a data shape, and success criteria; review the diff yourself.
5. **Verify on the same surface.** Re-run the **same reproduction path** and capture the **after
   evidence** on it — the same commands, the same journey, the same captures — then compare before
   against after. The original repro passes, **on the same surface that failed**; a check that runs
   against a different surface, build path, or browser proves something else. Inconclusive or
   wrong-surface is not a pass. For UI bugs, `browser-verifier` confirms the rendered output and
   re-runs the journey that failed. A failed check goes back through
   [the bounded fix loop](../policies/failure-policy.md#the-bounded-fix-loop).
6. **Get an independent review.** Dispatch `reviewer` on the diff, with the repro, the fix, and the
   before/after pair. A fix verified by the lane that wrote it is the self-approval this harness exists
   to prevent. On `FAIL`, the findings go through
   [the bounded fix loop](../policies/failure-policy.md#the-bounded-fix-loop).
7. **Reconcile the docs, last.** A fixed defect is a row in the _Known defects_ table that is now
   wrong. Update the affected `docs/features/<feature>.md` section and the index row, routed to the lane
   that wrote the fix. If nothing described the defect, Doc Impact is `none`.
8. **Propose the commit split** so the failing repro would land before the fix.
9. **Then `/handoff`.** Stop there: nothing is pushed and no PR is opened.

## Reply

What was broken, the root cause, the fix, and how you verified it. Paste the failing-then-passing repro
output verbatim, and show the before/after pair with the comparison between them. Name the principle
that changed a decision, list the units you dispatched, and state explicitly any environment that was
missing and prevented reproduction.
