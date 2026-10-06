# Portal layout

Where things live in `apps/frontend/portal`, read out of the running repo. The rules that decide
whether a change belongs at one of these paths are in
[the frontend skill](../SKILL.md); this file is the index they point at.

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

`@/` aliases `apps/frontend/portal/src`. Relative imports inside a feature, `@pawhaven/*` for
packages.

Why the portal owns its own routing rather than deferring it is
[§5 Routing architecture](../../../../docs/architecture/PawHaven-Frontend-Architecture.md#5-routing-architecture).
The packages it consumes, and the dependency direction between them, are in
[§3 Package ecosystem](../../../../docs/architecture/PawHaven-Frontend-Architecture.md#3-package-ecosystem).

## Feature layout

```
features/<name>/
├── route.tsx              ← lazy route definition, and the loader/guard
├── <Name>.tsx             ← page component
├── api/                   ← the files below, plus api/tests/
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

Add a file because the feature needs it, not because a template lists it. Discover the current
feature list at runtime rather than trusting this one.

The boundary these directories exist to hold is
[§4 Component architecture and boundaries](../../../../docs/architecture/PawHaven-Frontend-Architecture.md#4-component-architecture--boundaries),
and the automated checks that catch a violation are
[§9 Module boundary enforcement](../../../../docs/architecture/PawHaven-Frontend-Architecture.md#9-module-boundary-enforcement).
