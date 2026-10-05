---
name: frontend-patterns
description: >
  Concrete code patterns extracted from the PawHaven portal. Copy the shape, change the names.
  Use when implementing a list page, a form, an API layer, or a route.
  触发场景 / Trigger: pattern example list page form api route 代码模板 示例.
---

# Frontend patterns

Every example below is copied from the real codebase. Match the shape. Where a file is described as
optional, it is because a real feature does not have it — not because the template is flexible.

## API layer

The files a feature needs depend on what it does. The `frontend` skill has the per-feature
breakdown —
[Feature layout](../../../../skills/frontend/SKILL.md#feature-layout).

```ts
// <name>.queryKeys.ts — every feature with server data has this
export const <name>QueryKeys = {
  all: ['<name>'] as const,
  current: (id: string) => [...<name>QueryKeys.all, 'current', id] as const,
};
```

```ts
// <name>.api.ts — raw requests only
import type { X } from '@pawhaven/shared/types';
import { apiClient } from '@/utils/apiClient';

export const getX = async (): Promise<X> => apiClient.get<X>('/x');
```

```ts
// <name>.queries.ts — one options factory per read; absent when a feature has no read
export const xQueryOptions = (id: string) => ({
  queryKey: <name>QueryKeys.current(id),
  queryFn: getX,
  staleTime: 5 * 60 * 1000,
  retry: false,
});
```

`apiClient` unwraps the envelope — request functions resolve to the payload directly.

## Route

```ts
// features/rescue-cases/route.tsx — the loader form, for a feature that reads
import { rescueCasesQueryOptions } from './api/rescueCases.queries';

import { getQueryClient } from '@/providers/QueryProvider';
import { routePaths } from '@/router/routePaths';

export const rescueCasesLoader = async () => {
  const queryClient = getQueryClient();
  return queryClient.ensureQueryData(rescueCasesQueryOptions());
};

export const rescueCasesRoute = {
  path: routePaths.rescueCases,
  loader: rescueCasesLoader,
  lazy: async () => {
    const { RescueCasesPage } =
      await import('@/features/rescue-cases/RescueCases');
    return { Component: RescueCasesPage };
  },
};
```

A route with no loader of its own — `features/auth/route.tsx` — is `path` + `Component` + `handle`
only. Do not add an empty loader.

## List page

```tsx
const <Name>Page = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = useLoaderData() as Item[];
  const [filter, setFilter] = useState('all');

  return (
    <div className="max-w-6xl px-4">
      {items.map((item) => (
        <Card key={item.id} onClick={() => navigate(`/path/${item.id}`)} />
      ))}
    </div>
  );
};
```

- `key` is a stable id, never the array index.
- Translate at render: store the key in a constant, call `t(option.labelKey)`.
- Layout container: `max-w-6xl px-4`.

## Form section

```tsx
// Parent owns the form
const form = useForm<FormValues>({
  resolver: zodResolver(FormSchema),
  defaultValues: initialValues,
});

// Section consumes context — never a second useForm
const { control } = useFormContext<FormValues>();
const watched = useWatch({ control, name: 'field' });

<FormInput name="field" label={t('ns.field')} required />;
```

- Use `@pawhaven/ui/form` primitives, never raw `<input>`.
- `useWatch` for a value that drives another field's visibility.

## Loader / guard

`features/auth/route.tsx` is the guard to copy — it reads the persisted profile off the store,
prefetches through the same options the component reads, and redirects in the loader:

```ts
export const requireUser = async ({ request }: LoaderFunctionArgs) => {
  const { pathname, search } = new URL(request.url);
  const redirectTo = `${routePaths.login}?${routeSearchParams.redirect}=${encodeURIComponent(`${pathname}${search}`)}`;

  try {
    await getQueryClient().ensureQueryData(
      currentUserQueryOptions(getCurrentUserId()),
    );
  } catch {
    throw redirect(redirectTo);
  }

  return null;
};
```

`getCurrentUserId()` reads `store.getState()` — valid in a loader, not in a component. Redirect in
the loader. Never a render-time `if (isLoading) return <Redirect />`.
