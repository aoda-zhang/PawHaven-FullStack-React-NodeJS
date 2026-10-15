# @pawhaven/design-system

Shared design tokens, theme, and utilities for the PawHaven monorepo.

## When to use semantic vs primitive

| Category                | Use             | Example                                              |
| ----------------------- | --------------- | ---------------------------------------------------- |
| **Color**               | Semantic only   | `bg-primary`, `text-text-secondary`, `border-border` |
| **Typography role**     | Semantic only   | `text-text`, `text-text-link`, `font-heading`        |
| **Shadow**              | Semantic only   | `shadow-card`, `shadow-dropdown`                     |
| **Radius**              | Prefer semantic | `rounded-card`, `rounded-input`, `rounded-button`    |
| **Spacing / layout**    | Primitive OK    | `pt-2`, `gap-3`, `w-full`, `flex-col`                |
| **Sizing**              | Primitive OK    | `h-8`, `size-4`, `min-h-[44px]`                      |
| **Responsive / states** | Primitive OK    | `md:flex`, `hover:opacity-90`, `focus:ring`          |

> Rule of thumb: **design decisions** (color, type role, shadow depth, radius scale) → semantic. **Structural/layout** (space, size, breakpoint, interaction) → primitive.

## Install

```ts
// apps/frontend/portal/src/providers/AppProvider.tsx
import '@pawhaven/design-system/index.css';
```

## Usage

All classnames reference **semantic tokens** from `theme.css`. Never use raw primitives (`--color-gray-6`) directly in components.

```html
<div class="bg-primary text-text-inverse shadow-card rounded-xl">
  <h1 class="font-heading text-text text-3xl">Hello PawHaven</h1>
  <button class="btn-primary btn-base rounded-xl px-4 py-2">Get Started</button>
  <input class="input-field" placeholder="Search..." />
</div>
```

### Semantic color utilities

| Class                         | Token                    | Usage                         |
| ----------------------------- | ------------------------ | ----------------------------- |
| `bg-primary`                  | `--color-primary`        | Primary actions, brand        |
| `bg-secondary`                | `--color-secondary`      | Secondary actions, success    |
| `bg-card`                     | `--color-card`           | Card surfaces                 |
| `bg-background`               | `--color-background`     | Page background               |
| `text-text`                   | `--color-text`           | Body text                     |
| `text-text-secondary`         | `--color-text-secondary` | Subtle text                   |
| `text-text-inverse`           | `--color-text-inverse`   | Text on dark/primary surfaces |
| `text-text-link`              | `--color-text-link`      | Links                         |
| `border-border`               | `--color-border`         | Card borders, dividers        |
| `bg-error` / `text-error`     | `--color-error`          | Error states                  |
| `bg-success` / `text-success` | `--color-success`        | Success states                |
| `bg-warning` / `text-warning` | `--color-warning`        | Warning states                |
| `bg-info` / `text-info`       | `--color-info`           | Info states                   |

### Status colors

Use `getStatusColorByPrefix` util — never hard-code status colors.

```ts
import { getStatusColorByPrefix } from '@/utils/getStatusColorByPrefix';
const dotClass = getStatusColorByPrefix({
  status: animal.status,
  prefix: 'bg',
});
```

### Spacing, radius, shadow

| Class                                       | Token           |
| ------------------------------------------- | --------------- |
| `px-4` / `py-2` / `gap-3`                   | `--spacing-*`   |
| `rounded-xl` / `rounded-lg`                 | `--radius-*`    |
| `shadow-card` / `shadow-dropdown`           | `--shadow-*`    |
| `text-3xl` / `text-6xl`                     | `--font-size-*` |
| `font-heading` / `font-sans` / `font-serif` | `--font-*`      |

### Composite utilities

| Utility                                            | Description                                                 |
| -------------------------------------------------- | ----------------------------------------------------------- |
| `btn-primary` / `btn-secondary` / `btn-outline`    | Button variants                                             |
| `btn-base`                                         | Base button reset                                           |
| `card`                                             | Card surface (bg + border + shadow + rounded)               |
| `input-field`                                      | Full-width form input with focus ring                       |
| `form-error`                                       | Error text below form inputs                                |
| `link` / `link-reset`                              | Semantic link styling                                       |
| `flex-center` / `flex-between` / `flex-col-center` | Flex layouts                                                |
| `focus-ring`                                       | Accessible focus-visible outline                            |
| `text-hero` / `text-stat`                          | Composite typography (size + family + weight + line-height) |

## Token source

Semantic tokens: `src/theme.css`
Primitive tokens: `src/tokens/*.css`
Composite utilities: `src/utilities.css`

## Checks

```bash
pnpm --filter @pawhaven/design-system token-check       # raw hex / px / unknown classname
```
