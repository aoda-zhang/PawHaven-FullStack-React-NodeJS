# Architecture Change

You own this task. Plan, review, verify. Run parallel design exploration, stay in the lead.

An architecture change crosses a component, package, or API boundary, or is a large cross-cutting change. The design is explored in parallel before any implementation, because a boundary decision is expensive to reverse.

## Steps

1. **Name the boundary and the data shape.** What crosses the boundary, in what shape, and who the consumers are across `apps/` and `packages/`. Model the domain first per **principle-model-the-domain**; the shape decides most of the design.
2. **Explore designs in parallel.** Run competing design explorations (how the boundary could look, what each option costs) as parallel subagents. Converge on a recommendation with the tradeoffs each option accepted. Skip only with a one-line `skip: <reason>`.
3. **Run the design-decision workflow for the choice.** If more than one credible design survives step 2, apply `workflows/design-decision.md` before implementing.
4. **Plan the migration wave.** Per **principle-migrate-callers-then-delete-legacy-apis** and **principle-outcome-oriented-execution**: the new path, all callers migrated, the legacy path deleted, in one wave (or one reviewable stack of PRs). No lingering dual paths.
5. **Decompose into verifiable units.** Each unit ends in a check: typecheck, tests, and for UI boundaries a render check. Per **principle-sequence-verifiable-units**, deliver in an order where each step proves the previous one.
6. **Implement and review.** Delegate per-workstream to subagents with named data shapes and success criteria. **If the implementation wave is long** (multiple independent workstreams, likely > 300s per subagent), run the **parallel-execution** workflow (`workflows/parallel-execution.md`): split into small units, dispatch them in parallel, and join them through the memory-file barrier — each unit appends its status to today's `.codebuddy/memory/YYYY-MM-DD.md`, reads the entire memory file, waits for all sibling units, then reports back. Review every diff yourself; write your own summary. Guard at the boundary per **principle-boundary-discipline**.
7. **Verify the boundary end to end.** All consumers migrated, legacy deleted, `pnpm typecheck` green, targeted tests green, and the real surface renders the intended behavior.
8. **Record the decision.** Update `docs/` (architecture or ADR) so the boundary reasoning outlives the change, per the documentation rule. Small ordered commits, then the review handoff (`workflows/handoff.md`).

## Reply

The boundary, the shape that crosses it, the design options explored and why the chosen one won, the migration wave, and how the end-to-end verification proved it. Name the principles that changed a decision.
