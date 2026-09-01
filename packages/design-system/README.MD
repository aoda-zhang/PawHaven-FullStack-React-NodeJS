# @pawhaven/design-system

Shared design tokens, theme, and utilities for the PawHaven monorepo. Provides the single source of truth for all visual primitives used across `apps/frontend/*`, `packages/ui`, and `packages/frontend-core`.

## Quick Start

```ts
// CSS entry — imports tokens, theme, utilities, and base styles
import '@pawhaven/design-system/styles.css';

// TypeScript token access
import { color, spacing, radius, tokenVar } from '@pawhaven/design-system';
```

## Package Structure

```
packages/design-system/
├── index.css           # CSS entry point (tailwindcss + tokens + theme + utilities + base styles)
├── src/                # TypeScript + CSS source
│   ├── index.ts        # JS/TS entry point
│   ├── tokens.ts       # Typed token access (CSS var references + raw values)
│   ├── theme.css       # Semantic mappings (bg-primary, text-muted, etc.) + --text-* font-size aliases
│   ├── utilities.css   # Custom Tailwind @utility classes (btn-primary, card, text-hero, text-stat, etc.)
│   └── tokens/         # Primitive design tokens (CSS @theme blocks)
│       ├── index.css   # Barrel import
│       ├── color.css   # Color scales (gray, orange, green, red, yellow, blue, brown)
│       ├── typography.css # Font families, sizes, line-heights, tracking, weights
│       ├── spacing.css     # Spacing scale + container widths
│       ├── border.css      # Border widths
│       ├── radius.css      # Border radius scale
│       ├── shadow.css      # Shadow primitives + shadow colors
│       ├── motion.css      # Durations + easing curves
│       ├── breakpoint.css  # Responsive breakpoints
│       ├── opacity.css     # Opacity scale
│       ├── sizing.css      # Width/height primitives
│       └── z-index.css     # Z-index primitives
└── package.json
```

## Usage

### CSS Import

Import once in your app root to get all tokens, theme mappings, utilities, and base styles:

```ts
// apps/frontend/portal/src/providers/AppProvider.tsx
import '@pawhaven/design-system/styles.css';
```

### Tailwind Utility Classes

Use semantic tokens directly in Tailwind classes:

```html
<div class="bg-primary text-text-inverse rounded-xl shadow-card">
  <h1 class="font-heading text-3xl text-text">Hello PawHaven</h1>
  <button class="btn-primary btn-base rounded-xl px-4 py-2">Get Started</button>
  <input class="input-field" placeholder="Search..." />
</div>
```

### Custom Utilities

| Utility | Description |
|---------|-------------|
| `flex-center` | `display: flex; align-items: center; justify-content: center` |
| `flex-between` | `display: flex; align-items: center; justify-content: space-between` |
| `flex-col-center` | Vertical flex with centered content |
| `btn-base` | Base button reset (inline-flex, centered, medium weight, transitions) |
| `btn-primary` | Primary brand button (orange bg + white text) |
| `btn-secondary` | Secondary button (green bg + white text) |
| `btn-outline` | Outlined button (transparent bg + border) |
| `card` | Card surface (white bg, border, shadow, rounded) |
| `input-field` | Full-width form input with focus ring |
| `form-error` | Error text below form inputs |
| `link` | Semantic link styling |
| `link-reset` | Remove link decoration |
| `button-reset` | Full button reset |
| `button-rounded` | Rounded button with token-based padding |
| `focus-ring` | Accessible focus-visible outline |

### TypeScript Token Access

```ts
import { color, spacing, radius, shadow, duration, easing, typography, tokenVar } from '@pawhaven/design-system';

// CSS variable references — use in inline styles, chart libraries, etc.
const style = { color: color.primary, padding: spacing.card };

// Type-safe tokenVar helper
const primaryVar = tokenVar('color.primary'); // → 'var(--color-primary)'

// Raw color primitives (for canvas, charts, etc.)
import { colorPrimitives } from '@pawhaven/design-system';
const orange500 = colorPrimitives.orange[5]; // → '#fb923c'
```

### Token Reference

#### Color Scales

Each color has a 1–10 scale (1 = lightest, 10 = darkest):

| Scale | Gray | Orange (Brand) | Green (Secondary/Success) | Red (Error) | Yellow (Warning) | Blue (Info) | Brown (Neutral) |
|-------|------|----------------|---------------------------|-------------|------------------|-------------|-----------------|
| 1 | `#ffffff` | `#fff7ed` | `#f0fdf4` | `#fff1f2` | `#fffbeb` | `#eff6ff` | `#fffaf6` |
| 5 | `#d4d4d4` | `#fb923c` | `#4ade80` | `#f87171` | `#fbbf24` | `#60a5fa` | `#e1cfbf` |
| 6 | `#a3a3a3` | `#f7823a` | `#4caf50` | `#ef4444` | `#f59e0b` | `#3b82f6` | `#d3c3b3` |
| 10 | `#171717` | `#7a2b08` | `#14532d` | `#7f1d1d` | `#78350f` | `#1e3a8a` | `#4a392c` |

#### Semantic Mappings

Semantic token names and values are the single source of truth defined in
[`design-system.html`](./design-system.html) (the Figma design system reference).
Primitive hue/scale tokens (`--color-gray-*`, `--color-brown-*`, etc.) MUST NOT be
used directly in components — always reference a semantic token from the table below.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `--color-orange-6` | Primary actions, brand (Primary `#f7823a`) |
| `--color-primary-fg` | `--color-gray-1` | Text on primary (Primary FG `#ffffff`) |
| `--color-secondary` | `--color-green-6` | Secondary actions, success |
| `--color-background` | `--color-gray-2` | Page background (Background `#f7f7f5`) |
| `--color-foreground` | `--color-gray-10` | Main text, headings (Foreground `#1c1c1c`) |
| `--color-muted` | `--color-gray-3` | Secondary bg, inactive (Muted `#f3f3f1`) |
| `--color-accent` | `--color-brown-2` | Highlights, light pills (Accent `#fff4ee`) |
| `--color-card` | `--color-gray-1` | Card surfaces (Card `#ffffff`) |
| `--color-surface` | `--color-gray-1` | Alias of `card` |
| `--color-border` | `--color-gray-4` | Card borders, dividers (Border `#e4e4e2`) |
| `--color-hero-bg` | `--color-brown-3` | Warm beige hero (Hero BG `#f5ede3`) |
| `--color-nav-bg` | `brown-1` @ 88% | Frosted nav (Nav BG) |
| `--color-dark-text` | `--color-gray-10` | Hero headline, dark buttons (Dark Text `#1c1a17`) |
| `--color-body-text` | `--color-brown-9` | Hero/body copy (Body Text `#6b6258`) |
| `--color-stat-labels` | `--color-brown-8` | Stat captions (Stat Labels `#9e8e82`) |
| `--color-divider` | `--color-brown-6` | Hero stats divider (Divider `#d4c4b4`) |
| `--color-footer-text` | `--color-brown-6` | Footer links (Footer Text `#d3c3b3`) |
| `--color-footer-muted` | `--color-brown-8` | Footer muted labels (Footer Muted `#8f7b69`) |
| `--color-text` | `--color-gray-9` | Body text |
| `--color-text-secondary` | `--color-gray-7` | Subtle text |
| `--color-text-inverse` | `--color-gray-1` | Text on dark/primary surfaces |
| `--color-text-link` | `--color-primary` | Links |
| `--color-error` | `--color-red-6` | Error states |
| `--color-success` | `--color-green-6` | Success states |
| `--color-warning` | `--color-yellow-6` | Warning states |
| `--color-info` | `--color-blue-6` | Info states |

#### Text Color Tokens

These are the **text-color** semantic tokens. Each maps to a Tailwind text-color
utility of the same name, prefixed with `text-` by Tailwind v4 (so the token
`--color-text-secondary` → utility `text-text-secondary`). They are the recommended way
to color text and are safe to use directly in `className`.

| Token (CSS var) | Utility class | Value | Usage |
|-----------------|---------------|-------|-------|
| `--color-text` | `text-text` | `--color-gray-9` | Body text |
| `--color-text-secondary` | `text-text-secondary` | `--color-gray-7` | Subtle/secondary text |
| `--color-text-tertiary` | `text-text-tertiary` | `--color-gray-6` | Tertiary captions |
| `--color-text-placeholder` | `text-text-placeholder` | `--color-gray-5` | Input placeholders |
| `--color-text-inverse` | `text-text-inverse` | `--color-gray-1` | Text on dark / primary surfaces |
| `--color-text-link` | `text-text-link` | `--color-primary` | Links |

> **Naming note:** the utility always carries a leading `text-` (Tailwind's
> text-color prefix), so tokens whose names also start with `text` produce a
> doubled `text-text-…` class (e.g. `text-text-secondary`). This is expected and
> valid — the class is generated from the `--color-*` theme token, not hardcoded.
> There is intentionally **no** dedicated "muted text" token; previously-muted
> text now uses `text-text-secondary`. The remaining `text-*`-prefixed tokens
> keep their names for backward compatibility.

#### Rescue Status Color Tokens

These semantic tokens define the color for **every animal / rescue status**. They
are the **single source of truth** for status colors and **must not** be hard-coded
as raw Tailwind colors (e.g. `bg-blue-500`, `bg-green-500`, `bg-slate-400`).

| Token (CSS var) | Utility class | Value | Status |
|-----------------|---------------|-------|--------|
| `--color-rescue-status-pending` | `bg-rescue-status-pending` | `--color-yellow-6` | `pending` |
| `--color-rescue-status-inProgress` | `bg-rescue-status-inProgress` | `--color-blue-6` | `inProgress` |
| `--color-rescue-status-treated` | `bg-rescue-status-treated` | `--color-blue-10` | `treated` |
| `--color-rescue-status-recovering` | `bg-rescue-status-recovering` | `--color-green-6` | `recovering` |
| `--color-rescue-status-awaitingAdoption` | `bg-rescue-status-awaitingAdoption` | `--color-yellow-5` | `awaitingAdoption` |
| `--color-rescue-status-adopted` | `bg-rescue-status-adopted` | `--color-green-8` | `adopted` |
| `--color-rescue-status-failed` | `bg-rescue-status-failed` | `--color-gray-6` | `failed` |

> **Use the `getStatusColorByPrefix` util — never hard-code status colors.**
> Always resolve a status color through the shared helper instead of writing the
> class directly. This keeps the status → color mapping in one place and in sync
> with the tokens above. The `prefix` argument selects the variant:
> `'bg'` → `bg-rescue-status-*`, `'text'` → `text-rescue-status-*`,
> `'border'` → `border-rescue-status-*`.
>
> ```ts
> // apps/frontend/portal/src/utils/getStatusColorByPrefix.ts
> import { getStatusColorByPrefix } from '@/utils/getStatusColorByPrefix';
>
> const dotClass = getStatusColorByPrefix({ status: animal.status, prefix: 'bg' });
> ```
>
> Current consumers: `RescueCases/components/StatusBadge.tsx`,
> `RescueDetail/index.tsx`.

#### Typography Tokens

Font families, sizes, weights, line heights, and letter spacing are **primitive
tokens** defined in [`tokens/typography.css`](./src/tokens/typography.css) (the
`@theme` block). The raw `--font-size-*` / `--leading-*` / `--font-*` variables
are the single source of truth.

The neutral scale (`text-xs` … `text-6xl`) is a **primitive** in
[`tokens/typography.css`](./src/tokens/typography.css) — declared there so the
project owns the scale (its values mirror Tailwind v4's default `--text-*`).
Two kinds of `--text-*` entries live in [`theme.css`](./src/theme.css):

1. **Role/usage semantics** (not scale steps) — these name a purpose, so they
   belong in the semantic layer, not the primitive file:

   | Token | Value | Meaning |
   |-------|-------|---------|
   | `--text-display` | `var(--font-size-6xl)` | hero/display heading |
   | `--text-stat` | `var(--font-size-3xl)` | big stat numbers |
   | `--text-body` | `var(--font-size-base)` | body copy (`text-md` is invalid — `md` is a breakpoint) |
   | `--text-caption` | `var(--font-size-xs)` | tiny caption text |

| Utility | Source | Generated by |
|---------|--------|--------------|
| `text-xs` … `text-6xl` | `--font-size-*` primitive (Tailwind default scale) | Tailwind v4 |
| `text-display` / `text-stat` / `text-body` / `text-caption` | `--text-*` semantic token | `--text-*` theme token |
| `text-hero` | `font-size: --text-display` + `line-height` + `font-family` + `font-weight` | composite `@utility` |
| `text-stat` | `font-size: --text-stat` + `line-height` + `font-family` + `font-weight` | composite `@utility` |

`text-hero` / `text-stat` are **composite `@utility` styles** in `utilities.css`
because they bundle size + family + weight + line-height into one class.
`--font-serif` / `--font-heading` / `--font-sans` provide the `font-serif` /
`font-heading` / `font-sans` utilities.

## Scripts

```bash
# Type-check the TypeScript source
pnpm --filter @pawhaven/design-system typecheck
```
