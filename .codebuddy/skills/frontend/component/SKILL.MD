---
name: component
description: >
  组件设计模式与共享组件规范 / Component Design Patterns & Graduation Rules.
  定义 PawHaven 共享组件的设计原则：组件 API 设计、组合模式 vs 继承、组件分层（feature 私有 vs packages/ui vs packages/frontend-core）、毕业规则（2+ feature 使用的组件必须晋升到共享包）、Props 接口设计、Single Responsibility 原则、命名导出规范、纯组件约束（UI = f(props)，禁止业务/副作用）。
  触发场景 / Trigger: 组件设计 component design API surface interface signature props contract, 共享组件 shared component reusable common UI building block library, 组件开发 component development build create implement authoring compose, 组件拆分 component decomposition split break down extract decouple separate, 组件提取 extract component pull out lift up promote abstract isolate, 组件重构 component refactor restructure reorganize redesign improve clean up, 组件 API component props children slots render prop composition pattern, packages/ui shared UI library graduation promote publish export package, frontend-core shared core logic utility hook helper, 组件毕业 graduation promote to shared elevate to reusable component promotion, 组件复用 component reuse DRY don't repeat yourself deduplication consolidation, 纯 UI 组件 pure UI component presentational dumb component stateless, composition vs inheritance hoc higher order component render props custom hook, single responsibility SRP separation of concerns cohesion coupling, naming conventions export default named export barrel index.
version: 2.0
---

# Purpose

This skill defines how to design, build, and graduate components in PawHaven. Every shared component must be intentional — well-designed APIs, correct placement (feature vs package), and consistent patterns across the application.

PawHaven components follow a **pure component** discipline: a component describes *how the UI looks and behaves* (`UI = f(props)`) and must not answer *how the application works*. Business logic, data fetching, routing, and auth live outside the component — in features, hooks, and providers.

Apply this skill whenever:

- Creating a new shared/packaged component (`@pawhaven/ui`, `@pawhaven/frontend-core`)
- Graduating a component from a feature to a package
- Designing component APIs (props, callbacks, composition slots)
- Deciding between composition, configuration, or inheritance
- Splitting large components

---

# Pure Component Principles

A pure React component focuses only on UI rendering and user interaction.

It should not contain:

- Business logic
- Data fetching
- API calls
- Global application state
- Side effects (routing, auth, browser storage)

The component should be predictable:

```ts
UI = f(props)
```

A pure component should:

- Receive data through props
- Render UI based on props
- Notify parent components through callback functions
- Be reusable across different features
- Be easy to test

A pure component should not:

- Fetch data
- Call APIs
- Manage business workflows
- Access routing directly
- Access authentication logic

## TypeScript Requirements

Always define explicit prop types.

Good:

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}
```

Avoid:

```tsx
function Button(props: any) {}
```

## Event Handling

Pure components communicate through callbacks.

```tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
```

## State Management

Avoid internal state by default.

Allowed:

- Hover state
- Animation state
- Temporary UI interaction state

Avoid:

- Business data state
- Server state
- Application workflows

## Composition

Prefer composition over excessive props.

Good:

```tsx
<Card>
  <CardHeader />
  <CardContent />
</Card>
```

Avoid:

```tsx
<Card showHeader headerTitle="Title" />
```

## Performance

Do not automatically use:

- `React.memo`
- `useMemo`
- `useCallback`

Only optimize when there is measurable performance impact.

## Accessibility

Components should:

- Use semantic HTML
- Support keyboard interaction
- Provide proper ARIA attributes when needed

## Pure Component Example

```tsx
import type { ReactNode } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled = false,
  children,
  onClick,
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
```

## Golden Rule

A pure React component should answer:

> "How should this UI look and behave?"

It should NOT answer:

> "How does the application work?"

---

# Component Placement — The Graduation Rule

## Decision Tree

```
You need Component X
  │
  ├─ 1. Does only 1 feature use it?
  │     → Lives in features/{FeatureName}/components/
  │     → Owned by the feature, no public API contract needed
  │
  ├─ 2. Do 2+ features need it?
  │     │
  │     ├─ Is it PURE UI? (no API calls, no auth, no business logic)
  │     │     → Graduate to @pawhaven/ui
  │     │     → Requirements: generic props, no domain terms, self-contained
  │     │
  │     └─ Is it BUSINESS-COMMON? (auth guards, domain widgets, API-aware)
  │           → Graduate to @pawhaven/frontend-core
  │           → Requirements: typed against shared schemas, handles auth state
  │
  └─ 3. Is it used by 3+ features AND has complex state?
        → Consider extracting to its own package
        → Requires: dedicated README, tests, design review
```

## Hard Rule — No App-Level `components/` Folder

> **There is NO `apps/*/src/components/` layer.** A frontend app may only contain
> `providers/`, `layout/`, `router/`, `features/`, `hooks/`, and `store/`. Any component
> that is shared across features or apps MUST graduate into a package — never live in an
> app-level `components/` folder.

- Feature-private components → `features/{Feature}/components/`
- Shared pure-UI components → `@pawhaven/ui`
- Shared business-common components → `@pawhaven/frontend-core`

## Decoupling Before Graduation

A component often depends on app-level modules (`@/hooks/...`, `@/layout/...`,
feature APIs). Packages MUST NOT import from apps. Inject those dependencies via props
before moving the component:

- App hook results (e.g. `useIsStableEnv`, `useCurrentUser`) → pass the resolved value/state as props
- App-level layout (e.g. `RootLayoutFooter`) → pass as a `footer?: ReactNode` / `ReactElement` prop
- App-level route paths (e.g. `routePaths.login`) → pass the literal string as a prop

Keep only peer-dependency imports (React, `react-router-dom`, `react-i18next`, Radix UI primitives) inside the package.

## Graduation Checklist

Before moving a component from feature to package:

- [ ] Remove ALL app-level imports (`@/...`) — no feature, hook, layout, or config imports
- [ ] Inject app-level dependencies (hooks, footer, route paths) via props
- [ ] Props use only `@pawhaven/shared` types or generic primitives
- [ ] No hardcoded feature-specific text (all content via props or i18n keys)
- [ ] Component has a clear, single responsibility
- [ ] Exported from the package barrel file (`index.ts`)
- [ ] No styles dependent on feature-level CSS
- [ ] All 3 existing usages confirmed working after move

---

# Component API Design

## 1. Props: Be Explicit and Minimal

✅ Good — typed interface, clear defaults, controlled components:

```tsx
interface StoryCardProps {
  story: LoveStory;
  variant?: 'compact' | 'full';
  onBookmark?: (storyId: string) => void;
  className?: string;
}

export function StoryCard({
  story,
  variant = 'compact',
  onBookmark,
  className,
}: StoryCardProps) {
  // ...
}
```

❌ Avoid — too many boolean flags, prop soup:

```tsx
// Props that toggle behavior should use a variant/mode enum instead
interface BadProps {
  showImage: boolean;
  showTitle: boolean;
  showDescription: boolean;
  isCompact: boolean;
  isFullWidth: boolean;
  // → Replace with: variant: 'hero' | 'card' | 'list-item' | 'inline'
}
```

## 2. Composition Over Configuration

Prefer children/render slots over complex config props.

✅ Good — composition leaves layout control to the parent:

```tsx
<Card>
  <Card.Image src={url} alt={title} />
  <Card.Body>
    <Card.Title>{title}</Card.Title>
    <Card.Description>{desc}</Card.Description>
  </Card.Body>
  <Card.Footer>
    <Button variant="primary">{t('common.readMore')}</Button>
  </Card.Footer>
</Card>
```

❌ Avoid — everything controlled by props:

```tsx
<Card
  imageUrl={url}
  title={title}
  description={desc}
  showFooter
  footerButtonLabel={t('common.readMore')}
/>
```

**When to use composition (compound components):**

- The component has distinct visual sections (header, body, footer)
- Different usages need different content in each section
- The component is a layout container, not a data display widget

**When props are fine:**

- Simple, single-purpose display components
- The structure is truly fixed across all usages
- Less than 5 props total

## 3. Callback Props — Be Consistent

```tsx
// Event handlers: on{Event} — standard React convention
onClick: (event: React.MouseEvent) => void;
onSubmit: (data: FormValues) => void;

// Change handlers: on{Thing}Change — passes the new value
onPageChange: (page: number) => void;
onSortChange: (field: string, direction: 'asc' | 'desc') => void;

// Action callbacks: on{Action} — semantic, not tied to UI event
onDelete: (id: string) => void;
onBookmark: (id: string) => void;

// NEVER use different naming for the same concept in different components
// ❌ onRemove / handleDelete / deleteItem / onItemDelete — pick ONE and stick
```

## 4. Controlled vs Uncontrolled

Prefer controlled components for shared packages. They're predictable and testable.

```tsx
// ✅ Controlled — state lives in parent, component is pure
interface TabsProps {
  activeTab: string;
  tabs: Tab[];
  onChange: (tabId: string) => void;
}

// Use internal state ONLY when the component truly owns the state lifecycle
// Example: expandable panel that no parent needs to track
interface ExpandableProps {
  defaultExpanded?: boolean;  // initial state only
  children: React.ReactNode;
}
```

## 5. Ref Forwarding — Only When Necessary

Forward refs sparingly. Most components don't need ref forwarding.

```tsx
// ONLY forward refs for:
// - Form inputs that need focus() programmatically
// - Elements that need scrollIntoView()
// - DOM measurements

import { forwardRef } from 'react';

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ label, error, ...props }, ref) {
    return <input ref={ref} aria-label={label} {...props} />;
  }
);

// NEVER forward refs "just in case" — add when needed
```

## 6. Polymorphic Components — Avoid Unless Necessary

Don't use polymorphic `as` props unless multiple element types are truly needed:

```tsx
// ✅ Polymorphic justified: this component needs to be a <button>, <a>, or <Link>
interface ButtonProps {
  as?: 'button' | 'a';
  // or with a generic: as?: React.ElementType;
}

// ❌ Unnecessary: <Card as="section"> — just use <Card> wrapped in <section>
```

---

# Button Component Best Practices (shadcn + Tailwind v4 + React 19)

The canonical Button in `@pawhaven/ui` is a shadcn-style pure component. It defines the
house pattern for interactive control components. Full reference: [references/button.md](references/button.md).

## Structure: `cva` + `buttonVariants` + `Slot` + `data-slot`

- **`cva` (class-variance-authority)** manages the `variant × size` cartesian matrix.
  Never hand-write `if/else` class selection. Style stays decoupled from the component.
- **`buttonVariants()`** is exported standalone so it can be reused on non-button elements.
- **`asChild` via `Slot`** enables polymorphic reuse. Use it to merge styles into a child element.
- **`data-slot="button"`** exposes a styling hook for parent overrides.

## React 19: no `forwardRef`

- Use `React.ComponentProps<'button'>` instead of `React.forwardRef<...>`.
- `ref` is a normal prop in React 19; it flows through `...props` automatically.
- Use named function components; drop `displayName`.

## Pure component discipline

- `UI = f(props)`: no state, no data fetching, no global store, no side effects.
- Loading is props-driven: `<Button disabled><Spinner data-icon="inline-start" />...</Button>`.
- Business logic lives in the caller.

## Semantic correctness — links are NOT buttons

- Use `<Button>` for real buttons (native `<button>`, keyboard + focus built in).
- Use `buttonVariants()` on a plain `<a>` for links — never force a link through
  `asChild`/`render`, which overrides `<a>` semantics with `role="button"`.

## Tailwind v4 specifics

- `size-*` instead of `w-* h-*`; `has-[>svg]:px-*` for icon-aware padding.
- Icons via lucide-react with `data-icon="inline-start|inline-end"` — never emojis.
- Restore `cursor: pointer` in `@layer base` (Tailwind v4 changed the default).
- Accessible: native element + `disabled:opacity-50` + `focus-visible:ring-*`.

---

# Component Patterns

## Compound Components

Use for layout containers with semantic sub-sections:

```tsx
// packages/ui/src/Modal/

// Modal.tsx — provides context
interface ModalContextValue {
  isOpen: boolean;
  onClose: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <ModalContext.Provider value={{ isOpen, onClose }}>
      <dialog open className="modal-overlay" onClick={onClose}>
        {children}
      </dialog>
    </ModalContext.Provider>
  );
}

// ModalHeader.tsx
export function ModalHeader({ children }: { children: React.ReactNode }) {
  return <header className="modal-header">{children}</header>;
}

// ModalBody.tsx
export function ModalBody({ children }: { children: React.ReactNode }) {
  return <div className="modal-body">{children}</div>;
}

// Barrel: packages/ui/src/components/Modal/index.ts
export { Modal, ModalHeader, ModalBody } from './Modal';
```

## Render Props — Use Sparingly

Only for truly variable rendering. Prefer children or compound components:

```tsx
// ✅ Render props justified: the rendering logic varies significantly
interface DataTableProps<T> {
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
}

// ❌ Unnecessary: just use children
<Container renderHeader={() => <Header />}>
```

---

# Naming & Exports

## Component Naming

- PascalCase: `StoryCard`, `RescueForm`, `ImageUploader`
- Descriptive, not abbreviated: `RescueStatusBadge`, not `RSBadge`
- No "Component" suffix: `Button`, not `ButtonComponent`
- Feature-private components can be more specific: `StoryCardFooter`, `RescueMapOverlay`

## File Naming

```
ComponentName.tsx       # One public component per file
ComponentName.test.tsx  # Co-located tests
ComponentName.module.css # Co-located CSS modules (only when Tailwind can't express it)
index.ts                # Barrel export — ONLY re-exports public components
```

## Directory Layout — All Pure Components Live in `components/`

In `@pawhaven/ui`, **every pure component folder lives under `src/components/`**:

```
packages/ui/src/
  components/
    Loading/index.tsx
    Button/index.tsx
    Form/
      FormInput/index.tsx
      formBase.type.ts
  utils/cn.ts
  index.ts              # barrel → re-exports from ./components/*
```

- Component folder → `src/components/<Name>/`, entry file `index.tsx`.
- Shared helpers (e.g. `cn`) → `src/utils/cn.ts`, **package-local per package, always imported with a relative path**:
  - `@pawhaven/ui` imports its own `cn` relatively (e.g. `../../utils/cn` from a component).
  - `@pawhaven/frontend-core` keeps its **own** `src/utils/cn.ts` and imports it relatively (`../../utils/cn`) — it must NOT depend on `@pawhaven/ui` for `cn`. This keeps `@pawhaven/ui` pure with no dependency on `frontend-core`.
  - Do NOT use package subpaths (`@pawhaven/ui/utils/cn`) for an internal util in a `tsc`-compiled package.
- The top-level barrel re-exports each `components/<Name>` path.
- Compound families (e.g. `Form/*`) group under `components/Form/<SubName>/`.

## Export Rules

```tsx
// ✅ Named exports — always
export function Button({ ... }: ButtonProps) { ... }
export function Modal({ ... }: ModalProps) { ... }

// ✅ Barrel files — packages/ui/src/index.ts (re-export from components/)
export { Button } from './components/Button';
export { Card } from './components/Card';
export { Modal, ModalHeader, ModalBody } from './components/Modal';

// ❌ Default exports — never
export default function Button() { ... }
```

Named exports ensure:

- IDE auto-imports use the correct name
- Rename refactoring is safe
- Barrel re-expoorts are explicit

---

# When to Split a Component

Split when ANY of these are true:

1. **Lines > 150** — extract sub-components or hooks
2. **Multiple levels of abstraction** — a component mixing low-level DOM with high-level business logic
3. **Repeated JSX patterns** — same structure appearing 3+ times with minor variations
4. **Testability** — can't test a piece in isolation without rendering the whole thing
5. **Multiple `useState` + `useEffect` clusters** — extract a custom hook

## Splitting Example

❌ Before — one monolithic component:

```tsx
function RescueDetail({ rescueId }: { rescueId: string }) {
  // Fetching (40 lines)
  // Loading state (10 lines)
  // Error state (10 lines)
  // Image gallery (50 lines)
  // Rescue info (60 lines)
  // Timeline (40 lines)
  // CTA buttons (30 lines)
  return (/* massive JSX */);
}
```

✅ After — decomposed:

```tsx
// RescueDetail/index.tsx — orchestrator only
export function RescueDetail({ rescueId }: { rescueId: string }) {
  const { data, isLoading, error } = useRescueQuery(rescueId);

  if (isLoading) return <RescueDetailSkeleton />;
  if (error) return <ErrorDisplay error={error} />;
  if (!data) return <EmptyState message={t('rescue.notFound')} />;

  return (
    <div className="rescue-detail">
      <RescueImageGallery images={data.images} />
      <RescueInfoSection rescue={data} />
      <RescueTimeline events={data.timeline} />
      <RescueActions rescue={data} />
    </div>
  );
}
```

> Note: the orchestrator above pulls data via a hook — that is a *feature* component, not a pure component. Pure components in `@pawhaven/ui` receive `data`/`isLoading`/`error` as props instead of fetching themselves.

---

# Common Mistakes

Avoid:

- Giant components (150+ lines without clear decomposition)
- Prop soup (10+ flat props that should be grouped or replaced with composition)
- Over-engineering (compound components for a single-use label)
- Premature graduation (moving to package before 2 features use it)
- Leaky abstractions (package component importing feature types)
- Inconsistent callback naming (`onDelete` in one component, `handleRemove` in another)
- Default exports
- Unnecessary ref forwarding
- Boolean props that toggle behavior instead of a `variant` prop
- Components that know too much (fetching data + rendering + routing)
- Duplicate components across features (check packages first)
- Impure components that fetch data, call APIs, or touch routing/auth inside a shared UI package

---

# Quality Checklist (Pure Component)

Before completing a component:

- [ ] UI only, no business logic
- [ ] No API calls
- [ ] Strong TypeScript types
- [ ] Events exposed through callbacks
- [ ] Reusable component API
- [ ] Accessible markup
- [ ] No unnecessary optimizations (`React.memo`/`useMemo`/`useCallback`)

---

# Definition of Done

A component is complete when:

- [ ] Named export from a clean barrel file
- [ ] Props interface is typed, minimal, and documented with JSDoc if exported
- [ ] Uses composition or clear props — no prop soup
- [ ] Correctly placed: feature-private or graduated to the right package
- [ ] No cross-feature or cross-package import violations
- [ ] All text comes from i18n keys or callers (no hardcoded strings)
- [ ] All visual values from `@pawhaven/design-system`
- [ ] Callback naming follows project convention
- [ ] Loading, empty, and error states handled (if it fetches data — features only)
- [ ] Keyboard accessible and has ARIA labels (if interactive)
- [ ] Reused via import, not copy-pasted across features
- [ ] Single responsibility — does one thing well

---

# Related

- Best practices: [references/best-practices.md](references/best-practices.md)
- Button (shadcn + React 19 canonical): [references/button.md](references/button.md)
- Architecture & graduation: [architecture-doctor](../../code-review/architecture-doctor/SKILL.MD)
- Styling tokens: [styling skill](../style/SKILL.MD)
