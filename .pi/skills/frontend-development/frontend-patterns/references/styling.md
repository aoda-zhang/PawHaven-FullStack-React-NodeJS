# Styling — design tokens

Semantic Tailwind utilities from `@pawhaven/design-system` only. No raw hex, no raw color names, no
magic pixel values, no inline styles. The router that names when to read this is
[frontend-patterns](../SKILL.md).

## The gate is stated once, elsewhere

The token gate itself — where tokens live, what is forbidden, the scale — is stated **once** in the
[portal facts document](../../../../../../docs/frontend-portal.md):
[The styling gate](../../../../../../docs/frontend-portal.md#the-styling-gate). That file is the single
source; `style-doctor` checks against it. Do not restate the forbidden list here, because a list
written twice is a list that will disagree with itself.

## Writing a className

```tsx
// ✅ semantic utilities from the token set
<div className="bg-card text-text-secondary border-border hover:bg-muted" />

// ❌ always
<div style={{ background: '#1a1a1a' }} />
<div className="bg-[#1a1a1a] text-[#333]" />
```

- **Merge with `cn()`** from `@pawhaven/frontend-core` whenever a component accepts `className`.
  Omitting it means a parent cannot adjust layout.
- **No dynamic class concatenation.** No `` `bg-${color}` `` — a static map of complete class
  strings, so Tailwind's scanner sees every literal.
- **Class order is Prettier's job.** `prettier-plugin-tailwindcss` runs at commit; do not hand-sort
  and do not fight it.
- **Extract to a constant** when a class list stops being readable on one line.

**When no token fits**, the answer is to add a token to `packages/design-system/src/tokens/` and use
the generated utility — not to reach for an arbitrary value. That is the whole decision, and it is
short enough to apply without thinking.

## Custom utilities

The following catalogue covers all 18 `@utility` definitions in
`packages/design-system/src/utilities.css`, grouped by that file's own section comments. Use each class
exactly as written.

### Layout utilities

| Class             | Behavior                                                            |
| ----------------- | ------------------------------------------------------------------- |
| `full-width`      | Full-viewport-width element with compensating negative side margin. |
| `flex-center`     | Flex container with centered content on both axes.                  |
| `flex-between`    | Flex container with vertically centered, space-separated content.   |
| `flex-col-center` | Vertical flex container with centered content on both axes.         |

### Typography utilities

| Class       | Behavior                                                     |
| ----------- | ------------------------------------------------------------ |
| `text-hero` | Display-size serif heading utility with display line height. |
| `text-stat` | Statistic-size serif utility with single-unit line height.   |

### Button utilities

| Class            | Behavior                                                           |
| ---------------- | ------------------------------------------------------------------ |
| `btn-base`       | Shared button layout, typography, transition, and focus behavior.  |
| `btn-primary`    | Primary-background button utility with inverse text.               |
| `btn-secondary`  | Secondary-background button utility with inverse text.             |
| `btn-outline`    | Transparent-background button utility with border and body text.   |
| `button-reset`   | Removes native button appearance, background, border, and padding. |
| `button-rounded` | Pointer cursor with token-derived radius and padding.              |

`btn-base` supplies shared behavior but not color. Combine it with `btn-primary`, `btn-secondary`,
or `btn-outline`:

```tsx
<button className="btn-base btn-primary rounded-xl px-4 py-2">Save</button>
<button className="btn-base btn-outline rounded-xl px-4 py-2">Cancel</button>
```

### Surface utilities

| Class  | Behavior                                            |
| ------ | --------------------------------------------------- |
| `card` | Surface background with border, radius, and shadow. |

### Form utilities

| Class         | Behavior                                                       |
| ------------- | -------------------------------------------------------------- |
| `input-field` | Full-width input with border, radius, and visible focus state. |
| `form-error`  | Small error text below form inputs, using the error token.     |

### Link utilities

| Class        | Behavior                                                  |
| ------------ | --------------------------------------------------------- |
| `link`       | Semantic link color with transitions and hover underline. |
| `link-reset` | Removes link decoration and inherits surrounding color.   |

### Accessibility utilities

| Class        | Behavior                                                    |
| ------------ | ----------------------------------------------------------- |
| `focus-ring` | Visible focus outline with a light surrounding shadow ring. |

Reach for `focus-ring` on any element that is interactive without being a `button` or `a`, because
those two get their focus styling from the browser and the custom ones do not.

## Design system package structure

### File layout

```
packages/design-system/
├── index.css           # CSS entry: tailwindcss + tokens + theme + utilities + base
└── src/
    ├── theme.css       # semantic token mappings, consumed by Tailwind (bg-primary, text-muted, …)
    ├── utilities.css   # custom @utility classes (btn-primary, card, input-field, etc.)
    └── tokens/         # primitive CSS @theme blocks
        ├── index.css      # barrel: one @import per token file
        ├── color.css       # 7 color scales: gray, orange, green, red, yellow, blue, brown
        ├── typography.css  # fonts: Plus Jakarta Sans (sans), Fraunces (heading and serif), Caveat (handwriting)
        ├── spacing.css     # spacing scale + container widths
        ├── radius.css      # xs → 3xl + full
        ├── shadow.css      # xs → xl + shadow colors
        ├── motion.css      # duration (75ms → 1000ms) + easing curves
        ├── breakpoint.css  # xs → 2xl
        ├── border.css      # 0 → 8px
        ├── opacity.css     # 0 → 100
        ├── sizing.css      # width/height primitives
        └── z-index.css     # 0 → 50 + auto
```

The load order in `index.css` is the dependency order: primitive `tokens/` first, then the semantic
`theme.css` mapping onto them, then `utilities.css` on top. A value that has to be resolved in a
different order will not compile into the expected class.

### Export surface

The package is CSS-only. `package.json` declares:

```json
"exports": {
  "./index.css": "./index.css",
  "./tokens": "./src/tokens/index.css"
}
```

There is no `main` and no `types`, so the package resolves only as a stylesheet. A TypeScript import
of token values — `import { color } from '@pawhaven/design-system'` — does not resolve, and there is
no typed token export list to read. A value needed outside a className comes from the CSS custom
property or from a Tailwind utility class instead.

## Token ordering and units

The `@theme {}` blocks in `src/tokens/*.css` follow strict structural rules. Every new or modified
token must obey them: a token in the wrong position or with the wrong unit is a violation even when
its value is right, because the ordering is what makes the scale readable at a glance.

### Rule 1: Numeric ascending order

Every group of tokens in a `@theme` block is sorted by numerical value, smallest to largest.

```css
--font-size-xs: 0.75rem;            /* smallest */
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
...
--font-size-6xl: 3.75rem;           /* largest scale token */
--font-size-subtitle: 0.9375rem;    /* smallest semantic */
--font-size-stat: 1.75rem;
--font-size-display: 4.25rem;       /* largest semantic */
```

### Rule 2: Scale tokens first, semantic after

Never intersperse semantic tokens inside a numeric scale.

```css
✅ Correct                          ❌ Wrong
--font-size-xs: 0.75rem;            --font-size-xs: 0.75rem;
--font-size-sm: 0.875rem;           --font-size-sm: 0.875rem;
--font-size-base: 1rem;             --font-size-subtitle: 0.9375rem; /* semantic in scale! */
...                                 --font-size-base: 1rem;
--font-size-6xl: 3.75rem;           ...
--font-size-subtitle: 0.9375rem;    --font-size-6xl: 3.75rem;
--font-size-stat: 1.75rem;
--font-size-display: 4.25rem;
```

### Rule 3: Semantic tokens also sorted ascending

Within the semantic group (after scale tokens), sort by ascending value.

```css
✅ Correct                          ❌ Wrong
--font-size-subtitle: 0.9375rem;    --font-size-display: 4.25rem;  /* 4.25 should be last */
--font-size-stat: 1.75rem;          --font-size-stat: 1.75rem;
--font-size-display: 4.25rem;       --font-size-subtitle: 0.9375rem;
```

### Rule 4: Special keywords at the very end

`full`, `auto`, `none`, `min`, `max`, `fit` always go after all numeric tokens.

```css
--size-0: 0;
--size-px: 1px;
...
--size-24: 6rem;                    /* last numeric */
--size-full: 100%;                  /* keyword */
--size-min: min-content;
--size-max: max-content;
--size-fit: fit-content;
```

### Rule 5: Color scale 1 (lightest) to 10 (darkest)

Every color group follows `color-{name}-{1..10}`, ascending.

```css
--color-orange-1: #fff7ed;          /* lightest */
--color-orange-2: #ffedd5;
...
--color-orange-10: #7a2b08;        /* darkest */
```

Color groups: `gray`, `orange` (brand), `green` (secondary/success), `red` (error), `yellow`
(warning), `blue` (info), `brown` (neutral warm).

### Rule 6: Font families in fixed logical order

Font families are not sorted numerically. Fixed order:

```css
--font-sans → --font-heading → --font-serif → --font-handwriting
```

### Rule 7: Motion easing in fixed logical order

```css
ease-in → ease-out → ease-in-out → ease-standard → ease-decelerate → ease-accelerate → ease-bounce
```

### Rule 8: Units per token category

| Token category   | Unit     | Example                    |
| ---------------- | -------- | -------------------------- |
| Font sizes       | rem      | `--font-size-base: 1rem`   |
| Spacing / sizing | rem      | `--spacing-4: 1rem`        |
| Radius           | px       | `--radius-lg: 12px`        |
| Border width     | px       | `--border-width-1: 1px`    |
| Motion duration  | ms       | `--duration-200: 200ms`    |
| Line height      | unitless | `--leading-normal: 1.5`    |
| Opacity          | unitless | `--opacity-50: 0.5`        |
| Z-index          | unitless | `--z-index-50: 50`         |
| Letter spacing   | em       | `--tracking-wide: 0.025em` |

### Per-file order map

**`src/tokens/typography.css`** — `@theme` block: font families (logical order). Font sizes:
`xs → 6xl` ascending, then semantic `subtitle → stat → display` ascending. Line heights:
`none → loose` ascending, then semantic `display` at end. Letter spacing: `tighter → widest`
ascending. Font weights: `normal → extrabold` ascending.

**`src/tokens/color.css`** — Groups: `gray, orange, green, red, yellow, blue, brown`. Each:
`name-1 → name-10` ascending.

**`src/tokens/spacing.css`** — Spacing: `px, 0, 1, 2, 3, 4, 5, 6, 8, 10, 12` ascending. Container:
`sm, md, lg, xl, 2xl` ascending.

**`src/tokens/radius.css`** — `xs → 3xl` ascending, then `full` (keyword at end).

**`src/tokens/shadow.css`** — Colors: `shadow-light → shadow-dark` ascending opacity, then
`shadow-inner` at end. Shadows: `xs → xl` ascending, then `inner, none` at end.

**`src/tokens/motion.css`** — Duration: `75 → 1000` ascending. Easing: logical order.

**`src/tokens/border.css`** — `0 → 8` ascending.

**`src/tokens/breakpoint.css`** — `xs → 2xl` ascending.

**`src/tokens/opacity.css`** — `0 → 100` ascending.

**`src/tokens/sizing.css`** — `0 → 24` ascending, then `full, min, max, fit` keywords at end.

**`src/tokens/z-index.css`** — `0 → 50` ascending, then `auto` keyword at end.

### Placement checklist

For the file that is touched, before the edit is finished:

1. Place the token in the correct position — scale before semantic, numeric ascending, keywords at
   the end
2. Use the correct unit for its category (Rule 8)

## Token scales — lookup tables

Every value here is a closed set. Pick from the table; do not interpolate between entries.

### Semantic color tokens

Defined in `src/theme.css`; each one already has a matching Tailwind utility class.

| Category        | Tokens                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand / Primary | `primary`, `primary-hover`, `primary-active`, `primary-light`, `primary-subtle`                                                                                                             |
| Secondary       | `secondary`, `secondary-hover`, `secondary-active`, `secondary-light`                                                                                                                       |
| Surfaces        | `background`, `foreground`, `muted`, `accent`, `accent-foreground`, `card`, `adoptable-bg`, `adoptable-text`, `surface`, `background-subtle`, `muted-strong`                                |
| Text            | `text`, `text-secondary`, `text-tertiary`, `text-placeholder`, `text-inverse`, `text-link`                                                                                                  |
| Borders         | `border`, `border-hover`, `border-strong`, `border-focus`, `border-error`                                                                                                                   |
| Status          | `error`, `error-light`, `success`, `success-light`, `warning`, `warning-light`, `info`, `info-light`                                                                                        |
| Rescue status   | `rescue-status-pending`, `rescue-status-inProgress`, `rescue-status-treated`, `rescue-status-recovering`, `rescue-status-awaitingAdoption`, `rescue-status-adopted`, `rescue-status-failed` |

### Semantic → primitive mapping

Where a semantic token resolves to a primitive palette entry:

| Utility class         | Token                    | Primitive  |
| --------------------- | ------------------------ | ---------- |
| `bg-primary`          | `--color-primary`        | `orange-6` |
| `text-text`           | `--color-text`           | `gray-9`   |
| `text-text-secondary` | `--color-text-secondary` | `gray-7`   |
| `text-text-inverse`   | `--color-text-inverse`   | `gray-1`   |
| `bg-background`       | `--color-background`     | `gray-2`   |
| `bg-surface`          | `--color-surface`        | `gray-1`   |
| `bg-muted`            | `--color-muted`          | `gray-3`   |
| `border-border`       | `--color-border`         | `gray-5`   |
| `border-border-focus` | `--color-border-focus`   | `primary`  |
| `text-error`          | `--color-error`          | `red-6`    |
| `text-success`        | `--color-success`        | `green-6`  |
| `text-warning`        | `--color-warning`        | `yellow-6` |
| `text-info`           | `--color-info`           | `blue-6`   |

### Typography

Family stacks. The role each family plays — headings, body, editorial, accents — is decided in
`SKILL.md`; this table is only what each one resolves to.

| Token              | Tailwind           | Family                                     |
| ------------------ | ------------------ | ------------------------------------------ |
| `font-sans`        | `font-sans`        | 'Plus Jakarta Sans', system-ui, sans-serif |
| `font-heading`     | `font-heading`     | 'Fraunces', Georgia, serif                 |
| `font-serif`       | `font-serif`       | 'Fraunces', Georgia, serif                 |
| `font-handwriting` | `font-handwriting` | 'Caveat', cursive                          |

Font sizes:

| Scale token | Value    |
| ----------- | -------- |
| `text-xs`   | 0.75rem  |
| `text-sm`   | 0.875rem |
| `text-base` | 1rem     |
| `text-lg`   | 1.125rem |
| `text-xl`   | 1.25rem  |
| `text-2xl`  | 1.5rem   |
| `text-3xl`  | 1.875rem |
| `text-4xl`  | 2.25rem  |
| `text-5xl`  | 3rem     |
| `text-6xl`  | 3.75rem  |

Semantic aliases:

| Semantic class | Primitive          | Value    |
| -------------- | ------------------ | -------- |
| `text-caption` | `--font-size-xs`   | 0.75rem  |
| `text-body`    | `--font-size-base` | 1rem     |
| `text-stat`    | `--font-size-3xl`  | 1.875rem |
| `text-display` | `--font-size-5xl`  | 3rem     |

Font weights: `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700),
`font-extrabold` (800)

Line heights: `leading-none` (1), `leading-tight` (1.25), `leading-snug` (1.375), `leading-normal`
(1.5), `leading-relaxed` (1.625), `leading-loose` (2), `leading-display` (1.08)

### Spacing

Primitive scale from `src/tokens/spacing.css`:

| Token | Value          |
| ----- | -------------- |
| `px`  | 1px            |
| `0`   | 0              |
| `1`   | 0.25rem (4px)  |
| `2`   | 0.5rem (8px)   |
| `3`   | 0.75rem (12px) |
| `4`   | 1rem (16px)    |
| `5`   | 1.5rem (24px)  |
| `6`   | 2rem (32px)    |
| `8`   | 3rem (48px)    |
| `10`  | 4rem (64px)    |
| `12`  | 5rem (80px)    |

Semantic spacing aliases (from `theme.css`):

- `gutter` (spacing-5): horizontal container padding
- `section` (spacing-10): section vertical padding
- `card` (spacing-5): card internal padding
- `input` (spacing-3): input field padding

Container widths: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px), `2xl` (1536px)

Max content width: `max-w-6xl` (72rem / 1152px)

### Radius

| Token         | Tailwind       | Value  | Usage                                  |
| ------------- | -------------- | ------ | -------------------------------------- |
| `radius-xs`   | `rounded-xs`   | 2px    | Subtle rounding                        |
| `radius-sm`   | `rounded-sm`   | 4px    | Small elements                         |
| `radius-md`   | `rounded-md`   | 8px    | Buttons, inputs, trait tags, nav items |
| `radius-lg`   | `rounded-lg`   | 12px   | Cards, logo icon                       |
| `radius-xl`   | `rounded-xl`   | 16px   | Buttons (cta)                          |
| `radius-2xl`  | `rounded-2xl`  | 24px   | Cards (large)                          |
| `radius-3xl`  | `rounded-3xl`  | 32px   | Containers                             |
| `radius-full` | `rounded-full` | 9999px | Badges, pills, avatars                 |

Semantic radius aliases: `radius-input` (sm), `radius-button` (md), `radius-card` (lg),
`radius-dialog` (xl)

### Shadow

| Token          | Value        | Usage               |
| -------------- | ------------ | ------------------- |
| `shadow-xs`    | 0 1px 2px    | Very subtle         |
| `shadow-sm`    | 0 1px 3px    | Cards default       |
| `shadow-md`    | 0 3px 6px    | Dropdowns           |
| `shadow-lg`    | 0 8px 20px   | Cards hover, modals |
| `shadow-xl`    | 0 12px 28px  | Toasts, elevated    |
| `shadow-inner` | inset shadow | Inner depth         |
| `shadow-none`  | none         | Reset               |

Semantic shadow aliases: `shadow-card` (sm), `shadow-dropdown` (md), `shadow-modal` (lg),
`shadow-toast` (xl)

### Motion

Durations: `duration-75`, `duration-100`, `duration-150`, `duration-200`, `duration-300`,
`duration-500`, `duration-700`, `duration-1000`

Easings: `ease-standard`, `ease-in`, `ease-out`, `ease-in-out`, `ease-decelerate`,
`ease-accelerate`, `ease-bounce`

### Z-index

Primitive scale: `z-0`, `z-10`, `z-20`, `z-30`, `z-40`, `z-50`, `z-auto`

Semantic aliases:

| Token            | Value | Usage               |
| ---------------- | ----- | ------------------- |
| `z-base`         | 1     | Default content     |
| `z-dropdown`     | 100   | Dropdowns, popovers |
| `z-sticky`       | 200   | Sticky headers      |
| `z-overlay`      | 300   | Overlays, drawers   |
| `z-modal`        | 400   | Modals, dialogs     |
| `z-notification` | 500   | Notifications       |
| `z-toast`        | 600   | Toasts (highest)    |

### Breakpoints

| Token | Width  |
| ----- | ------ |
| `xs`  | 360px  |
| `sm`  | 640px  |
| `md`  | 768px  |
| `lg`  | 1024px |
| `xl`  | 1280px |
| `2xl` | 1536px |

## Doctor

[style-doctor](./styling.md) — the gate for UI changes, and it
enumerates every rule. `pnpm token-check` is the gate: it runs the five mechanical rules from
`style-doctor` (raw hex, raw palette names, CSS-variable bypass, static-value `style={{}}`, `px`
arbitrary values) over `apps/frontend` + `packages/ui`. Seven pre-existing hits are pinned in the
script's `KNOWN_VIOLATIONS` allowlist, so a new violation fails the run. `style-doctor` remains the
reviewer for what the script cannot judge.
