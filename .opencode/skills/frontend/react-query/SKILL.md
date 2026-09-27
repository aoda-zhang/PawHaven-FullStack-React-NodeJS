---
name: react-query
description: >-
  Server-state standards for TanStack Query v5 in this project's React frontend:
  query key factories, queryOptions shared definitions, QueryClient defaults and
  staleTime strategy, useQuery and useSuspenseQuery consumption, useMutation with
  optimistic update and rollback, error boundaries, prefetching, and the feature
  api/ file split. Use when fetching, caching, invalidating, or mutating server
  data; designing query keys or QueryClient defaults; fixing loading, error, or
  empty states; TanStack Query, useQuery, useMutation, queryOptions, 服务端状态,
  数据请求, 缓存, 乐观更新.
  Not for client or UI state owned by Redux (redux), component render performance
  and effects (react), or form submission and validation (react-hook-form).
  react-doctor scans for violations of this; this skill defines them.
---

# Purpose

TanStack Query owns **server state** — data that originates from and is owned by the
server, together with its loading, error, and freshness. Client state belongs to
Redux. The failure this skill prevents is the same data living in two caches that
disagree.

Apply it whenever a change touches:

- A query, a mutation, or the `QueryClient` defaults
- Query keys, and the invalidation of anything after a write
- Loading, error, and empty states for remote data
- Optimistic updates, prefetching, or a Suspense boundary over data
- The `features/*/api/` files that hold the data layer

---

# 1. Server State Ownership

## 1.1 The boundary

A cache is not free: it refetches, dedupes, and expires on a schedule nobody wrote
down. Redux has none of that, so a Redux copy of an API response serves yesterday's
data until something remembers to update it.

| Data type                                      | Owner                        | Why                                                 |
| ---------------------------------------------- | ---------------------------- | --------------------------------------------------- |
| Server-owned data (users, posts, products)     | **TanStack Query**           | Caching, background refetch, stale-while-revalidate |
| Client-only state (auth token, UI flag, theme) | Redux Toolkit                | Not from the server; no caching needed              |
| Form input values                              | React Hook Form / `useState` | Ephemeral; not persisted                            |

**Golden rule: if it comes from an API, TanStack Query owns it. Never duplicate
server data into Redux.**

Call `useQuery` where the data is read, not at the top of the tree. A query in a
parent that props its result down re-renders every child in between and still
re-fetches whenever the parent re-renders.

## 1.2 RTK Query is not the default here

| If…                                                                  | Use…                                                |
| -------------------------------------------------------------------- | --------------------------------------------------- |
| The API is REST/GraphQL and not tightly coupled to Redux             | **TanStack Query** — more flexible, better devtools |
| The API is tightly coupled to Redux state (cache tags map to slices) | **RTK Query**                                       |
| Both client and server state are needed                              | **TanStack Query + Redux Toolkit**, separately      |

For this project TanStack Query is the standard for server state. Introduce RTK Query
only for a concrete reason, not because it also fetches.

---

# 2. Query Keys and Shared Configuration

## 2.1 Key factory — required

**Never use raw string arrays as query keys.** A factory gives literal types, one
place to change a key, and prefix invalidation: `userKeys.all` invalidates every user
query without anyone enumerating them.

```typescript
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
};
```

The full factory, the `as const` reasoning, and the invalidation matrix are in
[references/query-keys.md](references/query-keys.md).

## 2.2 `queryOptions` for anything shared

Define the query once with `queryOptions()` and pass the result to `useQuery`, a
route loader, or a prefetch. Copying the options into a second call site is how two
components end up with different `staleTime` for the same data.

```typescript
export const userQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: userKeys.detail(userId),
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000,
  });

const { data: user } = useQuery(userQueryOptions(userId));
```

## 2.3 Freshness is chosen per data type

A global `staleTime: 0` refetches on every focus and every mount, which is a
performance problem and a flickering-UI problem. Set it per data type instead: the
mapping from data type to `staleTime`, and the per-query override, are in
[references/query-client.md](references/query-client.md).

---

# 3. Reading Data

## 3.1 Dependent and conditional queries

Gate a query with `enabled` when its input may be missing. Without it the query
fires with `undefined` and caches an error under a key that will never be correct.

```typescript
const { data } = useQuery({
  ...userQueryOptions(userId!),
  enabled: !!userId,
});
```

## 3.2 `select` and `placeholderData`

`select` transforms the value a component sees without touching what is cached, and
it only runs when the cached data changes. Transforming inside `queryFn` instead
writes the derived shape into the cache, so a second consumer of the same key gets
the wrong type.

```typescript
const { data: fullName } = useQuery({
  ...userQueryOptions(userId),
  select: (user) => `${user.firstName} ${user.lastName}`,
});
```

`placeholderData: (previous) => previous` keeps the last page on screen while the
next one loads, which removes the layout jump on a filter or pagination change.

## 3.3 Loading, error, and empty states

Every query consumer handles all three. A spinner with no empty branch reads as a
broken page, and an unhandled `isError` reads as a hung one.

```tsx
function UserProfile({ userId }: { userId: string }) {
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = useQuery(userQueryOptions(userId));

  if (isLoading) return <UserProfileSkeleton />;
  if (isError)
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (!user) return <EmptyState message={t('user.notFound')} />;

  return <UserCard user={user} />;
}
```

## 3.4 `useSuspenseQuery` as a named alternative

The default is `useQuery` with explicit states. Reach for `useSuspenseQuery` when a
Suspense boundary and an `ErrorBoundary` already sit above the component: it hands
loading and error to those boundaries and guarantees `data` is non-nullable, so the
`!user` branch disappears.

```tsx
const { data: user } = useSuspenseQuery(userQueryOptions(userId));
// user is always defined here — no isLoading check needed
```

Adding it without the boundaries means the nearest ancestor is loading forever.

---

# 4. Writing Data

## 4.1 Invalidate, do not refetch

After a successful mutation, invalidate the queries the write affected instead of
calling `refetch()`. Invalidation re-runs every matching query and keeps their
freshness rules; a hand-called `refetch()` is one query, at one moment, and silently
leaves the rest of the cache stale.

```typescript
const mutation = useMutation({
  mutationFn: (data: CreatePostInput) => createPost(data),
  onSuccess: (newPost) => {
    queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    // Or write the known result straight into the cache:
    queryClient.setQueryData(postKeys.detail(newPost.id), newPost);
  },
});
```

## 4.2 Optimistic update: mutate, roll back, reconcile

A mutation a user expects to feel instant — a like, a status change, an inline edit —
should not make the UI wait for a round trip. Snapshot before mutating, roll back on
failure, and always reconcile afterwards so the cache ends up true whatever happened.

```typescript
function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTodo,

    // 1. Before the mutation fires: cancel in-flight reads, snapshot, apply
    onMutate: async (updatedTodo) => {
      await queryClient.cancelQueries({
        queryKey: todoKeys.detail(updatedTodo.id),
      });

      const previousTodo = queryClient.getQueryData(
        todoKeys.detail(updatedTodo.id),
      );

      queryClient.setQueryData(todoKeys.detail(updatedTodo.id), (old) => ({
        ...old,
        ...updatedTodo,
      }));

      return { previousTodo };
    },

    // 2. On failure: put the snapshot back and say so
    onError: (err, updatedTodo, context) => {
      if (context?.previousTodo) {
        queryClient.setQueryData(
          todoKeys.detail(updatedTodo.id),
          context.previousTodo,
        );
      }
      toast.error(t('todo.updateFailed'));
    },

    // 3. Always reconcile with the server
    onSettled: (_data, _error, updatedTodo) => {
      queryClient.invalidateQueries({
        queryKey: todoKeys.detail(updatedTodo.id),
      });
    },
  });
}
```

Skipping `onMutate` leaves a cancelled read to overwrite the optimistic value; a
mutation that reads cached data, or one a user watches change immediately, is the
case for this pattern.

## 4.3 Pending state in the UI

Drive the control from `isPending` and disable it, so a double submit cannot produce
two writes.

```tsx
<button onClick={() => mutation.mutate(formData)} disabled={mutation.isPending}>
  {mutation.isPending ? t('common.saving') : t('common.save')}
</button>
```

---

# 5. Error Handling

## 5.1 Errors that belong to an ErrorBoundary

A query whose failure means the whole page is wrong — not one card of it — should
throw to the nearest boundary so the page has one recovery path instead of a
half-rendered screen with its own inline error.

```typescript
const { data } = useQuery({ ...criticalQueryOptions, throwOnError: true });
```

Pair it with `QueryErrorResetBoundary` so that retrying clears the errored query's
state — without the reset callback, the boundary re-renders straight back into the
same error:

```tsx
import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from 'react-error-boundary';

function App() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div role="alert">
              <h2>{t('error.title')}</h2>
              <p>{error.message}</p>
              <button onClick={resetErrorBoundary}>{t('error.retry')}</button>
            </div>
          )}
        >
          <Routes />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

## 5.2 Errors a component owns

Everything else is handled at the component with `isError` / `error` and a retry, as
in §3.3. A query whose error is expected in normal operation — an optional
recommendation, a permissions check — should not tear down the view around it.

---

# 6. Prefetching

Prefetching is the cheapest performance win available: it removes the spinner without
changing a line of render code.

```tsx
function PostCard({ post }: { post: Post }) {
  const queryClient = useQueryClient();

  return (
    <Link
      to={`/posts/${post.id}`}
      onMouseEnter={() => queryClient.prefetchQuery(postQueryOptions(post.id))}
      onFocus={() => queryClient.prefetchQuery(postQueryOptions(post.id))}
    >
      {post.title}
    </Link>
  );
}
```

In a route loader, `ensureQueryData` both fetches and guarantees the value is in the
cache before the route renders:

```typescript
loader: async ({ params, context }) => {
  await context.queryClient.ensureQueryData(userQueryOptions(params.userId));
};
```

---

# 7. Data-Layer File Layout

The `api/` folder of a feature is the whole data layer, and each file has one job:

- `{feature}.api.ts` — raw fetch functions, no React
- `{feature}.queryKeys.ts` — the key factory
- `{feature}.queries.ts` — `useQuery` / `useSuspenseQuery` hooks only (GET)
- `{feature}.mutations.ts` — `useMutation` hooks only (POST/PUT/PATCH/DELETE)

`queries.ts` must not contain a `useMutation`, and `mutations.ts` must not contain a
`useQuery`. A hook that appears in both is two copies of one cache key with
independent invalidation, and the file that gets edited is the one that goes stale.

Do not create an empty `queries.ts` or `mutations.ts`. A feature with no mutations has
no `mutations.ts`, and an `export {}` placeholder is a rule violation with no
explanation.

Mock data is owned by `{feature}.api.ts` alone, as a `try`/`catch` fallback. The flow
is one-way — `mockData.ts` → `api.ts` → `queries.ts` → page — because a page that
imports mock data directly has no way to tell the difference between real and
fabricated data in production. The trees and the fallback code are in
[references/data-layer-layout.md](references/data-layer-layout.md).

---

# 8. Definition of Done

- [ ] Every hook in the change went into the right `api/` file, and no hook was added
      to both `queries.ts` and `mutations.ts`
- [ ] No empty `queries.ts` / `mutations.ts` was created to satisfy a convention
- [ ] The catalogue in [references/anti-patterns.md](references/anti-patterns.md) has
      been checked against the diff

---

# Related skills

| Domain                                         | Skill                            |
| ---------------------------------------------- | -------------------------------- |
| Client state: auth, UI flags, preferences      | `redux` skill                    |
| Components, hooks, effects, render performance | `react` skill                    |
| Form state: inputs, validation, submission     | `react-hook-form` skill          |
| Detecting data-fetching anti-patterns in code  | `code-review/react-doctor` skill |

## References

- [references/query-client.md](references/query-client.md) — the `QueryClient`
  factory with its global defaults, the data-type → `staleTime` table, the
  per-query override, and where the client is actually constructed in the portal.
  Read it before changing a cache default or adding a query with its own freshness.
- [references/query-keys.md](references/query-keys.md) — the full key factory, why
  `as const` and hierarchical prefixes are load-bearing, the invalidation matrix from
  one key to a whole subtree, and the `queryOptions` pattern shared with loaders and
  prefetch. Read it when adding a key, renaming a key, or deciding what to invalidate.
- [references/data-layer-layout.md](references/data-layer-layout.md) — the file trees
  for the feature `api/` convention and the app-wide alternative, the mock-data
  fallback with its one-way flow, and the co-located test layout. Read it when adding
  a feature's first query or restructuring an existing data layer.
- [references/anti-patterns.md](references/anti-patterns.md) — the catalogue: each
  anti-pattern, why it breaks, and the body section that states the fix. Read it
  before reporting a data-fetching change done, and when a query behaves in a way the
  code does not explain.
