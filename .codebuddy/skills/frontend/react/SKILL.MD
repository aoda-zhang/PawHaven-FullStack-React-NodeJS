---
name: react
description: Enterprise-grade React development standards covering component architecture, state, effects, performance, accessibility, and React Doctor validation.
version: 1.0
---

# Purpose

This skill defines React development standards for the project. Every React change must be validated by **React Doctor** — a deterministic scanner that audits state, effects, performance, architecture, security, and accessibility.

Apply this skill whenever working on:

- React components (pages, layouts, shared components)
- Hooks (custom hooks, effects, state logic)
- State management (context, zustand, etc.)
- Data fetching (TanStack Query, SWR, fetch)
- Routing (React Router, file-based routing)
- Forms, modals, dialogs, notifications
- Error boundaries and suspense
- Performance optimization
- Accessibility
- Event handlers and side effects

---

# React Doctor — Mandatory Validation

## Every change MUST be checked with React Doctor

After any React-related change, run:

```bash
pnpm exec react-doctor
```

If any regressions or new issues are reported, fix them and rerun until no new issues remain.
Do not ship React code without a clean React Doctor result.

---

# Component Architecture

## 1. Keep Components Small and Focused

A component should do one thing well. Extract sub-components, hooks, and utilities as needed.
If a component is handling multiple responsibilities or becomes hard to read, split it up.

---

## 2. Prefer Functional Components

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

---

## 3. Props — Be Explicit

Always define a typed props interface. Use `interface`, not inline types, for readability.

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

---

## 4. Destructure Props in the Function Signature

✅ Good:

```tsx
function Card({ title, children, className }: CardProps) {
```

Not:

```tsx
function Card(props: CardProps) {
  const { title, children, className } = props;
```

---

## 5. Avoid Prop Drilling — Use Composition or Context

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

---

## 6. Component File Structure

Generally expose one public component per file; private helper components may stay in the same file when tightly coupled.

---

## 7. Named Exports Over Default Exports

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

# State Management

## State Selection

Choose the smallest solution that solves the problem.

Decision Tree

Component-local state  
↓  
useState  
↓  
Application-wide configuration (theme, language, authentication)  
↓  
useContext  
↓  
Shared business/application state  
↓  
Redux Toolkit  
↓  
Server state  
↓  
TanStack Query

Keep state as local as possible.  
Never store derived state.  
Avoid introducing global state without a clear need.

---

# Effects

## 17. Effects Should Be for Synchronization, Not Logic

React 18+ docs recommend using effects only for synchronizing with external systems (APIs, DOM, subscriptions). Pure computation should happen during render.

---

## 18. Avoid Effect Chains

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

---

# Performance

## Performance Guidelines

- Optimize only after measuring.
- Use stable keys.
- Lazy load large features.

---

# Accessibility (a11y)

Strive for accessible components by default:
- Prefer semantic HTML elements.
- Ensure keyboard navigation and focus management are supported.
- Use ARIA attributes only when necessary.
- Use color and contrast that meets accessibility standards.

---

# Common Mistakes

Avoid:

- Duplicated state
- Introducing unnecessary global state
- Giant components (150+ lines)
- Overusing Context for unrelated concerns
- Unnecessary or cascading effects
- Premature optimization
- Ignoring React Doctor diagnostics

---

# Definition of Done

A React change is complete only when:

- React Doctor reports no new issues (score unchanged or improved)
- Components are properly typed (no `any` props)
- All hooks have correct dependency arrays
- Effects have cleanup where needed
- Performance patterns are applied where beneficial
- Semantic HTML and accessibility requirements are met
- Loading, error, and empty states are handled
- Error boundaries protect feature-level code
- Code is formatted with prettier
- TypeScript typecheck passes

# React Philosophy

Prefer:

- Composition over inheritance
- Declarative code over imperative code
- Derived state over duplicated state
- Small focused components over large components
- Explicit code over magic abstractions
- Readability over cleverness

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
