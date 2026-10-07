---
description: Restructure code without changing behavior, in verifiable steps
---

# Refactoring

You own this task. Plan, review, verify. Stay in the lead.

Refactoring is a behaviour-preserving change to structure or shape: rename, extract, inline, dedupe,
move. The contract is the pinned behaviour. If behaviour changes, it is a feature or a bug fix.

> **Step 0 — Classify.** Run the [`task-classification`](../skills/task-classification/SKILL.md) skill
> and show the user its JSON before this workflow starts. `taskType` must be `refactor`; a behaviour
> change is a `feature` or `bug-fix` and routes elsewhere. When the code being moved is user-visible UI,
> routing, or auth, put `browser-verifier` in `requiredVerification` — the rendered output is the pin
> that proves nothing changed.

> **Whether stage 2 runs** is [the gate sequence](../policies/verification-policy.md#which-stages-are-conditional)'s
> call, keyed on the classification. Read the trigger rather than judging the plan by eye, and record a
> one-line `skip: <reason>` when you skip.

> **Read order.** Architecture docs and code first; `docs/features/**` last. A refactor that only moves
> files describes the same system before and after, so the correct doc impact is usually `none` — and a
> refactor that _does_ require a doc edit is a signal you moved something load-bearing.

## Steps

1. **Pin the behaviour first.** Name the executable checks that guard the code being moved: tests,
   typecheck, snapshots. If none exist and one is cheap, add it. The pin lands before the refactor.
2. **Subtract before you add.** Look for dead weight in the target: one-caller wrappers, superseded
   branches, unused exports. Removing them first makes the refactor smaller and safer —
   [subtract-before-you-add](../skills/principles/references/subtract-before-you-add.md).
3. **Scope the shape.** What moves where, what is renamed, what is extracted. Crosses a package or API
   boundary? Run `/architecture-change` instead. Keep the diff as small as the goal allows.
4. **Plan review, then the human gate.** Dispatch `oracle` unless the classification skips stage 2. A
   public API, an export another package imports, and a module boundary are the changes a sibling lane
   will notice; a move inside one module usually is not. Write the plan artifact first, and do not
   implement until it reads `VERDICT: PASS`. A Standard or Architectural plan also waits for human
   approval.
5. **Refactor in verifiable units.** Move in small slices; after each slice the pin is still green.
   Delegate mechanical slices with an explicit scope, then review each diff yourself and write your own
   reading across the slices —
   [relaying what a lane reported](../policies/verification-policy.md#relaying-what-a-lane-reported).
6. **Verify the pin.** The pinned checks pass unchanged, and that unchanged pair is the actual proof
   that nothing moved behaviourally. Any behaviour change is reconciled deliberately or it does not
   ship. For user-visible code, `browser-verifier` checks the rendered result against the pin too. A
   finding that the pin itself was wrong belongs to
   [when to return to planning](../policies/failure-policy.md#when-to-return-to-planning); everything
   else goes through [the bounded fix loop](../policies/failure-policy.md#the-bounded-fix-loop).
7. **Get an independent review.** Dispatch `reviewer` with a specific question: did the behaviour stay
   identical, and does the pin actually prove it? A refactor is judged by what it did not change, so the
   lane that wrote it cannot answer.
8. **Migrate callers in the same wave.** If a public API or export changed shape, migrate every consumer
   across `apps/` and `packages/` and delete the legacy export —
   [subtract-before-you-add](../skills/principles/references/subtract-before-you-add.md).
9. **Reconcile the docs, last**, if the move changed a path, endpoint, or module boundary that
   `docs/features/**` names. Otherwise Doc Impact is `none`.
10. **Then `/handoff`.**

## Reply

The structural change and why it is worth it, what was pinned and that it stayed green, what moved
where, and what the next owner inherits. Name the principle that changed a decision.
