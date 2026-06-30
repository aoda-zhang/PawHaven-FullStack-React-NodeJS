# Changelog

All notable changes to `@pawhaven/design-system` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — Unreleased

### Added
- TypeScript token access via `@pawhaven/design-system` and `@pawhaven/design-system/tokens`
- Dark mode support (`.dark` class + `prefers-color-scheme` auto-detection)
- `useColorScheme` hook for programmatic theme toggling
- New token groups: breakpoint, opacity, sizing, z-index primitives
- `focus-ring` utility for accessible focus indicators
- MUI theme component overrides (Card, Paper, OutlinedInput, Dialog, Alert, Chip, Tooltip, AppBar, Link)

### Changed
- **Breaking:** Merged `green` and `green-success` color scales into single `green` scale (using `green-success` values)
- **Breaking:** `MUI-theme.js` renamed to `MUI-theme.ts` — import path changed to `@pawhaven/design-system/theme`
- **Breaking:** CSS import path changed from `@pawhaven/design-system/index.css` to `@pawhaven/design-system/styles.css`
- MUI theme now derives all palette values from CSS variables (single source of truth)
- Spacing aliases now reference primitive tokens instead of raw rem values
- Shadow color primitives moved from `tokens/color.css` to `tokens/shadow.css`

### Fixed
- Removed undefined token references in `tokens/border.css` (`--color-neutral-*`, `--color-brand-*`, `--color-error-500`)
- Eliminated duplicate spacing/border definitions between `tokens/` and `theme.css`
- Fixed `MUI-theme.js` hardcoded `background.default: '#eee3d8'` drift — now reads correct `--color-brown-3`

### Removed
- `text-balance`, `text-pretty`, `visually-hidden` utilities (use Tailwind v4 built-ins)
- `green-success` color scale (merged into `green`)
- `MUI-theme.js` (replaced by `MUI-theme.ts`)

### Security
- Added `prefers-reduced-motion` support (WCAG 2.2 SC 2.3.3)
- Added `:focus-visible` focus indicators to buttons and inputs (WCAG 2.4.7)

## [1.0.0] — Initial

### Added
- CSS design tokens: color, typography, spacing, border, radius, shadow, motion
- Semantic theme layer (`theme.css`)
- Custom utilities: flex-center, flex-between, flex-col-center, text-balance, text-pretty, link, btn-base, btn-primary, btn-secondary, btn-outline, card, input-field, form-error, link-reset, button-reset, visually-hidden, button-rounded
- MUI v7 theme object
