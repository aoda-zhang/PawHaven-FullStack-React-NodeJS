# Data fetching — TanStack Query v5

Query keys come from a factory, server data lives only here, and loaders prefetch through the same
options the component reads. The router that names when to read this is
[frontend-patterns](../SKILL.md).

## Layering

Four files per feature, in `features/<feature>/api/`:

| File                  | Holds                                                             |
| --------------------- | ----------------------------------------------------------------- |
| `<name>.api.ts`       | raw request functions — the only place that calls the HTTP client |
| `<name>.queries.ts`   | `queryOptions` factories, one per read                            |
| `<name>.mutations.ts` | `useMutation` hooks                                               |
| `<name>.queryKeys.ts` | the key factory                                                   |

A component never calls `<name>.api.ts` directly for a read. It imports the options.

A file is created when there is something to put in it, and deleted when there is not. `api/tests/`
sits beside the four files.

## Query keys

```ts
// auth.queryKeys.ts
export const authQueryKeys = {
  all: ['auth'] as const,
  currentUser: (userId: string) =>
    [...authQueryKeys.all, 'currentUser', userId] as const,
};
```

- Every key comes from the factory. A literal `['auth', 'user']` inline is a blocking finding.
- Start from `all`, spread downward. Enables `invalidateQueries({ queryKey: x.all })`.
- Include every input that changes the result in the key. A missing input is a stale-data bug.

### The key factory

```typescript
// src/queries/userKeys.ts
export const userKeys = {
  all: ['users'] as const,

  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,

  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};
```

Three properties make this worth the extra file:

1. **Hierarchical invalidation.** Every key is a prefix extension of `all`, so a mutation can name
   the scope it affects without knowing every key that exists under it.
2. **Type safety.** `as const` preserves the literal types, so a key built from a factory cannot be
   compared against a differently-shaped raw array.
3. **Single source of truth.** No scattered `['users', id]` strings to grep for, and renaming a
   resource is one edit.

### Invalidation by prefix

| Call                                                               | Refetches             |
| ------------------------------------------------------------------ | --------------------- |
| `queryClient.invalidateQueries({ queryKey: userKeys.all })`        | every user query      |
| `queryClient.invalidateQueries({ queryKey: userKeys.lists() })`    | only the list queries |
| `queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })` | one specific user     |

Invalidation is prefix-based and partial by default: a matching query is marked stale and refetched
if it is currently mounted, so no new `refetch()` call is needed at the call site.

## queryOptions

```ts
// auth.queries.ts
export const currentUserQueryOptions = (userId: string) => ({
  queryKey: authQueryKeys.currentUser(userId),
  queryFn: getUserCurrent,
  staleTime: 5 * 60 * 1000,
  retry: false,
});
```

- One factory per read, in `<name>.queries.ts`.
- `staleTime` is deliberate. `0` is a decision, not a default.
- `retry: false` for auth and anything where a retry masks an error.
- `enabled` only when the input genuinely may be absent.

### The `queryOptions` pattern

```typescript
// src/queries/userQueries.ts
import { queryOptions } from '@tanstack/react-query';
import { userKeys } from './userKeys';

export const userQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: userKeys.detail(userId),
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000,
  });

// In a component:
const { data: user } = useQuery(userQueryOptions(userId));

// In a route loader:
loader: (({ params }) =>
  queryClient.ensureQueryData(userQueryOptions(params.userId)),
  // As a prefetch:
  queryClient.prefetchQuery(userQueryOptions(userId)));
```

One definition, three call sites. This is the difference between a shared query and three copies of
the same options that happen to agree today.

## Mutations

- `useMutation` hooks live in `<name>.mutations.ts`. No inline `useMutation` in a component.
- On success, invalidate or update the affected key. A mutation that changes server state and
  invalidates nothing is a bug.
- Surface errors through the mutation state, not a local `try/catch` that swallows.

## Server state never lives elsewhere

- Not in Redux. Not in `useState`. Not in a module-level variable.
- Loading, error, and success are the query's states. Do not mirror them into local state.

## Loaders

- Prefetch through the same options the component will read — one source of truth.

  ```ts
  await getQueryClient().ensureQueryData(currentUserQueryOptions(userId));
  ```

- A guard redirects in its loader. No render-time `if (isLoading) return <Redirect />`.

## QueryClient and freshness

### The factory

Build the client in a factory function rather than inlining options at each call site, so the
defaults are one edit instead of N.

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 min — data considered fresh
        gcTime: 30 * 60 * 1000, // 30 min — keep in cache after unused
        retry: 2, // retry twice on failure
        refetchOnWindowFocus: false, // don't refetch on tab switch
        refetchOnReconnect: true, // refetch when coming back online
      },
      mutations: {
        retry: 1, // retry mutations once
      },
    },
  });
}
```

`refetchOnWindowFocus: false` is set explicitly here rather than inherited: v5 still defaults it to
`true`, and a left-open tab then refetches every focus. A per-query `true` is the right escape for
live data — the dashboard counter, a presence badge.

### Stale time by data type

| Data type               | `staleTime`               | Example                                         |
| ----------------------- | ------------------------- | ----------------------------------------------- |
| Static / rarely changes | `60 * 60 * 1000` (1 hour) | User preferences, feature flags, countries list |
| Medium freshness        | `5 * 60 * 1000` (5 min)   | Product catalog, user profiles                  |
| Frequently changing     | `30 * 1000` (30 sec)      | Notifications, messages                         |
| Real-time / live        | `0` (always stale)        | Feed, dashboard stats                           |

### Overriding per query

Only when the data genuinely differs from its class — a profile that changes on upload, not on
scroll:

```typescript
useQuery({
  queryKey: userKeys.detail(userId),
  queryFn: () => fetchUser(userId),
  staleTime: 60 * 60 * 1000, // user profile rarely changes
});
```

### Where this lives in the portal

`apps/frontend/portal/src/providers/QueryProvider.tsx` owns the single client, exposed as
`getQueryClient()` and memoized in a module-level variable. Defaults are supplied through
`getRequestQueryOptions()` from `@pawhaven/frontend-core`, with the runtime-config values read from
`loadConfig().query` overriding the constants.

The practical rule: a second `new QueryClient()` anywhere in the portal creates a second cache, so a
`useMutation` in one tree will not invalidate a query in the other. Tests may construct their own
client; application code may not.

## Mock data fallback

During development, mock data lives in `mockData.ts` and is consumed by the API layer as a fallback.
Pages and components never import mock data directly — the data flow is strictly one-way:

```
mockData.ts → api.ts (try/catch fallback) → queries.ts (useQuery) → Page component
```

```typescript
// features/Feature/api/feature.api.ts
import { apiClient } from '@/utils/apiClient';
import { mockItems } from '../mockData';

export const fetchItems = async (): Promise<Item[]> => {
  try {
    return await apiClient.get<Item[]>('/api/items');
  } catch {
    return mockItems;
  }
};

// features/Feature/api/feature.queries.ts
export const useFetchItems = () => {
  return useQuery({
    queryKey: featureKeys.list(),
    queryFn: fetchItems,
  });
};

// Correct — the page uses the query hook
const { data } = useFetchItems();

// Wrong — the page must never import mockData directly
import { mockItems } from '../mockData';
```

Mock data is owned by `api.ts` exclusively. A page that imports it directly has no way to tell
fabricated data from real data once the mock is deleted, and the `isError` branch it skipped stays
untested until production.

## Tests

Query and mutation tests are co-located with the data layer, in an `api/tests/` folder, and are
vitest — `vi.fn()` and `vi.mock()`, never the Jest equivalents. A test that renders a component with
a query needs its own `QueryClient`; use one with `retry: false` so a failure surfaces as one
assertion rather than three.

## Anti-pattern catalogue

Every rule above is stated once, in the sections of this file. This catalogue is the diagnosis:
what the symptom looks like, why it breaks, and which section holds the rule. Check a diff against
it before reporting a data-fetching change done.

| Anti-pattern                                             | Why it breaks                                                            | Rule                                                                      |
| -------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Raw string query keys                                    | No type safety; scattered magic strings                                  | [Query keys](#query-keys)                                                 |
| Storing query data in Redux                              | Duplicates the cache; serves data that has gone stale                    | [Server state never lives elsewhere](#server-state-never-lives-elsewhere) |
| `useQuery` in a parent, prop-drilled to deep children    | Re-fetch cascades; pointless prop drilling                               | [Server state never lives elsewhere](#server-state-never-lives-elsewhere) |
| Calling `refetch()` after a mutation                     | One query, one moment; the rest of the cache stays stale                 | [Mutations](#mutations)                                                   |
| No optimistic update for a UX-critical mutation          | A spinner for every action; the UI lags the user                         | [Mutations](#mutations)                                                   |
| `staleTime: 0` globally                                  | Excessive refetching; flickering UI                                      | [queryOptions](#queryoptions)                                             |
| Not handling loading, error, and empty states            | Blank screen on failure; a broken page on empty                          | [Server state never lives elsewhere](#server-state-never-lives-elsewhere) |
| `isLoading` used as the Suspense key                     | Breaks transitions; the view flickers                                    | [Server state never lives elsewhere](#server-state-never-lives-elsewhere) |
| `refetchOnWindowFocus` disabled for every query          | A tab left open never notices changed data                               | [QueryClient and freshness](#queryclient-and-freshness)                   |
| A mutation that never invalidates                        | Every cache entry keeps serving the pre-write value                      | [Mutations](#mutations)                                                   |
| Deriving a value inside `queryFn`                        | A second consumer of the same key reads the derived type, not the entity | [queryOptions](#queryoptions)                                             |
| `useQuery` in `mutations.ts`                             | GET hooks belong in `queries.ts`; two files, one concern                 | [Layering](#layering)                                                     |
| A hook duplicated across `queries.ts` and `mutations.ts` | Two copies, independent invalidation                                     | [Layering](#layering)                                                     |
| An empty `queries.ts` / `mutations.ts` (`export {}`)     | A dead file that reads as complete                                       | [Layering](#layering)                                                     |
| A page importing `mockData` directly                     | Fabricated data is indistinguishable from real data in production        | [Mock data fallback](#mock-data-fallback)                                 |

## Banned

| Banned                                                             | Use                      |
| ------------------------------------------------------------------ | ------------------------ |
| inline query key array                                             | the key factory          |
| `useState` + `useEffect` fetch                                     | `useQuery`               |
| server data in a Redux slice                                       | `useQuery`               |
| `useQuery` in a component + `ensureQueryData` with a different key | the same options factory |
| inline `useMutation`                                               | `<name>.mutations.ts`    |
| `refetchOnWindowFocus` re-enabled by default                       | leave the v5 default     |

## Doctor

[react-doctor](../../react-doctor/SKILL.md) · S1 server data in Redux ·
S3 raw string query keys
