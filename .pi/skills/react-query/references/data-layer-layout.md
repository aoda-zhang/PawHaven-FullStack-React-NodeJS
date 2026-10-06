# react-query — Data-Layer Layout

The file trees for a feature's data layer, the mock-data fallback, and the
co-located test layout. The rules about which hook goes in which file are in
`SKILL.md` §7; this file is the shape of the folder.

## Contents

| Section                                                      | What it answers                                         |
| ------------------------------------------------------------ | ------------------------------------------------------- |
| [The feature `api/` convention](#the-feature-api-convention) | Where a feature's queries, keys, and mutations go       |
| [The app-wide alternative](#the-app-wide-alternative)        | The root-level layout, for data that is not a feature's |
| [Mock data fallback](#mock-data-fallback)                    | How dev mock data reaches the UI without leaking        |
| [Tests](#tests)                                              | Where the query and mutation tests live                 |

---

## The feature `api/` convention

The rule about which hook goes in which file, and why a hook may not appear in both,
is in `SKILL.md` §7. This is the shape of the folder:

```
features/{Feature}/api/
├── {feature}.api.ts        # raw fetch functions (no React hooks)
├── {feature}.queryKeys.ts  # query key factory
├── {feature}.queries.ts    # useQuery / useSuspenseQuery hooks ONLY (GET requests)
└── {feature}.mutations.ts  # useMutation hooks ONLY (POST/PUT/PATCH/DELETE)
```

A file is created when there is something to put in it, and deleted when there is
not. `api/tests/` sits beside the four files.

---

## The app-wide alternative

Codebases that keep data outside features may use a root-level layout instead. One
client, keys and `queryOptions` separated, one mutation hook per file:

```
src/
├── lib/
│   └── queryClient.ts   # the client factory + default options
├── queries/
│   ├── userKeys.ts      # key factory
│   ├── postKeys.ts
│   ├── userQueries.ts   # queryOptions definitions
│   └── postQueries.ts
└── mutations/
    ├── useCreatePost.ts # one mutation hook per file
    ├── useUpdateUser.ts
    └── useDeletePost.ts
```

Either layout is fine; mixing them in one app is not, because a reader cannot tell
where a feature's keys are supposed to live.

---

## Mock data fallback

During development, mock data lives in `mockData.ts` and is consumed by the API
layer as a fallback. Pages and components never import mock data directly — the data
flow is strictly one-way:

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

Mock data is owned by `api.ts` exclusively. A page that imports it directly has no
way to tell fabricated data from real data once the mock is deleted, and the
`isError` branch it skipped stays untested until production.

---

## Tests

Query and mutation tests are co-located with the data layer, in an `api/tests/`
folder, and are vitest — `vi.fn()` and `vi.mock()`, never the Jest equivalents. A
test that renders a component with a query needs its own `QueryClient`; use one with
`retry: false` so a failure surfaces as one assertion rather than three.
