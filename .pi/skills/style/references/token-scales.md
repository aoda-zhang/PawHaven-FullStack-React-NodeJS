# Token scales — lookup tables

Every value here is a closed set. Pick from the table; do not interpolate between entries.

## Contents

- [Semantic color tokens](#semantic-color-tokens)
- [Semantic → primitive mapping](#semantic--primitive-mapping)
- [Typography](#typography)
- [Spacing](#spacing)
- [Radius](#radius)
- [Shadow](#shadow)
- [Motion](#motion)
- [Z-index](#z-index)
- [Breakpoints](#breakpoints)

## Semantic color tokens

Defined in `src/theme.css`; each one already has a matching Tailwind utility class.

| Category        | Tokens                                                                                                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand / Primary | `primary`, `primary-hover`, `primary-active`, `primary-light`, `primary-subtle`                                                                                                             |
| Secondary       | `secondary`, `secondary-hover`, `secondary-active`, `secondary-light`                                                                                                                       |
| Surfaces        | `surface`, `surface-elevated`, `surface-hover`, `surface-active`, `surface-dark`, `background`, `background-subtle`, `muted`, `muted-strong`                                                |
| Text            | `text`, `text-secondary`, `text-tertiary`, `text-muted`, `text-placeholder`, `text-inverse`, `text-link`                                                                                    |
| Borders         | `border`, `border-hover`, `border-strong`, `border-focus`, `border-error`                                                                                                                   |
| Status          | `error`, `error-light`, `success`, `success-light`, `warning`, `warning-light`, `info`, `info-light`                                                                                        |
| Rescue status   | `rescue-status-pending`, `rescue-status-inProgress`, `rescue-status-treated`, `rescue-status-recovering`, `rescue-status-awaitingAdoption`, `rescue-status-adopted`, `rescue-status-failed` |

## Semantic → primitive mapping

Where a semantic token resolves to a primitive palette entry:

| Utility class         | Token                    | Primitive  |
| --------------------- | ------------------------ | ---------- |
| `bg-primary`          | `--color-primary`        | `orange-6` |
| `text-text`           | `--color-text`           | `gray-9`   |
| `text-text-secondary` | `--color-text-secondary` | `gray-7`   |
| `text-text-muted`     | `--color-text-muted`     | `gray-5`   |
| `text-text-inverse`   | `--color-text-inverse`   | `gray-1`   |
| `bg-background`       | `--color-background`     | `brown-4`  |
| `bg-surface`          | `--color-surface`        | `gray-1`   |
| `bg-muted`            | `--color-muted`          | `brown-2`  |
| `border-border`       | `--color-border`         | `gray-5`   |
| `border-border-focus` | `--color-border-focus`   | `primary`  |
| `text-error`          | `--color-error`          | `red-6`    |
| `text-success`        | `--color-success`        | `green-6`  |
| `text-warning`        | `--color-warning`        | `yellow-6` |
| `text-info`           | `--color-info`           | `blue-6`   |

## Typography

Family stacks. The role each family plays — headings, body, editorial, accents — is decided in
`SKILL.md`; this table is only what each one resolves to.

| Token              | Tailwind           | Family                               |
| ------------------ | ------------------ | ------------------------------------ |
| `font-heading`     | `font-heading`     | Poppins, Nunito, sans-serif          |
| `font-sans`        | `font-sans`        | Inter, Nunito, system-ui, sans-serif |
| `font-serif`       | `font-serif`       | Fraunces, Georgia, serif             |
| `font-handwriting` | `font-handwriting` | Patrick Hand, cursive                |

Font sizes:

| Scale tokens (ascending) | Semantic tokens             |
| ------------------------ | --------------------------- |
| `text-xs` (0.75rem)      | `text-subtitle` (0.9375rem) |
| `text-sm` (0.875rem)     | `text-stat` (1.75rem)       |
| `text-base` (1rem)       | `text-display` (4.25rem)    |
| `text-lg` (1.125rem)     |                             |
| `text-xl` (1.25rem)      |                             |
| `text-2xl` (1.5rem)      |                             |
| `text-3xl` (1.875rem)    |                             |
| `text-4xl` (2.25rem)     |                             |
| `text-5xl` (3rem)        |                             |
| `text-6xl` (3.75rem)     |                             |

Font weights: `font-normal` (400), `font-medium` (500), `font-semibold` (600), `font-bold` (700),
`font-extrabold` (800)

Line heights: `leading-none` (1), `leading-tight` (1.25), `leading-snug` (1.375), `leading-normal`
(1.5), `leading-relaxed` (1.625), `leading-loose` (2), `leading-display` (1.08)

## Spacing

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

## Radius

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

## Shadow

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

## Motion

Durations: `duration-75`, `duration-100`, `duration-150`, `duration-200`, `duration-300`,
`duration-500`, `duration-700`, `duration-1000`

Easings: `ease-standard`, `ease-in`, `ease-out`, `ease-in-out`, `ease-decelerate`,
`ease-accelerate`, `ease-bounce`

## Z-index

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

## Breakpoints

| Token | Width  |
| ----- | ------ |
| `xs`  | 360px  |
| `sm`  | 640px  |
| `md`  | 768px  |
| `lg`  | 1024px |
| `xl`  | 1280px |
| `2xl` | 1536px |
