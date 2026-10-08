---
description: Design and land a structural change that crosses module, package, or API boundaries
---

# Architecture Change

You own this task. Plan, review, verify. Stay in the lead.

A change crosses a component, package, or API boundary when it moves who owns something, not when it
touches many files. The design is explored before any implementation, because a boundary decision is
expensive to reverse.

> **Step 0 — Classify.** Run the [`task-classification`](../plugins/orchestration/skills/task-classification/SKILL.md) skill
> and show the user its JSON before this workflow starts. The signal is the boundary, not the size.
> `risk: critical` needs explicit human confirmation before anything irreversible runs. > `harness-core/` itself is `risk: high` and its required validation is the harness workflow. A change to canonical source also regenerates every runtime and validates that the runtime loads it. A moved UI or auth
> boundary puts `browser-verifier` in `requiredVerification`.

> **Read order.** The architecture docs are the primary input here rather than a preamble — all three,
> plus `authentication-architecture.md` when a trust boundary is in scope. Then the code.
> `docs/features/**` last, as the record this change invalidates.

## Steps

1. **Name the boundary and the data shape.** What crosses it, in what shape, and who the consumers are
   across `apps/` and `packages/`. Model the domain first per
   [model-the-domain](../plugins/orchestration/skills/principles/references/model-the-domain.md); the shape decides most of
   the design.
2. **Explore the design.** Name the competing shapes and what each costs. Where the options are
   independent, run them as parallel background units and converge yourself. Skip only with a one-line
   `skip: <reason>`.
3. **Settle the choice** with `/design-decision` when more than one credible design survives.
4. **Plan the migration wave.** The new path, every caller migrated, the legacy path deleted, in one
   wave — per [subtract-before-you-add](../plugins/orchestration/skills/principles/references/subtract-before-you-add.md).
   No lingering dual paths.
5. **Settle the shared contract**, and where it lands. If two domains are involved, the plan names the
   boundary: [the contract rule](../rules/contract.md#who-settles-it).
6. **Decompose into verifiable units**, each ending in a check — `pnpm typecheck`, the targeted tests,
   and for a UI boundary a render check. Order them so each step proves the previous one.
7. **Write the plan, review it, get it approved.** One artifact: the boundary, the chosen design, the
   migration wave, the units, the runnable check that ends each one, and the acceptance criteria.
   Dispatch `oracle` for an independent read — **plan review is not optional in this workflow**, because
   a boundary decision is the strongest case for a read by someone who did not write it. That is stages
   2 and 3 of the [gate sequence](../rules/verification.md#the-gate-sequence); implementation
   does not begin until the plan reads `VERDICT: PASS` and the human has approved it.
8. **Implement, in units, with named validators.** Delegate per workstream with a scope, a data shape,
   and observable success criteria. Run `/parallel-execution` when the units are genuinely independent.
   Guard at the boundary per
   [boundary-discipline](../plugins/orchestration/skills/principles/references/boundary-discipline.md). A worker that cannot
   build what it was handed stops and signals `CONTRACT_CHANGE_REQUIRED` —
   [the route](../rules/contract.md#the-contract-change-route).
9. **Verify the boundary end to end.** Every consumer migrated, the legacy path deleted, and the real
   surface showing the intended behaviour — `browser-verifier` where that surface is UI, routing, or
   auth. The harness checks on top when the change touched the harness itself. A failed check goes through
   [the bounded fix loop](../rules/failure.md#the-bounded-fix-loop); a finding that the
   boundary or the plan is wrong goes to
   [when to return to planning](../rules/failure.md#when-to-return-to-planning).
10. **Record the decision.** Update `docs/architecture/` so the boundary reasoning outlives the change,
    and reconcile whichever `docs/features/<feature>.md` names the old owner. Both edits ship with the
    code, routed to the lane that made the change.
11. **Then `/handoff`.**

## Reply

The boundary, the shape that crosses it, the options explored and why the chosen one won, the migration
wave, and how the end-to-end verification proved it. Name the principle that changed a decision.
