---
name: react
description: >
  React 19 standards for the PawHaven portal: component shape, the state decision tree, effect
  discipline, the React Compiler memoization policy, and the project's import and export patterns.
  Use when writing or reviewing components, hooks, or effects. Do NOT use for backend NestJS
  code, CSS token definitions, or routing configuration.
metadata:
  triggers:
    - 'create a React component'
    - 'fix a hook'
    - 'why is this re-rendering'
  not_triggers:
    - 'write a NestJS service'
    - 'add a design token'
---

# React

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

`forwardRef` is obsolete: a function component accepts `ref` as a prop. The rule, the types, and the
worked ❌/✅ pair are in `project-rules` —
[React 19](../project-rules/references/components.md) — which is the one place they are stated, and
which every reviewer also reads. Do not retype the example here.

What is specific to writing:

- No manual `memo` / `useMemo` / `useCallback` for ordinary re-render cost. The React Compiler handles it.
  Memoize only for a measured reason: an expensive third-party object identity, or a value passed
  to a non-Compiler child.
- `defaultProps` is gone. Use default parameter values.

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

[react-doctor](../code-review/react-doctor/SKILL.md) · S1 Redux server data ·
S2 bare `useDispatch`/`useSelector` · S5 `console.log`
