# Component placement

Where a PawHaven component belongs and how to shape it. Placement is decided by reuse count and
business coupling: feature-local, `@pawhaven/frontend-core` for shared app infrastructure, or
`@pawhaven/ui` for pure presentation. The router that names when to read this is
[frontend-patterns](../SKILL.md).

## Placement

Decide by **reuse count** and **business coupling**. Both must be answered.

| Reuse        | Business-coupled?     | Location                                              |
| ------------ | --------------------- | ----------------------------------------------------- |
| 1 feature    | —                     | `features/<feature>/components/<Name>.tsx`            |
| 3+ features  | yes — PawHaven domain | `packages/frontend-core/src/components/<kebab-name>/` |
| 3+ features  | no — generic          | `packages/ui/src/components/<kebab-name>/`            |
| 1–2 features | yes                   | keep local. Do not promote early                      |

- **3+ business components → `frontend-core`.** It already holds `RequireAuth`, `LanguageSelector`,
  `ErrorDisplay`, `NotFound`, `FileDownloadButton`, `MultiImageUpload`, `Brand`.
- **Pure, non-business → `ui`.** It already holds `form`, `button`, `skeleton`, `toast`, `timeline`,
  `carousel`, `phase`, `loading`, `photo-placeholder`, `phone-input`, `notification-banner`.
- `ui` must not import from `frontend-core`, from a feature, or from `app`. It receives props and
  children only.
- `frontend-core` must not import from `ui`'s internals, from a feature, or from `app`.
- Never import across two features directly. Promote, or pass through a route/layout.
- Feature-private helpers stay in the feature, not in `components/`.

## Anatomy

```tsx
import type { Pet } from '@pawhaven/shared/types';

import { cn } from '@pawhaven/frontend-core';

import { StatusBadge } from './StatusBadge';

export type PetCardProps = {
  pet: Pet;
  onSelect?: (id: string) => void;
};

export const PetCard = ({ pet, onSelect, className }: PetCardProps) => (
  <article
    className={cn('border-border bg-card rounded-lg border p-4', className)}
  >
    <StatusBadge status={pet.status} />
  </article>
);
```

- Accept `className` and merge with `cn()` when the parent may need layout control.
- Forward `data-*` and standard HTML attributes on DOM-rooting components.
- `children` for composition. Slots as named props only when a child needs a behaviour.
- No `PropTypes`. No default export.

## Composition over configuration

- A component that grows boolean props (`isPrimary`, `isLarge`, `isDisabled`, `isLoading`) becomes
  variants, or splits. Do not add a fifth boolean.
- Render children in a slot; do not compute JSX from props and pass it down.
- Do not import a component to decide whether to render it. Branch at the call site.

## Data

- Presentational components receive data as props. They do not fetch.
- A component that fetches belongs in a feature container, not in `ui` or `frontend-core`.

## Banned

| Banned                              | Use instead                            |
| ----------------------------------- | -------------------------------------- |
| `import` from another feature       | promote to `frontend-core`, or compose |
| fetch inside `ui` / `frontend-core` | pass data down as props                |
| `ui` importing `frontend-core`      | invert — pass `className` down         |
| boolean prop explosion              | variants or split                      |
| `export default`                    | named export                           |

## Splitting a component

The thresholds, the reasoning behind each, and a worked decomposition of a page component that grew
past one job. The rules this file applies live in [Placement](#placement) and
[Composition over configuration](#composition-over-configuration); this is where the cut gets chosen.

### Split thresholds

Split when **any** of these is true. Each one is a symptom of a component holding more than one
reason to change.

| Signal                                              | Why it means split                                                                                                    |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Lines > 150**                                     | Past this, a diff usually touches unrelated parts of the file at once                                                 |
| **Multiple levels of abstraction**                  | Low-level DOM manipulation and high-level business logic in one body have different readers and different test setups |
| **Repeated JSX patterns** — same structure 3+ times | Three copies drift; one component with a slot does not                                                                |
| **Testability** — a piece cannot be tested alone    | If it needs the whole tree to render, the boundary is in the wrong place                                              |
| **Multiple `useState` + `useEffect` clusters**      | That is a custom hook wearing a component costume; the states are independent                                         |

Under 150 lines with a single responsibility, splitting further costs a file and an import to no
benefit.

### Worked decomposition

Before — one monolithic component, where the fetching, the three states, and four unrelated regions
are all in one body:

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

After — the orchestrator holds the state and the ordering, and each region is a component with one
job:

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

Note the orchestrator above pulls data via a hook: that is a _feature_ component, not a pure one.
Pure components in `@pawhaven/ui` receive `data`, `isLoading`, and `error` as props instead of
fetching for themselves, and the loading/empty/error branches live in the feature that owns the
query.

### Feature orchestrator vs pure component

|                  | Feature component                       | Pure component (`@pawhaven/ui`)                    |
| ---------------- | --------------------------------------- | -------------------------------------------------- |
| Data             | Fetches, or reads a `react-query` hook  | Receives it as a prop                              |
| States           | Owns loading, empty, and error branches | Receives them as props, or the caller renders them |
| Domain knowledge | Knows about rescues, reports, adoption  | Knows about `variant="compact"`, not rescues       |
| Text             | Resolves i18n keys                      | Receives text as a prop or children                |
| Lives in         | `features/{Feature}/components/`        | `packages/ui/src/components/<Name>/`               |

The orchestrator is the component that composes; the pure components are the ones it composes out of.
If a region needs none of the left column, it is a candidate to graduate.

## Shared package layout

Which folder a new file belongs in, what the barrels re-export, and which imports a package is
allowed to make. The naming and export rules live in [Anatomy](#anatomy) and
[Placement](#placement).

### File and folder naming

```
ComponentName.tsx         # One public component per file
ComponentName.test.tsx    # Co-located tests
ComponentName.module.css  # Co-located CSS modules (only when Tailwind can't express it)
index.ts                  # Barrel export — ONLY re-exports public components
```

### Directory layout

In `@pawhaven/ui`, component folders use lowercase kebab-case and component files use PascalCase:

```
packages/ui/src/
  components/
    button/
      Button.tsx
    carousel/
      Carousel.tsx
    form/
      form-check-box/
        FormCheckBox.tsx
      form-date-ranger/
        FormDateRanger.tsx
      form-input/
        FormInput.tsx
      form-phone-input/
        FormPhoneInput.tsx
      form-radio/
        FormRadio.tsx
      form-select/
        FormSelect.tsx
      form-text-area/
        FormTextArea.tsx
      FormBase.type.ts
      index.ts
    loading/
      Loading.tsx
      loading.json
    notification-banner/
      NotificationBanner.tsx
    phase/
      Phase.tsx
    phone-input/
      PhoneInput.tsx
    photo-placeholder/
      PhotoPlaceholder.tsx
    skeleton/
      Skeleton.tsx
    timeline/
      Timeline.tsx
    toast/
      Toast.tsx
  utils/
    cn.ts
  index.ts
```

- Component folder → `src/components/<kebab-name>/`, entry file `<PascalName>.tsx`; for example,
  `button/Button.tsx`.
- Compound families group related components under a lowercase family folder and kebab-case
  subfolders. Shared prop types use the actual `FormBase.type.ts` filename, as in
  `form/form-input/FormInput.tsx`.
- The root barrel (`src/index.ts`) re-exports standalone components from their component files. The
  form family has its own barrel at `components/form/index.ts`, exposed through the package `./form`
  subpath.

### The `cn` rule

Shared helpers live at `src/utils/cn.ts` and are **package-local per package, imported with a
relative path**:

- `@pawhaven/ui` imports its own `cn` relatively — e.g. `../../utils/cn` from a component two levels
  down.
- `@pawhaven/frontend-core` keeps its **own** `src/utils/cn.ts` and imports it relatively
  (`../../utils/cn`). It must **not** depend on `@pawhaven/ui` for `cn`, which is what keeps
  `@pawhaven/ui` free of a `frontend-core` dependency.
- Do **not** use package subpaths (`@pawhaven/ui/utils/cn`) for an internal util in a `tsc`-compiled
  package. A subpath import is not a declared export map entry, so it resolves at dev time and
  breaks for consumers of the built output.

### Barrel composition

```tsx
// packages/ui/src/index.ts
// Representative entries from the actual root barrel.
export { Button, buttonVariants } from './components/button/Button';
export { Loading } from './components/loading/Loading';
export { Toast, showToast } from './components/toast/Toast';
```

```tsx
// packages/ui/src/components/form/index.ts
// Representative entries from the actual form barrel.
export { FormInput, type FormInputProps } from './form-input/FormInput';
export {
  FormCheckbox,
  type FormCheckboxProps,
} from './form-check-box/FormCheckBox';
```

A barrel re-exports and nothing else: no logic, no re-formatting, no conditional exports. There are
no `Card` or `Modal` exports because neither component exists under `src/components/`.

## Button — the canonical pure component

The canonical pure-UI Button for `@pawhaven/ui`, and the structural template every other interactive
primitive copies. Each rule below has one home: this file holds the worked implementation and the
reason for each element of it; [Anatomy](#anatomy) and [Composition over configuration](#composition-over-configuration)
hold the component rules that apply to all components.

The implementation below is transcribed from `packages/ui/src/components/button/Button.tsx`. That file is
the only source for the canonical implementation.

### Canonical implementation

```tsx
// packages/ui/src/components/button/Button.tsx
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../utils/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-fg hover:bg-primary-active',
        destructive: 'bg-error text-text-inverse hover:bg-error/90',
        outline:
          'border border-border bg-background text-text hover:bg-muted hover:text-text',
        secondary: 'bg-muted text-text hover:bg-muted-strong',
        ghost: 'hover:bg-muted hover:text-text',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-9 rounded-md px-3 has-[>svg]:px-2.5',
        lg: 'h-11 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-10 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = ({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) => {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      )}
      {children}
    </Comp>
  );
};
```

Barrel:

```tsx
// packages/ui/src/index.ts
export { Button, buttonVariants } from './components/button/Button';
```

### Why each element is best practice

#### `cva` for variant × size combinations

- `variant` (6) × `size` (4) is a cartesian product. Hand-written conditionals explode
  exponentially; `cva` keeps variants, sizes, and defaults declarative and returns a reusable
  `buttonVariants()` function.
- Style and component are decoupled: `buttonVariants()` is a pure function `styles = f(variant,
size)` that applies to ANY element, not just `<button>`. That is what makes the link case below
  work.

#### React 19: no `forwardRef`, use `ButtonProps`

- React 19 promotes `ref` to a normal prop and deprecates `forwardRef`.
- The actual implementation declares `ButtonProps` as an interface extending
  `React.ComponentProps<'button'>` and `VariantProps<typeof buttonVariants>`, with optional `asChild`
  and `loading` props.
- The `...props` spread carries `ref` automatically.

#### `asChild` + `Slot` for polymorphic reuse — but NOT for links

- `<Button asChild><Link>...</Link></Button>` merges styles into the child element.
- Never use a link-as-button with `asChild`/`render` — it forces `role="button"` and destroys `<a>`
  semantics, taking middle-click, copy-link, and keyboard behaviour with it.
- For real links, reuse `buttonVariants` directly on a plain `<a>`:

  ```tsx
  <a href="/login" className={buttonVariants({ variant: 'outline' })}>
    Login
  </a>
  ```

#### Pure component discipline (`UI = f(props)`)

- No state, no data fetching, no global store, no side effects inside the component.
- Loading is props-driven through the actual `loading` prop. `<Button loading>` renders `Loader2`
  with `size-4 animate-spin` and sets `disabled` automatically.
- Business logic lives in the caller, not the component.

#### Accessibility & a11y

- Native `<button>` (semantic, Enter/Space keyboard, focus) — never fake with `div`.
- `disabled:pointer-events-none disabled:opacity-50` for disabled state.
- `focus-visible:ring-*` for visible keyboard focus (WCAG).

#### Tailwind v4 specifics

- `data-slot="button"` so parents can override via `*:data-[slot=button]`.
- Use `size-*` instead of `w-* h-*` (for example, `size-10` for the icon button and `size-4` for
  the loading spinner).
- `has-[>svg]:px-*` adjusts padding when an icon is present.
- Icons use lucide-react. Loading uses `Loader2` with `size-4 animate-spin` and `aria-hidden`. Never
  use an emoji as an icon.
- Pointer behavior is part of the Button's `cva` base string: `cursor-pointer` normally and
  `disabled:cursor-not-allowed` when disabled.

### How callers use it

Three call shapes cover almost everything. A caller never passes a class string that reimplements a
variant, and never reaches for a `<div>` to get the styling.

```tsx
// Default action
<Button onClick={onSubmit}>Save</Button>

// Pending — the button owns the disabled state and the spinner. The caller passes only `loading`.
<Button loading={isPending}>Save</Button>

// Navigation — buttonVariants on a real anchor, so the link keeps its semantics
<a href="/login" className={buttonVariants({ variant: 'outline' })}>
  Login
</a>
```

Every other interactive primitive in `@pawhaven/ui` follows the same three shapes, so a new
primitive that needs a fourth call shape is a sign it wants to be a layout component instead.

## Doctor

[boundary-doctor](../../code-review/boundary-doctor/SKILL.md) — package dependency direction ·
[architecture-doctor](../../code-review/architecture-doctor/SKILL.md) — placement rules
