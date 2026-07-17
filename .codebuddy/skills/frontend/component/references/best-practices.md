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

## Do not

- Giant components, prop soup, over-engineering, premature graduation, leaky abstractions,
  inconsistent callback naming, default exports, unnecessary ref forwarding, components that fetch + render + route.
