---
name: frontend
description: >
  The facts about the PawHaven portal that a writer and a reviewer must agree on, in one place.
  Where things live, the styling gate, the real Redux hook names, where a type belongs, the i18n
  contract, and the API-layer file shapes. Read before writing or reviewing any portal code, and
  cite it rather than restating it — a rule stated in two places is a rule that will disagree with
  itself.
  触发场景 / Trigger: frontend portal react component where find layout structure token hook i18n
  type api layer where does this live 文件位置 目录结构 约定.
---

# Frontend

Facts only. The **how** lives in the lens skills — `react`, `style`, `component`, `i18n`,
`react-query`, `react-hook-form`, `redux`, `typescript`, `frontend-patterns` for writing, and the four
`*-doctor` skills for checking. If you find yourself restating a fact from this file in one of those,
that is the bug this file exists to prevent.

When a fact here is wrong, fix it here. Do not correct it in a lens skill.

## What this file is

This is PawHaven project knowledge, not generic React guidance. It is the operational index an agent
reads instead of loading the 672-line
[frontend architecture document](../../../docs/architecture/PawHaven-Frontend-Architecture.md),
because that document holds none of the names and paths below: it has no `reduxHooks` path, no
`useAppSelector` correction, no feature-directory layout, and no "where a type lives" table. Merging
this file into `docs/` would either bloat the architecture document or invent a second file competing
with it, so the split is deliberate and fixed.

**`docs/` is why a rule exists. This file is where things are and what they are called.**

Where a section below has a canonical counterpart in the architecture document, that section is the
authority for the reasoning behind the rule. The operational fact stays here.

## The map

| What                    | Path                                                       |
| ----------------------- | ---------------------------------------------------------- |
| App entry               | `apps/frontend/portal/src/main.tsx`                        |
| Router paths            | `apps/frontend/portal/src/router/routePaths.ts`            |
| Root loader + bootstrap | `apps/frontend/portal/src/layout/api/rootLayout.loader.ts` |
| Store                   | `apps/frontend/portal/src/store/reduxStore.ts`             |
| Store hooks             | `apps/frontend/portal/src/hooks/reduxHooks.ts`             |
| Query client            | `apps/frontend/portal/src/providers/QueryProvider.tsx`     |
| API client              | `apps/frontend/portal/src/utils/apiClient.ts`              |

`apps/frontend/portal` is the **only** frontend app. There is no `apps/frontend/admin`; a skill or
rule that scans it is scanning nothing.

Why the portal owns its own routing rather than deferring it is
[§5 Routing architecture](../../../docs/architecture/PawHaven-Frontend-Architecture.md#5-routing-architecture).
The packages it consumes, and the dependency direction between them, are in
[§3 Package ecosystem](../../../docs/architecture/PawHaven-Frontend-Architecture.md#3-package-ecosystem).

`@/` aliases `apps/frontend/portal/src`. Relative imports inside a feature, `@pawhaven/*` for
packages.

## Feature layout

```
features/<name>/
├── route.tsx              ← lazy route definition, and the loader/guard
├── <Name>.tsx             ← page component
├── api/                   ← the four files below, plus api/tests/
├── components/            ← feature-private components
├── constants/  utils/  tests/
```

Features: `auth`, `home`, `report-animal`, `rescue-cases`, `rescue-detail`, `rescue-guide`,
`animal-follow`, plus `layout/` (root loader + bootstrap, not a feature).

**The api directory is not a fixed four files.** It follows what the feature does:

| Files                                                    | Features                                |
| -------------------------------------------------------- | --------------------------------------- |
| `.api` `.queries` `.queryKeys` `.mutations` + `tests`    | `animal-follow`, `auth`                 |
| `.api` `.queries` `.queryKeys`, no mutations (read-only) | `home`, `rescue-cases`, `rescue-detail` |
| `.api` `.mutations` `.queryKeys`, no queries (writes)    | `report-animal`                         |
| `.api` only, plus its test                               | `rescue-guide` (PDF download)           |

Add a file because the feature needs it, not because a template lists it.

The boundary these directories exist to hold is
[§4 Component architecture and boundaries](../../../docs/architecture/PawHaven-Frontend-Architecture.md#4-component-architecture--boundaries),
and the automated checks that catch a violation are
[§9 Module boundary enforcement](../../../docs/architecture/PawHaven-Frontend-Architecture.md#9-module-boundary-enforcement).

## State access — the real names

There are **three** typed paths, and no others:

```tsx
// 1. generic typed hooks — src/hooks/reduxHooks.ts
import { useReduxDispatch, useReduxSelector } from '@/hooks/reduxHooks';
// 2. per-slice convenience hook, defined beside its slice — src/store/globalReducer.ts
import { useGlobalState } from '@/store/globalReducer';
```

The names are `useReduxDispatch` and `useReduxSelector`. **`useAppDispatch` / `useAppSelector` do not
exist** — an earlier note in this harness invented them, and an agent looking for them will "fix"
correct code into a broken import. Raw `useDispatch` / `useSelector` from `react-redux` outside
`hooks/reduxHooks.ts` is a blocking finding.

The registered store is one slice: `store/globalReducer.ts` carrying `profile`, `locale`,
`isSysMaintain`. A slice is not part of the tree until `reducerRegister.ts` lists it.
`store.getState()` appears in exactly two loaders, never in a component.

Server data is never in Redux. It belongs to TanStack Query.

The split between the two, and why it is drawn there rather than elsewhere, is
[§6 State management architecture](../../../docs/architecture/PawHaven-Frontend-Architecture.md#6-state-management-architecture).

## The styling gate

Tokens live in `packages/design-system/src/tokens/`, consumed as **semantic Tailwind utilities**.
Never read a token file to hand-write a value.

Forbidden, everywhere: raw hex, a raw Tailwind palette name (`text-gray-500`), a CSS-variable bypass
(`bg-[var(--color-primary)]`), `px` in arbitrary values, and `style={{}}` for any static value. Use the
scale (`p-4`, `text-sm`, `rounded-lg`, `shadow-sm`); merge with `cn()` from `@pawhaven/frontend-core`.
Class order is Prettier's job — do not hand-sort.

`pnpm token-check` is the declared gate and **it does not currently run**: root `package.json` points
at `packages/design-system/scripts/token-check.cjs`, which is not in the tree. Until that is fixed, the
gate is `style-doctor`'s commands, not that script. Do not tell anyone a token violation is
"enforced by `pnpm token-check`".

The three-layer token system this gate exists to protect is
[§7 Design token architecture](../../../docs/architecture/PawHaven-Frontend-Architecture.md#7-design-token-architecture).

## Where a type lives

| Situation                       | Location                                 | Import                   |
| ------------------------------- | ---------------------------------------- | ------------------------ |
| Used in **more than one place** | `packages/shared/types/<Name>.schema.ts` | `@pawhaven/shared/types` |
| Used by **exactly one** feature | `features/<feature>/types.ts`            | relative                 |

No third option. Zod is the source of truth: every API contract and enum is a schema in
`packages/shared/types`, and the TS type is derived with `z.infer`. Read enum members off the schema,
never duplicate the literal union. A type in `packages/frontend-core` is app infrastructure, not a
domain contract.

Banned: `any`, an `as` cast that silences an error, `!`, the `enum` keyword.

The package boundary that puts domain contracts in `packages/shared` and app infrastructure in
`packages/frontend-core` is
[§3 Package ecosystem](../../../docs/architecture/PawHaven-Frontend-Architecture.md#3-package-ecosystem).

## The i18n contract

`packages/i18n/locales/{en-US,zh-CN,de-DE}/`, one `<module>.json` per feature plus `common.json` and
`errorMessage.json`. Adding a key means adding it to **all three** in the same change; a key present
in one and missing in another is blocking. `documents/pdf/` is a separate sub-tree loaded by its own
instance.

Keys are semantic, never literal. `snake_case` inside a file, `camelCase` for cross-file access —
which is why `rescueCases.json` holds the top-level key `rescue_cases` while its filename is
camelCase. Store the **key** in constants and option arrays and translate at render; never store a
rendered translation. A stored translation makes the stored value depend on the submitter's locale —
`statusDescription` on `animalReports` is the live example, and it is a defect, not a pattern.

Features must not import `@pawhaven/i18n` directly; that package is app-root infrastructure. Use
`useTranslation` / `t()`.

Why i18n is a separate package with its own loader is
[§8 Internationalization architecture](../../../docs/architecture/PawHaven-Frontend-Architecture.md#8-internationalization-architecture).

## Verification commands

These are the facts about _checking_, not about writing. Each was run when it was written here.

```bash
# cross-feature / cross-module / i18n / window-navigation violations
rg -n "from '@/features/" apps/frontend/portal/src/features --glob '*.ts' --glob '*.tsx' | grep -v "import type"
rg -n "from '@pawhaven/i18n'" apps/frontend/portal/src
# raw hooks, inline styles, any, console.log
rg -n 'useSelector|useDispatch' apps/frontend/portal/src --glob '!**/reduxHooks.ts'
rg -n 'style=\{\{' apps/frontend/portal/src --glob '*.tsx'
rg -n ': any\b' apps/frontend/portal/src --glob '!**/*.test.*'
# locale key parity — a bundled script, not a hand-rolled jq
node .pi/skills/code-review/i18n-doctor/scripts/check-locale-parity.mjs \
  --locales packages/i18n/locales --reference en-US
```

The four `*-doctor` skills own the full rule lists. This file owns the vocabulary those rules use, so
a rule and the fact it checks cannot drift apart.

The boundary rules these commands check are stated in
[§9 Module boundary enforcement](../../../docs/architecture/PawHaven-Frontend-Architecture.md#9-module-boundary-enforcement).

## Related

- [Writing](../../agents/frontend-dev/skills/frontend-patterns/SKILL.md) — concrete shapes to copy
- [React standards](../../agents/frontend-dev/skills/react/SKILL.md) · [styling](../../agents/frontend-dev/skills/style/SKILL.md) · [i18n](../../agents/frontend-dev/skills/i18n/SKILL.md) · [TypeScript](../../agents/frontend-dev/skills/typescript/SKILL.md) · [Redux](../../agents/frontend-dev/skills/redux/SKILL.md) · [component placement](../../agents/frontend-dev/skills/component/SKILL.md)
- [Doctors](../code-review/react-doctor/SKILL.md) · [style](../code-review/style-doctor/SKILL.md) · [i18n](../code-review/i18n-doctor/SKILL.md) · [TypeScript](../code-review/typescript-doctor/SKILL.md)
- [Frontend architecture](../../../docs/architecture/PawHaven-Frontend-Architecture.md) — the
  canonical home for why each rule above exists. §3 package ecosystem, §4 component boundaries,
  §5 routing, §6 state, §7 design tokens, §8 i18n, §9 module boundary enforcement. Read the section
  before changing a boundary. This file records where things are and what they are called; that
  document records whether they belong there, and why.
