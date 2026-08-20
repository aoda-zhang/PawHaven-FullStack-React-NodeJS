# Refactoring

You own this task. Plan, review, verify. Delegate mechanical work to subagents, stay in the lead.

Refactoring is a behavior-preserving change to structure or shape: rename, extract, inline, dedupe, move. The contract is the pinned behavior. If behavior changes, it is a feature or a bug fix, not a refactor.

## Steps

1. **Pin the behavior first.** Identify the executable checks that guard the code being moved: tests, typecheck, snapshots. If none exist and one is cheap, add it. Per **principle-sequence-verifiable-units**, the pin lands before the refactor.
2. **Subtract before you add.** Look for dead weight in the refactoring target: one-caller wrappers, superseded branches, unused exports. Per **principle-subtract-before-you-add** and **principle-laziness-protocol**, removing them first makes the refactor smaller and safer.
3. **Scope the shape.** Name the target structure: what moves where, what is renamed, what is extracted. Crosses a package or API boundary? Run the architecture-change workflow instead. Keep the diff as small as the goal allows.
4. **Refactor in verifiable units.** Move or rename in small slices; after each slice, the pin is still green. Delegate mechanical slices to subagents with explicit scope; review each diff yourself.
5. **Verify the pin.** The pinned checks pass unchanged. Any change to behavior is a red flag; reconcile it deliberately or it does not ship.
6. **Migrate callers in the same wave.** If a public API or export changed shape, migrate all consumers across `apps/` and `packages/` and delete the legacy export per **principle-migrate-callers-then-delete-legacy-apis**.
7. **Small ordered commits, then the review handoff** (`workflows/handoff.md`).

## Reply

The structural change and why it is worth it, what was pinned and that it stayed green, what moved where, and what the next owner inherits. Name the principles that changed a decision.
