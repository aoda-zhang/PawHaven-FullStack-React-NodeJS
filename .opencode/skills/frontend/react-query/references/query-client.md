# react-query — QueryClient and Freshness

The `QueryClient` construction, the global defaults, and the data-type → `staleTime`
mapping. The rule that these are set per data type rather than globally is in
`SKILL.md` §2.3; this file is the table and the code.

## Contents

| Section                                                           | What it answers                                      |
| ----------------------------------------------------------------- | ---------------------------------------------------- |
| [The factory](#the-factory)                                       | How the client is constructed once                   |
| [Stale time by data type](#stale-time-by-data-type)               | Which `staleTime` a given data type gets             |
| [Overriding per query](#overriding-per-query)                     | When one query may differ from the default           |
| [Where this lives in the portal](#where-this-lives-in-the-portal) | Which file owns the client in `apps/frontend/portal` |

---

## The factory

Build the client in a factory function rather than inlining options at each call
site, so the defaults are one edit instead of N.

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

`refetchOnWindowFocus: false` is set explicitly here rather than inherited: v5 still
defaults it to `true`, and a left-open tab then refetches every focus. A per-query
`true` is the right escape for live data — the dashboard counter, a presence badge.

---

## Stale time by data type

| Data type               | `staleTime`               | Example                                         |
| ----------------------- | ------------------------- | ----------------------------------------------- |
| Static / rarely changes | `60 * 60 * 1000` (1 hour) | User preferences, feature flags, countries list |
| Medium freshness        | `5 * 60 * 1000` (5 min)   | Product catalog, user profiles                  |
| Frequently changing     | `30 * 1000` (30 sec)      | Notifications, messages                         |
| Real-time / live        | `0` (always stale)        | Feed, dashboard stats                           |

---

## Overriding per query

Only when the data genuinely differs from its class — a profile that changes on
upload, not on scroll:

```typescript
useQuery({
  queryKey: userKeys.detail(userId),
  queryFn: () => fetchUser(userId),
  staleTime: 60 * 60 * 1000, // user profile rarely changes
});
```

---

## Where this lives in the portal

`apps/frontend/portal/src/providers/QueryProvider.tsx` owns the single client,
exposed as `getQueryClient()` and memoized in a module-level variable. Defaults are
supplied through `getRequestQueryOptions()` from `@pawhaven/frontend-core`, with the
runtime-config values read from `loadConfig().query` overriding the constants.

The practical rule: a second `new QueryClient()` anywhere in the portal creates a
second cache, so a `useMutation` in one tree will not invalidate a query in the
other. Tests may construct their own client; application code may not.
