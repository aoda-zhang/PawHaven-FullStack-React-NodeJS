# Feature

You own this task. Plan, review, verify. Delegate implementation to subagents, stay in the lead.

A feature is built from a named data shape, through an explicit design pass, to verified behavior on the real surface. Scope is decided before code is written, and every user-visible state is part of the feature.

> **Complexity classification** (per pawhaven.md §3.0): Features are typically **Standard** or **Architectural**. pawhaven classifies before starting this workflow. Standard features follow the steps below. Architectural features add an ADR step and mandatory architect review before implementation begins.

## Steps

1. **Name the data shape first.** What is the domain model? What types carry the feature end to end? Model the domain per **principle-model-the-domain** before writing components or hooks. If the feature has an existing shape, align with it; do not invent a parallel one.
2. **Explore the design** (`how` before you build). Walk the relevant subsystems: existing components, packages, i18n keys, backend contracts. For cross-boundary features, the **architect** defines the shared API contract in `packages/shared/` first (Zod schemas, DTOs, request/response types). Frontend and backend consume this contract — frontend does not draft it unilaterally. Run this as a parallel design exploration per the architecture-change workflow when the feature crosses boundaries. Skip only with a one-line `skip: <reason>`.
3. **Throughput checkpoint.** Before implementing, write the plan and answer: are there blocking steps? are there independent workstreams? is there shared mutable state? what is the smallest safe decomposition into verifiable units? Per **principle-sequence-verifiable-units**, each unit ends in a check.
4. **Delegate.** Fire a subagent per workstream with a named data shape and explicit success criteria. Review every diff yourself; write your own summary, don't pass through subagent words.
5. **Cover the full state space.** Loading, empty, error, and offline states are part of the feature (**principle-experience-first**). All user-visible text via `t()` in `zh-CN` / `en-US` / `de-DE`; all styles via design-system tokens. No hardcoded strings, no magic numbers.
6. **Verify on the real surface.** `pnpm typecheck`, targeted tests, and a render check of the actual UI. The feature works when the real surface shows the intended behavior across states, not when it compiles.
7. **Small ordered commits, then the review handoff** (`workflows/handoff.md`). Include Doc Impact classification (`none` / `update` / `create`). The handoff stops the task: nothing is pushed, no PR is opened. You own the diff and answer review questions; the human reviews and opens the PR.

## Reply

Who the feature is for and what changes for them, the data shape, the design choices and tradeoffs, how you verified it across states. Name the principles that changed a decision.
