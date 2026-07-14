---
name: react
description: >
  React 开发标准 / Enterprise-Grade React Development Standards.
  定义 React 组件开发全链路规范：组件架构模式、状态管理决策树（useState vs useReducer vs Redux vs TanStack Query）、useEffect 使用规范与清理、性能优化（useMemo/useCallback/React.memo）、无障碍访问 a11y（语义化 HTML/ARIA/keyboard navigation）、Error Boundary 错误边界、React Doctor 验证工具、Props 类型定义、组件拆分原则。
  触发场景 / Trigger: React 开发 react development frontend framework library SPA JSX TSX component-based, 组件开发 component create build implement author compose design write, hooks useState useEffect useCallback useMemo useRef useContext useReducer custom hook rules of hooks, 性能优化 performance optimization memoization memo useMemo useCallback React.memo lazy Suspense code splitting bundle size, 无障碍 accessibility a11y wai-aria WCAG screen reader keyboard navigation focus trap semantic HTML, 错误边界 error boundary ErrorBoundary componentDidCatch getDerivedStateFromError fallback UI resilience, React Doctor validation tool best practice check automated fix recommendation lint, 状态管理决策 state decision tree when to use what useState vs useReducer vs context vs Redux vs TanStack Query, 组件架构 component architecture composition pattern container presentational smart dumb separation, 语义化 HTML semantic HTML main nav section article aside header footer form label input button, ARIA role label describedby hidden expanded selected checked live polite assertive, 键盘导航 keyboard navigation tabIndex tab order focus management onKeyDown enter escape, useEffect cleanup subscription teardown abort controller cleanup function dependency array, component lifecycle mount unmount update re-render reconciliation virtual DOM, children prop composition render prop pattern compound component slot pattern, forwardRef useImperativeHandle ref forwarding imperative handle.
version: 2.0
---

# Purpose

This skill defines React development standards for the project. It covers **generic React patterns** — component architecture, effects, performance, accessibility, error handling.

For specialized patterns, see the companion skills:

| Domain | Skill |
|--------|-------|
| Client state (auth, UI flags, preferences) | `redux` skill |
| Server state (API data, caching, mutations) | `react-query` skill |
| Form state (inputs, validation, submission) | `react-hook-form` skill |
| Shared components (API design, graduation) | `component` skill |
| Visual design (Tailwind, tokens, layout) | `styling` skill |
| Translations (i18n, locales) | `i18n` skill |

Apply this skill whenever working on:

- React components (pages, layouts, shared components)
- Hooks (custom hooks, effects, state logic)
- State architecture decisions (which tool for which state)
- Routing (React Router)
- Error boundaries and Suspense
- Performance optimization
- Accessibility
- Event handlers and side effects

---

# 1. React Doctor — Mandatory Validation

## Every change MUST be checked with React Doctor

After any React-related change, run:

```bash
npx react-doctor@latest
```

If any regressions or new issues are reported, fix them and rerun until no new issues remain. Do not ship React code without a clean React Doctor result.

---

# 2. State Decision Tree

Choose the right tool for each type of state:

| State Type | Solution | Skill Reference |
|-----------|----------|-----------------|
| Component-local state (toggle, input preview) | `useState` / `useReducer` | — (this skill) |
| Cross-component UI state (theme, locale) | React Context | — (this skill) |
| Global client state (auth user, feature flags) | Redux Toolkit | → `redux` skill |
| Server/API state (users, posts, products) | TanStack Query v5 | → `react-query` skill |
| Form state (inputs, validation, submit) | React Hook Form + Zod | → `react-hook-form` skill |

**Rules:**
- Keep state as local as possible — push it down the tree.
- Never store derived state — compute it during render or via selectors.
- Never store server state in Redux — that's TanStack Query's domain.
- Avoid introducing global state without a clear need.

---

# 3. Component Architecture

## 3.1 Keep Components Small and Focused

A component should do one thing well. Extract sub-components, hooks, and utilities as needed. If a component is handling multiple responsibilities or becomes hard to read, split it up.

## 3.2 Prefer Functional Components

Always use functional components. Never use class components unless integrating with a legacy class-only library.

✅ Good:

```tsx
function UserProfile({ userId }: UserProfileProps) {
  return <div>...</div>;
}
```

❌ Avoid:

```tsx
class UserProfile extends React.Component { ... }
```

## 3.3 Props — Be Explicit

Always define a typed props interface. Use `interface` for readability.

✅ Good:

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

❌ Avoid:

```tsx
function Button(props: any) { ... }
function Button({ label }: { label: string }) { ... }
```

## 3.4 Destructure Props in the Function Signature

✅ Good:

```tsx
function Card({ title, children, className }: CardProps) {
```

Not:

```tsx
function Card(props: CardProps) {
  const { title, children, className } = props;
```

## 3.5 Avoid Prop Drilling — Use Composition or Context

If props pass through 3+ intermediate components, refactor.

**Option A: Composition** (preferred for layout props):

```tsx
<Layout sidebar={<Sidebar />}>
  <Content />
</Layout>
```

**Option B: Context** (for truly global state):

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

## 3.6 Component File Structure

Generally expose one public component per file; private helper components may stay in the same file when tightly coupled.

## 3.7 Named Exports Over Default Exports

Named exports enable better IDE autocompletion and safer refactoring.

✅ Good:

```tsx
export function Button({ ... }: ButtonProps) { ... }
```

```tsx
import { Button } from '@/components/Button';
```

❌ Avoid:

```tsx
export default function Button() { ... }
```

```tsx
import Button from '@/components/Button'; // import name can diverge
```

---

# 4. Effects

## 4.1 Effects Should Be for Synchronization, Not Logic

React docs recommend using effects only for synchronizing with external systems (APIs, DOM, subscriptions). Pure computation should happen during render.

## 4.2 Avoid Effect Chains

❌ Bad — cascading effects:

```tsx
useEffect(() => setB(a * 2), [a]);
useEffect(() => setC(b * 2), [b]);
```

✅ Good — compute during render:

```tsx
const b = a * 2;
const c = b * 2;
```

## 4.3 Effect Cleanup

Always clean up subscriptions, timers, and event listeners:

```tsx
useEffect(() => {
  const subscription = eventEmitter.on('event', handler);
  return () => subscription.off('event', handler);
}, []);
```

---

# 5. Error Boundaries

Wrap feature-level code in error boundaries. Don't let one component's error crash the entire page.

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
</ErrorBoundary>
```

**Where to place error boundaries:**
- Around each route/page
- Around feature-level components that could fail independently
- Around third-party integrations

**NOT** around every small component — Error Boundaries add overhead.

---

# 6. Suspense & Lazy Loading

Lazy load large features and route-level components:

```tsx
const DashboardPage = lazy(() => import('./pages/DashboardPage'));

<Suspense fallback={<PageSkeleton />}>
  <DashboardPage />
</Suspense>
```

When using TanStack Query's Suspense mode, refer to the `react-query` skill for `useSuspenseQuery` and `QueryErrorResetBoundary` patterns.

---

# 7. Performance

## 7.1 React 19 Compiler — No Manual Memoization

React 19 ships with the React Compiler (formerly "React Forget") that **automatically handles memoization**. The compiler:

- Auto-memoizes components (equivalent to wrapping everything in `React.memo`)
- Inlines stable callback references (equivalent to `useCallback`)
- Caches computed values where beneficial (equivalent to `useMemo`)

**CRITICAL RULE: Do NOT manually use `useMemo`, `useCallback`, or `React.memo`.**

Manual memoization in React 19 is NOT needed and can:
- Interfere with the compiler's optimizations
- Add unnecessary code noise
- Create maintenance burden with dependency arrays

✅ **React 19 — Correct:**
```tsx
function ExpensiveList({ items, filter }: Props) {
  // Compiler handles memoization automatically
  const filtered = items.filter(item => item.category === filter);
  const handleClick = (id: string) => { /* ... */ };

  return filtered.map(item => (
    <Item key={item.id} item={item} onClick={handleClick} />
  ));
}
```

❌ **Avoid — unnecessary manual memoization:**
```tsx
function ExpensiveList({ items, filter }: Props) {
  const filtered = useMemo(
    () => items.filter(item => item.category === filter),
    [items, filter]
  );
  const handleClick = useCallback(
    (id: string) => { /* ... */ },
    []
  );

  return filtered.map(item => (
    <Item key={item.id} item={item} onClick={handleClick} />
  ));
}
```

## 7.2 Other Performance Rules

- Optimize only after measuring.
- Use stable keys for lists (never array index unless list is static).
- Lazy load large features.
- Code splitting via `lazy()` + `Suspense`.

---

# 8. Accessibility (a11y)

Strive for accessible components by default:

- Prefer semantic HTML elements (`<button>`, `<nav>`, `<main>`, `<header>`).
- Ensure keyboard navigation and focus management are supported.
- Use ARIA attributes only when necessary — semantic HTML is preferred.
- Use color and contrast that meets WCAG AA standards (4.5:1 for normal text).
- All form errors must have `role="alert"` and `aria-describedby` linking to the input.
- Icons must have `aria-hidden="true"` if decorative, or `aria-label` if meaningful.
- For full a11y patterns on forms, refer to the `react-hook-form` skill.

---

# 9. Common Mistakes

Avoid:

- Duplicating state (compute derived state during render)
- Introducing unnecessary global state — keep it local
- Giant components (150+ lines → split into sub-components)
- Overusing Context for unrelated concerns — causes unnecessary re-renders
- Unnecessary or cascading effects — compute during render
- Premature optimization — measure first
- Ignoring React Doctor diagnostics
- Storing server state in Redux (use TanStack Query) — see `redux` skill
- Manual form state with `useState` (use React Hook Form) — see `react-hook-form` skill
- Scattered query keys (use key factories) — see `react-query` skill
- Manual `useMemo` / `useCallback` / `React.memo` — React 19 Compiler handles memoization automatically

---

# 10. Definition of Done

A React change is complete only when:

- [ ] React Doctor reports no new issues (score unchanged or improved)
- [ ] Components are properly typed (no `any` props)
- [ ] No manual `useMemo` / `useCallback` / `React.memo` (React 19 compiler handles it)
- [ ] Effects have cleanup where needed
- [ ] State is in the right tool (Redux for client state, TanStack Query for server state, RHF for forms)
- [ ] Performance patterns are applied where profiling shows benefit
- [ ] Semantic HTML and accessibility requirements are met
- [ ] Loading, error, and empty states are handled for all data-fetching components
- [ ] Error boundaries protect feature-level code
- [ ] TypeScript typecheck passes
- [ ] Code is formatted with prettier

---

# React Philosophy

Prefer:

- Composition over inheritance
- Declarative code over imperative code
- Derived state over duplicated state
- Small focused components over large components
- Explicit code over magic abstractions
- Readability over cleverness
- Local state over global state

React is designed around simple components working together.

Keep components easy to understand.

---

# Guiding Principle

When writing React code, always prefer:

- Simplicity over cleverness
- Composition over configuration
- Readability over brevity
- Local state over global state
- Derived state over duplicated state
- Declarative code over imperative code

Write React code that is easy to understand, easy to maintain, and easy to extend.
