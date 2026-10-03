---
description: Diagnose and fix a performance problem using measurements
---

# Perf Issue

You own this task. Plan, review, verify. Delegate measurement to subagents, stay in the lead.

Perf work is measurement-gated. Without a baseline, an optimization is a hypothesis. Measure, then optimize, then measure again on the same surface.

> **Step 0 — Classify.** Run the [`task-classification`](../skills/task-classification/SKILL.md)
> skill and show the user its JSON before this workflow starts. `taskType` must be `performance`; a
> surface that is wrong rather than slow is a `bug-fix`, and a page you cannot yet explain is an
> `investigation`. Both routes start with a measurement anyway. When the slow surface is UI, routing,
> or auth, `browser-verifier` captures the baseline and the after numbers on the same surface.

## Steps

1. **Capture the baseline.** Measure the reported slowness on the real surface (devtools, profiler, traced interaction) and record the numbers. The baseline trace is the contract; per **sequence-verifiable-units** (enforced by the orchestrator workflow), it lands before any change.
2. **Trace the cause, not the symptom.** Profile to find where the time actually goes: renders, network, bundle, effects, re-render cascades. Rule out hypotheses with evidence. Fan out parallel profiling subagents across wide surfaces; converge on the bottleneck.
3. **Optimize the smallest change.** Target the measured bottleneck with the smallest change that fixes it, per **laziness-protocol** (via the `principles` skill). Model the domain if the fix touches state shape (**model-the-domain** (via the `principles` skill)): often a memo or effect fix is a symptom, and the real fix is moving state to the right home.
4. **Re-measure on the same surface.** The post-fix trace shows the improvement against the baseline. If it does not improve, the change is a hypothesis, not a fix; it does not ship. A UI bottleneck is re-measured by `browser-verifier` on the same route, not on a different one.
5. **Guard the win.** Add the cheapest check that would catch a regression (a perf assertion, a test, a re-measurement note) when one is practical.
6. **Verify.** `pnpm typecheck`, targeted tests, the before/after numbers. Then reconcile `docs/features/<feature>.md` if the change altered what a document describes — including a _Known defects_ row that recorded the slowness and no longer holds. Then `/handoff`.

## Reply

The baseline numbers, the traced bottleneck with evidence, the fix and why it addresses the root cause, the before/after numbers pasted verbatim, and the regression guard. Name the principles that changed a decision.
