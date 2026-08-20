---
name: styling
description: >
  样式规范与设计系统 / Styling Standards & Design System Enforcement.
  定义项目样式全流程标准：所有样式必须基于 @pawhaven/design-system 设计 Token、必须使用 Tailwind 语义 utility class（禁止 CSS 变量绕过 bg-[var(--color-*)]）、禁止硬编码颜色值（hex/rgb/rgba/hsl）、禁止魔法数字（backdrop-blur-[12px]/w-[137px]）、禁止内联 style={}、响应式断点规范、cn() 工具类合并、深色模式兼容。
  触发场景 / Trigger: 样式 styling CSS SCSS SASS CSS Modules Tailwind utility-first utility class atomic CSS, Tailwind className utility class postcss JIT just-in-time compiler config, 设计系统 design system design token primitives foundation brand identity consistency, design tokens colors spacing typography font shadow radius border elevation z-index, 颜色 color palette primary secondary accent neutral background surface text border, 间距 spacing padding margin gap layout grid flex box alignment, 响应式 responsive breakpoint sm md lg xl 2xl mobile tablet desktop adaptive, 深色模式 dark mode light mode theme toggle color-scheme prefers-color-scheme, 硬编码颜色 hardcoded color hex #fff #000 rgb( rgba( hsl( hsla( named color, 魔法数字 magic numbers arbitrary values arbitrary px backdrop-blur-[ w-[ h-[ p-[ m-[, CSS 变量绕过 CSS variable bypass var() var(--color- bg-[var( text-[var( border-[var(, 内联样式 inline style={} style attribute direct styling forbidden must use className, className cn() classnames clsx twMerge tailwind-merge utility function merge combine, 主题 theme theming CSS custom properties design token variable light dark, 排版 typography font font-family font-size font-weight line-height letter-spacing, 断点 breakpoint responsive utility sm: md: lg: xl: 2xl: mobile-first desktop-first, @pawhaven/design-system shared design token package npm workspace monorepo, backdrop-blur filter blur effect glassmorphism glass effect frosted, grid flexbox layout container max-width mx-auto alignment justify align, hover focus active disabled state pseudo-class variant variant-*:, transition animation animate motion duration timing easing keyframe.
version: 2.0
---

# Purpose

This skill defines the project's styling standards.

All UI must be built using **`@pawhaven/design-system`** (`packages/design-system/`) as the single source of truth for design tokens, theme mappings, utility classes, and component patterns.

Visual reference spec: `packages/design-system/design-system.html`

---

# Design System Foundation

## Package: `@pawhaven/design-system`

The design system lives at `packages/design-system/` and provides everything needed for styling:

### Import in your app root

```ts
// CSS entry — tokens + theme + utilities + base styles
import '@pawhaven/design-system/styles.css';

// TypeScript token access
import {
  color,
  spacing,
  radius,
  shadow,
  duration,
  easing,
  typography,
  tokenVar,
  colorPrimitives,
} from '@pawhaven/design-system';

// Tokens are consumed via Tailwind utility classes and CSS variables.
```

### Package structure

```
packages/design-system/
├── design-system.html  # Visual reference spec (all tokens, typography, layouts)
├── index.css           # CSS entry (tailwindcss + tokens + theme + utilities + base)
└── src/
    ├── tokens.ts       # Typed token access (CSS var references + raw values)
    ├── theme.css       # Semantic token mappings (consumed by Tailwind)
    ├── theme.css       # Semantic token mappings (bg-primary, text-muted, etc.)
    ├── utilities.css   # Custom @utility classes (btn-primary, card, input-field, etc.)
    └── tokens/         # Primitive CSS @theme blocks
│   ├── color.css       # 7 color scales: gray, orange, green, red, yellow, blue, brown
│   ├── typography.css  # Fonts: Inter/Nunito (sans), Poppins (heading), Merriweather (serif)
│   ├── spacing.css     # Spacing scale + container widths
│   ├── radius.css      # xs → 3xl + full
│   ├── shadow.css      # xs → xl + shadow colors
│   ├── motion.css      # Duration (75ms → 1000ms) + easing curves
│   ├── breakpoint.css  # xs → 2xl
│   ├── border.css      # 0 → 8px
│   ├── opacity.css     # 0 → 100
│   ├── sizing.css      # Width/height primitives
│   └── z-index.css     # 0 → 50 + auto
```

---

# Core Principles

## 1. Design System First — Always use tokens from `@pawhaven/design-system`

Every visual value must come from the design system. Never introduce ad-hoc colors, spacing, or styles.

---

## 2. Semantic Colors

Use semantic tokens, never raw color values.

**Key rule**: every CSS variable defined in `theme.css` (e.g. `--color-surface-dark`) already has a corresponding Tailwind utility class (e.g. `bg-surface-dark`). Never write `var(--color-*)` directly — it is the equivalent of hardcoding, just wrapped in a CSS variable that bypasses the utility system.

❌ Bad — all of these are wrong for the same reason: they bypass the semantic utility layer:

```tsx
// Hardcoded color names
text - red - 500;
bg - blue - 600;
border - gray - 300;

// CSS variable bypass — use the utility class instead
bg - [var( --color-surface - dark )];     // → bg - surface - dark
text - [var( --color - text - inverse )]; // → text - text - inverse
style = {{ fontFamily: 'var(--font-heading)' }}; // → font-heading class
```

✅ Good — use the semantic tokens defined in `theme.css`:

```tsx
bg - primary; // --color-primary → orange-6
text - text; // --color-text → gray-9
text - text - secondary; // --color-text-secondary → gray-7
text - text - muted; // --color-text-muted → gray-5
text - text - inverse; // --color-text-inverse → gray-1
bg - background; // --color-background → brown-4
bg - surface; // --color-surface → gray-1
bg - muted; // --color-muted → brown-2
border - border; // --color-border → gray-5
border - border - focus; // --color-border-focus → primary
text - error; // --color-error → red-6
text - success; // --color-success → green-6
text - warning; // --color-warning → yellow-6
text - info; // --color-info → blue-6
```

Available semantic color tokens (from `theme.css`):

| Category        | Tokens                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand / Primary | `primary`, `primary-hover`, `primary-active`, `primary-light`, `primary-subtle`                                                                                                             |
| Secondary       | `secondary`, `secondary-hover`, `secondary-active`, `secondary-light`                                                                                                                       |
| Surfaces        | `surface`, `surface-elevated`, `surface-hover`, `surface-active`, `surface-dark`, `background`, `background-subtle`, `muted`, `muted-strong`                                                |
| Text            | `text`, `text-secondary`, `text-tertiary`, `text-muted`, `text-placeholder`, `text-inverse`, `text-link`                                                                                    |
| Borders         | `border`, `border-hover`, `border-strong`, `border-focus`, `border-error`                                                                                                                   |
| Status          | `error`, `error-light`, `success`, `success-light`, `warning`, `warning-light`, `info`, `info-light`                                                                                        |
| Rescue status   | `rescue-status-pending`, `rescue-status-inProgress`, `rescue-status-treated`, `rescue-status-recovering`, `rescue-status-awaitingAdoption`, `rescue-status-adopted`, `rescue-status-failed` |

---

## How to Pick the Right Utility Class

When you need any visual property (color, spacing, font, radius, shadow, etc.), follow this decision flow in order. **This single rule replaces all individual "don't do this" lists** — if you follow it, you will never hardcode, never use magic numbers, and never bypass the design system.

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

**Why this matters**: `bg-[var(--color-primary)]` fails at step 2 — the semantic token exists but you're bypassing it. `style={{ fontFamily: '...' }}` fails at step 2 — `font-heading` exists. `w-[317px]` fails at step 3 — it's not a valid spacing token. Every common mistake is a violation of this flow at some step.

---

## Token Structure & Ordering Rules (ENFORCED)

The `@theme {}` blocks in `src/tokens/*.css` follow strict structural rules.
**Every new or modified token MUST obey them.** Adding a token out of order or with the wrong unit is a violation.

### Rule 1: Numeric ascending order — ALWAYS

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

### Rule 2: Scale tokens FIRST, semantic tokens AFTER

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

Within the semantic group (AFTER scale tokens), sort by ascending value.

```css
✅ Correct                          ❌ Wrong
--font-size-subtitle: 0.9375rem;    --font-size-display: 4.25rem;  /* 4.25 should be last */
--font-size-stat: 1.75rem;          --font-size-stat: 1.75rem;
--font-size-display: 4.25rem;       --font-size-subtitle: 0.9375rem;
```

### Rule 4: Special keywords at the VERY END

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

### Rule 5: Color scale — 1 (lightest) to 10 (darkest)

Every color group follows `color-{name}-{1..10}`, ascending.

```css
--color-orange-1: #fff7ed;          /* lightest */
--color-orange-2: #ffedd5;
...
--color-orange-10: #7a2b08;        /* darkest */
```

Color groups: `gray`, `orange` (brand), `green` (secondary/success), `red` (error), `yellow` (warning), `blue` (info), `brown` (neutral warm).

### Rule 6: Font families — fixed logical order

Font families are NOT sorted numerically. Fixed order:

```css
--font-sans → --font-heading → --font-serif → --font-handwriting
```

### Rule 7: Motion easing — fixed logical order

```css
ease-in → ease-out → ease-in-out → ease-standard → ease-decelerate → ease-accelerate → ease-bounce
```

### Rule 8: Units — rem everywhere, ms for durations, px only for borders

| Token category   | Unit      | Example                      |
|------------------|-----------|------------------------------|
| Font sizes       | rem       | `--font-size-base: 1rem`     |
| Spacing / sizing | rem       | `--spacing-4: 1rem`          |
| Radius           | px        | `--radius-lg: 12px`          |
| Border width     | px        | `--border-width-1: 1px`      |
| Motion duration  | ms        | `--duration-200: 200ms`      |
| Line height      | unitless  | `--leading-normal: 1.5`      |
| Opacity          | unitless  | `--opacity-50: 0.5`          |
| Z-index          | unitless  | `--z-index-50: 50`           |
| Letter spacing   | em        | `--tracking-wide: 0.025em`   |

### Per-file reference

**`src/tokens/typography.css`** — `@theme` block: font families (logical order). Font sizes: `xs → 6xl` ascending, then semantic `subtitle → stat → display` ascending. Line heights: `none → loose` ascending, then semantic `display` at end. Letter spacing: `tighter → widest` ascending. Font weights: `normal → extrabold` ascending.

**`src/tokens/color.css`** — Groups: `gray, orange, green, red, yellow, blue, brown`. Each: `name-1 → name-10` ascending.

**`src/tokens/spacing.css`** — Spacing: `px, 0, 1, 2, 3, 4, 5, 6, 8, 10, 12` ascending. Container: `sm, md, lg, xl, 2xl` ascending.

**`src/tokens/radius.css`** — `xs → 3xl` ascending, then `full` (keyword at end).

**`src/tokens/shadow.css`** — Colors: `shadow-light → shadow-dark` ascending opacity, then `shadow-inner` at end. Shadows: `xs → xl` ascending, then `inner, none` at end.

**`src/tokens/motion.css`** — Duration: `75 → 1000` ascending. Easing: logical order.

**`src/tokens/border.css`** — `0 → 8` ascending.

**`src/tokens/breakpoint.css`** — `xs → 2xl` ascending.

**`src/tokens/opacity.css`** — `0 → 100` ascending.

**`src/tokens/sizing.css`** — `0 → 24` ascending, then `full, min, max, fit` keywords at end.

**`src/tokens/z-index.css`** — `0 → 50` ascending, then `auto` keyword at end.

### When adding a new token

1. Choose the correct `src/tokens/*.css` file
2. Place it in the correct position (scale before semantic, numeric ascending, keywords at end)
3. Use the correct unit per Rule 8
4. If semantic, also add mapping in `theme.css`
5. If exposed to TypeScript, add to `src/tokens.ts`

---

## 3. Custom Utility Classes

Use the custom utility classes from `utilities.css` whenever applicable. Do not re-create these patterns manually.

### Layout utilities

```tsx
flex - center; // display: flex; align-items: center; justify-content: center
flex - between; // display: flex; align-items: center; justify-content: space-between
flex - col - center; // vertical flex with centered content
```

### Button utilities

```tsx
btn - base; // Base button reset (inline-flex, centered, medium weight, transitions, focus-ring)
btn - primary; // Orange bg + white text (combine with btn-base)
btn - secondary; // Green bg + white text (combine with btn-base)
btn - outline; // Transparent bg + border (combine with btn-base)
button - reset; // Full button reset: appearance, bg, border, padding, font, cursor
button - rounded; // Rounded button with token-based padding
```

Example:

```tsx
<button className="btn-base btn-primary rounded-xl px-4 py-2">Save</button>
<button className="btn-base btn-outline rounded-xl px-4 py-2">Cancel</button>
```

### Surface utilities

```tsx
card; // White bg, border, shadow-sm, rounded-lg
```

### Form utilities

```tsx
input - field; // Full-width input with border, focus ring, transitions
form - error; // Error text below form inputs (sm, red)
```

### Link utilities

```tsx
link; // Semantic link: primary color, underline on hover, transitions
link - reset; // Remove link decoration + inherit color
```

### Accessibility utilities

```tsx
focus - ring; // focus-visible: 2px primary outline + light shadow ring
```

---

## 4. Typography — Use the defined font families

The design system defines four font families:

| Token              | Tailwind           | Family                               | Usage                         |
| ------------------ | ------------------ | ------------------------------------ | ----------------------------- |
| `font-heading`     | `font-heading`     | Poppins, Nunito, sans-serif          | Page headings, section titles |
| `font-sans`        | `font-sans`        | Inter, Nunito, system-ui, sans-serif | Body text, UI                 |
| `font-serif`       | `font-serif`       | Fraunces, Georgia, serif             | Editorial / display / stats   |
| `font-handwriting` | `font-handwriting` | Patrick Hand, cursive                | Handwritten accents           |

Available font sizes:

| Scale tokens (ascending) | Semantic tokens |
|--------------------------|-----------------|
| `text-xs` (0.75rem) | `text-subtitle` (0.9375rem) |
| `text-sm` (0.875rem) | `text-stat` (1.75rem) |
| `text-base` (1rem) | `text-display` (4.25rem) |
| `text-lg` (1.125rem) | |
| `text-xl` (1.25rem) | |
| `text-2xl` (1.5rem) | |
| `text-3xl` (1.875rem) | |
| `text-4xl` (2.25rem) | |
| `text-5xl` (3rem) | |
| `text-6xl` (3.75rem) | |

Available font weights: `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700), `font-extrabold` (800)

Available line heights: `leading-none` (1), `leading-tight` (1.25), `leading-snug` (1.375), `leading-normal` (1.5), `leading-relaxed` (1.625), `leading-loose` (2), `leading-display` (1.08)

❌ Avoid:

```tsx
text-[15px]
leading-[21px]
font-[550]
```

---

## 5. Spacing — Use the spacing scale

Primitive spacing scale from `src/tokens/spacing.css`:

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

❌ Avoid:

```tsx
mt-[17px]
w-[287px]
left-[43px]
h-[91px]
```

---

## 6. Border Radius — Use the radius scale

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

Semantic radius aliases: `radius-input` (sm), `radius-button` (md), `radius-card` (lg), `radius-dialog` (xl)

❌ Avoid:

```tsx
rounded-[11px]
rounded-[13px]
```

---

## 7. Shadows — Use the shadow tokens

| Token          | Value        | Usage               |
| -------------- | ------------ | ------------------- |
| `shadow-xs`    | 0 1px 2px    | Very subtle         |
| `shadow-sm`    | 0 1px 3px    | Cards default       |
| `shadow-md`    | 0 3px 6px    | Dropdowns           |
| `shadow-lg`    | 0 8px 20px   | Cards hover, modals |
| `shadow-xl`    | 0 12px 28px  | Toasts, elevated    |
| `shadow-inner` | inset shadow | Inner depth         |
| `shadow-none`  | none         | Reset               |

Semantic shadow aliases: `shadow-card` (sm), `shadow-dropdown` (md), `shadow-modal` (lg), `shadow-toast` (xl)

❌ Avoid custom box-shadow values.

---

## 8. Motion — Use duration + easing tokens

Available durations: `duration-75`, `duration-100`, `duration-150`, `duration-200`, `duration-300`, `duration-500`, `duration-700`, `duration-1000`

Available easings: `ease-standard`, `ease-in`, `ease-out`, `ease-in-out`, `ease-decelerate`, `ease-accelerate`, `ease-bounce`

✅ Good:

```tsx
transition-colors duration-150 ease-standard
transition-opacity duration-200 ease-out
```

❌ Avoid:

```tsx
duration-[375ms]
```

---

## 9. Z-Index — Use the z-index scale

Primitive scale: `z-0`, `z-10`, `z-20`, `z-30`, `z-40`, `z-50`, `z-auto`

Semantic aliases:
| Token | Value | Usage |
|-------|-------|-------|
| `z-base` | 1 | Default content |
| `z-dropdown` | 100 | Dropdowns, popovers |
| `z-sticky` | 200 | Sticky headers |
| `z-overlay` | 300 | Overlays, drawers |
| `z-modal` | 400 | Modals, dialogs |
| `z-notification` | 500 | Notifications |
| `z-toast` | 600 | Toasts (highest) |

❌ Avoid:

```tsx
z - [99];
z - [9999];
```

---

## 10. Breakpoints — Use defined breakpoint tokens

| Token | Width  |
| ----- | ------ |
| `xs`  | 360px  |
| `sm`  | 640px  |
| `md`  | 768px  |
| `lg`  | 1024px |
| `xl`  | 1280px |
| `2xl` | 1536px |

---

## 11. No Hardcoded Design Values

Never hardcode design values inside components.

❌ Avoid:

```tsx
className='w-[237px]'
className='text-[#3498db]'
className='rounded-[13px]'
style={{ marginTop: 37 }}
style={{ color: "#4285F4" }}
```

✅ Use design tokens instead:

```tsx
className = 'rounded-lg';
className = 'bg-primary';
className = 'text-muted';
className = 'p-4';
```

---

## 12. No Magic Numbers

❌ Avoid:

```tsx
mt-[17px]
w-[287px]
left-[43px]
h-[91px]
```

✅ Prefer the spacing scale:

```tsx
mt - 4;
w - full;
max - w - md;
h - 24;
```

If a value is reused across the application, promote it into the design system instead of hardcoding it.

---

## 12b. Units — Prefer `rem`, avoid `px`

`px` units are forbidden unless strictly necessary. The design system scale is `rem`-based so that spacing, typography, and layout respect the user's root font size and remain accessible. When a token does not exist and an arbitrary value is unavoidable, express it in `rem`, never `px`.

**Why**: `px` values ignore the user's browser font-size preference and break proportional scaling. `rem` scales with the root and keeps the UI accessible and consistent.

❌ Avoid — arbitrary `px`:

```tsx
w-[320px]
text-[15px]
mt-[12px]
gap-[10px]
style={{ width: 320 }}
style={{ marginTop: '12px' }}
```

✅ Prefer — design tokens first, then `rem` only if a token truly does not exist:

```tsx
w-full            // token/utility
text-base         // token
mt-4              // spacing scale (1rem)
w-[20rem]         // rem arbitrary value (only when no token fits)
style={{ width: '20rem' }}
```

**Rare, acceptable `px` exceptions** (px is allowed only when rem is technically wrong or produces sub-pixel artifacts):

- Hairline borders / dividers: `border`, `border-[1px]`, `1px` rules where `rem` would round inconsistently
- Fixed device-pixel assets that must not scale (e.g., a 1px focus ring, retina line art)
- Third-party overrides that only accept `px`

When you use a `px` exception, keep it minimal and localized. Everything else must be a token or `rem`.

---

## 13. Hover Effects — Use the defined patterns

| Element              | Effect                             | Tailwind                                      |
| -------------------- | ---------------------------------- | --------------------------------------------- |
| Cards                | 2px lift + larger shadow           | `-translate-y-1 shadow-lg`                    |
| Card images          | 5% zoom over 500ms                 | `scale-105 transition-transform duration-500` |
| Nav items (inactive) | bg → muted, text → foreground      | `hover:bg-muted hover:text-text`              |
| Buttons              | 10% opacity reduction or underline | `hover:opacity-90` / `hover:underline`        |
| Logo                 | 5% scale on parent hover           | `group-hover:scale-105 transition-transform`  |

---

## 14. Icons — Use Lucide with consistent sizing

All icons come from the [Lucide](https://lucide.dev) library. Render as inline SVGs with:

- `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`
- `stroke-linecap="round"`, `stroke-linejoin="round"`
- `viewBox="0 0 24 24"`

Icon sizes by context:
| Context | Tailwind |
|---------|----------|
| Nav icons | `w-4 h-4` |
| Card meta icons (location, time) | `w-3.5 h-3.5` |
| Badge icons (urgent) | `w-3 h-3` |
| Mobile menu / Hero button | `w-5 h-5` |

Icons should use `currentColor` and inherit text color. Avoid manually styling every icon.

---

## 15. Utility First

Prefer Tailwind utilities over custom CSS.

✅ Good:

```tsx
<div className="flex items-center gap-4 rounded-lg border bg-surface p-6">
```

❌ Bad — avoid creating CSS classes for simple layouts:

```css
.card {
  display: flex;
  padding: 24px;
}
```

---

## 16. Responsive by Default

Every layout should work across supported screen sizes. Use responsive utilities:

```tsx
grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3
```

Avoid fixed widths whenever possible.

---

## 17. Build Flexible Layouts

Prefer Flexbox, Grid, gap, max-width, min-width, auto sizing.

Avoid pixel-perfect positioning:

```tsx
left-[183px]
top-[42px]
```

Prefer natural document flow.

---

## 18. Dark Mode — Use semantic tokens

Never hardcode light mode colors. Always rely on semantic tokens that support both themes:

```tsx
bg - background; // adapts to theme
text - text; // adapts to theme
border - border; // adapts to theme
```

---

## 19. State Styles

Interactive states should always exist. Include appropriate styles for:

- Hover, Focus, Active, Disabled, Loading, Selected

Use consistent design tokens.

---

## 20. Animations

Prefer design system animations.

✅ Good:

```tsx
transition-colors duration-200 ease-standard
transition-opacity duration-150
```

---

## 21. Class Composition — Use `cn()`

Use a class composition utility (for example `cn()`):

✅ Good:

```tsx
className={cn(
  "rounded-lg bg-surface",
  isActive && "border-primary",
  className
)}
```

Avoid manual string concatenation.

---

## 22. Custom CSS

Only write custom CSS when Tailwind cannot express the desired behavior.

Before creating CSS ask:

- Can this be solved with Tailwind?
- Can this become a reusable component?
- Can this become a design token in `@pawhaven/design-system`?

---

## 23. Inline Styles

❌ Avoid — all static visual values belong in utility classes (see decision flow above):

```tsx
style={{ width: 320 }}
style={{ fontFamily: 'var(--font-heading)' }}
style={{ color: '#4285F4' }}
```

✅ Good — inline only for truly dynamic values computed at runtime:

```tsx
style={{ '--progress': `${progress}%` } as React.CSSProperties}
```

---

## 24. TypeScript Token Access

For JS-driven styling (inline styles, canvas, charts), use the typed TS tokens:

```ts
import {
  color,
  spacing,
  radius,
  shadow,
  duration,
  easing,
  typography,
  tokenVar,
  colorPrimitives,
} from '@pawhaven/design-system';

// CSS variable references — use in inline styles, charts, etc.
const style = { color: color.primary, padding: spacing.card };

// Type-safe tokenVar helper
const primaryVar = tokenVar('color.primary'); // → 'var(--color-primary)'

// Raw color primitives (for canvas, charts, etc.)
const primaryColor = colorPrimitives.orange[6]; // → '#f7823a'

// Semantic reference
const bgColor = color.background; // → 'var(--color-background)'
const textColor = color.text; // → 'var(--color-text)'
const cardRadius = radius.card; // → 'var(--radius-card)'
const cardShadow = shadow.card; // → 'var(--shadow-card)'
const fastEase = easing.standard; // → 'var(--ease-standard)'
const baseDuration = duration.base; // → 'var(--duration-200)'
const headingFont = typography.fontHeading; // → 'var(--font-heading)'
```

---

## 25. Component Styling

All React components are built with shadcn/ui (Radix UI primitives + Tailwind design tokens). They consume the shared design tokens automatically via Tailwind utility classes and CSS variables — no separate theme provider is required.

```tsx
import { Button } from '@pawhaven/ui';

function Example() {
  return (
    <Button variant="primary" className="bg-primary text-primary">
      {/* shadcn/ui components already share the same tokens as Tailwind */}
    </Button>
  );
}
```

Changing a token in `src/tokens/color.css` updates both Tailwind and all components automatically.

---

## 26. Adding New Tokens

If a new visual value is truly needed and is not already in the design system:

1. Add it to the appropriate `src/tokens/*.css` file
2. If it's a semantic mapping, add it to `theme.css`
3. Add the corresponding TS reference in `src/tokens.ts`
4. Re-export from `src/index.ts` if needed
5. Update `design-system.html` as the visual reference

Never add ad-hoc values directly in components.

---

# Code Review Checklist

Before completing a feature verify:

- [ ] `@pawhaven/design-system` is imported (`styles.css` in root)
- [ ] Follows the "How to Pick the Right Utility Class" decision flow
- [ ] No hardcoded colors — semantic tokens used (`bg-primary`, `text-text`, etc.)
- [ ] No `var(--color-*)` bypass — every CSS variable reference uses its utility class
- [ ] No hardcoded spacing — spacing scale used (`p-4`, `gap-2`, etc.)
- [ ] No hardcoded typography — font tokens used as classes (`font-heading`, `text-xl`)
- [ ] No magic numbers — no `w-[317px]`, `mt-[13px]`, etc.
- [ ] No `px` units — arbitrary values use `rem` (`w-[20rem]`), not `px`; `px` only for justified exceptions (hairline borders, non-scaling assets)
- [ ] No arbitrary Tailwind values — no `text-[#xxx]`, `rounded-[Npx]`
- [ ] No arbitrary z-index values — use semantic z-scale
- [ ] Custom utilities used where applicable (`btn-primary`, `card`, `input-field`, `flex-center`, etc.)
- [ ] No inline styling (unless truly dynamic)
- [ ] Icon-only links/buttons have an `aria-label` for accessibility
- [ ] Responsive layout is supported
- [ ] Design tokens are used
- [ ] Semantic colors are used
- [ ] Uses `cn()` for class composition
- [ ] Interactive states are implemented (hover, focus, active, disabled)
- [ ] Dark mode is supported via semantic tokens
- [ ] Tailwind utilities are preferred over custom CSS
- [ ] MUI components use `MUITheme` from `@pawhaven/design-system/theme`
- [ ] Icons use Lucide with consistent sizing and `currentColor`

---

# Common Mistakes

Avoid:

- `text-[#123456]` — hardcoded hex
- `bg-[var(--color-*)]` / `text-[var(--color-*)]` — CSS variable bypass, use the semantic utility class
- `style={{ fontFamily }}` / `style={{ color }}` / `style={{ width }}` — static values in inline styles
- `w-[317px]` — magic number (and uses `px`; if truly needed, use `rem`)
- `mt-[13px]` — magic number (and uses `px`; if truly needed, use `rem`)
- `rounded-[9px]` — magic number (and uses `px`; if truly needed, use `rem`)
- `text-[15px]` / `w-[20px]` — `px` units are forbidden unless a justified exception; use tokens or `rem`
- `style={{ ... }}` — inline styles for static values
- Pixel-perfect positioning
- Random spacing values
- Random z-index values
- Component-specific colors
- Duplicate visual styles
- Creating new design patterns without updating `@pawhaven/design-system`
- Re-creating utility classes that already exist in `utilities.css`
- Using raw Tailwind color names (`text-orange-500`) instead of semantic tokens (`text-primary`)

**If unsure, follow the decision flow in "How to Pick the Right Utility Class" above.**

---

# Definition of Done

A component satisfies this skill only if:

- It imports and uses `@pawhaven/design-system` as its design foundation
- All styles are implemented with Tailwind utilities where possible
- Custom utilities from `utilities.css` are reused where applicable
- No hardcoded visual values exist
- No magic numbers are introduced
- No `px` units are used except for justified exceptions (hairline borders, non-scaling assets); all other arbitrary values use `rem`
- Semantic design tokens are used for all colors, spacing, typography, radius, shadows
- The layout is responsive across defined breakpoints
- Dark mode is supported via semantic tokens
- Interactive states are handled consistently
- The component remains visually consistent with the rest of the application

## Related

- Best practices: [references/best-practices.md](references/best-practices.md)
- Styling violations detection: [style-doctor](../../code-review/style-doctor/SKILL.MD)
- Components: [component](../component/SKILL.MD)
