# React standards

Component shape, the state decision tree, effect discipline, the React Compiler memoization policy,
and the project's import and export patterns. The router that names when to read this is
[frontend-patterns](../SKILL.md).

## Component shape — HIGH

**Incorrect (default export, `React.FC`):**

```tsx
export default function PetCard({ pet }: { pet: Pet }) { ... }
```

**Correct (named export, plain function):**

```tsx
export type PetCardProps = { pet: Pet };
export const PetCard = ({ pet }: PetCardProps) => { ... };
```

- Destructure props in the signature. Do not read `props.x`.
- One component per file, unless the second is a private helper of the first.
- Page-level components may use the bottom-export form; do not mix both styles in one file.
- Define an explicit `Props` / `*Props` interface for every component; never bare inline object
  params for externally-consumed components.
- Prefer composition + `children` over prop-drilling deep config; keep components
  single-responsibility.
- No business logic or side effects inside presentational components — they are `UI = f(props)`.
  Data fetching and state live in feature containers or via TanStack Query.
- `import type` for type-only imports (e.g. `import type { Ref } from 'react'`).
- Components must be deterministic given props — no hidden global state mutation.

### Typed props interface

`interface ButtonProps` — optional fields marked, `onClick` carried as a callback rather than a
handler wired inside, so the parent keeps ownership of what the click means.

```tsx
interface ButtonProps {
  label: string;
  variant: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

function Button({ label, variant, disabled, onClick, className }: ButtonProps) {
  // ...
}
```

Two shapes to reject: `any`, which removes the contract entirely, and an inline object type, which
cannot be named in an error message or extended by a caller.

```tsx
// ❌ any
function Button(props: any) { ... }

// ❌ inline type — no name to point at, no place to add a field
function Button({ label }: { label: string }) { ... }
```

### Breaking a prop-drilling chain

Two props that pass through the same three components is the trigger. Both escapes return the
layout to whoever owns the data.

Composition, when the value is a slot the intermediate components only position:

```tsx
function Page() {
  const user = useCurrentUser();
  return (
    <Layout sidebar={<Sidebar user={user} />}>
      <Content user={user} />
    </Layout>
  );
}
```

Context, when the value is global and the readers are scattered:

```tsx
const ThemeContext = createContext<Theme>(defaultTheme);

function App() {
  return (
    <ThemeContext.Provider value={theme}>
      <Page />
    </ThemeContext.Provider>
  );
}

function Page() {
  const theme = useContext(ThemeContext); // no prop drilling
}
```

### Error boundary fallback

```tsx
import { ErrorBoundary } from 'react-error-boundary';

function Fallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className="p-6 text-center">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground mt-2">{error.message}</p>
      <button onClick={resetErrorBoundary} className="mt-4">
        Try Again
      </button>
    </div>
  );
}

// Route-level boundary
<ErrorBoundary FallbackComponent={Fallback}>
  <FeaturePage />
</ErrorBoundary>;
```

## State decision tree — CRITICAL

Walk in order. Stop at the first that fits.

1. **Derived** — compute during render. No state.
2. **URL** — shareable, back-button-safe → `useSearchParams`.
3. **Server** — anything from the API → TanStack Query. Never `useState` + `useEffect` fetch.
4. **Form** — user input → React Hook Form + Zod. Never `useState` per field.
5. **Client** — cross-component, session-scoped → Redux Toolkit slice.
6. **Local** → `useState`. Two values that change together → `useReducer`.

## Effects — CRITICAL

**Incorrect (fetch in effect):**

```tsx
const [pets, setPets] = useState<Pet[]>([]);
useEffect(() => {
  fetchPets().then(setPets);
}, []);
```

**Correct (TanStack Query):**

```tsx
const { data: pets } = useQuery(petsQueryOptions());
```

- Effects synchronize with something outside React. They do not compute, derive, or transform.
- Every subscription, timer, listener, and observer returns its cleanup.
- No effect chains. One effect, one synchronization.
- Deps are exhaustive. Do not silence with a disable comment — restructure instead.

## React 19 — HIGH

`forwardRef` is obsolete: a function component accepts `ref` as a prop.

- ❌ `const X = forwardRef<HTMLInputElement, Props>((props, ref) => ...)` + `X.displayName = 'X'`
- ✅ Plain function component that receives `ref` in its props:

```tsx
// ref is a normal prop — set its type explicitly
interface StyledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

const StyledInput = ({ className, ref, ...props }: StyledInputProps) => (
  <input ref={ref} className={className} {...props} />
);
```

- `displayName` is no longer required for the ref fix — a named function/const already gives the
  devtools name. Set it only when you genuinely need a custom display string.
- This applies to any custom component, hook wrapper, or third-party-lib `inputComponent` where a
  `ref` must reach a DOM node.

What is specific to writing:

- No manual `memo` / `useMemo` / `useCallback` for ordinary re-render cost. The React Compiler handles it.
  Memoize only for a measured reason: an expensive third-party object identity, or a value passed
  to a non-Compiler child.
- `defaultProps` is gone. Use default parameter values.

### Memoization, with and without

The two files below compute the same thing. The second one is not more correct — it is the shape to
stop writing once the compiler is enabled.

```tsx
// ✅ React 19 — compiler handles memoization
function ExpensiveList({ items, filter }: Props) {
  const filtered = items.filter((item) => item.category === filter);
  const handleClick = (id: string) => {
    /* ... */
  };

  return filtered.map((item) => (
    <Item key={item.id} item={item} onClick={handleClick} />
  ));
}
```

```tsx
// ❌ manual memoization the compiler already covers
function ExpensiveList({ items, filter }: Props) {
  const filtered = useMemo(
    () => items.filter((item) => item.category === filter),
    [items, filter],
  );
  const handleClick = useCallback((id: string) => {
    /* ... */
  }, []);

  return filtered.map((item) => (
    <Item key={item.id} item={item} onClick={handleClick} />
  ));
}
```

When a profile justifies the manual version anyway, the comment has to say which cost was measured:

```tsx
// profiled: 1.2k rows, 40ms per filter keystroke on the verified list
const filtered = useMemo(
  () => items.filter((item) => item.category === filter),
  [items, filter],
);
```

## Project patterns — HIGH

- Alias `@/` → `apps/frontend/portal/src`. Relative imports within a feature.
- Lazy-load routes:

  ```ts
  export const petRoute = {
    path: routePaths.pet,
    lazy: async () => {
      const { Pet } = await import('@/features/pet/Pet');
      return { Component: Pet };
    },
  };
  ```

- Page data via `useLoaderData()`; guard data with a loader or a route guard, not a render-time `if`.
- Event handlers declared inside the component. Do not define a component inside another component.
- `key` is a stable id. Never the array index for a mutable list.

## Accessibility floor — HIGH

**Incorrect (`<div onClick>`, placeholder as label):**

```tsx
<div onClick={handleSubmit}>Submit</div>
<input placeholder="Email" />
```

**Correct:**

```tsx
<button type="button" onClick={handleSubmit}>Submit</button>
<label htmlFor="email">Email</label>
<input id="email" placeholder="you@example.com" />
```

- Icon-only controls carry `aria-label`.
- Images carry `alt`. Decorative images use `alt=""`.

## Doctor

[react-doctor](../../react-doctor/SKILL.md) · S1 Redux server data ·
S2 bare `useDispatch`/`useSelector` · S5 `console.log`
