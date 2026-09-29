---
name: style
description: >-
  PawHaven styling standards. Every visual value — color, spacing, type, radius, shadow, motion,
  z-index — comes from @pawhaven/design-system and reaches the DOM as a Tailwind utility class
  or one of the custom utilities in utilities.css, never as a literal. Governs semantic color and
  dark mode, scale selection, rem over px, inline-style limits, hover and state patterns, Lucide
  icon sizing, cn() composition, and the order in which a value is chosen. Use when writing or
  changing any className, style attribute, or CSS property: picking a token, choosing a font
  family or size, adding a shadow, transition, or z-index, deciding whether a value may go
  inline, or adding a token to the design system. Triggers: Tailwind class, CSS property, design
  token, className, 样式规范, 设计系统, 设计 Token, 硬编码颜色.
  style-doctor scans for violations of this; this skill defines them.
---

# Styling Standards & Design System Enforcement

Every visual value in PawHaven comes from `@pawhaven/design-system` and reaches the DOM as a
Tailwind utility class or one of the custom utilities in `utilities.css` — never as a literal.

Foundation import, in the app root:

```ts
import '@pawhaven/design-system/index.css'; // tokens + theme + utilities + base styles
```

## When to use / when not to use

Use this skill when authoring or changing any visual value: a `className`, a `style` attribute, a
CSS property, or a new token under `packages/design-system/src/tokens/`.

Do not use it to find violations in existing code. Scanning a diff, a file, or a component for
hardcoded colors, `var()` bypasses, magic numbers, or inline styles is
[style-doctor](../../code-review/style-doctor/SKILL.md)'s job. This skill states what the correct
answer is; that skill reports the places the answer is missing.

## The decision flow

When a visual value is needed, walk these four steps in order. Every individual "don't" rule below
is a step that got skipped, so the flow is the one thing worth memorizing.

```
Need a visual value?
  │
  ├─ 1. Is there a custom utility class in utilities.css?
  │     YES → Use it (btn-primary, card, input-field, flex-center, link, etc.)
  │
  ├─ 2. Is there a semantic token in theme.css?
  │     YES → Use the Tailwind utility class directly (bg-primary, text-muted,
  │            font-heading, shadow-card, duration-200, ease-standard, etc.)
  │
  ├─ 3. Is there a primitive token in src/tokens/*.css?
  │     YES → Use the standard Tailwind class (p-4, rounded-lg, text-xl, etc.)
  │
  └─ 4. None of the above exist
        → Add a new token to @pawhaven/design-system first, then use it
```

Step 4 is the only one that changes a file. A value no token covers is a design-system addition,
not a component literal — component literals are how the token set stops describing the UI.

The steps are ordered because each layer is built on the one below: `utilities.css` on
`theme.css`, `theme.css` on `src/tokens/*.css`. So `bg-[var(--color-primary)]` fails at step 2 —
the semantic token exists and is being bypassed. `style={{ fontFamily: '...' }}` fails at step 2 —
`font-heading` exists. `w-[317px]` fails at step 3 — it is not a spacing token.

## Color and theme

### Semantic tokens, never raw color values

A raw palette name (`text-orange-500`) is a design decision smuggled into a component: it ignores
dark mode, ignores the brand scale, and drifts the moment the palette moves. Writing the CSS
variable directly is the same bypass in costume — every variable in `src/theme.css` already has a
matching utility class, so `bg-[var(--color-surface-dark)]` and `bg-surface-dark` are the same
token, one of them just illegible.

```tsx
// ❌ raw palette names
text-orange-500; bg-blue-600; border-gray-300;

// ❌ CSS variable bypass — the utility class already exists
bg-[var(--color-surface-dark)];   // → bg-surface-dark
text-[var(--color-text-inverse)]; // → text-text-inverse
style={{ fontFamily: 'var(--font-heading)' }}; // → font-heading

// ✅ semantic utilities
bg-primary; text-text; text-text-secondary; text-text-muted; text-error;
```

The token inventory by category, and the primitive each token resolves to, is in
`references/token-scales.md`.

### Dark mode is what semantic tokens buy

Never hardcode a light-mode color. Because `bg-background`, `text-text`, and `border-border` are
mapped per theme in `theme.css`, the same class is correct in both — a literal like
`text-gray-900` is correct in exactly one.

### Inline styles only for runtime-computed values

A `style` attribute skips Tailwind's conflict resolution and, more importantly, makes the value
invisible to anyone auditing for token compliance. Reserve it for values that only exist at
runtime:

```tsx
style={{ '--progress': `${progress}%` } as React.CSSProperties} // ✅ computed per render
style={{ width: 320 }}                                             // ❌ → w-80
style={{ color: '#4285F4' }}                                       // ❌ → semantic color class
```

## Picking a value from a scale

Each scale below is a closed set. An arbitrary value (`w-[287px]`, `text-[15px]`, `z-[99]`) is
outside it, which is exactly why two pages that were built a month apart stop matching.

### Typography

A family is a role decision, so pick the one whose role matches the element and keep a page to a
single family per role: `font-heading` for page and section titles, `font-sans` for body and UI,
`font-serif` for editorial and display, `font-handwriting` for handwritten accents. The family
stacks, sizes, weights, and line heights: `references/token-scales.md`. Avoid `text-[15px]`,
`leading-[21px]`, `font-[550]` — they sit between scale steps, so nothing else can predict them.

### Spacing

Spacing comes from the primitive scale, or from the semantic alias that already encodes where a
gap belongs. Values, aliases, container widths, and the content-width cap:
`references/token-scales.md`. Avoid `mt-[17px]`, `w-[287px]`, `left-[43px]`, `h-[91px]`.

### Radius

`rounded-*` from the scale, or the semantic alias for that component type — inputs, buttons, cards,
and dialogs each have one, so a component never picks its own corner. Table in
`references/token-scales.md`. Avoid `rounded-[11px]`, `rounded-[13px]`.

### Shadow

A component should almost never reach for a raw `shadow-*`: the semantic alias already carries the
elevation level the design intends, and an ad-hoc value breaks the stacking of card, dropdown,
modal, and toast. Table in `references/token-scales.md`. Avoid custom `box-shadow` values.

### Motion

A transition is a duration token plus an easing token plus a property word. Table in
`references/token-scales.md`. Avoid `duration-[375ms]`.

```tsx
transition-colors duration-150 ease-standard
transition-opacity duration-200 ease-out
```

### Z-index

Stacking is a design decision, so it is expressed as one: `z-[99]` means nobody — including the
author — can say what sits above it. Use the semantic z-scale. Table in
`references/token-scales.md`.

### Breakpoints

Layouts are written against the defined breakpoints, because a custom media query is a breakpoint
the rest of the app cannot see, so it silently desynchronizes the layout it was copied from.
Widths: `references/token-scales.md`.

## Hardcoded values and units

### No literals, no magic numbers

`w-[237px]`, `text-[#3498db]`, `rounded-[13px]`, and `style={{ marginTop: 37 }}` each freeze one
design decision inside one component, where a token change cannot reach it. The test is whether
the value came out of a scale: if it did not, it needs a token, or a different value from one.

```tsx
className='w-[237px]'  className='text-[#3498db]'  className='rounded-[13px]'  // ❌
className='rounded-lg' className='bg-primary'      className='p-4'             // ✅
```

If a value repeats across the application, promote it into the design system rather than
copying it a second time.

### `rem`, not `px`

The scale is `rem`-based so spacing, type, and layout follow the user's root font size. A `px`
value ignores that preference, so the whole layout fails to scale for exactly the users who set
it. Where no token exists and an arbitrary value is unavoidable, write `rem`.

Escape hatch: `px` is acceptable only when `rem` is technically wrong — hairline borders and
dividers that would round inconsistently, fixed device-pixel assets that must not scale (a 1px
focus ring, retina line art), and third-party overrides that only accept `px`. Keep those minimal
and localized; everything else is a token or `rem`.

```tsx
w-[320px]     text-[15px]    mt-[12px]    // ❌ ignores the user's root font size
w-full        text-base      mt-4         // ✅ token, or scale
w-[20rem]                                     // ✅ rem arbitrary value, no token fits
```

## Layout and composition

### Utility first; custom CSS is the last resort

A hand-written `.card { display: flex; padding: 24px; }` is a scale value that no longer scales.
Before writing CSS, answer in order: can Tailwind express this, can it be a reusable component, can
it be a token in `@pawhaven/design-system`. Only if all three are no.

### Responsive by default

Every layout has to work at every supported breakpoint, so write it mobile-first with the
breakpoint utilities: `grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3`. Avoid fixed widths wherever
a max-width or flexible track will do.

### Flexible layout over pixel-perfect positioning

`left-[183px]` / `top-[42px]` pins a component to one viewport and breaks the moment content
reflows. Prefer Flexbox, Grid, `gap`, `max-width`, `min-width`, and auto sizing so the component
follows its content in normal document flow.

### Compose classes with `cn()`

Manual string concatenation produces two conflicting classes with no defined winner; `cn()`
merges them correctly and keeps conditional variants readable.

```tsx
className={cn('rounded-lg bg-surface', isActive && 'border-primary', className)}
```

## Interaction and state

### Hover effects use the defined patterns

| Element              | Effect                             | Tailwind                                      |
| -------------------- | ---------------------------------- | --------------------------------------------- |
| Cards                | 2px lift + larger shadow           | `-translate-y-1 shadow-lg`                    |
| Card images          | 5% zoom over 500ms                 | `scale-105 transition-transform duration-500` |
| Nav items (inactive) | bg → muted, text → foreground      | `hover:bg-muted hover:text-text`              |
| Buttons              | 10% opacity reduction or underline | `hover:opacity-90` / `hover:underline`        |
| Logo                 | 5% scale on parent hover           | `group-hover:scale-105 transition-transform`  |

An ad-hoc hover (`hover:bg-[#f0f0f0]`, `hover:scale-110`) makes that one element feel unlike
every other one, which is the whole cost of a one-line deviation.

### Every interactive element carries its states

Hover, focus, active, disabled, loading, selected — all present, all built from the same tokens.
A component with a hover state and no focus or disabled state is unusable by keyboard or by anyone
waiting on a request.

### Icons are Lucide, sized by context

All icons come from [Lucide](https://lucide.dev), rendered as inline SVG with
`fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`,
`stroke-linejoin="round"`, `viewBox="0 0 24 24"`. `currentColor` is what lets an icon inherit its
text color, so per-icon color styling is always a mistake.

| Context                          | Tailwind      |
| -------------------------------- | ------------- |
| Nav icons                        | `w-4 h-4`     |
| Card meta icons (location, time) | `w-3.5 h-3.5` |
| Badge icons (urgent)             | `w-3 h-3`     |
| Mobile menu / Hero button        | `w-5 h-5`     |

Icon-only links and buttons also need an `aria-label`, because a bare SVG exposes no accessible
name.

## Components

### shadcn/ui components already consume the tokens

`@pawhaven/ui` is built on Radix primitives and Tailwind design tokens, so a token change in
`src/tokens/color.css` updates the component and the utility classes together — no theme provider,
no second set of colors.

```tsx
import { Button } from '@pawhaven/ui';

<Button variant="primary" className="bg-primary text-primary">
  Save
</Button>;
```

### No TypeScript entry point

`@pawhaven/design-system` is CSS-only. Its `exports` map offers `./index.css` and `./tokens`, and
the package declares no `main` and no `types`, so `import { color } from '@pawhaven/design-system'`
does not resolve and there is no typed token export to reach for.

Canvas fills, chart colors, and any value computed in JS therefore take their value from the CSS
custom property, or stay on a Tailwind utility class — never from a JS import of the token set.

## Adding a value the design system lacks

When step 4 of the flow fires, the change lands in the design system, not the component:

1. Add it to the appropriate `src/tokens/*.css` file
2. If it is a new file, add an `@import` for it to the `src/tokens/index.css` barrel
3. If it is a semantic mapping, add it to `theme.css`

Position and unit are not free choices: every `@theme` block follows ordering rules, and a token in
the wrong place is a violation even when its value is right. Read
`references/token-ordering.md` before editing a token file.

Never add ad-hoc values directly in components.

## Pre-commit checks

Mechanical gates, not restatements of the rules above:

- No `style={{ }}` carrying a static value, and no `bg-[var(--color-*)]` bypass
- No arbitrary values (`text-[#xxx]`, `rounded-[Npx]`, `w-[Npx]`) outside a justified `rem`
- No raw palette color name (`text-orange-500`) where a semantic token exists
- A repeated value that landed in two components is a token that should have been added
- Any pattern resembling an existing `utilities.css` utility reuses that utility

## References

- `references/token-scales.md` — every scale as a lookup table: semantic color tokens and the
  primitive each resolves to, font families/sizes/weights/line-heights, the spacing scale and
  container widths, radius, shadow, motion durations and easings, the z-index scale, breakpoints.
  Read it when a visual property has to be given a concrete existing value and the class name is
  not already known.
- `references/custom-utilities.md` — the `utilities.css` catalogue (layout, button, surface, form,
  link, focus-ring) with what each expands to and how they combine. Read it before writing any
  button, card, input, link, or centered flex container, and before adding a pattern that looks
  like one of them.
- `references/token-ordering.md` — the ordering and unit rules that govern `src/tokens/*.css`, the
  per-file order map, and the placement checklist. Read it when adding, renaming, or moving a
  token, since ordering is enforced.
- `references/package-structure.md` — the design system package map: file layout, the roles of
  `theme.css` / `utilities.css` / `src/tokens/*`, and the CSS-only export surface. Read it when
  wiring the package into an app root.

## Related skills

- [style-doctor](../../code-review/style-doctor/SKILL.md) — detecting styling violations in
  existing code
- [component](../component/SKILL.md) — component API design and the feature/package boundary
