# The UI Library system

> This document covers **how the system is put together, what quality it guarantees, and how to use
> it**. The component inventory, every prop, and the accessibility details live in
> [packages/ui/README.md](../../packages/ui/README.md) — not repeated here.

## What I built

`@pawhaven/ui` is a **private workspace package** with 22 components and two entry points:

```ts
import { Button, Carousel, NotificationBanner, Toast } from '@pawhaven/ui';
import { FormInput, FormSelect, FormPhoneInput } from '@pawhaven/ui/form';
```

They are split for one reason: the form controls are **bound to React Hook Form** — they read
`useFormContext()` internally, so they only work inside a `<FormProvider>`. Mixing those with
ordinary components in one entry point leaves the caller wrapping everything in a provider, and
makes it impossible to see from the types which components need one. Two subpaths keep that
explicit.

The components fall into three groups (details in the
[README's component catalogue](../../packages/ui/README.md#component-catalogue)):

- **Primitive / Foundation** — `Button`, `Skeleton`, `PhotoPlaceholder`, `Loading`
- **Composite** — `Carousel`, `NotificationBanner`, `Toast`, the `Timeline` family
- **Pattern** — the seven form controls

### One rule I hold to: no compatibility layer

When a component prop is renamed, **the old name is removed, not kept as an alias**.

```ts
// before: size accepted 'small' | 'medium' | 'sm' | 'md', and needed a resolver to pick one
const resolvedSize = resolveFormControlSize(size);

// now: one spelling
size?: 'sm' | 'md'
```

An alias costs you a document explaining which one is current, two paths through the type forever,
and another removal later. The package is private and every caller is in this repository, so
**changing it once, cleanly, is cheaper than carrying compatibility for three years**.

## What quality is guaranteed

| Guarantee                  | How                                                                                                                           | Runs in                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Accessibility**          | ESLint with `plugin:jsx-a11y/recommended`; each component carries its own `role` / `aria-*` semantics                         | `pnpm --filter @pawhaven/ui lint`           |
| **Types**                  | The package's own `tsc --noEmit`                                                                                              | `pnpm --filter @pawhaven/ui typecheck`      |
| **Behaviour**              | Vitest, 18 test files                                                                                                         | `pnpm --filter @pawhaven/ui test`           |
| **Published contract**     | `verify-package.mjs` asserts the exports map, `sideEffects`, the build output, and that every named export survived the build | `pnpm --filter @pawhaven/ui verify:package` |
| **Visual and interactive** | The Storybook catalogue, one story file per component, run in a real Chromium with axe                                        | `pnpm --filter @pawhaven/ui test-storybook` |
| **Style compliance**       | The design-token plugin applies directly to the component sources                                                             | `pnpm lint`                                 |

The **Storybook layer is the most valuable of these** — it gives both a browsable catalogue of the
components and axe checks running in a real browser, which a jsdom test cannot do.

## How to look at the components

The Storybook lives inside the component package (`packages/ui/.storybook/`), and each component
keeps its story file next to its own source — for example
`packages/ui/src/components/button/Button.stories.tsx`.

```bash
pnpm --filter @pawhaven/ui storybook        # http://127.0.0.1:6006
pnpm --filter @pawhaven/ui build-storybook  # static site → packages/ui/dist/storybook-static
pnpm --filter @pawhaven/ui test-storybook   # real Chromium + axe
```

> The Storybook has **its own Tailwind scan scope**, which is not the same as the Portal's
> production build. What a story shows is not what the product shows — when a change affects the
> product, check `pnpm build:local` instead.

## How to look up the latest documentation with the skill

As the library grows, working out "which component should this use?" by browsing folders gets
slower. The repository has a **`ui-component-catalog` skill**
(`.opencode/skills/ui-component-catalog/`) that acts as the entry point into the library.

Use it like this: any task that **selects, evaluates, reuses, or implements a UI component** should
invoke the skill first. It will:

1. Match the intent against `references/component-index.md` — the index holds each component's
   purpose, its matching keywords (including Chinese ones), and the location of its source, docs,
   tests, and story
2. Once something matches, read that component's own `README.md`, then confirm the API against the
   source and the exported types
3. Look at the story and the tests when they exist
4. If nothing matches, search `packages/ui/src/components/` — do not invent a component

It also carries a maintenance rule of its own: when a component is added, removed, renamed, or its
purpose changes, **update only that one row in the index**.

> The index is a **locator, not an API contract**. To find out whether a prop exists, read the
> source.

## Related documents

- [packages/ui/README.md](../../packages/ui/README.md) — component catalogue, prop vocabulary,
  accessibility notes, migration guide
- [Design Tokens](design-tokens.md) — where the component colours come from and how they are
  enforced
- [Frontend development patterns](../context/frontend-development-patterns.md) — the current frontend implementation conventions
