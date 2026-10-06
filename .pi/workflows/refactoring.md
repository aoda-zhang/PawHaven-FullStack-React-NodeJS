---
description: Restructure code without changing behavior, in verifiable steps
---

# Refactoring

You own this task. Plan, review, verify. Delegate mechanical work to subagents, stay in the lead.

Refactoring is a behavior-preserving change to structure or shape: rename, extract, inline, dedupe, move. The contract is the pinned behavior. If behavior changes, it is a feature or a bug fix, not a refactor.

> **Step 0 — Classify.** Run the [`task-classification`](../skills/task-classification/SKILL.md)
> skill and show the user its JSON before this workflow starts. `taskType` must be `refactor`; a
> behavior change is a `feature` or `bug-fix` and routes elsewhere. When the code being moved is
> user-visible UI, routing, or auth, put `browser-verifier` in `requiredVerification` — the rendered
> output is the pin that proves nothing changed.

> **Read order.** Architecture docs and code first; `docs/features/**` last. A refactor that only
> moves files should describe the same system before and after, so usually the correct doc impact is
> `none` — and a refactor that _does_ require a doc edit is a signal you moved something that was
> load-bearing.

## Steps

1. **Pin the behavior first.** Identify the executable checks that guard the code being moved: tests, typecheck, snapshots. If none exist and one is cheap, add it. Per **sequence-verifiable-units** (enforced by the orchestrator workflow), the pin lands before the refactor.
2. **Subtract before you add.** Look for dead weight in the refactoring target: one-caller wrappers, superseded branches, unused exports. Per **subtract-before-you-add** (via the `principles` skill) and **laziness-protocol** (via the `principles` skill), removing them first makes the refactor smaller and safer.
3. **Scope the shape.** Name the target structure: what moves where, what is renamed, what is extracted. Crosses a package or API boundary? Run the architecture-change workflow instead. Keep the diff as small as the goal allows.
4. **Plan review, then the human gate.** Whether stage 2 runs is the shared rule's call, keyed on the classification. Read the trigger in the [gate sequence](./harness-process.md#the-gate-sequence) rather than judging the plan by eye, and record a one-line `skip: <reason>` when you skip. The shape you named in step 3 changes how much the read is worth, not whether it is required. A public API, an export another package imports, and a module boundary are the changes a sibling lane will notice, and a move inside one module is often the rubber stamp `critic` exists to avoid. Where the shape and the trigger disagree, the classification decides. Write the plan artifact first, and do not implement until it reads `VERDICT: PASS`. A Standard or Architectural plan also waits for human approval. A refactor that crosses a package or API boundary outright routes to `/architecture-change` per step 3, which reviews its own plan.
5. **Refactor in verifiable units.** Move or rename in small slices; after each slice, the pin is still green. Delegate mechanical slices to subagents with explicit scope, then review each diff yourself and write your own reading across the slices, per [Evidence](../skills/project-rules/references/orchestrator.md#evidence-what-a-pass-requires).
6. **Verify the pin.** The pinned checks pass unchanged. The pin landed before the refactor and is green after it, and that unchanged pair is the actual proof that nothing moved behaviorally. Any change to behavior is a red flag; reconcile it deliberately or it does not ship. For user-visible code, dispatch `browser-verifier` so the rendered result is checked against the pin too. A finding that the pin itself was wrong, rather than the code, is not a defect: it belongs to [When to return to planning](./harness-process.md#when-to-return-to-planning). Everything else goes through the [bounded fix loop](./harness-process.md#the-bounded-fix-loop).
7. **Get an independent review.** Dispatch `reviewer` on the diff. Its question here is specific: did the behavior actually stay identical, and does the pin from step 1 actually prove it? A refactor is judged by what it did not change, so a lane that wrote it cannot be the one that answers. Hand it the pinned checks and the before/after result from step 6; hold it to `VERDICT: PASS` or `VERDICT: FAIL`, and route a `FAIL` through the [bounded fix loop](./harness-process.md#the-bounded-fix-loop). It runs before the handoff because `/handoff` reports a verdict it does not produce.
8. **Migrate callers in the same wave.** If a public API or export changed shape, migrate all consumers across `apps/` and `packages/` and delete the legacy export per **migrate-callers-then-delete-legacy-apis** (enforced by the orchestrator workflow).
9. **Reconcile the docs, last.** If a refactor changed a file path, endpoint, or module boundary that `docs/features/**` names, update it from the code that shipped, routed to the lane that did the move. If the document still describes the same system, Doc Impact is `none` and you touch nothing.
10. **Then `/handoff`**.

## Reply

The structural change and why it is worth it, what was pinned and that it stayed green, what moved where, and what the next owner inherits. Name the principles that changed a decision.
