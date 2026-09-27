# react-query — Query Keys and `queryOptions`

The full key factory and the shared `queryOptions` definition. The rule that keys come
from a factory and shared queries from `queryOptions` is in `SKILL.md` §2.1–2.2;
this file is the pattern, the reasoning, and the invalidation matrix.

## Contents

| Section                                                 | What it answers                                                |
| ------------------------------------------------------- | -------------------------------------------------------------- |
| [The key factory](#the-key-factory)                     | How to shape a factory, and what each level is for             |
| [Invalidation by prefix](#invalidation-by-prefix)       | Which key to pass to `invalidateQueries` for which scope       |
| [The `queryOptions` pattern](#the-queryoptions-pattern) | Sharing one definition across a hook, a loader, and a prefetch |

---

## The key factory

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

1. **Hierarchical invalidation.** Every key is a prefix extension of `all`, so a
   mutation can name the scope it affects without knowing every key that exists
   under it.
2. **Type safety.** `as const` preserves the literal types, so a key built from a
   factory cannot be compared against a differently-shaped raw array.
3. **Single source of truth.** No scattered `['users', id]` strings to grep for, and
   renaming a resource is one edit.

---

## Invalidation by prefix

| Call                                                               | Refetches             |
| ------------------------------------------------------------------ | --------------------- |
| `queryClient.invalidateQueries({ queryKey: userKeys.all })`        | every user query      |
| `queryClient.invalidateQueries({ queryKey: userKeys.lists() })`    | only the list queries |
| `queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })` | one specific user     |

Invalidation is prefix-based and partial by default: a matching query is marked
stale and refetched if it is currently mounted, so no new `refetch()` call is needed
at the call site.

---

## The `queryOptions` pattern

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

One definition, three call sites. This is the difference between a shared query and
three copies of the same options that happen to agree today.
