---
name: frontend-patterns
description: >
  How to write portal frontend code in PawHaven: React component shape, forms, data fetching, client
  state, styling, i18n, and component placement. Read before writing or reviewing anything under
  apps/frontend/portal, packages/ui, or packages/frontend-core, and before deciding whether a value
  belongs in a component, a slice, or a query.
  Trigger: frontend react component hook form validation query redux state style token i18n
  locale component placement promote shared ui package feature split extract refactor pattern
  example list page form api route.
metadata:
  triggers:
    - 'create a React component'
    - 'fix a hook'
    - 'build a form'
    - 'fetch from the API'
    - 'where does this value live'
    - 'add a design token'
    - 'add a translation'
    - 'which package does this component go in'
  not_triggers:
    - 'write a NestJS service'
    - 'backend endpoint or Prisma model'
---

# Frontend patterns

The portal's implementation patterns. Each rule below was read out of the running codebase; where a
rule and [the portal facts document](../../../../../docs/frontend-portal.md) could disagree, the facts
document wins, and the rule that drifted from it is the bug.

## Apply to

- Anything under `apps/frontend/portal`, `packages/ui`, or `packages/frontend-core`.
- Deciding where a value lives: derived, URL, server, form, client, or local.
- Deciding where a component belongs, or whether it should be promoted.
- Adding a design token, a translation, or a locale.

## Do not apply to

| Topic                                        | Owner                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| NestJS code                                  | [backend](../../../backend-development/skills/backend/SKILL.md)           |
| Type discipline across both stacks           | [typescript](../../../development-foundations/skills/typescript/SKILL.md) |
| Whether a change needs a test, and what kind | [testing-standards](../../../testing/skills/testing-standards/SKILL.md)   |
| The commands that check these rules          | [code-review](../../../code-review/skills/code-review/SKILL.md)           |

## Read the reference for the area you are touching

Each reference is self-contained: the rule, the code that carries it, and the check that enforces it.

| Reference                                        | Holds                                                                                                         | Read it when                                                          |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [feature-layout](./references/feature-layout.md) | The shapes to copy: the API layer, a route, a list page, a form section, a loader guard                       | Starting any feature work                                             |
| [react](./references/react.md)                   | Component shape, the state decision tree, effect discipline, React 19, the a11y floor                         | Writing or reviewing a component, hook, or effect                     |
| [forms](./references/forms.md)                   | Schema-first validation, the `@pawhaven/ui/form` primitives, multi-section forms, field arrays, server errors | Building or changing any form                                         |
| [data-fetching](./references/data-fetching.md)   | The four-file `api/` layer, the key factory, `queryOptions`, mutations, loaders, the single QueryClient       | Reading or writing anything from the API                              |
| [state](./references/state.md)                   | What belongs in Redux, the one registered slice, `reducerNames`, typed access, persistence                    | Deciding whether a value belongs in Redux at all, or touching a slice |
| [styling](./references/styling.md)               | The token gate pointer, writing a className, the package structure, token ordering, the scale tables          | Writing or reviewing any className                                    |
| [i18n](./references/i18n.md)                     | The key rules, the locale contract pointer, adding a module or locale, the file layout, the inventory         | Writing any visible copy, adding a key, or wiring a language selector |

`scripts/check-locale-parity.mjs` is the locale key parity check. It lives here rather than in a review
skill because this reference owns the locale contract, and a script that executes a rule belongs beside
the rule. Run it before claiming a translation change is done.
| [components](./references/components.md) | The placement table, anatomy, composition over configuration, splitting, the package layout | Creating, moving, or promoting a component |

## Related

- Review entry point: [code-review](../../../code-review/skills/code-review/SKILL.md)
- Project facts: [frontend-portal.md](../../../../../docs/frontend-portal.md)
