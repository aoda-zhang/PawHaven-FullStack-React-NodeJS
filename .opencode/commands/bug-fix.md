---
description: Reproduce, root-cause, fix, and verify a bug with runtime evidence
---

# Bug Fix

You own this task. Plan, verify. Stay in the lead.

Be scientific. Every shipped line traces to runtime evidence. Reproduce first, then root-cause, then
fix, then verify on the same surface.

> **Step 0 — Route.** This workflow is for a defect. A slow-but-correct surface is a performance
> issue; a "where does this live" question is investigation. State in one line what request type you
> judged this to be, and why.

> **Read order.** Architecture docs and code first; `docs/features/**` last, and only for what is
> already known — a bug may be one of the _Known defects_ the index already tabulates. Read that to
> avoid re-reporting a known issue, never to decide what the code does.

## Steps

1. **Reproduce it yourself, on the matching surface**, and capture the **before evidence** — the
   failing output, the screenshot, the console or network capture on the reproduction path — because
   step 5 replays that same path. Every attempt ends in exactly one of three outcomes:
   - **Reproduced.** You have a surface, an input, and an output to compare against. Continue.
   - **Not reproduced.** You may not ship a fix on this evidence. Keep hunting for the trigger, or say
     plainly that the report could not be reproduced and stop. A speculative patch against an
     unreproduced report is a guess that lands as a permanent code change.
   - **Unable to verify.** The surface is environmental and unreachable. Ship nothing. Capture the
     closest repro you can, name exactly what is missing, and hand that to the human. Inability to
     reproduce is evidence about the surface, not about the report.
2. **Binary-search the cause.** Form candidate hypotheses and rule them out with runtime evidence —
   logs, breakpoints, data inspection. Dispatch the `scout` subagent when the surface is wide;
   converge on the root cause yourself.
3. **Plan the fix.** Design the smallest fix that addresses the root cause: fix the cause, not the
   symptom, and prefer removing code over adding it. A belt-and-suspenders change that might help is a
   hypothesis, not a fix. If the fix moves a component, package, or API boundary, present the plan to
   the human before implementing.
4. **Implement.** Keep the diff as small as the root cause allows, and review it yourself against the
   repro.
5. **Verify on the same surface.** Re-run the **same reproduction path** and capture the **after
   evidence** on it — the same commands, the same journey, the same captures — then compare before
   against after. The original repro passes, **on the same surface that failed**; a check that runs
   against a different surface, build path, or browser proves something else. Inconclusive or
   wrong-surface is not a pass.
6. **Review the diff before finishing.** Walk the full diff against the before/after pair and name
   anything the fix could have broken elsewhere. On a failure, the fix loop applies: fix and re-verify,
   at most **3 cycles**, then stop and report `WORKFLOW BLOCKED` with the unresolved findings. A
   finding that says the diagnosis is wrong returns to step 2 instead of the loop.
7. **Reconcile the docs, last.** A fixed defect is a row in the _Known defects_ table that is now
   wrong. Update the affected `docs/features/<feature>.md` section and the index row. If nothing
   described the defect, Doc Impact is `none`.
8. **Propose the commit split** so the failing repro would land before the fix.
9. **Stop at the handoff.** Present the summary. Nothing is committed or pushed without the human.

## Reply

What was broken, the root cause, the fix, and how you verified it. Paste the failing-then-passing repro
output verbatim, and show the before/after pair with the comparison between them. State explicitly any
environment that was missing and prevented reproduction.
