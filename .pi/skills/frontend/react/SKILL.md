---
name: react
description: >-
  React development standards for this project: component architecture and props
  contracts, the state-tool decision tree, effect discipline, error boundaries,
  the React 19 Compiler memoization policy, and a baseline accessibility floor.
  Use when writing or reviewing components, hooks, or effects — props typing,
  useState vs useReducer vs Context placement, useEffect cleanup, useMemo,
  useCallback, React.memo, lazy + Suspense, ErrorBoundary, JSX authoring,
  组件开发, hooks 规范, 性能优化, 无障碍.
  react-doctor scans for violations of this; this skill defines them. Not for
  client state (redux), server state (react-query), form state (react-hook-form),
  and tokens and layout (style).
---

# Purpose

This skill governs generic React work: component architecture, effect discipline,
error containment, the memoization policy that follows from the React 19
Compiler, and rendered accessibility. It deliberately does not restate the tools
that own adjacent state — see [Related skills](#related-skills).

Apply it whenever a change touches:

- Components — pages, layouts, shared components — and their props
- Hooks: custom hooks, effects, state placement
- State-tool decisions: which tool owns which state
- Error boundaries and Suspense
- Rendering performance and bundle splitting
- Accessibility of rendered output

---

# 1. React Doctor — Mandatory Validation

React code here is gated by `react-doctor` in CI, so a local run is the only
evidence a change is safe before it is reported done.

```bash
npx react-doctor@0.9.12
```

Pin the version to the one CI runs (`.github/workflows/react-doctor.yml`) rather
than `@latest`. A floating tag reports rules the local run and CI disagree
about, and that gap has already grown silently.

Fix every regression it reports and rerun until no new issues remain.

---

# 2. State Decision Tree

Pick the narrowest tool that can hold the state. A wider tool costs a
subscription, an extra re-render, or a staleness bug for data the narrower one
already tracks.

| State Type                                     | Solution                  | Skill Reference           |
| ---------------------------------------------- | ------------------------- | ------------------------- |
| Component-local state (toggle, input preview)  | `useState` / `useReducer` | — (this skill)            |
| Cross-component UI state (theme, locale)       | React Context             | — (this skill)            |
| Global client state (auth user, feature flags) | Redux Toolkit             | → `redux` skill           |
| Server/API state (users, posts, products)      | TanStack Query v5         | → `react-query` skill     |
| Form state (inputs, validation, submit)        | React Hook Form + Zod     | → `react-hook-form` skill |

- **Keep state as local as possible.** State hoisted above its readers re-renders
  every sibling in between.
- **Never store derived state.** A stored copy must be invalidated by hand and
  will drift from its source; compute it during render or in a selector.
- **Never store server state.** A cached API response in Redux goes stale on its
  own schedule; `react-query` already owns refetch, dedupe, and error state.
- **Do not introduce global state without a named second reader.** If nothing
  outside the component reads it, it is component state that escaped.

---

# 3. Component Architecture

## 3.1 Keep components small and focused

A component should do one thing well. Past roughly 150 lines it usually holds
more than one, and the split is mechanical: extract sub-components, hooks, and
utilities until each one has a single reason to change.

## 3.2 Prefer functional components

Class components carry lifecycle boilerplate and `this` binding that hooks
remove entirely. The one exception is a legacy class-only library you cannot
wrap.

```tsx
function UserProfile({ userId }: UserProfileProps) { ... }
```

## 3.3 Props — be explicit

An untyped prop is a contract the compiler cannot check, so it fails at the call
site instead of at the boundary. Declare an `interface` per component; prefer
`interface` over an inline object type for readability and for error messages
that name the type.

## 3.4 Destructure props in the function signature

Destructuring in the signature makes every prop the component uses visible in one
place, and marks the ones it does not touch — the two things a reader checks when
judging whether a component is over-coupled.

```tsx
function Card({ title, children, className }: CardProps) { ... }
```

## 3.5 Avoid prop drilling — use composition or context

Passing a prop through 3+ intermediate components means those components now
carry a contract they have no use for. Break the chain: `children` for layout
props, Context only for genuinely global state.

```tsx
<Layout sidebar={<Sidebar />}>
  <Content />
</Layout>
```

## 3.6 One public component per file

A file with two exports is a file with two readers and two reasons to change.
Private helpers may stay alongside their host when they are tightly coupled.

## 3.7 Named exports over default exports

A default export lets the import name drift from the declaration, which defeats
refactoring and hides the origin in autocomplete.

```tsx
export function Button(props: ButtonProps) { ... }
import { Button } from '@/components/Button';
```

---

# 4. Effects

## 4.1 Effects synchronize, they do not compute

An effect runs after render, so anything it computes is stale for one frame and
re-renders the component to catch up. Keep computation in the render body and
reserve effects for subscribing to systems React does not own: APIs, DOM,
timers, event listeners.

## 4.2 Avoid effect chains

One value that derives from another should be one expression, not two effects
that ping-pong through state.

```tsx
// ❌ cascading effects
useEffect(() => setB(a * 2), [a]);
useEffect(() => setC(b * 2), [b]);

// ✅ compute during render
const b = a * 2;
const c = b * 2;
```

## 4.3 Clean up every subscription

An uncleaned listener outlives its component and keeps its closure — and whatever
the closure captured — alive for the life of the page.

```tsx
useEffect(() => {
  const subscription = eventEmitter.on('event', handler);
  return () => subscription.off('event', handler);
}, []);
```

---

# 5. Error Boundaries

A thrown error unmounts the whole React tree by default, so one failing component
takes the page with it. A boundary converts that into a local failure with a
retry path.

- Around each route or page.
- Around feature-level components that can fail independently.
- Around third-party integrations.

Not around every small component — boundaries add a render layer, and a boundary
around something that never throws is cost with no payoff.

Fallbacks must be reachable: `role="alert"` so the failure is announced, and a
control that resets the boundary rather than a dead end.

---

# 6. Suspense & Lazy Loading

Split at the route boundary so a feature's code downloads when the feature is
entered, not on first paint.

```tsx
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

<Suspense fallback={<PageSkeleton />}>
  <DashboardPage />
</Suspense>;
```

For data-driven suspense — `useSuspenseQuery`, `QueryErrorResetBoundary` — the
`react-query` skill owns those patterns.

---

# 7. Performance

## 7.1 The React 19 Compiler handles memoization

The compiler auto-memoizes components, inlines stable callbacks, and caches
computed values. Manual `useMemo`, `useCallback`, and `React.memo` on top of it
adds code, a dependency array to keep correct, and constraints the compiler has
to work around.

The one documented escape hatch: reach for manual memoization only when a
profile shows a real cost the compiler missed, and say why in a comment.

```tsx
// React 19 — the compiler covers this
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

## 7.2 Measure before optimizing

- Optimize against a profile, not an intuition about which component is slow.
- List keys must be stable — an array index is a key only for a list that is
  static and never reordered, filtered, or paginated.
- Lazy load large features; code split with `lazy()` + `Suspense`.

---

# 8. Accessibility (a11y)

Accessibility is a floor, not an enhancement: a component that cannot be
operated by keyboard or announced by a screen reader is not finished.

- Prefer semantic HTML (`<button>`, `<nav>`, `<main>`, `<header>`). A semantic
  element arrives with role, focusability, and keyboard behaviour already right.
- Add ARIA only where semantics run out — an ARIA attribute that contradicts its
  element is worse than none.
- Meet WCAG AA contrast: 4.5:1 for normal text.
- Form errors need `role="alert"` plus `aria-describedby` pointing at the input,
  so the message is announced when focus lands on the field.
- Icons: `aria-hidden="true"` when decorative, `aria-label` when they carry
  meaning.

Form-level a11y patterns live in the `react-hook-form` skill.

---

# 9. Definition of Done

Three gates this skill owns that the sections above do not restate:

- [ ] `react-doctor` reports no new issues — the score is unchanged or better.
- [ ] Every data-fetching component renders loading, error, **and** empty states.
      A spinner with no empty branch reads as a broken page.
- [ ] `pnpm typecheck` and Prettier pass.

---

# Related skills

Adjacent state tooling and design concerns are owned elsewhere — loading two
skills for one decision is how they drift:

| Domain                                      | Skill                            |
| ------------------------------------------- | -------------------------------- |
| Client state (auth, UI flags, preferences)  | `redux` skill                    |
| Server state (API data, caching, mutations) | `react-query` skill              |
| Form state (inputs, validation, submission) | `react-hook-form` skill          |
| Shared components (API design, graduation)  | `component` skill                |
| Visual design (Tailwind, tokens, layout)    | `styling` skill                  |
| Translations (i18n, locales)                | `i18n` skill                     |
| Detecting React anti-patterns in code       | `code-review/react-doctor` skill |

## References

- [references/component-patterns.md](references/component-patterns.md) — worked
  code exemplars for §3.3 props, §3.5 prop-drilling escape, §5 error boundary
  fallback, and §7.1 memoization. Read it when authoring or reviewing a component
  and the rule above needs to be seen in code, not read about.

## Guiding principle

Composition over inheritance and over configuration. Declarative over
imperative. Explicit code over magic abstractions. Readability over brevity.
Local state over global state. The code should be obvious to the next reader,
because the next reader is whoever debugs this at 2am.
