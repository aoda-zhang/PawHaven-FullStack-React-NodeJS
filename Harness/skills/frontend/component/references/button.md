# Button — shadcn + Tailwind v4 + React 19 Reference

Canonical pure-UI Button for `@pawhaven/ui`. When creating any new component, follow
the same structural principles demonstrated here.

> **Location convention**: every pure component in `@pawhaven/ui` lives in
> `packages/ui/src/components/<Name>/` with a `components/` parent directory.
> A component's file is `<Name>/index.tsx`, and the barrel re-export is
> `components/index.ts` or the top-level `src/index.ts`.

Source of truth (authoritative): `packages/design-system/figma/src/app/components/ui/button.tsx`

## 1. Canonical implementation

```tsx
// packages/ui/src/components/Button/index.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

Barrel:

```tsx
// packages/ui/src/index.ts
export { Button, buttonVariants } from './components/Button';
```

## 2. Why each element is best practice

### `cva` for variant × size combinations

- `variant` (6) × `size` (4) is a cartesian product. Hand-written conditionals explode exponentially;
  `cva` keeps variants/sizes/defaults declarative and returns a reusable `buttonVariants()` function.
- Style and component are decoupled: `buttonVariants()` is a pure function `styles = f(variant, size)`
  that can be applied to ANY element, not just `<button>`.

### React 19: no `forwardRef`, use `React.ComponentProps<'button'>`

- React 19 promotes `ref` to a normal prop and deprecates `forwardRef`.
- shadcn migration: `React.forwardRef<...>` → `React.ComponentProps<...>`, drop `ref={ref}`,
  use named functions, drop `displayName`.
- `...props` spread carries `ref` automatically.

### `asChild` + `Slot` for polymorphic reuse — but NOT for links

- `<Button asChild><Link>...</Link></Button>` merges styles into the child element.
- NEVER use a link-as-button with `asChild`/`render` — it forces `role="button"` and destroys `<a>` semantics.
- For real links, reuse `buttonVariants` directly on a plain `<a>`:
  ```tsx
  <a href="/login" className={buttonVariants({ variant: 'outline' })}>
    Login
  </a>
  ```

### Pure component discipline (`UI = f(props)`)

- No state, no data fetching, no global store, no side effects inside the component.
- Loading is props-driven: `<Button disabled><Spinner data-icon="inline-start" />Generating</Button>`.
- The `@pawhaven/ui` `Button` extends the shadcn base with a `loading?: boolean` prop that renders an inline spinner and sets `disabled` automatically: `<Button loading={isPending}>Submit</Button>`.
- Business logic lives in the caller, not the component.

### Accessibility & a11y

- Native `<button>` (semantic, Enter/Space keyboard, focus) — never fake with `div`.
- `disabled:pointer-events-none disabled:opacity-50` for disabled state.
- `focus-visible:ring-*` for visible keyboard focus (WCAG).
- `aria-invalid` + destructive ring styles for form error states.

### Tailwind v4 specifics

- `data-slot="button"` so parents can override via `*:data-[slot=button]`.
- Use `size-*` instead of `w-* h-*` (e.g. `size-9`, `size-4`).
- `has-[>svg]:px-*` adjusts padding when an icon is present.
- Icons: use lucide-react, add `data-icon="inline-start|inline-end"` for spacing. NEVER use emoji as icons.
- Restore `cursor: pointer` in CSS because Tailwind v4 changed the default:
  ```css
  @layer base {
    button:not(:disabled),
    [role='button']:not(:disabled) {
      cursor: pointer;
    }
  }
  ```

## 3. Checklist when creating a component like this

- [ ] Variants/sizes declared with `cva` + `defaultVariants`, not conditionals
- [ ] React 19 style: no `forwardRef`, props via `React.ComponentProps<'button'>`
- [ ] `asChild` via `Slot` when polymorphic; `buttonVariants` reused for links
- [ ] Pure: no state/fetch/global store/side effects
- [ ] Native semantic element + keyboard + focus-visible + disabled styles
- [ ] `data-slot`, `size-*`, `has-[>svg]`, icon `data-icon` spacing
- [ ] Named export + barrel `index.ts`
