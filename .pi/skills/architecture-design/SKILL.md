---
name: architecture-design
description: >
  PawHaven's architecture decision method: where a change belongs, what it breaks, and how the
  decision is recorded. Read before designing any change that crosses a module, package, service,
  or API boundary, and before approving someone else's design.
  Trigger: architecture design technical design system design solution planning decision, module
  assignment new module extend existing service split bounded context, API design contract endpoint
  contract change database schema migration impact analysis, risk assessment impact dependency
  technical debt, cross-module cross-package boundary refactor restructure, design review
  architecture approval.
---

# Architecture Design

A design is a decision, not a description. The output says **where the work goes and what it breaks**.

## Procedure

1. **Discover the real map.** Read the current topology before proposing anything:
   [service boundaries](../../../docs/architecture/service-boundaries.md),
   [backend architecture](../../../docs/architecture/PawHaven-Backend-Architecture.md), and
   [portal structure](../../../docs/frontend-portal.md). Discover the module list from
   `apps/backend/core-service/src/modules/`, not from memory.
2. **Answer the placement questions.** Extend an existing module, or add one? Read
   [references/architecture-analysis.md](./references/architecture-analysis.md).
3. **Check the boundary it crosses.** Read [references/boundaries.md](./references/boundaries.md)
   for the dependency direction and what a boundary move has to clear.
4. **Assess impact** on API, database, and frontend. Checklists:
   [references/architecture-analysis.md](./references/architecture-analysis.md).
5. **Classify risk** — high / medium / low, criteria in the same reference.
6. **Write the decision record.** Template:
   [references/decision-record.md](./references/decision-record.md). Sections 3.1 (Placement) and
   3.5 (Alternatives) are mandatory. A recommendation with no rejected alternative is a description.

## Rules this skill answers to

- A new module is the default for a new business capability. A new deployable service needs an
  explicit justification in the decision record.
- Anything that moves a boundary updates the matching document under `docs/architecture/` in the
  same change. The architecture docs are the canonical record; this skill is the method.
- The auth trust model is fixed and not redesigned per feature. Read
  [authentication-architecture.md](../../../docs/architecture/authentication-architecture.md).

## Read the reference for the area you are assessing

| Reference                                                      | Holds                                               | Read it when                                          |
| -------------------------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------- |
| [architecture-analysis](./references/architecture-analysis.md) | Decision tree, impact checklists, risk criteria     | Placing work or sizing impact                         |
| [boundaries](./references/boundaries.md)                       | Dependency direction, module/service boundary rules | The change crosses a module, package, or service edge |
| [decision-record](./references/decision-record.md)             | Output template                                     | Writing the decision down                             |

## Related

- Backend implementation: [backend](../backend/SKILL.md)
- Classification: [task-classification](../task-classification/SKILL.md)
- Boundary and architecture checks: [code-review](../code-review/SKILL.md)
