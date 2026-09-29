---
name: frontend-context
description: >
  Where things live in the PawHaven portal. Read this before searching — it saves a grep.
  Use when you need to find a route, a feature, a shared type, a design token, or a test.
  触发场景 / Trigger: where find route feature type token test file location 文件位置 目录结构.
---

# Frontend context

## Entry points

| What              | Path                                                   |
| ----------------- | ------------------------------------------------------ |
| App entry         | `apps/frontend/portal/src/main.tsx`                    |
| Router paths      | `apps/frontend/portal/src/router/routePaths.ts`        |
| Route definitions | `apps/frontend/portal/src/router/`                     |
| Store             | `apps/frontend/portal/src/store/reduxStore.ts`         |
| Query client      | `apps/frontend/portal/src/providers/QueryProvider.tsx` |
| API client        | `apps/frontend/portal/src/utils/apiClient.ts`          |

## Feature layout

Every feature lives at `apps/frontend/portal/src/features/<name>/`:

```
features/report-animal/
├── route.tsx              ← lazy route definition
├── ReportAnimal.tsx       ← page component
├── api/
│   ├── reportAnimal.api.ts        ← raw request functions
│   ├── reportAnimal.queries.ts    ← queryOptions factories
│   ├── reportAnimal.mutations.ts  ← useMutation hooks
│   └── reportAnimal.queryKeys.ts  ← key factory
├── components/            ← feature-private components
├── tests/                 ← Vitest tests
└── types.ts               ← feature-local types
```

Existing features: `auth`, `home`, `report-animal`, `rescue-cases`, `rescue-detail`, `rescue-guide`, `animal-follow`.

## Shared packages

| Package       | Import                                       | Holds                                                    |
| ------------- | -------------------------------------------- | -------------------------------------------------------- |
| Shared types  | `@pawhaven/shared/types`                     | Zod schemas shared front/backend                         |
| UI components | `@pawhaven/ui`                               | Pure presentational (button, form, skeleton, toast…)     |
| Frontend core | `@pawhaven/frontend-core`                    | App infrastructure (cn, lazyImport, RequireAuth, config) |
| Design tokens | `@pawhaven/design-system`                    | Token CSS files                                          |
| i18n          | `packages/i18n/locales/{en-US,zh-CN,de-DE}/` | Per-feature JSON locale files                            |

## Conventions that save time

- `@/` aliases `apps/frontend/portal/src`. Use it for cross-feature imports.
- Relative imports inside a feature. `@pawhaven/*` for packages.
- `apiClient` (from frontend-core) unwraps the `ApiResponse` envelope — request functions resolve directly to the payload.
- Redux state is read via `useGlobalState()` from `@/store/globalReducer`, not raw `useSelector`.
- Tests sit in `features/<name>/tests/` as `*.test.tsx`, run with Vitest.
