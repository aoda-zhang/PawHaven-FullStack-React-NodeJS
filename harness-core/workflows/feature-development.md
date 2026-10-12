---
description: 'Ship a feature end to end: settle the design, implement, validate'
---

# Feature

You own this task. Plan, review, verify. Stay in the lead.

A feature is built from a named data shape, through an explicit design pass, to verified behaviour on
the real surface. Scope is decided before code is written, and every user-visible state is part of the
feature.

> **Step 0 — Classify.** Run the [`task-classification`](../plugins/orchestration/skills/task-classification/SKILL.md) skill
> and show the user its JSON before this workflow starts. `taskType` must be `feature`; if it is not,
> route to that workflow instead of bending this one around it. Any user-visible UI, route, form, or
> auth surface in scope puts `browser-verifier` in `requiredVerification`.

> **Which stages run, and when a plan review is skippable**, is
> [the gate sequence](../rules/verification.md#the-gate-sequence)'s call. The classification
> is that gate's entire trigger, so record a one-line `skip: <reason>` when you skip and do not judge
> by eye.

> **Read order.** The architecture docs for the area in scope, then the code. `docs/features/**` last
> and only for what is already known — a record to update, not a design input. See
> [AGENTS.md](../../AGENTS.md#read-the-code-first-write-the-feature-docs-last).

## Steps

1. **Name the data shape first.** What is the domain model, and which types carry the feature end to
   end? Model the domain per
   [model-the-domain](../plugins/orchestration/skills/principles/references/model-the-domain.md) before writing components
   or hooks. If the feature has an existing shape, align with it; do not invent a parallel one.
2. **Explore the design.** Walk the subsystems in scope: existing components, packages, i18n keys,
   backend contracts. Run competing explorations as parallel units where they are independent. Skip
   only with a one-line `skip: <reason>`.
3. **Settle the shared contract** when two domains are involved — the plan names the boundary and where
   it lands, and neither implementation lane drafts it alone:
   [the contract rule](../rules/contract.md#who-settles-it).
4. **Write the plan artifact.** One artifact, before any code: the data shape, the boundary decisions,
   the units, the check that ends each, the acceptance criteria, and the answer to the throughput
   questions — are there blocking steps, independent workstreams, shared mutable state, and what is the
   smallest safe decomposition.
5. **Plan review, then the human gate.** Dispatch `oracle` for an independent read of the plan. That is
   stages 2 and 3 of the [gate sequence](../rules/verification.md#the-gate-sequence):
   implementation does not begin until the plan reads `VERDICT: PASS` and the human has approved it.
6. **Implement in units with named validators.** One dispatch per workstream, with a scope, a data
   shape, and observable success criteria. Run `/parallel-execution` when the units are independent.
7. **Cover the full state space.** Loading, empty, error, and offline states are part of the feature.
   All user-visible text through `t()` in `zh-CN` / `en-US` / `de-DE`; all styles through design-system
   tokens. No hardcoded strings, no magic numbers.
8. **Verify on the real surface, from separate producers.** The writing lane self-tests, `tester`
   reports per criterion, `browser-verifier` runs the journey when the change touches UI, routing,
   forms, or auth, and `reviewer` returns the verdict. Only `PASS` completes the workflow. What each
   must report is [evidence](../rules/verification.md#evidence-what-a-pass-requires); a
   failed check goes to the [bounded fix loop](../rules/failure.md#the-bounded-fix-loop), and
   a finding that the plan is wrong goes to
   [when to return to planning](../rules/failure.md#when-to-return-to-planning).
9. **Update the feature doc, last**, from the code that shipped — routed to the lane that wrote the
   code so the doc and the code land together. If the change did not alter what the document describes,
   Doc Impact is `none` and you touch nothing.
10. **Then `/handoff`.** Stop there: nothing is pushed and no PR is opened.

## Reply

Who the feature is for and what changes for them, the data shape, the design choices and tradeoffs, and
how you verified it across states. Name the principle that changed a decision.
