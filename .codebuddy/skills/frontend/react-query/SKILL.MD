---
name: react-query
description: >
  TanStack Query v5 服务端状态管理规范 / TanStack Query v5 Enterprise Patterns.
  定义服务端数据请求全流程标准：QueryClient 配置（staleTime/gcTime/retry）、Query Key Factory 查询键工厂（禁止裸字符串）、queryOptions 共享查询配置、useQuery 数据获取、useMutation 变更操作与乐观更新 optimistic update、错误边界 error boundary 集成、预取 prefetch、无限滚动 useInfiniteQuery、防重复请求。
  服务端状态属于 TanStack Query — 永远不要放入 Redux store。
  触发场景 / Trigger: 数据请求 data fetching server state API request network call HTTP fetch axios, API 调用 API call endpoint integration request response REST GraphQL, TanStack Query react-query v5 useQuery useMutation useInfiniteQuery useSuspenseQuery, useQuery query key data isLoading isError isFetching isPending status error refetch, useMutation mutate mutateAsync onSuccess onError onSettled onMutate optimistic update rollback, 乐观更新 optimistic update immediate UI feedback rollback on error cache invalidation, 缓存 cache staleTime gcTime cacheTime garbage collection time refetchInterval refetchOnWindowFocus, staleTime stale data fresh data background refetch staleness window focus, 预取 prefetch prefetchQuery queryClient.prefetchQuery hover hover intent eager loading, 无限滚动 infinite scroll useInfiniteQuery fetchNextPage hasNextPage isFetchingNextPage getNextPageParam, 服务端状态 server state never in Redux store separation of concerns async server cache, query key factory queryOptions shared config convention DRY typed keys, 加载状态 loading state spinner skeleton placeholder isPending isFetching isLoading status, 错误处理 error handling error boundary QueryErrorResetBoundary retry onError toast notification, 重试 retry retryDelay exponential backoff max retries retryOnMount, 轮询 polling refetchInterval periodic automatic refresh real-time updates, query invalidation cache invalidation invalidateQueries refetch active queries, mutation side effects POST PUT PATCH DELETE create update delete, suspense React Suspense enabled useSuspenseQuery error boundary integration.
version: 1.0
---

# Purpose

This skill defines TanStack Query v5 standards for the project. TanStack Query manages **server state** — data that originates from and is owned by the server. Client state belongs in Redux; server state belongs here.

Apply this skill whenever working on:

- API data fetching (queries, mutations)
- Cache configuration (staleTime, gcTime, retry)
- Query key design and invalidation
- Optimistic updates
- Error handling for server data
- Prefetching strategies

---

# 1. When to Use TanStack Query vs Redux

| Data Type | Solution | Why |
|-----------|----------|-----|
| Server-owned data (users, posts, products) | **TanStack Query** | Caching, background refetch, stale-while-revalidate |
| Client-only state (auth token, UI flag, theme) | Redux Toolkit | Not from the server; doesn't need caching |
| Form input values | React Hook Form / `useState` | Ephemeral; not persisted |

**Golden Rule: If it comes from an API, TanStack Query owns it. Never duplicate server data into Redux.**

---

# 2. QueryClient Configuration

## 2.1 Global Defaults

Create a factory function that returns sensible defaults. Do NOT inline raw options in every query.

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,          // 5 min — data considered fresh
        gcTime: 30 * 60 * 1000,             // 30 min — keep in cache after unused
        retry: 2,                            // retry twice on failure
        refetchOnWindowFocus: false,         // don't refetch on tab switch (default in v5)
        refetchOnReconnect: true,            // refetch when coming back online
      },
      mutations: {
        retry: 1,                            // retry mutations once
      },
    },
  });
}
```

## 2.2 Stale Time Strategy by Data Type

Choose `staleTime` based on how frequently data changes:

| Data Type | staleTime | Example |
|-----------|-----------|---------|
| Static / rarely changes | `60 * 60 * 1000` (1 hour) | User preferences, feature flags, countries list |
| Medium freshness | `5 * 60 * 1000` (5 min) | Product catalog, user profiles |
| Frequently changing | `30 * 1000` (30 sec) | Notifications, messages |
| Real-time / live | `0` (always stale) | Feed, dashboard stats |

Configure per-query when it differs from the global default:

```typescript
useQuery({
  queryKey: userKeys.detail(userId),
  queryFn: () => fetchUser(userId),
  staleTime: 60 * 60 * 1000,  // user profile rarely changes
});
```

---

# 3. Query Key Factory — Required Pattern

**Never use raw string arrays as query keys.** Use a structured factory for type safety and hierarchical invalidation.

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

**Why:**

1. **Hierarchical invalidation** — invalidate all users or just one:
   ```typescript
   queryClient.invalidateQueries({ queryKey: userKeys.all });      // all user queries
   queryClient.invalidateQueries({ queryKey: userKeys.lists() });  // only list queries
   queryClient.invalidateQueries({ queryKey: userKeys.detail(id) }); // one specific user
   ```

2. **Type safety** — `as const` preserves literal types.

3. **Single source of truth** — no scattered raw `['users', id]` strings across files.

---

# 4. `queryOptions` — Reusable Query Configurations

Use `queryOptions()` to create reusable, type-safe query definitions that can be shared between `useQuery`, `useSuspenseQuery`, route loaders, and prefetching.

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

// In component:
const { data: user } = useQuery(userQueryOptions(userId));

// In route loader:
loader: ({ params }) =>
  queryClient.ensureQueryData(userQueryOptions(params.userId)),

// Prefetch:
queryClient.prefetchQuery(userQueryOptions(userId));
```

✅ **Always define `queryOptions` for queries that are used in multiple places or need prefetching.**

---

# 5. `useQuery` Patterns

## 5.1 Basic Query

```typescript
const { data, isLoading, isError, error } = useQuery(userQueryOptions(userId));
```

## 5.2 Dependent / Conditional Query

```typescript
// Only fetch when userId is defined
const { data } = useQuery({
  ...userQueryOptions(userId!),
  enabled: !!userId,
});
```

## 5.3 Data Transformation (`select`)

Use `select` to transform data without affecting the cached value:

```typescript
const { data: fullName } = useQuery({
  ...userQueryOptions(userId),
  select: (user) => `${user.firstName} ${user.lastName}`,
});
```

✅ `select` only runs when data changes (memoized). ❌ Don't transform in the query function — mutate cached data.

## 5.4 Placeholder Data

```typescript
const { data } = useQuery({
  ...userQueryOptions(userId),
  placeholderData: (previousData) => previousData,  // keep previous data while loading
});
```

## 5.5 Loading / Error / Empty States

**Every query consumer MUST handle these three states:**

```tsx
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, isError, error } = useQuery(userQueryOptions(userId));

  if (isLoading) return <UserProfileSkeleton />;
  if (isError) return <ErrorState message={error.message} onRetry={() => refetch()} />;
  if (!user) return <EmptyState message="User not found" />;

  return <UserCard user={user} />;
}
```

---

# 6. `useMutation` Patterns

## 6.1 Basic Mutation

```typescript
const mutation = useMutation({
  mutationFn: (data: CreatePostInput) => createPost(data),
  onSuccess: (newPost) => {
    // Invalidate related queries so they refetch
    queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    // Or: manually add to cache
    queryClient.setQueryData(postKeys.detail(newPost.id), newPost);
  },
});
```

## 6.2 Optimistic Update — Required for UX-critical mutations

Always implement **optimistic update with rollback** for mutations where users expect instant feedback (likes, status changes, inline edits):

```typescript
function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTodo,

    // 1. Before mutation fires: optimistically update cache
    onMutate: async (updatedTodo) => {
      // Cancel in-flight queries to avoid race conditions
      await queryClient.cancelQueries({ queryKey: todoKeys.detail(updatedTodo.id) });

      // Snapshot previous value for rollback
      const previousTodo = queryClient.getQueryData(todoKeys.detail(updatedTodo.id));

      // Apply optimistic update
      queryClient.setQueryData(todoKeys.detail(updatedTodo.id), (old) => ({
        ...old,
        ...updatedTodo,
      }));

      // Return context for onError
      return { previousTodo };
    },

    // 2. On failure: roll back
    onError: (err, updatedTodo, context) => {
      if (context?.previousTodo) {
        queryClient.setQueryData(todoKeys.detail(updatedTodo.id), context.previousTodo);
      }
      toast.error('Failed to update. Changes reverted.');
    },

    // 3. Always refetch to sync with server
    onSettled: (_data, _error, updatedTodo) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.detail(updatedTodo.id) });
    },
  });
}
```

**The three-step pattern: `onMutate` (optimistic + snapshot) → `onError` (rollback) → `onSettled` (refetch)**

## 6.3 Mutation State in UI

```tsx
<button
  onClick={() => mutation.mutate(formData)}
  disabled={mutation.isPending}
>
  {mutation.isPending ? 'Saving...' : 'Save'}
</button>
```

---

# 7. Error Handling

## 7.1 Error Boundaries for Critical Queries

For queries where errors should be handled globally (not per-component), use `throwOnError`:

```typescript
const { data } = useQuery({
  ...criticalQueryOptions,
  throwOnError: true,  // re-throw to nearest ErrorBoundary
});
```

Wrap with `QueryErrorResetBoundary` + `ErrorBoundary`:

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
              <h2>Something went wrong</h2>
              <p>{error.message}</p>
              <button onClick={resetErrorBoundary}>Try Again</button>
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

## 7.2 Per-Query Error Handling

For non-critical queries, handle errors at the component level with `isError` / `error`:

```typescript
if (isError) {
  return <InlineError message={error.message} onRetry={() => refetch()} />;
}
```

---

# 8. Prefetching

## 8.1 Prefetch on Hover

The cheapest performance win — eliminate loading spinners:

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

## 8.2 Prefetch in Route Loaders

```typescript
loader: async ({ params, context }) => {
  await context.queryClient.ensureQueryData(userQueryOptions(params.userId));
};
```

---

# 9. `useSuspenseQuery` — When to Use

`useSuspenseQuery` is for when you want React Suspense to handle loading/error states instead of manual `isLoading`/`isError` checks.

| Pattern | When |
|---------|------|
| `useQuery` | Default choice. Explicit control over loading/error/empty states. |
| `useSuspenseQuery` | When you have a Suspense boundary + ErrorBoundary higher in the tree. `data` is guaranteed non-nullable. |

```tsx
// With Suspense — loading/error handled by boundaries above
const { data: user } = useSuspenseQuery(userQueryOptions(userId));
// user is always defined here — no isLoading check needed
return <UserCard user={user} />;
```

**Key difference**: `useSuspenseQuery` guarantees `data` is never `undefined`. TypeScript reflects this — no `| undefined` in the type.

---

# 10. File Organization

```
src/
├── lib/
│   └── queryClient.ts           # createQueryClient factory + default options
├── queries/
│   ├── userKeys.ts              # user key factory
│   ├── postKeys.ts              # post key factory
│   ├── userQueries.ts           # user queryOptions definitions
│   └── postQueries.ts           # post queryOptions definitions
├── mutations/
│   ├── useCreatePost.ts         # mutation hook (one per file)
│   ├── useUpdateUser.ts
│   └── useDeletePost.ts
```

✅ One mutation hook per file. ✅ Keys and queryOptions in separate files. ✅ No scattered query keys.

## 10.1 Feature API Directory Structure

Within each feature, queries and mutations MUST be kept in separate files:

```
features/{Feature}/api/
├── {feature}.api.ts       # raw fetch functions (no React hooks)
├── {feature}.queryKeys.ts # query key factory
├── {feature}.queries.ts   # useQuery / useSuspenseQuery hooks ONLY (GET requests)
└── {feature}.mutations.ts # useMutation hooks ONLY (POST/PUT/PATCH/DELETE)
```

**Critical rules:**

- `queries.ts` — ONLY exports `useQuery` / `useSuspenseQuery` hooks. Must NOT contain `useMutation`.
- `mutations.ts` — ONLY exports `useMutation` hooks. Must NOT contain `useQuery`.
- No duplication — every hook must live in exactly ONE of these two files. If a hook appears in both, it is a violation.
- Never create an empty `queries.ts` or `mutations.ts`. Only create the file when there is at least one relevant API hook to put in it. If a feature has no queries, do not create `queries.ts`; if it has no mutations, do not create `mutations.ts`.

---

# 11. Common Anti-Patterns

| Anti-Pattern | Why It's Wrong | Fix |
|-------------|---------------|-----|
| Raw string query keys | No type safety; scattered magic strings | Use query key factory |
| Storing query data in Redux | Duplicates cache; stale data risk | Query Client IS the cache |
| `useQuery` in parent, prop-drill to deep children | Re-fetch cascades; unnecessary prop drilling | Call `useQuery` near where data is used |
| Calling `refetch()` after mutation | Fragile; manual sync | Use `queryClient.invalidateQueries()` |
| No optimistic updates for UX-critical mutations | User sees loading spinner for every action | Use `onMutate` + snapshot + rollback |
| `staleTime: 0` globally | Excessive refetching; bad UX | Set intentional stale times per data type |
| Not handling loading/error states | Blank screen or crash on API failure | Every query consumer MUST handle isLoading + isError |
| Using `isLoading` as key for Suspense | Breaks transitions; flickering | Use `placeholderData: keepPrevious` or Suspense boundary |
| Disabling `refetchOnWindowFocus` for all queries | Misses stale data when user returns | Only disable for static data |
| Mutation not calling `invalidateQueries` on success | Stale cache after mutation | Always invalidate affected queries in `onSuccess` or `onSettled` |
| `useQuery` in mutations.ts | Mixes concerns; GET hooks belong in queries.ts | Move useQuery to queries.ts; mutations.ts only exports useMutation |
| Duplicate hooks in queries.ts and mutations.ts | Stale copies; merge conflicts; confusion | Keep each hook in exactly one file |
| Empty `queries.ts` / `mutations.ts` (`export {};` placeholder) | Dead files; rule violation | Delete the file when there is no relevant hook |

---

# 12. TanStack Query vs RTK Query Decision

If you also have RTK Query in the project, follow this rule:

| If... | Use... |
|-------|--------|
| Your API is REST/GraphQL and not tightly coupled to Redux | **TanStack Query** (more flexible, better devtools) |
| Your API is tightly coupled to Redux state (e.g., cache tags map to slices) | **RTK Query** |
| You need both client + server state in one tool | **TanStack Query** + Redux Toolkit separately |

For this project: **TanStack Query is the standard for server state.** Only introduce RTK Query if there is a concrete reason.

---

# 13. Definition of Done

A TanStack Query change is complete when:

- [ ] Query keys are defined via a key factory (no raw string arrays)
- [ ] Shared query configs use `queryOptions()` (no duplicated config)
- [ ] Every `useQuery` consumer handles `isLoading`, `isError`, and empty/null states
- [ ] Mutations invalidate affected queries via `queryClient.invalidateQueries()`
- [ ] UX-critical mutations implement optimistic update with rollback
- [ ] `staleTime` is set intentionally per data type (not just default)
- [ ] Prefetch is used on hover/focus for navigation-heavy flows
- [ ] No server data is duplicated into Redux
- [ ] Error boundaries wrap critical query sections
- [ ] QueryClient is created via a factory function, not raw `new QueryClient()`
- [ ] `queries.ts` only exports `useQuery` hooks (GET); `mutations.ts` only exports `useMutation` hooks
- [ ] No hook is duplicated across `queries.ts` and `mutations.ts`

## Related

- Best practices: [references/best-practices.md](references/best-practices.md)
- Client state: [redux](../redux/SKILL.MD) · React core: [react](../react/SKILL.MD)
- Golden rule — never put server state in Redux: [redux](../redux/SKILL.MD)
