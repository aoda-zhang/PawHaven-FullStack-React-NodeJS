---
name: principles
description: >
  PawHaven's decision-forcing principles — the reasoning moves that must change a decision, and the
  duty to name which one did. Load before planning or implementing any non-trivial change, and while
  reviewing one. A principle cited with no decision behind it means the rule was skipped, not that it
  was satisfied.
  Trigger: principle decision tradeoff judgement call architecture choice
  design choice naming abstraction adding abstraction new api new component refactor diff size,
  debugging root cause reproduce why symptom, state modelling domain model data shape type structure
  boundary validation parsing trust, self-audit cite decision rationale explain choice before
  implementing before code review.
---

# Principles

Principles are decision-forcing moves, not knowledge. Each is small and each changes what you do at
one decision point. The duty is to **name the principle that changed a decision**. A citation with
no decision behind it means the rule it stands for was skipped.

Read only the reference for the decision point you are at. Do not read all five before starting.

## Apply these

| Principle                                                          | Changes your decision when                                                                       | Read it when                                                                                   |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| [subtract-before-you-add](./references/subtract-before-you-add.md) | Ordering and size — subtraction first, smallest change that works, 2+ callers before abstracting | Sequencing a new API, variant, or rewrite; tempted to add a layer, hook, or shared abstraction |
| [fix-root-causes](./references/fix-root-causes.md)                 | Depth — reproduce, then ask why until it is a cause not a symptom                                | Debugging, or patching something that throws                                                   |
| [model-the-domain](./references/model-the-domain.md)               | Structure — name the data shape, then pick the organizing structure                              | Writing stateful or heavily branching logic                                                    |
| [boundary-discipline](./references/boundary-discipline.md)         | Placement — validate once at the edge, trust inside                                              | Wiring validation, error handling, framework adapters                                          |
| [prove-it-works](./references/prove-it-works.md)                   | Evidence — verify the real artifact, not the build                                               | Before claiming anything is done                                                               |

## Reply discipline

When a decision was changed by one of these, name it and the choice it drove:

> Applied **subtract before you add** — inlined the helper instead of extracting it, because only one
> caller exists today.

If you cannot name a principle behind a decision, say which: either you skipped its rule or the
decision was not principle-driven.
