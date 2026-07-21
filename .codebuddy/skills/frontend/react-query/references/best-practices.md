# react-query — Best Practices

Companion to `SKILL.MD`. Load when building server-state data fetching / caching / mutations.

## Golden rule

If it comes from an API, TanStack Query owns it. Never duplicate server data into Redux.

## Required patterns

- **Query key factory** — never raw string arrays. `userKeys.detail(id)` enables hierarchical invalidation.
- **`queryOptions`** for queries used in 2+ places or needing prefetch/loader.
- **Stale time by data type** — static (1h), medium (5m), frequent (30s), live (0). Not global `0`.
- **QueryClient via factory** — never raw `new QueryClient()` with inline options.
- **Feature API separation** — `queries.ts` (useQuery/GET only) and `mutations.ts` (useMutation/POST-PUT-DELETE only), never mixed, never duplicated.
- **No empty files** — only create `queries.ts` / `mutations.ts` when a relevant hook exists; delete them when empty.

## useQuery

- Handle `isLoading` + `isError` + empty/null in every consumer.
- `select` for transforms (memoized, doesn't touch cache).
- `enabled` for dependent queries; `placeholderData` to keep previous while loading.

## Mutations

- Invalidate affected queries in `onSuccess`/`onSettled` (not `refetch()`).
- UX-critical mutations: optimistic update = `onMutate` (cancel + snapshot + set) → `onError` (rollback) → `onSettled` (refetch).
- Disable submit + show `isPending` loading.

## Prefetch

- `prefetchQuery` on hover/focus for navigation-heavy flows; `ensureQueryData` in route loaders.

## Anti-patterns

Raw string keys · server data in Redux · query in parent + prop-drill · `refetch()` after mutation ·
no optimistic updates · global `staleTime:0` · unhandled loading/error · disabling refetchOnWindowFocus globally ·
useQuery in mutations.ts · duplicate hooks across queries.ts and mutations.ts · empty queries.ts/mutations.ts placeholders.
