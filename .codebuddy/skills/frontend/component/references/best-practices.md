# component — Best Practices

Companion to `SKILL.MD`. Load when designing, splitting, or graduating a component.

## Graduation decision tree

```
1 feature uses it            → features/{Feature}/components/
2+ features, pure UI         → @pawhaven/ui
2+ features, business-aware  → @pawhaven/frontend-core
3+ features + complex state  → own package (README + tests + design review)
```

## API design

- Props: explicit, typed interface, minimal. Replace boolean toggles with a `variant` enum.
- Composition over configuration for components with distinct sections (header/body/footer).
- Callbacks: `on{Event}` (onClick), `on{Thing}Change` (passes value), `on{Action}` (onDelete).
  Pick one verb per concept and never mix `onRemove`/`handleDelete`/`deleteItem`.
- Prefer controlled components for shared packages.
- Forward refs only for inputs needing `focus()` / `scrollIntoView()` / DOM measurement.
- Avoid polymorphic `as` props unless multiple element types are truly required.

## Split when

- Lines > 150
- Mixing low-level DOM with high-level business logic
- Same JSX pattern repeated 3+ times
- Multiple `useState`/`useEffect` clusters → extract a custom hook

## Naming & exports

- PascalCase, descriptive, no `Component` suffix, named exports only, barrel re-exports.
- One public component per file.

## Directory layout

- In `@pawhaven/ui`, every pure component lives at `src/components/<Name>/index.tsx`.
- Shared helpers (`cn`) live at `src/utils/cn.ts`, **package-local per package, imported relatively** (e.g. `../../utils/cn`). Do NOT use package subpaths (`@pawhaven/ui/utils/cn`) for internal utils.
- Top-level barrel `src/index.ts` re-exports from `./components/*`.
- Compound families group under `src/components/<Family>/<SubName>/`.

## Do not

- Giant components, prop soup, over-engineering, premature graduation, leaky abstractions,
  inconsistent callback naming, default exports, unnecessary ref forwarding, components that fetch + render + route.

## Button (shadcn + React 19) essentials

Full canonical source: [references/button.md](references/button.md).

- `cva` for `variant × size`; export `buttonVariants()` standalone for reuse on links.
- React 19: no `forwardRef`, use `React.ComponentProps<'button'>`.
- `asChild` via `Slot`; but links use `buttonVariants()` on a plain `<a>`, never forced through `asChild`.
- Pure (`UI = f(props)`): no state/fetch/global store; loading via `disabled` + `<Spinner>`.
- `data-slot="button"`, `size-*`, `has-[>svg]:px-*`, icon `data-icon` spacing (lucide-react, no emojis).
- Accessible: native element, `disabled:opacity-50`, `focus-visible:ring-*`; restore `cursor: pointer` in `@layer base`.
