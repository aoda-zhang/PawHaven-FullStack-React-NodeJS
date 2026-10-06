---
description: 'Ship a feature end to end: explore the design, implement, validate'
---

# Feature

You own this task. Plan, review, verify. Delegate implementation to subagents, stay in the lead.

A feature is built from a named data shape, through an explicit design pass, to verified behavior on the real surface. Scope is decided before code is written, and every user-visible state is part of the feature.

> **Complexity classification**: features are typically **Standard** or **Architectural**. Classify
> before starting and name the principle that drove the call. Standard features follow the steps
> below. Architectural features add a living-architecture-docs update step and mandatory design
> review before implementation begins.

> **Step 0 — Classify.** Run the [`task-classification`](../skills/task-classification/SKILL.md)
> skill and show the user its JSON before this workflow starts. `taskType` must be `feature`; if it
> is not, route to that workflow instead of bending this one around it. Any user-visible UI, route,
> form, or auth surface in scope puts `browser-verifier` in `requiredVerification` — for a complex
> feature that is a hard completion gate, not a nice-to-have.

> **Read order.** The architecture docs and the code first — `PawHaven-System-Architecture-Overview.md`,
> then `PawHaven-Frontend-Architecture.md` / `PawHaven-Backend-Architecture.md` for the area in scope,
> then the code. `docs/features/**` is read **last** and only to learn what is already known; it is a
> record to update, not a design input. See the documentation rule in
> [`project-rules`](../skills/project-rules/references/documentation.md).

## Steps

1. **Name the data shape first.** What is the domain model? What types carry the feature end to end? Model the domain per **model-the-domain** (via the `principles` skill) before writing components or hooks. If the feature has an existing shape, align with it; do not invent a parallel one.
2. **Explore the design** (`how` before you build). Walk the relevant subsystems: existing components, packages, i18n keys, backend contracts. For cross-boundary features, the **architect** defines the shared API contract in `packages/shared/` first (Zod schemas, DTOs, request/response types). Frontend and backend consume this contract — frontend does not draft it unilaterally. Run this as a parallel design exploration per the architecture-change workflow when the feature crosses boundaries. Skip only with a one-line `skip: <reason>`.
3. **Write the plan artifact.** One artifact, written before any code: the data shape, the boundary decisions, the units, and the check that ends each one. Answer the throughput questions here: are there blocking steps? are there independent workstreams? is there shared mutable state? what is the smallest safe decomposition into verifiable units? Per **sequence-verifiable-units** (enforced by the orchestrator workflow), each unit ends in a check.
4. **Plan review, then the human gate.** Dispatch `oracle` for an independent read of the plan. It returns `VERDICT: PASS` or `VERDICT: REVISE` about the plan, never about code. Skip it only when the [gate sequence](./harness-process.md#the-gate-sequence) says stage 2 is skipped, and record a one-line `skip: <reason>` when you do. The classification is that gate's entire trigger, so how small the plan reads is not a reason to skip it. A plan review run by reflex is a rubber stamp, and a required one skipped on a hunch is a plan nobody read independently. Implementation does not begin until the plan reads `VERDICT: PASS` **and** the human has approved it. These are stages 2 and 3.
5. **Delegate.** Fire a subagent per workstream with a named data shape and explicit success criteria. Review every diff yourself, and relay each lane's verification exactly as it was reported while writing your own reading across lanes, per [Evidence](../skills/project-rules/references/orchestrator.md#evidence-what-a-pass-requires). **If the implementation is long** (multi-file, cross-module, two or more independent workstreams), run `/parallel-execution` instead: split into small verifiable units, dispatch them as background tasks, and join them yourself.
6. **Cover the full state space.** Loading, empty, error, and offline states are part of the feature (**experience-first** (via the `principles` skill)). All user-visible text via `t()` in `zh-CN` / `en-US` / `de-DE`; all styles via design-system tokens. No hardcoded strings, no magic numbers.
7. **Verify on the real surface, from three separate producers.** The feature works when the real surface shows the intended behavior across states, not when it compiles. Three contexts produce the evidence, because the lane that writes the code does not give the final verdict on it:
   - The writing lane (`frontend-dev` or `backend-dev`) runs its own checks before it reports. `pnpm typecheck` and the targeted tests run here.
   - `tester` takes the acceptance criteria one by one and returns `satisfied`, `not satisfied`, or `unverifiable` per criterion, plus any `REQUIREMENT_GAPS`.
   - `browser-verifier` runs the journey when the change touches UI, routing, forms, or auth. A complex feature is not complete until it has run.

   `reviewer` then returns `VERDICT: PASS` or `VERDICT: FAIL` on the diff, and only `PASS` completes the workflow. What each check must report before it counts as passed is in [Evidence](../skills/project-rules/references/orchestrator.md#evidence-what-a-pass-requires). A failed stage goes back to the writing lane through the [bounded fix loop](./harness-process.md#the-bounded-fix-loop). A finding that says the plan is wrong goes to [When to return to planning](./harness-process.md#when-to-return-to-planning) instead, because looping a bad plan produces more of the bad thing.

8. **Update the feature doc, last.** Once the change is verified, write `docs/features/<feature>.md` from the code that shipped — new endpoints, new fields, the _What Does Not Exist_ entries that are now filled or newly found, and the _Known defects_ row in the index if the change closed one. Dispatch this to the lane that wrote the code, so the doc and the code land together. If the change did not alter what the document describes, say Doc Impact `none` and touch nothing.
9. **Then `/handoff`**. Include Doc Impact classification (`none` / `update` / `create`). The handoff stops the task: nothing is pushed, no PR is opened. You own the diff and answer review questions; the human reviews and opens the PR.

## Reply

Who the feature is for and what changes for them, the data shape, the design choices and tradeoffs, how you verified it across states. Name the principles that changed a decision.
