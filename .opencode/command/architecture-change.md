---
description: Design and land a structural change that crosses module, package, or API boundaries
agent: orchestrator
---

# Architecture Change

You own this task. Plan, review, verify. Run parallel design exploration, stay in the lead.

An architecture change crosses a component, package, or API boundary, or is a large cross-cutting change. The design is explored in parallel before any implementation, because a boundary decision is expensive to reverse.

## Steps

1. **Name the boundary and the data shape.** What crosses the boundary, in what shape, and who the consumers are across `apps/` and `packages/`. Model the domain first per **model-the-domain** (via the `principles` skill); the shape decides most of the design.
2. **Explore designs in parallel.** Run competing design explorations (how the boundary could look, what each option costs) as parallel subagents. Converge on a recommendation with the tradeoffs each option accepted. Skip only with a one-line `skip: <reason>`.
3. **Run `/design-decision` for the choice.** If more than one credible design survives step 2, settle it before implementing.
4. **Plan the migration wave.** Per **migrate-callers-then-delete-legacy-apis** (enforced by the orchestrator workflow) and **outcome-oriented-execution** (enforced by the orchestrator workflow): the new path, all callers migrated, the legacy path deleted, in one wave (or one reviewable stack of PRs). No lingering dual paths.
5. **Decompose into verifiable units.** Each unit ends in a check: typecheck, tests, and for UI boundaries a render check. Per **sequence-verifiable-units** (enforced by the orchestrator workflow), deliver in an order where each step proves the previous one.
6. **Implement and review.** Delegate per-workstream to subagents with named data shapes and success criteria. **If the implementation wave is long** (multiple independent workstreams with no dependency between them), run `/parallel-execution`: split into small verifiable units, dispatch them as background tasks, and join them yourself — you are the barrier, and `task_status` is the only progress check. Review every diff yourself; write your own summary. Guard at the boundary per **boundary-discipline** (via the `principles` skill).
7. **Verify the boundary end to end.** All consumers migrated, legacy deleted, `pnpm typecheck` green, targeted tests green, and the real surface renders the intended behavior.
8. **Record the decision.** Update the living architecture docs in `docs/` so the boundary reasoning outlives the change, per the documentation rule. No ADR records. Then `/handoff`.

## Reply

The boundary, the shape that crosses it, the design options explored and why the chosen one won, the migration wave, and how the end-to-end verification proved it. Name the principles that changed a decision.
