# Token ordering and units

The `@theme {}` blocks in `src/tokens/*.css` follow strict structural rules. Every new or modified
token must obey them: a token in the wrong position or with the wrong unit is a violation even when
its value is right, because the ordering is what makes the scale readable at a glance.

## Contents

- [Rule 1: Numeric ascending order](#rule-1-numeric-ascending-order)
- [Rule 2: Scale tokens first, semantic after](#rule-2-scale-tokens-first-semantic-after)
- [Rule 3: Semantic tokens also sorted ascending](#rule-3-semantic-tokens-also-sorted-ascending)
- [Rule 4: Special keywords at the very end](#rule-4-special-keywords-at-the-very-end)
- [Rule 5: Color scale 1 (lightest) to 10 (darkest)](#rule-5-color-scale-1-lightest-to-10-darkest)
- [Rule 6: Font families in fixed logical order](#rule-6-font-families-in-fixed-logical-order)
- [Rule 7: Motion easing in fixed logical order](#rule-7-motion-easing-in-fixed-logical-order)
- [Rule 8: Units per token category](#rule-8-units-per-token-category)
- [Per-file order map](#per-file-order-map)
- [Placement checklist](#placement-checklist)

## Rule 1: Numeric ascending order

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

## Rule 2: Scale tokens first, semantic after

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

## Rule 3: Semantic tokens also sorted ascending

Within the semantic group (after scale tokens), sort by ascending value.

```css
✅ Correct                          ❌ Wrong
--font-size-subtitle: 0.9375rem;    --font-size-display: 4.25rem;  /* 4.25 should be last */
--font-size-stat: 1.75rem;          --font-size-stat: 1.75rem;
--font-size-display: 4.25rem;       --font-size-subtitle: 0.9375rem;
```

## Rule 4: Special keywords at the very end

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

## Rule 5: Color scale 1 (lightest) to 10 (darkest)

Every color group follows `color-{name}-{1..10}`, ascending.

```css
--color-orange-1: #fff7ed;          /* lightest */
--color-orange-2: #ffedd5;
...
--color-orange-10: #7a2b08;        /* darkest */
```

Color groups: `gray`, `orange` (brand), `green` (secondary/success), `red` (error), `yellow`
(warning), `blue` (info), `brown` (neutral warm).

## Rule 6: Font families in fixed logical order

Font families are not sorted numerically. Fixed order:

```css
--font-sans → --font-heading → --font-serif → --font-handwriting
```

## Rule 7: Motion easing in fixed logical order

```css
ease-in → ease-out → ease-in-out → ease-standard → ease-decelerate → ease-accelerate → ease-bounce
```

## Rule 8: Units per token category

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

## Per-file order map

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

## Placement checklist

For the file that is touched, before the edit is finished:

1. Place the token in the correct position — scale before semantic, numeric ascending, keywords at
   the end
2. Use the correct unit for its category (Rule 8)
