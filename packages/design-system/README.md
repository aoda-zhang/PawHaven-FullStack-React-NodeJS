# @pawhaven/design-system

Shared design tokens, theme, and utilities for the PawHaven monorepo.

## When to use semantic vs primitive

| Category                | Use             | Example                                              |
| ----------------------- | --------------- | ---------------------------------------------------- |
| **Color**               | Semantic only   | `bg-primary`, `text-text-secondary`, `border-border` |
| **Typography role**     | Semantic only   | `type-page-title`, `type-section-title`, `type-body` |
| **Shadow**              | Semantic only   | `shadow-card`, `shadow-dropdown`                     |
| **Radius**              | Semantic roles  | `rounded-card`, `rounded-panel`, `rounded-button`, `rounded-input`, `rounded-icon`, `rounded-media` |
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
<div class="bg-card text-text shadow-card rounded-card">
  <h1 class="type-page-title text-text">Hello PawHaven</h1>
  <p class="type-body">Rescue animals and connect with your community.</p>
  <button class="bg-primary text-primary-fg rounded-button px-4 py-2">
    Get Started
  </button>
  <input
    class="border-border bg-background rounded-input border px-3 py-2"
    placeholder="Search..."
  />
</div>
```

### Semantic color utilities

| Class                         | Token                    | Usage                         |
| ----------------------------- | ------------------------ | ----------------------------- |
| `bg-primary`                  | `--color-primary`        | Primary actions, brand        |
| `bg-secondary`                | `--color-secondary`      | Secondary actions    |
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

Use the `getRescueStatusColor` util — never hard-code status colors.

```ts
import { getRescueStatusColor } from '@/shared/utils/rescueStatus/getRescueStatusColor';
const dotClass = getRescueStatusColor({
  status: animal.status,
  prefix: 'bg',
});
```

### Spacing, radius, shadow

| Class                                       | Token           |
| ------------------------------------------- | --------------- |
| `px-4` / `py-2` / `gap-3`                   | `--spacing-*`   |
| `rounded-button` / `rounded-card` / `rounded-panel` / `rounded-input` / `rounded-icon` / `rounded-media` | `--radius-*` |
| `shadow-card` / `shadow-dropdown`           | `--shadow-*`    |
| `text-3xl` / `text-6xl`                     | `--font-size-*` |
| `font-heading` / `font-sans` / `font-serif` | `--font-*`      |

### Composite utilities

| Utility                   | Description                                                 |
| ------------------------- | ----------------------------------------------------------- |
| `focus-ring`              | Accessible focus-visible outline                            |
| `type-*` / `text-hero` / `stat-text` | Semantic/composite typography roles |
| `full-width`              | Full-bleed container                                        |
| `baseFormContainer`       | The label/control/error stack the form controls render into |

## Token source

Semantic tokens: `src/theme.css`
Primitive tokens: `src/tokens/*.css`
Composite utilities: `src/utilities.css`

## Checks

```bash
pnpm --filter @pawhaven/design-system token-check       # raw hex / px / unknown classname
```


## Semantic token rules

- Use action tokens for interaction intent and status tokens for feedback intent. They may resolve to the same primitive colour today, but are separate contracts.
- Prefer semantic typography utilities (`type-page-title`, `type-section-title`, `type-body`, `type-body-secondary`, `type-label`, `type-caption`) for recurring text roles.
- Spacing primitives are intentionally backward-compatible. Do not renumber or change their values without auditing existing Tailwind classes and migrating affected layouts.
- The document-service PDF stylesheet imports the shared token sources during prebuild. Keep its source styles token-based; the token-check script scans the PDF engine entry stylesheet.
- See [Design Token Guidelines](../../docs/design-system/design-token-guidelines.md) for Figma naming, intent, and handoff rules.
