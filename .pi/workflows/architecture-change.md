---
description: Design and land a structural change that crosses module, package, or API boundaries
---

# Architecture Change

You own this task. Plan, review, verify. Run parallel design exploration, stay in the lead.

An architecture change crosses a component, package, or API boundary, or is a large cross-cutting change. The design is explored in parallel before any implementation, because a boundary decision is expensive to reverse.

> **Step 0 — Classify.** Run the [`task-classification`](../skills/task-classification/SKILL.md)
> skill and show the user its JSON before this workflow starts. The signal is the boundary, not the
> size: crossing service responsibility, domain ownership, or a cross-service contract makes this an
> `architecture-change` even when the diff is small. A `risk: critical` classification (a
> destructive migration, destructive data operation, or production infrastructure change) needs
> explicit human confirmation before anything irreversible runs. A change to the agent harness itself
> (`.pi/`) is `risk: high` and never takes a lightweight path, however small the diff: it changes the
> process every other lane runs under, and its required validation is `pnpm pi-check`. A moved UI or
> auth boundary puts `browser-verifier` in `requiredVerification`.

> **Read order.** All three architecture docs, plus `authentication-architecture.md` when a trust
> boundary is in scope — this workflow is the one case where the architecture docs are the primary
> input rather than a preamble. Then the code. `docs/features/**` comes last, as the record of what
> the change invalidates, not as an input to the boundary decision.

## Steps

1. **Name the boundary and the data shape.** What crosses the boundary, in what shape, and who the consumers are across `apps/` and `packages/`. Model the domain first per **model-the-domain** (via the `principles` skill); the shape decides most of the design.
2. **Explore designs in parallel.** Run competing design explorations (how the boundary could look, what each option costs) as parallel subagents. Converge on a recommendation with the tradeoffs each option accepted. Skip only with a one-line `skip: <reason>`.
3. **Run `/design-decision` for the choice.** If more than one credible design survives step 2, settle it before implementing.
4. **Plan the migration wave.** Per **migrate-callers-then-delete-legacy-apis** (enforced by the orchestrator workflow) and **outcome-oriented-execution** (enforced by the orchestrator workflow): the new path, all callers migrated, the legacy path deleted, in one wave (or one reviewable stack of PRs). No lingering dual paths.
5. **Decompose into verifiable units.** Each unit ends in a check: typecheck, tests, and for UI boundaries a render check. Per **sequence-verifiable-units** (enforced by the orchestrator workflow), deliver in an order where each step proves the previous one.
6. **Write the plan, review it, get it approved.** One artifact: the boundary, the chosen design, the migration wave, the units, and the check that ends each one. Dispatch `critic` for an independent read. **Plan review is not optional in this workflow.** A boundary decision is expensive to reverse, which is the strongest argument for a read by someone who did not write it; `critic` returns `VERDICT: PASS` or `VERDICT: REVISE` about the plan, never about code. Implementation does not begin until the plan reads `VERDICT: PASS` **and** the human has approved it. These are stages 2 and 3 of the [gate sequence](./harness-process.md#the-gate-sequence).
7. **Implement and review.** Delegate per-workstream to subagents with named data shapes and success criteria. **If the implementation wave is long** (multiple independent workstreams with no dependency between them), run `/parallel-execution`: split into small verifiable units, dispatch them as background tasks, and join them yourself — you are the barrier, and bg_wait is the only progress check. Review every diff yourself, and relay each lane's verification exactly as it was reported while writing your own reading across lanes, per [Evidence](../skills/project-rules/references/orchestrator.md#evidence-what-a-pass-requires). Guard at the boundary per **boundary-discipline** (via the `principles` skill).
8. **Verify the boundary end to end.** All consumers migrated, legacy deleted, `pnpm typecheck` green, targeted tests green, and the real surface renders the intended behavior. Where that surface is UI, routing, or auth, `browser-verifier` runs the journey that crosses the boundary. The writing lane's own checks, `tester` on the acceptance criteria, and `reviewer`'s `VERDICT: PASS` are three separate contexts; what each must report is in [Evidence](../skills/project-rules/references/orchestrator.md#evidence-what-a-pass-requires). When the change touches `.pi/`, `pnpm pi-check` is required on top of the above. A failed stage goes through the [bounded fix loop](./harness-process.md#the-bounded-fix-loop); a finding that the boundary or the plan is wrong goes to [When to return to planning](./harness-process.md#when-to-return-to-planning) rather than through the loop.
9. **Record the decision.** Update the living architecture docs in `docs/architecture/` so the boundary reasoning outlives the change, per the documentation rule. No ADR records. Then reconcile `docs/features/<feature>.md` — a moved boundary changes the §"What Does Not Exist" and the service-boundary content of whichever feature docs name the old owner. Both edits ship with the code, routed to the lane that made the change. Then `/handoff`.

## Reply

The boundary, the shape that crosses it, the design options explored and why the chosen one won, the migration wave, and how the end-to-end verification proved it. Name the principles that changed a decision.
