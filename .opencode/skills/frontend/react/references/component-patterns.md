# react — Component Patterns

Worked code exemplars for `SKILL.md`. Every rule stays in `SKILL.md`; this file
is only the code, so a model can read the rule inline and open this when it needs
the shape rather than the statement.

## Contents

| Section                                                                          | SKILL.md rule |
| -------------------------------------------------------------------------------- | ------------- |
| [Typed props interface](#typed-props-interface)                                  | §3.3          |
| [Breaking a prop-drilling chain](#breaking-a-prop-drilling-chain)                | §3.5          |
| [Error boundary fallback](#error-boundary-fallback)                              | §5            |
| [React 19 memoization, with and without](#react-19-memoization-with-and-without) | §7.1          |

## Typed props interface

`interface ButtonProps` — optional fields marked, `onClick` carried as a
callback rather than a handler wired inside, so the parent keeps ownership of
what the click means.

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

Two shapes to reject: `any`, which removes the contract entirely, and an inline
object type, which cannot be named in an error message or extended by a caller.

```tsx
// ❌ any
function Button(props: any) { ... }

// ❌ inline type — no name to point at, no place to add a field
function Button({ label }: { label: string }) { ... }
```

## Breaking a prop-drilling chain

Two props that pass through the same three components is the trigger. Both
escapes return the layout to whoever owns the data.

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

## Error boundary fallback

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

## React 19 memoization, with and without

The two files below compute the same thing. The second one is not more correct —
it is the shape to stop writing once the compiler is enabled.

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

When a profile justifies the manual version anyway, the comment has to say which
cost was measured:

```tsx
// profiled: 1.2k rows, 40ms per filter keystroke on the verified list
const filtered = useMemo(
  () => items.filter((item) => item.category === filter),
  [items, filter],
);
```
