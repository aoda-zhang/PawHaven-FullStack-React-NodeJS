# @pawhaven/design-system

Shared design tokens, theme, utilities, and MUI theme for the PawHaven monorepo. Provides the single source of truth for all visual primitives used across `apps/frontend/*`, `packages/ui`, and `packages/frontend-core`.

## Quick Start

```ts
// CSS entry — imports tokens, theme, utilities, and base styles
import '@pawhaven/design-system/styles.css';

// TypeScript token access
import { color, spacing, radius, tokenVar } from '@pawhaven/design-system';

// MUI theme (MUI v7, cssVariables mode)
import { MUITheme } from '@pawhaven/design-system/theme';
```

## Package Structure

```
packages/design-system/
├── index.css           # CSS entry point (tailwindcss + tokens + theme + utilities + base styles)
├── src/                # TypeScript + CSS source
│   ├── index.ts        # JS/TS entry point
│   ├── MUI-theme.ts    # MUI v7 theme (derives from CSS variables)
│   ├── tokens.ts       # Typed token access (CSS var references + raw values)
│   ├── theme.css       # Semantic token mappings (bg-primary, text-muted, etc.)
│   ├── utilities.css   # Custom Tailwind @utility classes (btn-primary, card, etc.)
│   └── tokens/         # Primitive design tokens (CSS @theme blocks)
│       ├── index.css   # Barrel import
│       ├── color.css   # Color scales (gray, orange, green, red, yellow, blue, brown)
│       ├── typography.css  # Font families, sizes, weights, line heights, letter spacing
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

// CSS variable references — use in inline styles, MUI overrides, etc.
const style = { color: color.primary, padding: spacing.card };

// Type-safe tokenVar helper
const primaryVar = tokenVar('color.primary'); // → 'var(--color-primary)'

// Raw color primitives (for canvas, charts, etc.)
import { colorPrimitives } from '@pawhaven/design-system';
const orange500 = colorPrimitives.orange[5]; // → '#fb923c'
```

### MUI Theme

```tsx
import { ThemeProvider } from '@mui/material/styles';
import { MUITheme } from '@pawhaven/design-system/theme';

function App() {
  return (
    <ThemeProvider theme={MUITheme}>
      {/* MUI components now share the same tokens as Tailwind */}
    </ThemeProvider>
  );
}
```

The MUI theme reads CSS variables at runtime, so changing a token in `src/tokens/color.css` updates both Tailwind and MUI automatically.

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

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `--color-orange-6` | Primary actions, brand |
| `--color-secondary` | `--color-green-6` | Secondary actions |
| `--color-surface` | `--color-gray-1` | Card/paper backgrounds |
| `--color-background` | `--color-brown-4` | Page background |
| `--color-text` | `--color-gray-9` | Body text |
| `--color-text-secondary` | `--color-gray-7` | Subtle text |
| `--color-error` | `--color-red-6` | Error states |
| `--color-success` | `--color-green-6` | Success states |
| `--color-warning` | `--color-yellow-6` | Warning states |
| `--color-info` | `--color-blue-6` | Info states |

## Scripts

```bash
# Type-check the TypeScript source
pnpm --filter @pawhaven/design-system typecheck
```
