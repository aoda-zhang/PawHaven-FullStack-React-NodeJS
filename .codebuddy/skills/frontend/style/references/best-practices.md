# styling — Best Practices

Companion to `SKILL.MD`. Load when writing or auditing any visual styling.

## The decision flow (single rule)

```
1. Custom utility in utilities.css?  → use it
2. Semantic token in theme.css?      → use the class (bg-primary, text-muted)
3. Primitive token in src/tokens/*.css?  → use standard class (p-4, rounded-lg)
4. None exist                        → add token to @pawhaven/design-system, then use it
```

## Token Structure & Ordering (MUST FOLLOW)

When adding or modifying ANY token in `src/tokens/*.css`:

1. **Numeric ascending** — every group sorted smallest → largest
2. **Scale tokens first, semantic tokens after** — never intersperse
3. **Semantic tokens also sorted ascending** — within their group
4. **Special keywords at the end** — `full`, `auto`, `none`, `min`, `max`, `fit`
5. **Color: name-1 (lightest) to name-10 (darkest)** — always ascending
6. **Font families: fixed order** — `sans → heading → serif → handwriting`
7. **Units**: `rem` for sizes/spacing, `ms` for duration, `px` for radius/borders, unitless for line-height/opacity/z-index, `em` for letter-spacing

## Forbidden

- Hardcoded hex/rgb/hsl colors.
- `bg-[var(--color-*)]` / `text-[var(--color-*)]` bypass — use the semantic utility class.
- Static `style={{}}` values (only runtime-dynamic values belong inline).
- Raw Tailwind color names (`text-orange-500`) instead of semantic `text-primary`.
- Adding tokens out of order or with wrong units (see Token Structure above).

## Discouraged

- Magic numbers: `w-[317px]`, `mt-[13px]`, `backdrop-blur-[12px]`.
- Pixel-perfect positioning (`left-[183px]`); prefer flex/grid + natural flow.
- Custom CSS when a utility or token exists.

## Conventions

- `cn()` for class composition (never manual string concatenation).
- Icons: Lucide, `currentColor`, `viewBox="0 0 24 24"`, consistent sizing per context.
- Responsive by default (`grid-cols-1 md:grid-cols-2 xl:grid-cols-3`).
- Dark mode via semantic tokens (never hardcoded light colors).
- Components are built with shadcn/ui (Radix primitives) and consume design tokens via Tailwind.
- New visual value needed? Add it to the design system, don't hardcode in a component.
