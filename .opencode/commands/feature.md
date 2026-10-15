---
description: Ship a feature end to end — settle the design, implement, validate
---

# Feature

You own this task. Plan, verify. Stay in the lead.

A feature is built from a named data shape, through an explicit design pass, to verified behaviour on
the real surface. Scope is decided before code is written, and every user-visible state is part of the
feature.

> **Step 0 — Route.** This workflow is for a feature. If the request is a defect, run `/bug-fix`
> instead; if it is a "where does this live" question, answer it as investigation. State in one line
> what request type you judged this to be, and why.

> **Read order.** Architecture docs for the area in scope, then the code. `docs/features/**` last
> and only for what is already known — a record to update, not a design input.

## Steps

1. **Name the data shape first.** What is the domain model, and which types carry the feature end to
   end? If the feature has an existing shape, align with it; do not invent a parallel one.
2. **Explore the design.** Walk the subsystems in scope: existing components, packages, i18n keys,
   backend contracts. Dispatch the `scout` subagent for the reconnaissance, and run competing
   explorations in parallel where they are independent. Skip only with a one-line `skip: <reason>`.
3. **Settle the shared contract** when two domains are involved: the plan names the boundary and both
   sides import it from `packages/shared/types` instead of re-declaring it.
4. **Write the plan artifact.** One artifact, before any code: the data shape, the boundary decisions,
   the units, the check that ends each, and the acceptance criteria.
5. **Human gate, then implement.** Present the plan and wait for approval. A small, reversible,
   single-domain change may proceed on one line saying why it is safe; anything touching a contract,
   auth, or data shape waits for the human.
6. **Implement in units.** One unit per workstream, with a scope, a data shape, and observable
   success criteria. Self-test each unit before moving on.
7. **Cover the full state space.** Loading, empty, error, and offline states are part of the feature.
   All user-visible text through `t()` in `zh-CN` / `en-US` / `de-DE`; all styles through design-system
   tokens. No hardcoded strings, no magic numbers.
8. **Verify on the real surface.** Run the checks each unit's acceptance criterion names. For changes
   touching UI, routing, forms, or auth, walk the journey in the browser yourself. Report the evidence,
   not the impression: the command and the output that proves each criterion passes. A failed check
   enters the fix loop — fix and re-verify, at most **3 cycles**, then stop and report
   `WORKFLOW BLOCKED` with the unresolved findings. A finding that says the plan is wrong returns to
   step 4 instead of the loop.
9. **Update the feature doc, last**, from the code that shipped. If the change did not alter what the
   document describes, Doc Impact is `none` and you touch nothing.
10. **Stop at the handoff.** Present the summary. Nothing is committed or pushed without the human.

## Reply

Who the feature is for and what changes for them, the data shape, the design choices and tradeoffs, and
how you verified it across states.
