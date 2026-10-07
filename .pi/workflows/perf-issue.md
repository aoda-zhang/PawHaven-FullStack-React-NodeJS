---
description: Diagnose and fix a performance problem using measurements
---

# Perf Issue

You own this task. Plan, review, verify. Stay in the lead.

Perf work is measurement-gated. Without a baseline, an optimization is a hypothesis. Measure, then
optimize, then measure again on the same surface.

> **Step 0 — Classify.** Run the [`task-classification`](../skills/task-classification/SKILL.md) skill
> and show the user its JSON before this workflow starts. `taskType` must be `performance`; a surface
> that is wrong rather than slow is a `bug-fix`, and a page you cannot yet explain is an
> `investigation`. Both routes start with a measurement anyway. When the slow surface is UI, routing, or
> auth, `browser-verifier` captures the baseline and the after numbers on the same surface.

## Steps

1. **Capture the baseline.** Measure the reported slowness on the real surface — devtools, profiler,
   traced interaction — and record the numbers. The baseline trace is the contract, and it lands before
   any change.
2. **Trace the cause, not the symptom.** Profile to find where the time actually goes: renders, network,
   bundle, effects, re-render cascades. Rule out hypotheses with evidence. Fan out parallel profiling
   units across a wide surface; converge on the bottleneck yourself.
3. **Optimize the smallest change** that targets the measured bottleneck —
   [subtract-before-you-add](../skills/principles/references/subtract-before-you-add.md). If the fix
   touches state shape, model the domain first
   ([model-the-domain](../skills/principles/references/model-the-domain.md)): a memo or effect tweak is
   often a symptom, and the real fix is moving the state to the right home.
4. **Re-measure on the same surface.** The before and after numbers are the evidence, and both come from
   the same route, build state, machine, and interaction. If it did not improve, the change is a
   hypothesis, not a fix, and it does not ship. A number from a different surface is not a comparison. A
   UI bottleneck is re-measured by `browser-verifier` on the same route.
5. **Get an independent review.** Dispatch `reviewer` with a specific question: is the reported
   improvement real, and was it measured on the same surface as the baseline in step 1? Hand it the
   baseline trace, the post-fix trace, and the surface both came from. A `FAIL` goes through
   [the bounded fix loop](../policies/failure-policy.md#the-bounded-fix-loop).
6. **Guard the win.** Add the cheapest check that would catch a regression — a perf assertion, a test, a
   re-measurement note — when one is practical.
7. **Verify.** `pnpm typecheck`, targeted tests, and the before/after numbers. Then reconcile
   `docs/features/<feature>.md` if the change altered what a document describes, including a _Known
   defects_ row that recorded the slowness and no longer holds. Then `/handoff`.

## Reply

The baseline numbers, the traced bottleneck with evidence, the fix and why it addresses the root cause,
the before/after numbers pasted verbatim, and the regression guard. Name the principle that changed a
decision.
