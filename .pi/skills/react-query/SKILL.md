---
name: react-query
description: >
  TanStack Query v5 standards for the PawHaven portal. Query keys come from a factory, server
  data lives only here, and loaders prefetch through the same options the component reads.
  Use when reading or writing anything from the API.
  Trigger: query mutation fetch cache invalidate server data api request.
---

# react-query

## Layering

Four files per feature, in `features/<feature>/api/`:

| File                  | Holds                                                             |
| --------------------- | ----------------------------------------------------------------- |
| `<name>.api.ts`       | raw request functions — the only place that calls the HTTP client |
| `<name>.queries.ts`   | `queryOptions` factories, one per read                            |
| `<name>.mutations.ts` | `useMutation` hooks                                               |
| `<name>.queryKeys.ts` | the key factory                                                   |

A component never calls `<name>.api.ts` directly for a read. It imports the options.

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

[react-doctor](../code-review/react-doctor/SKILL.md) · S1 server data in Redux ·
S3 raw string query keys
