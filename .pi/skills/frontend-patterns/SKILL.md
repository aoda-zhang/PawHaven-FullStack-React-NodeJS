---
name: frontend-patterns
description: >
  The PawHaven frontend skill. One router over the concrete code patterns and the per-area rules of
  the portal: React component shape, forms, data fetching, client state, styling, i18n, and where a
  component belongs. Use when writing or reviewing anything under apps/frontend/portal, or when
  deciding whether a value belongs in a component, a slice, or a query.
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

## Purpose

The portal's frontend methodology in one place. Seven former top-level skills — `react`,
`react-hook-form`, `react-query`, `redux`, `style`, `i18n`, `component` — were dissolved into the
references below, because seven invocable names for one domain meant seven grants to keep in sync
and seven places a rule could be restated and drift. What is left is one skill a frontend writer
grants once, and a reference per area.

Every rule in the references was read out of the running codebase. Where a rule and
[the portal facts document](../../../docs/frontend-portal.md) could disagree, the facts document
wins — it is the operational index, and a rule that drifts from it is the bug both exist to prevent.

## When to use

- Writing or reviewing anything under `apps/frontend/portal` or `packages/ui` /
  `packages/frontend-core`.
- Deciding where a value lives: derived, URL, server, form, client, or local.
- Deciding where a component belongs, or whether one should be promoted.
- Adding a design token, a translation, or a locale.

## When not to use

- Backend NestJS code — that is [backend](../backend/SKILL.md).
- Type discipline across both stacks — that is [typescript](../typescript/SKILL.md).
- Whether a change needs a test, and what kind — that is
  [testing-standards](../testing-standards/SKILL.md).
- The review commands that enforce these rules — those live in the `code-review` doctors, not here.

## References

Read the one that covers the area you are touching. Each is self-contained: the rules, the code that
carries them, and the doctor that checks them.

| Reference                                                  | What it holds                                                                                                 | Read it when                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [patterns](./references/patterns.md)                       | The concrete shapes to copy: the API layer, a route, a list page, a form section, a loader guard              | Starting any feature work                                             |
| [react-standards](./references/react-standards.md)         | Component shape, the state decision tree, effect discipline, React 19, the a11y floor                         | Writing or reviewing a component, hook, or effect                     |
| [forms](./references/forms.md)                             | Schema-first validation, the `@pawhaven/ui/form` primitives, multi-section forms, field arrays, server errors | Building or changing any form                                         |
| [data-fetching](./references/data-fetching.md)             | The four-file `api/` layer, the key factory, `queryOptions`, mutations, loaders, the single QueryClient       | Reading or writing anything from the API                              |
| [client-state](./references/client-state.md)               | What belongs in Redux, the one registered slice, `reducerNames`, typed access, persistence                    | Deciding whether a value belongs in Redux at all, or touching a slice |
| [styling](./references/styling.md)                         | The token gate pointer, writing a className, the package structure, token ordering, the scale tables          | Writing or reviewing any className                                    |
| [i18n](./references/i18n.md)                               | The key rules, the locale contract pointer, adding a module or locale, the file layout, the inventory         | Writing any visible copy, adding a key, or wiring a language selector |
| [component-placement](./references/component-placement.md) | The placement table, anatomy, composition over configuration, splitting, the package layout                   | Creating, moving, or promoting a component                            |

## Doctor

[react-doctor](../code-review/react-doctor/SKILL.md) is the primary check for anything touching
React pages or components, and it enumerates the project-specific rules the generic CLI cannot
know. `style-doctor`, `i18n-doctor`, `typescript-doctor`, and `boundary-doctor` cover the rest; the
scope-to-doctor mapping is in [code-review](../code-review/SKILL.md).
