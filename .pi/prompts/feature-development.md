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
3. **Throughput checkpoint.** Before implementing, write the plan and answer: are there blocking steps? are there independent workstreams? is there shared mutable state? what is the smallest safe decomposition into verifiable units? Per **sequence-verifiable-units** (enforced by the orchestrator workflow), each unit ends in a check.
4. **Delegate.** Fire a subagent per workstream with a named data shape and explicit success criteria. Review every diff yourself; write your own summary, don't pass through subagent words. **If the implementation is long** (multi-file, cross-module, two or more independent workstreams), run `/parallel-execution` instead: split into small verifiable units, dispatch them as background tasks, and join them yourself.
5. **Cover the full state space.** Loading, empty, error, and offline states are part of the feature (**experience-first** (via the `principles` skill)). All user-visible text via `t()` in `zh-CN` / `en-US` / `de-DE`; all styles via design-system tokens. No hardcoded strings, no magic numbers.
6. **Verify on the real surface.** `pnpm typecheck`, targeted tests, and a render check of the actual UI. The feature works when the real surface shows the intended behavior across states, not when it compiles. When the feature touches UI, routing, forms, or auth, dispatch `browser-verifier` for that check — a complex feature is not complete until it has run.
7. **Update the feature doc, last.** Once the change is verified, write `docs/features/<feature>.md` from the code that shipped — new endpoints, new fields, the _What Does Not Exist_ entries that are now filled or newly found, and the _Known defects_ row in the index if the change closed one. Dispatch this to the lane that wrote the code, so the doc and the code land together. If the change did not alter what the document describes, say Doc Impact `none` and touch nothing.
8. **Then `/handoff`**. Include Doc Impact classification (`none` / `update` / `create`). The handoff stops the task: nothing is pushed, no PR is opened. You own the diff and answer review questions; the human reviews and opens the PR.

## Reply

Who the feature is for and what changes for them, the data shape, the design choices and tradeoffs, how you verified it across states. Name the principles that changed a decision.
