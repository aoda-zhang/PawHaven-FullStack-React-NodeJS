---
name: component
description: >-
  Component design and graduation standards for this project's React frontend:
  pure-component discipline (UI = f(props)), explicit minimal props, composition
  over prop soup, placement (feature-private vs @pawhaven/ui vs
  @pawhaven/frontend-core), the 2+ feature graduation rule, naming and barrel
  exports, and when to split a component. Use when creating, splitting,
  refactoring, or promoting a React component; designing a props or callback API;
  choosing between a feature-private component and a shared package; authoring a
  @pawhaven/ui primitive, 组件设计, 组件拆分, 组件复用, 组件毕业.
  boundary-doctor and architecture-doctor scan for violations of this; this skill
  defines them. Not for React core rules on hooks, effects, and render performance
  (react), or visual values and tokens (style).
---

# Purpose

A component in this repo answers _how the UI looks and behaves_ — `UI = f(props)` —
and never _how the application works_. Business logic, data fetching, routing, and
auth live in features, hooks, and providers. A component that breaks that rule
cannot be rendered in a test without faking the app, and cannot be promoted to a
package, because a package may not import from the app.

Apply it whenever a change touches:

- A new component, feature-private or in `@pawhaven/ui` / `@pawhaven/frontend-core`
- A component's props, callbacks, ref, or composition slots
- The decision between feature-private and shared, or a promotion into a package
- Splitting a component that has outgrown one responsibility
- The canonical primitives — `Button` sets the pattern for every other one

---

# 1. Pure Component Discipline

## 1.1 The two questions

A pure component answers _"How should this UI look and behave?"_ It does not answer
_"How does the application work?"_ Every item in the second category is someone
else's job, and moving one into a component is what makes it unreusable.

## 1.2 What a pure component never contains

Business logic, data fetching, API calls, global application state, or side
effects such as routing, auth, or browser storage.

The reason is mechanical, not stylistic: each of those needs something from the app
around it, so a test has to supply the app. A component that takes data and state
as props renders in a test with a literal, and a component that does not, renders
with a wrapper nobody will write.

What it does instead:

- Receives data through props
- Renders from those props
- Notifies the parent through callbacks
- Works in more than one feature without editing

## 1.3 Internal state is only for ephemeral UI

Hover, animation, and temporary interaction state are fine inside the component.
Business data, server data, and multi-step workflows are not: they have a lifetime
longer than the component's, and a second owner for state that outlives the
component is a synchronisation bug waiting for a user to press the button twice.

Fetching belongs to `react-query` (see its skill) and lives in a feature hook, never
in a component in `@pawhaven/ui`.

## 1.4 Interaction leaves through callbacks

The component renders and reports; the parent decides. A component that reaches for
the router or the auth store cannot be reused in a different route tree or rendered
in isolation.

```tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}
```

## 1.5 Do not memoize by reflex

A component that appears to need `React.memo` is usually receiving a fresh object
prop from a caller; fix the prop identity at the caller instead. The memoization
policy — the React 19 Compiler handles it, manual memoization needs a profile — is
the `react` skill's §7.

## 1.6 Accessibility is part of the component

A component that cannot be operated by keyboard, or whose control has no accessible
name, is not finished. Start from semantic HTML: a native `<button>` arrives with
role, focusability, and Enter/Space already correct. Add ARIA only where semantics
run out. The full floor, including contrast and `aria-describedby` for form errors,
is the `react` skill's §8.

---

# 2. Component Placement — the Graduation Rule

## 2.1 Decision tree

A component starts private and graduates when a second caller appears. Promoting on
the first caller is how a package ends up with an API shaped for one screen.

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

Check the packages before writing a new one. A duplicate across features is the
failure this tree exists to prevent, and a copy-paste is more expensive to remove
than an import.

## 2.2 There is no app-level `components/` layer

> **There is NO `apps/*/src/components/` layer.** A frontend app may only contain
> `providers/`, `layout/`, `router/`, `features/`, `hooks/`, and `store/`. Any
> component shared across features or apps must graduate into a package — never
> live in an app-level `components/` folder.

An app-level folder has no owner, so nothing keeps its API honest and nothing stops
the second feature from forking it. `code-review/boundary-doctor` fails the build
on a cross-feature import from one.

- Feature-private components → `features/{Feature}/components/`
- Shared pure-UI components → `@pawhaven/ui`
- Shared business-common components → `@pawhaven/frontend-core`

## 2.3 Decouple before promoting

A component often depends on app-level modules — `@/hooks/...`, `@/layout/...`,
feature APIs. Packages must not import from apps, so those dependencies have to
become props before the move, or the promotion stops at a lint error.

- App hook results (e.g. `useIsStableEnv`, `useCurrentUser`) → pass the resolved
  value or state as a prop
- App-level layout (e.g. `RootLayoutFooter`) → pass as `footer?: ReactNode` /
  `ReactElement`
- App-level route paths (e.g. `routePaths.login`) → pass the literal string

Inside the package, keep only peer-dependency imports: React, `react-router-dom`,
`react-i18next`, Radix UI primitives.

## 2.4 Graduation checklist

Before moving a component from a feature to a package:

- [ ] No app-level imports left (`@/...` — no feature, hook, layout, or config)
- [ ] App-level dependencies injected as props
- [ ] Props typed with `@pawhaven/shared` types or generic primitives only
- [ ] No feature-specific text — content arrives via props or i18n keys
- [ ] One clear, single responsibility
- [ ] Exported from the package barrel (`index.ts`); see §5.2
- [ ] No styles dependent on feature-level CSS
- [ ] All 3 existing usages confirmed working after the move

---

# 3. Component API Design

## 3.1 Props: explicit, typed, and minimal

An untyped prop is a contract the compiler cannot check, so it fails at the call
site rather than at the boundary. Declare an interface per component, mark the
optional fields, and give each prop a default at the signature so a caller sees the
resolved API in one place.

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

Keep the prop count low. Booleans that toggle behaviour multiply into combinations
nobody has tested, so they become one `variant` enum whose values are enumerable:

```tsx
// Avoid — five booleans, 32 combinations, no way to know which are valid
interface BadProps {
  showImage: boolean;
  showTitle: boolean;
  showDescription: boolean;
  isCompact: boolean;
  isFullWidth: boolean;
}

// Instead
interface StoryCardProps {
  variant: 'hero' | 'card' | 'list-item' | 'inline';
}
```

## 3.2 Composition over configuration

Children and slots leave layout control with the parent, which is the only party
that knows what is going in each slot. Configuration props move that knowledge into
the component and lock the layout at the same time.

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

// Instead of a props object that hard-codes all of that structure
<Card imageUrl={url} title={title} description={desc} showFooter footerButtonLabel={t('common.readMore')} />
```

Reach for a compound family when the component has distinct visual sections
(header, body, footer) that different callers fill differently, or when it is a
layout container rather than a data widget.

Plain props are correct when the component is a simple single-purpose display, the
structure is genuinely fixed across every usage, and the total stays under five.
Building a compound family for one caller is over-engineering with an API contract
attached.

## 3.3 Callback props: one verb per concept

Inconsistent callback names make the same action ungreppable — a reader looking for
"how does anything get deleted here?" has to try four spellings.

```tsx
// Event handlers: on{Event} — standard React convention
onClick: (event: React.MouseEvent) => void;
onSubmit: (data: FormValues) => void;

// Change handlers: on{Thing}Change — passes the new value
onPageChange: (page: number) => void;
onSortChange: (field: string, direction: 'asc' | 'desc') => void;

// Action callbacks: on{Action} — semantic, not tied to a UI event
onDelete: (id: string) => void;
onBookmark: (id: string) => void;
```

Pick one verb per concept and hold it across the codebase. `onRemove`,
`handleDelete`, `deleteItem`, and `onItemDelete` for one action is four.

## 3.4 Controlled by default

Prefer controlled components in shared packages. When the state lives in the parent,
the component stays a function of its props and a test drives it by driving props.

```tsx
// Controlled — state lives in the parent, component is pure
interface TabsProps {
  activeTab: string;
  tabs: Tab[];
  onChange: (tabId: string) => void;
}
```

The named escape hatch: internal state is acceptable when the component truly owns
the lifecycle and no parent needs to track it — an expandable panel, say. Accepting
`defaultExpanded` and owning the rest is enough; do not build a hybrid that is
controlled in one mode and uncontrolled in another.

## 3.5 Forward a ref only when a caller needs the DOM node

Forwarding a ref is an API commitment, and an unused one is a leak. Add it for form
inputs that need `focus()`, elements that need `scrollIntoView()`, and anything
measured. Do not add it "just in case".

React 19 makes `ref` an ordinary prop, so the component declares it in its props
interface and passes it through. `forwardRef` is retired in this repo:

```tsx
interface TextInputProps extends React.ComponentProps<'input'> {
  label: string;
  error?: string;
}

export function TextInput({ label, error, ...props }: TextInputProps) {
  return <input aria-label={label} aria-invalid={!!error} {...props} />;
}
```

The React 19 prop-typing migration, `displayName` included, is in
[project-rules/references/components.md](../../project-rules/references/components.md)
§1; the canonical interactive primitive is [references/button.md](references/button.md).

## 3.6 Polymorphic components: a named escape hatch

An `as` prop is justified when one component genuinely has to be a `<button>`, an
`<a>`, and a router `<Link>`, so that a single set of styles covers all three.

```tsx
interface ActionProps {
  as?: 'button' | 'a';
}
```

It is not justified for a decorative element swap: `<Card as="section">` should be a
`<section>` wrapping a `<Card>`. Every extra element type multiplies the props that
have to keep working, and the polymorphism is usually a symptom of a missing slot.

---

# 4. Composition Patterns

## 4.1 Compound components

Use a compound family when a component is a container with semantic sub-sections and
callers need to place content in them independently. Context carries the shared
state; each sub-component is a named export from the same folder.

```tsx
// packages/ui/src/components/Modal/index.tsx

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

export function ModalHeader({ children }: { children: React.ReactNode }) {
  return <header className="modal-header">{children}</header>;
}

export function ModalBody({ children }: { children: React.ReactNode }) {
  return <div className="modal-body">{children}</div>;
}

// Barrel: packages/ui/src/components/Modal/index.ts
export { Modal, ModalHeader, ModalBody } from './Modal';
```

## 4.2 Render props: use sparingly

A render prop is justified when the rendering logic itself varies per caller. For
everything else, children or a compound component carries the same variation with
less machinery.

```tsx
// Justified — the rendering varies substantially per caller
interface DataTableProps<T> {
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
}

// Not justified — children says the same thing
<Container renderHeader={() => <Header />} />;
```

---

# 5. Naming and Exports

## 5.1 Component names

PascalCase, descriptive, and without a `Component` suffix — `StoryCard`,
`RescueForm`, `ImageUploader`, `RescueStatusBadge`. A name that needs an
abbreviation (`RSBadge`) is usually a component with two responsibilities.
Feature-private components may be more specific about their host: `StoryCardFooter`,
`RescueMapOverlay`.

## 5.2 Named exports and barrels

A default export lets the import name drift from the declaration, which defeats
renaming and hides the origin in autocomplete. Named exports keep IDE auto-imports
and refactoring honest.

```tsx
// Named export — always
export function StoryCard({ ... }: StoryCardProps) { ... }

// Avoid — the import name is free to drift from the declaration
export default function StoryCard() { ... }
```

The barrel re-exports those named exports so a consumer gets the name the component
was declared with.

The on-disk layout — folder per component, `index.tsx` entry, package-local `cn`
imported by relative path, compound families under a family folder — is in
[references/package-layout.md](references/package-layout.md).

---

# 6. Definition of Done

Gates this skill owns that the sections above do not already restate:

- [ ] Split thresholds checked — a component over 150 lines, mixing DOM and business
      logic, or repeating a JSX pattern three times has been decomposed
      ([references/splitting.md](references/splitting.md))
- [ ] No component in the app duplicates a component that already exists in
      `@pawhaven/ui`, `@pawhaven/frontend-core`, or another feature
- [ ] Placement matches §2: feature-private, `@pawhaven/ui`, or
      `@pawhaven/frontend-core` — never an app-level `components/` folder
- [ ] `pnpm typecheck` and the component's own test pass

---

# Related skills

| Domain                                              | Skill                                                            |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| React core: hooks, effects, render performance      | `react` skill                                                    |
| Server state: fetching, caching, mutations          | `react-query` skill                                              |
| Form state: inputs, validation, submission          | `react-hook-form` skill                                          |
| Visual values: tokens, Tailwind, layout             | `style` skill                                                    |
| User-visible text and locales                       | `i18n` skill                                                     |
| Detecting boundary or graduation violations in code | `code-review/boundary-doctor`, `code-review/architecture-doctor` |

## References

- [references/button.md](references/button.md) — the canonical `@pawhaven/ui`
  Button: `cva` variant × size matrix, exported `buttonVariants()`, `asChild` via
  `Slot`, `data-slot`, React 19 prop typing without `forwardRef`, loading as a prop,
  the links-are-not-buttons rule, and the Tailwind v4 details. Read it when writing
  any interactive primitive, because it is the pattern the others copy.
- [references/splitting.md](references/splitting.md) — the split thresholds with the
  reasoning for each, the before/after decomposition of an overgrown page component,
  and how to tell a feature orchestrator from a pure component. Read it when a
  component has grown past one responsibility and the cut has to be chosen.
- [references/package-layout.md](references/package-layout.md) — the on-disk map for
  `@pawhaven/ui` and `@pawhaven/frontend-core`: folder and file naming, the
  `components/` parent, barrel composition, the package-local `cn` rule, and compound
  family grouping. Read it before creating a file in a shared package.
