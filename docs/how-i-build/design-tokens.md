# Design Tokens: why I built one, and how

> This document covers the **why** and the **how**. What the tokens are and what each one is
> called lives in the
> [design-system README](../../packages/design-system/README.md) — not here.

## Why I need one

Without design tokens, every page is another small decision: grey `#737373` or `#6b7280`? Spacing
12 or 16? Radius 8 or 12? Those decisions end up scattered across dozens of files, and **nothing
records them**.

Three things follow from that:

1. **Nothing can be changed globally.** Swapping the brand orange means searching the codebase for
   hex values.
2. **Drift is invisible.** Two greys that look identical are one shade apart. Code review does not
   catch it, and the page does not make it obvious.
3. **Everyone invents their own.** "Secondary text" means one thing to a new contributor and another
   to an experienced one, so the same product ships two greys.

A design system fixes this by **collecting the visual decisions in one place and letting the code
reference the meaning rather than the number.**

```css
/* before — the component hardcodes a value, so changing it means changing a hundred files */
<span className="text-[#737373] text-xs">Reported on 2026-10-16</span>

/* after — the component references a meaning, the value lives only in the token layer */
<span className="text-text-secondary text-xs">Reported on 2026-10-16</span>
```

## How I built it

Tailwind v4 is **CSS-first** — there is no `tailwind.config.js`, the configuration _is_ the CSS. So
the token layer is `packages/design-system/src/tokens/` plus `src/theme.css`.

### Two layers, one sentence to tell them apart

| Layer                     | Where              | Holds                                                                                                      | Who reads it                       |
| ------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| **Primitive** (raw value) | `src/tokens/*.css` | Pure scales with **no meaning**: `--color-gray-6`, `--spacing-4`, `--radius-lg`                            | Only the semantic layer            |
| **Semantic** (meaning)    | `src/theme.css`    | Maps onto primitives and **carries meaning**: `--color-error`, `--color-text-secondary`, `--color-primary` | Components, pages, the lint plugin |

The rule is a single line: **components may only use semantic tokens; primitives must never leak
into product code.** "When to use semantic vs primitive" is covered in
[design-system README § When to use semantic vs primitive](../../packages/design-system/README.md).

The semantic layer is mapping for colour, spacing and radius; z-index is the exception — its
`--z-index-*` values are declared directly in `theme.css`. Re-skinning or changing the brand colour
still happens in one place:

```css
/* packages/design-system/src/theme.css */
--color-error: var(
  --color-red-6
); /* the decision about the value lives in the primitive layer */
```

### One decision that does the heavy lifting: delete Tailwind's default palette

Tailwind ships a whole palette of its own — `bg-red-500`, `text-gray-100` and thousands more. As
long as those exist, anyone can reach for one, and **the design system is decorative**. So the
first line of the primitive layer:

```css
/* packages/design-system/src/tokens/color.css */
@theme {
  --color-*: initial;   /* Tailwind's default palette is removed as a whole */
  --color-gray-1: #ffffff;
  ...
}
```

From that point `bg-red-500` **does not generate CSS at all** — not "is checked and rejected",
simply does not exist.

### Every app uses the same one

The Portal and the component library both take their styles from that single place; neither
imports Tailwind on its own:

```css
/* apps/frontend/portal/src/app/index.css */
@import '@pawhaven/design-system/index.css';

/* packages/ui/index.css */
@import '@pawhaven/design-system/index.css';
```

One change to the tokens, every application moves with it.

## How quality is enforced

Three layers, from the most structural to the most explicit.

### 1. CSS — a token that does not exist produces no class

This is the hardest layer, and it **needs no checking tool at all**. `bg-primry` (a typo) has no
rule in the output, so the style is simply missing — visible at a glance. Tailwind v4's `@theme` is
effectively a type system: a wrong token name surfaces at build time.

### 2. ESLint plugin — a colour must come from a token

`@pawhaven/eslint-plugin-design-colors` (source:
[libs/eslint-config/plugin/design-colors/](../../libs/eslint-config/plugin/design-colors/README.md))
provides two rules:

| Rule               | What it rejects                                                                       |
| ------------------ | ------------------------------------------------------------------------------------- |
| `no-raw-color`     | Hex, `rgb()`, `hsl()`, `oklch()` — in a class name or in a `style={{}}` object        |
| `no-unknown-color` | A colour that is not one of our tokens (Tailwind's default palette, a mistyped token) |

**The key design choice**: the plugin reads the **design-system CSS directly at lint time** to
build the list of valid tokens (configured under `settings['design-colors']`). The CSS stays the
single source of truth — add a token and the plugin knows about it immediately, with no list to
update in JavaScript.

### 3. CLI and CI

| Command            | What it checks                                                                                                                                                              |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm lint`        | The plugin rules plus ordinary lint. Runs in CI; the commit hook runs lint-staged (ESLint + Prettier) on staged files.                                                      |
| `pnpm token-check` | Token drift across the workspace — CSS **and** source files: raw hex, palette names, hardcoded px, raw radius, `var(--color-*)` bypasses, plus semantic-layer comment drift |
| `pnpm check:i18n`  | Whether a translation key exists — the same "wrong but invisible" class of problem                                                                                          |

`pnpm token-check` earns its place because the plugin governs **how components write colour**,
while it cannot govern **whether the token layer itself is correct**. The two are complementary,
not duplicated.

## Related documents

- [Design System README](../../packages/design-system/README.md) — token inventory, semantic vs
  primitive, the utility list
- [ESLint plugin README](../../libs/eslint-config/plugin/design-colors/README.md) — rules,
  settings, resolution logic
- [Frontend Architecture](../context/frontend-architecture.md) — how the units depend on each other
- [UI Library](ui-library.md) — how the component library consumes these tokens
