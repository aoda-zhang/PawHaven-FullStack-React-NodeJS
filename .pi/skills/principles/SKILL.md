---
name: principles
description: >
  PawHaven's decision-forcing principles — the reasoning moves that must change a decision, and
  the self-audit duty to name which one did. Load this before planning or implementing any
  non-trivial change, and while reviewing one. A principle cited with no decision behind it means
  the rule was skipped, not that it was satisfied.
  Trigger: principle decision tradeoff judgement call judgement call architecture choice
  design choice naming abstraction adding abstraction new api new component refactor diff size,
  debugging root cause reproduce why symptom, state modelling domain model data shape type structure
  boundary validation parsing trust, ux tradeoff loading empty error state polish, self-audit cite
  decision rationale explain choice before implementing before code review.
---

# Principles

Principles are decision-forcing moves, not knowledge. Each is small, and each changes what you do
at a specific decision point. The duty is to **name the principle that changed a decision** — a
citation with no decision behind it means you skipped the rule it stands for.

**How to use this skill:** at each decision point in the first table, read only that reference. Six
principles, ~140 lines total. Do not read all six before starting.

## Apply these

| Principle                                                          | Changes your decision when                                          | Read it when                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------- |
| [subtract-before-you-add](./references/subtract-before-you-add.md) | Ordering — subtraction must come before addition                    | Sequencing a new API, variant, or rewrite             |
| [laziness-protocol](./references/laziness-protocol.md)             | Sizing — bias to the smallest change; 2+ callers before abstracting | Tempted to add a layer, hook, or shared abstraction   |
| [fix-root-causes](./references/fix-root-causes.md)                 | Depth — reproduce, then ask why until it is a cause not a symptom   | Debugging, or patching something that throws          |
| [model-the-domain](./references/model-the-domain.md)               | Structure — name the data shape, then pick the organizing structure | Writing stateful or heavily branching logic           |
| [boundary-discipline](./references/boundary-discipline.md)         | Placement — validate once at the edge, trust inside                 | Wiring validation, error handling, framework adapters |
| [experience-first](./references/experience-first.md)               | Priority — user experience outranks implementation convenience      | Product, UX, or feature-scope tradeoffs               |

## Already enforced mechanically

These seven used to live in `.codebuddy/principles/`. The orchestrator workflow and the mandatory
`<verification>` block now enforce them, so re-asserting them competes with the workflow instead of
reinforcing it. **Do not load them as instructions.** They are kept here as the record of intent and
for the detail behind the rule — read one only when you need to settle a genuine dispute about what
the rule means.

| Principle                                                                                          | Enforced by                                                                     |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [guard-the-context-window](./references/guard-the-context-window.md)                               | Delegation discipline — route bulk to specialists, keep summaries in the thread |
| [never-block-on-the-human](./references/never-block-on-the-human.md)                               | Autonomy — proceed on reversible work, let the human course-correct             |
| [prove-it-works](./references/prove-it-works.md)                                                   | The mandatory `<verification>` block in every lane's `<result>`                 |
| [sequence-verifiable-units](./references/sequence-verifiable-units.md)                             | Every delegation names a validation owner and allowed scope                     |
| [outcome-oriented-execution](./references/outcome-oriented-execution.md)                           | Convergence on the target architecture, not intermediate states                 |
| [migrate-callers-then-delete-legacy-apis](./references/migrate-callers-then-delete-legacy-apis.md) | `laziness-protocol` plus the boundary rules above                               |
| [make-operations-idempotent](./references/make-operations-idempotent.md)                           | Idempotency expectations on repeated operations                                 |

## Reply discipline

When a decision was changed by one of the six principles in the first table, name it and the choice
it drove:

> Applied **laziness protocol** — inlined the helper instead of extracting it, because only one
> caller exists today.

If you cannot name a principle behind a decision, you either skipped its rule or the decision was
not actually principle-driven. Say which.
