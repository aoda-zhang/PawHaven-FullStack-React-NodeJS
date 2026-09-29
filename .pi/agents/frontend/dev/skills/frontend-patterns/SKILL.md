---
name: frontend-patterns
description: >
  Concrete code patterns extracted from the PawHaven portal. Copy the shape, change the names.
  Use when implementing a list page, a form, an API layer, or a route.
  触发场景 / Trigger: pattern example list page form api route 代码模板 示例.
---

# Frontend patterns

Every example below is copied from the real codebase. Match the shape.

## API layer

Four files per feature, in `features/<name>/api/`.

```ts
// <name>.queryKeys.ts
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
// <name>.queries.ts — options factory
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
// features/<name>/route.tsx
import { routePaths } from '@/router/routePaths';

export const <name>Route = {
  path: routePaths.<name>,
  lazy: async () => {
    const { <Name> } = await import('@/features/<name>/<Name>');
    return { Component: <Name> };
  },
};
```

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

```ts
export const requireUser = async ({ request }: LoaderFunctionArgs) => {
  try {
    await getQueryClient().ensureQueryData(currentUserQueryOptions(userId));
  } catch {
    throw redirect(loginRoute.path);
  }
  return null;
};
```

Redirect in the loader. Never a render-time `if (isLoading) return <Redirect />`.
