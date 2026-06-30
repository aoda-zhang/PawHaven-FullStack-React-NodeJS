# PawHaven Design System — Enhancement Plan

> Audit of `packages/design-system` (v1.0.0). Produced from a full read of every file in the package plus its consumption sites in `apps/frontend/portal` and `packages/ui`.
>
> **Scope:** practical, high‑impact changes aligned with Tailwind CSS v4 `@theme`, MUI v7, and the W3C Design Tokens Community Group format. No paid services required.

---

## 0. Audit summary

### 0.1 What the package actually is today

- A **CSS‑only** package. `package.json` declares no `main`, `module`, `types`, or `exports` — consumers must deep‑import `@pawhaven/design-system/index.css`.
- The only real consumption site is `apps/frontend/portal/src/providers/AppProvider.tsx` (`import '@pawhaven/design-system/index.css'`). `@pawhaven/ui` lists it as a dependency but does not import it.
- 7 token files (`tokens/*.css`), 1 semantic theme file (`theme.css`), 1 utilities file (`utilities.css`), 1 MUI theme (`MUI-theme.js`).
- README documents a JS API (`import { colors, spacing } from '@pawhaven/design-system'`) that **does not exist**.

### 0.2 Confirmed defects (verified against source)

| # | Defect | Evidence |
|---|--------|----------|
| D1 | `tokens/border.css` references 4 undefined tokens | `--color-neutral-300/400`, `--color-brand-500`, `--color-error-500` do not exist anywhere; real tokens are `--color-gray-*`, `--color-orange-*`, `--color-red-*` |
| D2 | Semantic border tokens defined **twice** with conflicting values | `--color-border` in `border.css` (broken) and `theme.css` (correct). Only works because `theme.css` is imported last — latent bug |
| D3 | `--spacing-gutter/section/card/input` duplicated verbatim in `tokens/spacing.css` and `theme.css` | Both files emit identical `1.5rem / 4rem / 1.5rem / 0.75rem` |
| D4 | `green` and `green-success` scales overlap at stops 1–4 and 6 (identical hex) | `--color-green-6` and `--color-green-success-6` are both `#4caf50` |
| D5 | `MUI-theme.js` hardcodes hex values that duplicate CSS tokens | `#f7823a` = `--color-orange-6`, `#4caf50` = `--color-green-6`, `#eee3d8` ≈ `--color-brown-3`, etc. |
| D6 | `package.json` has no `exports`/`types` | README's `import { colors, spacing }` cannot work |
| D7 | No dark mode, no `prefers-reduced-motion` | `grep` for `prefers-color-scheme`, `prefers-reduced-motion`, `.dark` returns nothing |
| D8 | Missing token groups | No breakpoints, opacity, sizing, grid, z‑index primitives (z‑index only exists as semantic aliases in `theme.css`) |
| D9 | Redundant utilities overlapping Tailwind v4 built‑ins | `text-balance`, `text-pretty`, `visually-hidden` (≈ `sr-only`) ship natively in Tailwind v4 |
| D10 | `button-rounded` hardcodes `padding: 6px 12px` | Bypasses spacing tokens |
| D11 | Shadow color primitives live in `tokens/color.css` | `--color-shadow-*` are coupled to `tokens/shadow.css` and belong there |
| D12 | `@source` paths hardcoded in `index.css` | `'../ui/**/*'`, `'../../apps/frontend/**/*'`, `'../frontend-core/**/*'` — fragile, won't scan `apps/frontend/admin` correctly |

### 0.3 Current vs. proposed architecture

```
CURRENT                                  PROPOSED
──────                                   ────────
tokens/*.css  (CSS, @theme)              src/tokens.json   ← W3C format, single source of truth
        │                                        │
        ├─> (consumed by Tailwind)              ├─> scripts/build-tokens.mjs
        │                                  ┌─────┴─────┴──────┐
theme.css      (semantic, @theme)          ▼      ▼            ▼
        │                                *.css   tokens.ts   (W3C JSON keeps
        │                               (@theme) (typed JS)   working as docs)
utilities.css  (@utility)
        │                                  │            │
MUI-theme.js   (hardcoded hex)             ▼            ▼
                                       theme.css    MUI-theme.ts
                                       (semantic,    (palette: var(--color-*))
                                        @theme)
                                            │
                                       utilities.css (@utility, a11y‑aware)
```

---

## 1. Priority legend

- **P0** — Correctness bug or broken contract. Ship‑blocking. Fix immediately.
- **P1** — Single‑source‑of‑truth violations, missing foundational tokens, no programmatic access. High‑impact within the next sprint.
- **P2** — Quality, accessibility, maintainability, documentation. Plan this quarter.
- **P3** — Strategic (W3C compliance, Figma sync, versioning). Nice‑to‑have.

---

# P0 — Critical / blocking

## P0.1 — Fix undefined token references in `tokens/border.css`

**Issue.** `border.css:12-16` defines semantic border colors that reference four non‑existent tokens:

```css
--color-border:        var(--color-neutral-300);  /* undefined */
--color-border-hover:  var(--color-neutral-400);  /* undefined */
--color-border-strong: var(--color-neutral-400);  /* undefined */
--color-border-focus:  var(--color-brand-500);    /* undefined */
--color-border-error:  var(--color-error-500);    /* undefined */
```

These resolve to the empty string / `initial`. The app only renders correct borders because `theme.css` (imported after `tokens/`) redefines the same names against the correct `--color-gray-*` / `--color-red-*` / `--color-primary` tokens. Anyone importing `tokens/border.css` alone, or reordering imports, gets broken borders.

**Why it matters.** It is a latent correctness bug masked by import order. It also violates the "primitives in `tokens/`, semantics in `theme.css`" contract the package claims.

**Fix.** `border.css` should contain **only primitive border widths**. Semantic border colors belong exclusively in `theme.css` (where they are already correct). Edit `tokens/border.css` to:

```css
@theme {
  --border-width-0: 0;
  --border-width-1: 1px;
  --border-width-2: 2px;
  --border-width-4: 4px;
  --border-width-8: 8px;
}
```

Remove the five `--color-border-*` lines entirely. Verify `theme.css:46-51` already defines them against valid primitives (it does). Run a grep to confirm no consumer references `--color-neutral-*` / `--color-brand-*` / `--color-error-500`.

**Files:** `packages/design-system/tokens/border.css` (edit), `packages/design-system/theme.css` (no change, already correct).

---

## P0.2 — Fix `package.json` exports; make the package importable

**Issue.** `package.json` declares only `name`, `version`, `private`, `dependencies`. No `main`, `module`, `types`, `exports`, or `sideEffects`. This means:

- `import { colors } from '@pawhaven/design-system'` (per the README) fails — there is no entry.
- `import '@pawhaven/design-system'` (bare specifier) fails — consumers must deep‑import `@pawhaven/design-system/index.css`.
- TypeScript sees no types for the package.

**Why it matters.** The package's documented public API does not work. Every consumer is forced to use a fragile deep path. P1.1 (JS/TS tokens) depends on this being fixed.

**Fix.** Add `exports`, `sideEffects`, and a CSS entry point. (JS/TS entries are added in P1.2.)

```json
{
  "name": "@pawhaven/design-system",
  "version": "1.0.0",
  "private": true,
  "sideEffects": ["*.css"],
  "exports": {
    "./styles.css": "./index.css",
    "./theme": "./MUI-theme.js",
    "./tokens": "./src/tokens.ts"
  },
  "files": ["index.css", "theme.css", "utilities.css", "MUI-theme.js", "tokens", "src"],
  "dependencies": {
    "react": "^19.2.0",
    "@mui/material": "^7.3.4",
    "tailwindcss": "^4.1.14",
    "typescript": "^5.9.3",
    "@pawhaven/eslint-config": "workspace:*"
  }
}
```

Then update the one consumer (`apps/frontend/portal/src/providers/AppProvider.tsx`) from:

```ts
import '@pawhaven/design-system/index.css';
```

to:

```ts
import '@pawhaven/design-system/styles.css';
```

**Files:** `packages/design-system/package.json` (edit), `apps/frontend/portal/src/providers/AppProvider.tsx` (edit).

---

## P0.3 — Correct the README

**Issue.** `README.MD:13-18` shows `import { colors, spacing } from '@pawhaven/design-system'` and `colors.primary` / `spacing.md`. None of these exist. The README also fails to mention the CSS import, the MUI theme export, the utility classes, or the semantic token naming.

**Why it matters.** Misleading docs waste every new contributor's time and hide the real API.

**Fix.** Rewrite `README.MD` to document what actually exists today (after P0.2), with a "Coming per the enhancement plan" note for JS tokens. Minimum sections:

- Install (workspace dep, no npm install needed)
- CSS entry: `import '@pawhaven/design-system/styles.css'`
- Available utility classes (`flex-center`, `flex-between`, `flex-col-center`, `link`, `btn-primary`, `btn-secondary`, `btn-outline`, `card`, `input-field`, `form-error`, `link-reset`, `button-reset`, `button-rounded`)
- Semantic token usage with Tailwind: `bg-primary`, `text-text-secondary`, `border-border`, `shadow-card`, `radius-card`, etc.
- MUI theme: `import { MUITheme } from '@pawhaven/design-system/theme'`
- Token file map (`tokens/*.css` → what each contains)
- Link to this enhancement plan

**Files:** `packages/design-system/README.MD` (rewrite).

---

# P1 — High

## P1.1 — Eliminate spacing/border token duplication (single source of truth)

**Issue.**
- `--spacing-gutter`, `--spacing-section`, `--spacing-card`, `--spacing-input` are defined identically in both `tokens/spacing.css:6-9` and `theme.css:73-76`.
- The five `--color-border-*` semantic tokens are defined in both `tokens/border.css` (broken) and `theme.css` (correct) — see P0.1.

**Why it matters.** Two definitions of the same token will drift. Today they happen to match; tomorrow a designer changes one and the other silently wins or loses based on import order.

**Fix.** Establish the rule: **`tokens/*.css` holds primitives only; `theme.css` holds all semantic mappings.** Concretely:

1. In `tokens/spacing.css`, keep only the primitive spacing scale + container widths. The four aliases (`gutter`, `section`, `card`, `input`) move to `theme.css` (already there) and are deleted from `spacing.css`.
2. After P0.1, `border.css` no longer defines semantic border colors; `theme.css` remains their sole source.

Result: each token name has exactly one definition site.

```css
/* tokens/spacing.css — AFTER */
@theme {
  /* Primitive spacing scale */
  --spacing-px: 1px;
  --spacing-0: 0;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.5rem;   /* was --spacing-card / --spacing-gutter */
  --spacing-6: 2rem;
  --spacing-8: 3rem;
  --spacing-10: 4rem;    /* was --spacing-section */

  /* Containers */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;
}
```

```css
/* theme.css — semantic aliases (already present, keep) */
--spacing-gutter: var(--spacing-5);
--spacing-section: var(--spacing-10);
--spacing-card: var(--spacing-5);
--spacing-input: var(--spacing-3);
```

**Files:** `packages/design-system/tokens/spacing.css` (edit), `packages/design-system/theme.css` (update alias values to reference primitive scale, not raw `rem`).

---

## P1.2 — Add TypeScript token access for JS/TS consumers

**Issue.** Tokens exist only as CSS custom properties. JS/TS consumers (charts via recharts/Chart.js, canvas, inline styles, MUI component overrides that need raw values, animation libraries) have no typed access. This is why `MUI-theme.js` ended up hardcoding hex values — there was nothing to import.

**Why it matters.** Without JS access, every JS consumer reinvents the values (D5), creating N sources of truth. TypeScript types also unlock autocomplete and rename refactors.

**Fix.** Create `src/tokens.ts` that exports (a) primitive values, (b) semantic CSS‑var references, (c) a `tokenVar()` helper, and (d) types. This becomes the JS source of truth; `MUI-theme.ts` (P1.3) consumes it.

```ts
// src/tokens.ts

/** Primitive color scale values (source of truth for JS consumers). */
export const colorPrimitives = {
  gray:   { 1:'#ffffff', 2:'#f8f8f8', 3:'#f0f0f0', 4:'#e5e5e5', 5:'#d4d4d4',
            6:'#a3a3a3', 7:'#737373', 8:'#525252', 9:'#2f2f2f', 10:'#171717' },
  orange: { 1:'#fff7ed', 2:'#ffedd5', 3:'#fed7aa', 4:'#fdb87a', 5:'#fb923c',
            6:'#f7823a', 7:'#f66b26', 8:'#e65a1a', 9:'#c2410b', 10:'#7a2b08' },
  // ... green, red, yellow, blue, brown
} as const;

/** Semantic CSS variable references — use these in JS‑in‑CSS (inline styles, MUI). */
export const color = {
  primary:        'var(--color-primary)',
  primaryHover:   'var(--color-primary-hover)',
  primaryActive:  'var(--color-primary-active)',
  secondary:      'var(--color-secondary)',
  surface:        'var(--color-surface)',
  background:     'var(--color-background)',
  text:           'var(--color-text)',
  textSecondary:  'var(--color-text-secondary)',
  border:         'var(--color-border)',
  error:          'var(--color-error)',
  success:        'var(--color-success)',
  warning:        'var(--color-warning)',
  info:           'var(--color-info)',
} as const;

export const spacing = {
  gutter:  'var(--spacing-gutter)',
  section: 'var(--spacing-section)',
  card:    'var(--spacing-card)',
  input:   'var(--spacing-input)',
} as const;

export const radius = {
  input:  'var(--radius-input)',
  button: 'var(--radius-button)',
  card:   'var(--radius-card)',
  dialog: 'var(--radius-dialog)',
} as const;

export const duration = { fast: 'var(--duration-150)', base: 'var(--duration-200)', slow: 'var(--duration-300)' } as const;
export const easing   = { standard: 'var(--ease-standard)' } as const;

/** Type-safe CSS var reference, e.g. tokenVar('color.primary'). */
export function tokenVar(path: string): string {
  // Map dotted path to --kebab-case token name.
  const name = '--' + path.replace(/\./g, '-').replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  return `var(${name})`;
}

export type ColorToken  = keyof typeof color;
export type SpacingToken = keyof typeof spacing;
```

Wire it through `package.json` `exports` (P0.2 already adds `"./tokens": "./src/tokens.ts"`). Add `src/index.ts` re‑exporting for `import { color, spacing } from '@pawhaven/design-system'`.

**Files:** `packages/design-system/src/tokens.ts` (new), `packages/design-system/src/index.ts` (new), `packages/design-system/package.json` (add `"."` export → `./src/index.ts`), `packages/design-system/tsconfig.json` (new — extend `@pawhaven/tsconfig`).

---

## P1.3 — Derive MUI theme from CSS variables (eliminate hex duplication)

**Issue.** `MUI-theme.js:6-38` hardcodes ~14 hex values that duplicate CSS tokens. Example: `primary.main: '#f7823a'` is `--color-orange-6`; `background.default: '#eee3d8'` is approximately `--color-brown-3` (`#f6e9df` — note: not even an exact match, which is itself a drift bug). `success.main: '#4caf50'` duplicates `--color-green-6`.

**Why it matters.** Two sources of truth for the same colors. A designer changes the orange scale in Figma → CSS updates → MUI does not → MUI components (DatePicker, Toast, Snackbar, any non‑Tailwind surface) drift out of brand. This is already happening: `background.default` in MUI is `#eee3d8` but the token is `#f6e9df`.

**Fix.** MUI v7 with `cssVariables: true` accepts CSS `var()` strings throughout the palette. Rewrite `MUI-theme.js` (rename to `MUI-theme.ts`) to reference the CSS tokens via `src/tokens.ts`:

```ts
// MUI-theme.ts
import { createTheme } from '@mui/material/styles';
import { color, radius, duration, easing } from './src/tokens';

export const MUITheme = createTheme({
  cssVariables: true,
  palette: {
    primary:      { main: color.primary,      light: 'var(--color-primary-light)',    dark: 'var(--color-primary-active)', contrastText: color.textInverse },
    secondary:    { main: color.secondary,    light: 'var(--color-secondary-light)',  dark: 'var(--color-secondary-active)', contrastText: 'var(--color-text-inverse)' },
    background:   { default: 'var(--color-background)', paper: 'var(--color-surface)' },
    text:         { primary: color.text, secondary: color.textSecondary },
    divider:      'var(--color-border)',
    error:        { main: color.error },
    success:      { main: color.success },
    warning:      { main: color.warning },
    info:         { main: color.info },
  },
  shape:       { borderRadius: 8 }, // aligns with --radius-md
  spacing:     4,                   // 4px base → matches --spacing-1
  typography:  {
    fontFamily: 'var(--font-sans)',
    h1: { fontFamily: 'var(--font-heading)' },
    // ... h2–h6, button, body1, body2
  },
  transitions: {
    duration: { shortest: 150, shorter: 200, short: 250, standard: 300, long: 500 },
    easing:   { easeInOut: easing.standard, easeOut: 'var(--ease-out)', easeIn: 'var(--ease-in)' },
  },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 'var(--radius-button)' } } },
    MuiCard:   { styleOverrides: { root: { borderRadius: 'var(--radius-card)',  boxShadow: 'var(--shadow-card)' } } },
    MuiPaper:  { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 'var(--radius-input)' } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 'var(--radius-dialog)' } } },
  },
});
```

**Key point:** by pointing MUI at `var(--color-*)`, the CSS tokens become the single runtime source of truth for both Tailwind and MUI. Changing `--color-orange-6` in `tokens/color.css` now updates every MUI component automatically.

**Files:** `packages/design-system/MUI-theme.js` → rename to `MUI-theme.ts` and rewrite; update `package.json` `"./theme"` export; update any importer (none found in portal yet, so this is forward‑looking).

---

## P1.4 — Resolve the `green` vs `green-success` duplication

**Issue.** `tokens/color.css` defines two green scales. Stops 1–4 and 6 are byte‑identical; stops 5, 7–10 diverge:

| stop | `--color-green-*` | `--color-green-success-*` | match? |
|------|-------------------|---------------------------|--------|
| 1–4  | `#f0fdf4`…`#86efac` | same | ✅ |
| 5    | `#4ad07a` | `#4ade80` | ❌ |
| 6    | `#4caf50` | `#4caf50` | ✅ |
| 7    | `#3da64a` | `#16a34a` | ❌ |
| 8–10 | diverge | diverge | ❌ |

`theme.css` uses `--color-green-*` for "secondary" and `--color-green-success-*` for "success".

**Why it matters.** Two scales that are 50% identical invite confusion ("which green do I use?"), bloat the token set, and make Figma sync harder. The divergence at stops 5/7–10 also suggests one scale was tuned and the other wasn't.

**Fix.** Decide with design which scale is canonical. Recommended:

- **Keep one `green` scale** (the `green-success` values, which match Tailwind's standard green ramp and are better tuned at 5/7–10).
- Repoint `theme.css` semantic tokens:

  ```css
  --color-secondary:        var(--color-green-6);
  --color-secondary-hover:  var(--color-green-7);
  --color-secondary-active: var(--color-green-8);
  --color-secondary-light:  var(--color-green-1);
  --color-success:          var(--color-green-6);  /* same scale, different role */
  --color-success-light:    var(--color-green-2);
  ```

- Delete the entire `--color-green-success-*` block from `tokens/color.css`.
- Grep consumers for `green-success` (none found in `apps/frontend/portal` or `packages/ui` src beyond the token file itself) and update.

**Files:** `packages/design-system/tokens/color.css` (delete `green-success` block), `packages/design-system/theme.css` (repoint success aliases).

---

## P1.5 — Add missing foundational token groups

**Issue.** The token set has no breakpoints, opacity, sizing, or grid tokens. Components invent ad‑hoc values (e.g. `button-rounded`'s `6px 12px`). Z‑index exists only as semantic aliases in `theme.css` with no primitive scale.

**Why it matters.** These primitives are expected in any production design system. Their absence forces per‑component hardcoding, which is already happening.

**Fix.** Add a new `tokens/breakpoint.css`, `tokens/opacity.css`, `tokens/sizing.css`, and move z‑index primitives into `tokens/z-index.css`. Keep semantic aliases in `theme.css`.

```css
/* tokens/breakpoint.css */
@theme {
  --breakpoint-xs: 360px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```
(Tailwind v4 auto‑generates `sm:` / `md:` / … variants from `--breakpoint-*`.)

```css
/* tokens/opacity.css */
@theme {
  --opacity-0: 0;
  --opacity-25: 0.25;
  --opacity-50: 0.5;
  --opacity-75: 0.75;
  --opacity-90: 0.9;
  --opacity-100: 1;
}
```

```css
/* tokens/sizing.css */
@theme {
  --size-0: 0;
  --size-px: 1px;
  --size-1: 0.25rem;
  --size-2: 0.5rem;
  --size-3: 0.75rem;
  --size-4: 1rem;
  --size-6: 1.5rem;
  --size-8: 2rem;
  --size-10: 2.5rem;
  --size-12: 3rem;
  --size-16: 4rem;
  --size-20: 5rem;
  --size-24: 6rem;
  --size-full: 100%;
  --size-min: min-content;
  --size-max: max-content;
  --size-fit: fit-content;
}
```

```css
/* tokens/z-index.css — primitives; theme.css keeps semantic aliases */
@theme {
  --z-index-0: 0;
  --z-index-10: 10;
  --z-index-20: 20;
  --z-index-30: 30;
  --z-index-40: 40;
  --z-index-50: 50;
  --z-index-auto: auto;
}
```
Update `theme.css` z‑index aliases to reference the primitives: `--z-index-dropdown: var(--z-index-30)` etc.

Wire all four new files into `tokens/index.css` barrel import. Update `src/tokens.ts` to export them.

**Files:** `tokens/breakpoint.css`, `tokens/opacity.css`, `tokens/sizing.css`, `tokens/z-index.css` (new); `tokens/index.css`, `theme.css`, `src/tokens.ts` (edit).

---

## P1.6 — Introduce dark mode infrastructure

**Issue.** No `prefers-color-scheme` media query, no `.dark` class, no theme toggle infrastructure. Every semantic token is hard‑wired to a light‑mode primitive.

**Why it matters.** Dark mode is an accessibility feature (WCAG 2.2 encourages respecting user preference) and an expected product capability. Retrofitting it later requires re‑touching every semantic token.

**Fix.** Use the **class strategy** (`html.dark`) so users can toggle, with `prefers-color-scheme` as the default. Tailwind v4 supports `@custom-variant dark (&:where(.dark, .dark *))` for `dark:` utilities. Restructure `theme.css` so semantic tokens are re‑mapped under `.dark`:

```css
/* index.css — register the dark variant */
@import 'tailwindcss';
@custom-variant dark (&:where(.dark, .dark *));
```

```css
/* theme.css — light is default, .dark overrides */
@theme {
  /* light defaults (current values) */
  --color-surface: var(--color-gray-1);
  --color-background: var(--color-brown-4);
  --color-text: var(--color-gray-9);
  --color-text-secondary: var(--color-gray-7);
  --color-border: var(--color-gray-5);
  /* ...rest unchanged */
}

/* Dark overrides — only reassign the semantic layer, primitives stay */
@layer base {
  .dark {
    --color-surface: var(--color-gray-9);
    --color-surface-elevated: var(--color-gray-8);
    --color-surface-hover: var(--color-gray-8);
    --color-background: var(--color-gray-10);
    --color-background-subtle: var(--color-gray-9);
    --color-muted: var(--color-gray-8);
    --color-muted-strong: var(--color-gray-7);

    --color-text: var(--color-gray-1);
    --color-text-secondary: var(--color-gray-3);
    --color-text-tertiary: var(--color-gray-4);
    --color-text-muted: var(--color-gray-5);
    --color-text-placeholder: var(--color-gray-5);
    --color-text-inverse: var(--color-gray-9);

    --color-border: var(--color-gray-7);
    --color-border-hover: var(--color-gray-6);
    --color-border-strong: var(--color-gray-5);

    --shadow-card: 0 1px 3px rgba(0,0,0,0.4);
    --shadow-dropdown: 0 3px 6px rgba(0,0,0,0.45);
    --shadow-modal: 0 8px 20px rgba(0,0,0,0.5);
    --shadow-toast: 0 12px 28px rgba(0,0,0,0.55);
  }

  @media (prefers-color-scheme: dark) {
    :root:not(.light) { /* same overrides as .dark above */ }
  }
}
```

Because every utility and MUI palette reads `var(--color-*)`, dark mode "just works" once the semantic layer is re‑mapped — no component changes needed.

Add a tiny `useColorScheme` hook in `src/index.ts` that toggles `document.documentElement.classList` and persists to `localStorage`, so the portal can add a theme switcher without coupling to the design system.

**Files:** `index.css` (add `@custom-variant`), `theme.css` (add `.dark` + `prefers-color-scheme` blocks), `src/useColorScheme.ts` (new).

---

# P2 — Medium

## P2.1 — Honor `prefers-reduced-motion`

**Issue.** `tokens/motion.css` defines 8 durations and 6 easings, and `utilities.css` wires them into transitions (`btn-base`, `link`, `input-field`). There is no reduced‑motion fallback.

**Why it matters.** WCAG 2.2 SC 2.3.3 (Animation from Interactions, AAA) and vestibular disorder guidance require respecting user motion preferences. Today every animated component ignores the OS setting.

**Fix.** Add a global guard in `index.css`:

```css
@layer base {
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
}
```

And expose a `motion-safe:`‑style variant for explicit opt‑in animations. Tailwind v4 already ships `motion-safe` and `motion-reduce` variants, so component authors can write `motion-safe:transition-colors`.

**Files:** `packages/design-system/index.css` (edit).

---

## P2.2 — Add `:focus-visible` accessibility ring

**Issue.** `input-field` uses `:focus` (fires on mouse click) with a `box-shadow` ring. Buttons (`btn-*`) have no visible focus indicator at all. There is no shared focus‑ring utility.

**Why it matters.** WCAG 2.4.7 (Focus Visible, AA) requires a visible focus indicator. Keyboard users currently cannot tell which button is focused.

**Fix.** Add a `focus-ring` utility and apply `:focus-visible` (not `:focus`) so mouse users don't get a ring on click:

```css
@utility focus-ring {
  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
    box-shadow: 0 0 0 var(--border-width-2) var(--color-primary-light);
  }
}
```

Update `btn-base` to compose it:

```css
@utility btn-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: var(--font-weight-medium);
  transition-property: background-color, border-color, color;
  transition-timing-function: var(--ease-standard);
  transition-duration: var(--duration-150);

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
}
```

Change `input-field`'s `:focus` to `:focus-visible`.

**Files:** `packages/design-system/utilities.css` (edit).

---

## P2.3 — Remove Tailwind v4 native utility duplicates

**Issue.** `utilities.css` ships three utilities that Tailwind v4 already provides:
- `text-balance` → Tailwind v4 ships `text-balance`.
- `text-pretty` → Tailwind v4 ships `text-pretty`.
- `visually-hidden` → Tailwind v4 ships `sr-only` (functionally identical).

**Why it matters.** Duplicate utilities confuse consumers ("which do I use?") and add maintenance surface for no benefit.

**Fix.** Delete `text-balance`, `text-pretty`, and `visually-hidden` from `utilities.css`. Update any consumer using them to the native equivalents (`text-balance`, `text-pretty`, `sr-only`). Grep the monorepo first to size the migration:

```bash
grep -rn "visually-hidden\|text-balance\|text-pretty" apps/ packages/ --include="*.tsx" --include="*.ts"
```

Keep `flex-center`, `flex-between`, `flex-col-center` — these are not in Tailwind by default and are genuinely useful.

**Files:** `packages/design-system/utilities.css` (edit), consumers (update usages).

---

## P2.4 — Tokenize hardcoded values in utilities

**Issue.** `button-rounded` uses `padding: 6px 12px` instead of spacing tokens. `link` uses `text-underline-offset: 4px`. `visually-hidden` uses `1px`/`-1px` (acceptable — it's a spec). These bypass the design system.

**Why it matters.** Inconsistent with the token contract; can't be themed.

**Fix.**

```css
@utility button-rounded {
  cursor: pointer;
  border-radius: var(--radius-button);
  padding: var(--spacing-2) var(--spacing-3); /* 0.5rem 0.75rem */
}
```

`link`'s `4px` is fine as a literal (typographic offset, not a layout token) but could be `var(--radius-xs)` for consistency. Leave `visually-hidden` literals alone (after P2.3 it's deleted anyway).

**Files:** `packages/design-system/utilities.css` (edit).

---

## P2.5 — Move shadow color primitives to `tokens/shadow.css`

**Issue.** `--color-shadow`, `--color-shadow-light`, … `--color-shadow-inner` live in `tokens/color.css:11-18` but are only consumed by `tokens/shadow.css`. They are shadow primitives mislabeled as colors.

**Why it matters.** Misplaced primitives make the token file map harder to reason about and complicate the W3C token grouping (P3.1).

**Fix.** Move the seven `--color-shadow-*` declarations from `tokens/color.css` to the top of `tokens/shadow.css`. They remain `@theme` tokens so Tailwind generates `text-shadow-*` / `shadow-*` utilities as before. No consumer changes needed (the variables resolve globally).

**Files:** `tokens/color.css` (remove block), `tokens/shadow.css` (add block at top).

---

## P2.6 — Replace hardcoded `@source` paths with a config‑driven scan

**Issue.** `index.css:22-24` hardcodes three relative `@source` paths. From `packages/design-system/`, `../../apps/frontend/**/*.{jsx,tsx}` matches both `portal` and `admin`, but the path is brittle: move the package, rename an app, or add a third frontend and the scan silently breaks, producing missing utility classes in production builds.

**Why it matters.** Silent class stripping in production is a high‑blast‑radius failure mode.

**Fix.** Two options (pick one):

**Option A (recommended): move `@source` to each consuming app.** Each app's own CSS entry (or `vite.config.ts` `@tailwindcss/vite` plugin config) declares what to scan. The design system ships tokens/theme/utilities only; it does not prescribe consumer paths. Delete `@source` lines from `index.css`. Apps already using `@tailwindcss/vite` can set `content` in their vite config.

**Option B: keep central, make it explicit and exhaustive.**

```css
@source '../../apps/frontend/portal/src/**/*.{jsx,tsx,ts}';
@source '../../apps/frontend/admin/src/**/*.{jsx,tsx,ts}';
@source '../ui/src/**/*.{jsx,tsx,ts}';
@source '../frontend-core/src/**/*.{jsx,tsx,ts}';
```

Prefer Option A — it follows the Tailwind v4 convention that each app owns its content config.

**Files:** `packages/design-system/index.css` (edit), `apps/frontend/portal/vite.config.ts` and `apps/frontend/admin/vite.config.ts` (add content config if Option A).

---

## P2.7 — Add a Storybook / token documentation site

**Issue.** No Storybook, no token catalog, no live preview of utilities or semantic tokens. Designers and engineers cannot see what the system provides without reading CSS.

**Why it matters.** Undocumented tokens go unused; engineers reinvent components instead of reusing utilities; design reviews have no shared reference.

**Fix.** Add **Storybook 8** as a dev dependency at the workspace root or in `packages/design-system` (free, MIT‑licensed). Three story categories:

1. **Tokens** — auto‑generated stories for every color, spacing, radius, shadow, typography, motion token. A single `tokens.stories.tsx` iterates `src/tokens.ts` and renders swatches/grids.
2. **Utilities** — one story per `@utility` (`flex-center`, `btn-primary`, `card`, `input-field`, …) showing states (hover, focus, active, disabled).
3. **MUI theme** — render key MUI components (Button, Card, TextField, Dialog, DatePicker) inside `ThemeProvider` with `MUITheme` to verify Tailwind + MUI visual alignment.

Add a `pnpm --filter @pawhaven/design-system storybook` script. Storybook docs mode (`--docs`) doubles as the published token reference.

**Files:** `packages/design-system/.storybook/` (new), `packages/design-system/src/stories/` (new), `package.json` (add `storybook` script + devDeps).

---

## P2.8 — Establish a free Figma → tokens sync pipeline

**Issue.** `tokens/color.css`, `tokens/typography.css`, etc. all say "from Figma" in their headers, but there is no automation. Updates are copy‑pasted by hand, which is how the `green`/`green-success` divergence and the `#eee3d8` vs `#f6e9df` MUI drift happened.

**Why it matters.** "From Figma" without automation is aspirational, not operational.

**Fix.** Use the free, open‑source chain:

1. **Tokens Studio** (Figma plugin, free tier covers token export) → export `tokens.json` in **W3C Design Tokens Format** to `packages/design-system/figma/tokens.json`.
2. **Style Dictionary** (Apache 2.0, free) → `scripts/build-tokens.mjs` reads `tokens.json` and emits:
   - `tokens/*.css` (`@theme` blocks)
   - `src/tokens.ts` (typed JS)
   - `tokens/tokens.w3c.json` (kept for documentation)
3. Add a `pnpm tokens:build` script. Run it manually after a Figma export; commit the generated CSS/TS.

This makes `figma/tokens.json` the **single source of truth**, and all three artifacts (CSS, TS, docs) are generated. Drift becomes impossible by construction.

```js
// scripts/build-tokens.mjs (sketch)
import StyleDictionary from 'style-dictionary';
import { w3cTokenCss } from './w3c-to-tailwind-theme.js';

const sd = new StyleDictionary({
  source: ['figma/tokens.json'],
  platforms: {
    css: { transformGroup: 'css', buildPath: 'tokens/', files: [
      { destination: '_generated-color.css', format: 'css/variables', filter: { type: 'color' } }
    ]},
    ts:  { transformGroup: 'js',  buildPath: 'src/', files: [
      { destination: 'tokens.generated.ts', format: 'javascript/es6' }
    ]}
  }
});
await sd.cleanAllPlatforms();
await sd.buildAllPlatforms();
```

Mark generated files with a header banner (`/* AUTO‑GENERATED — edit figma/tokens.json, then `pnpm tokens:build` */`) so nobody edits them by hand.

**Files:** `packages/design-system/figma/tokens.json` (new, from Tokens Studio export), `packages/design-system/scripts/build-tokens.mjs` (new), `packages/design-system/scripts/w3c-to-tailwind-theme.js` (new), `package.json` (add `style-dictionary` devDep + `tokens:build` script).

---

# P3 — Nice‑to‑have / strategic

## P3.1 — Adopt the W3C Design Tokens Format as the source of truth

**Issue.** Today tokens are authored directly as CSS `@theme` blocks. This is Tailwind‑specific and not portable to native, email, or other platforms. The W3C Design Tokens CG format is the emerging standard.

**Why it matters.** Portability, tool interoperability, and future‑proofing. This is the strategic foundation that P2.8 builds on.

**Fix.** This is fully realized once P2.8 lands: `figma/tokens.json` is W3C‑format, and CSS/TS are generated from it. The remaining P3 work is **validating** the JSON against the W3C spec using `@tokens-studio/spec` (free) and adding a CI check (`pnpm tokens:lint`) so malformed token files fail the build.

**Files:** `scripts/lint-tokens.mjs` (new), CI workflow (add step).

---

## P3.2 — Token versioning & changelog

**Issue.** `package.json` version is `1.0.0` with no changelog. Token changes ship with no record of what moved.

**Why it matters.** Downstream apps can't tell if a token rename is a breaking change. Blocks safe adoption of new tokens.

**Fix.**
- Add `CHANGELOG.md` following Keep a Changelog, driven by Conventional Commits (already enforced per `docs/project_standards.md`). Scope `feat(design-system):`, `fix(design-system):` map to semver bumps.
- Add a `changeset` workflow (Atlassian Changesets, free) at the workspace root so PRs declare their impact.
- Tag token‑only releases separately (`@pawhaven/design-system@1.1.0`).

**Files:** `packages/design-system/CHANGELOG.md` (new), root `.changeset/` config (new).

---

## P3.3 — Automated contrast / accessibility regression tests

**Issue.** No automated check that text/background token pairings meet WCAG AA (4.5:1).

**Why it matters.** A semantic re‑mapping (especially dark mode, P1.6) can silently drop below AA.

**Fix.** Add a `pnpm a11y:check` script using `wcag-contrast` (free, MIT) that asserts known pairings:

```js
// scripts/check-contrast.mjs
import { hex } from 'wcag-contrast';
const pairs = [
  ['--color-text',          '--color-background'],     // 4.5:1
  ['--color-text-inverse',  '--color-primary'],        // 4.5:1
  ['--color-text-secondary','--color-surface'],        // 4.5:1
  ['--color-error',         '--color-surface'],        // 4.5:1
];
// resolve via css-vars parser, assert ratio >= 4.5
```

Run in CI. Pair with Storybook's `@storybook/addon-a11y` for component‑level checks (P2.7).

**Files:** `scripts/check-contrast.mjs` (new), CI workflow (add step).

---

## P3.4 — Expand MUI component overrides

**Issue.** `MUI-theme.js` only overrides `MuiButton.root.textTransform`. Every other MUI component uses MUI defaults, which diverge from the Tailwind utility styling used elsewhere (different radius, shadow, typography).

**Why it matters.** Mixed MUI + Tailwind UIs look inconsistent without overrides.

**Fix.** After P1.3 (MUI reads CSS vars), expand `components` overrides to cover: `MuiCard`, `MuiPaper`, `MuiOutlinedInput`, `MuiFilledInput`, `MuiDialog`, `MuiDialogActions`, `MuiAlert`, `MuiChip`, `MuiTooltip`, `MuiSnackbar`, `MuiTableCell`, `MuiAppBar`, `MuiToolbar`, `MuiLink`. Each override should reference semantic tokens (`var(--radius-card)`, `var(--shadow-card)`, `var(--color-border)`, `var(--font-heading)`) so MUI and Tailwind components stay visually aligned.

**Files:** `packages/design-system/MUI-theme.ts` (expand `components`).

---

# 2. Implementation order & dependencies

```
P0.1 (border.css fix) ────────┐
P0.2 (package exports) ───────┤
P0.3 (README) ────────────────┤
                              ▼
P1.1 (dedupe spacing/border) ─┐
P1.4 (merge green scales) ────┤   (independent of each other; do in parallel)
P1.5 (missing token groups) ──┤
P2.5 (move shadow colors) ────┤
P2.1 (reduced motion) ────────┤
P2.3 (drop dup utilities) ────┤
P2.4 (tokenize button-rounded)┘
                              │
P1.2 (TS tokens) ─────────────┤   (depends on P0.2 exports + P1.5 groups)
                              ▼
P1.3 (MUI reads CSS vars) ────┤   (depends on P1.2)
P2.2 (focus-visible) ─────────┤
P2.6 (@source config) ────────┤
P2.7 (Storybook) ─────────────┤   (depends on P1.2 for token stories)
                              ▼
P1.6 (dark mode) ─────────────┤   (depends on P1.3 so MUI follows theme)
P2.8 (Figma sync) ────────────┤   (depends on P1.5 + P1.2 for targets)
P3.4 (MUI overrides) ─────────┤   (depends on P1.3)
P3.3 (contrast CI) ───────────┤   (depends on P1.6 for dark pairings)
P3.1 (W3C validation) ────────┤   (depends on P2.8)
P3.2 (versioning) ────────────┘
```

**Suggested 3‑sprint rollout:**

- **Sprint 1 (P0 + quick P1):** P0.1, P0.2, P0.3, P1.1, P1.4, P2.5. All are low‑risk edits that fix active bugs and remove duplication. ~2–3 days.
- **Sprint 2 (JS access + MUI):** P1.2, P1.3, P1.5, P2.1, P2.2, P2.3, P2.4, P2.6. Establishes the single source of truth and a11y baseline. ~4–5 days.
- **Sprint 3 (DX + dark mode):** P1.6, P2.7, P2.8, P3.4. Dark mode, docs, Figma pipeline. ~1 week.
- **Ongoing:** P3.1, P3.2, P3.3 land as CI hardening.

---

# 3. Quick‑reference: file impact matrix

| File | Touched by |
|------|------------|
| `tokens/border.css` | P0.1 |
| `tokens/spacing.css` | P1.1 |
| `tokens/color.css` | P1.4, P2.5 |
| `tokens/shadow.css` | P2.5 |
| `tokens/breakpoint.css` (new) | P1.5 |
| `tokens/opacity.css` (new) | P1.5 |
| `tokens/sizing.css` (new) | P1.5 |
| `tokens/z-index.css` (new) | P1.5 |
| `tokens/index.css` | P1.5 |
| `theme.css` | P1.1, P1.4, P1.5, P1.6 |
| `utilities.css` | P2.2, P2.3, P2.4 |
| `index.css` | P1.6, P2.1, P2.6 |
| `MUI-theme.js` → `MUI-theme.ts` | P1.3, P3.4 |
| `package.json` | P0.2, P1.2, P2.7, P2.8 |
| `README.MD` | P0.3 |
| `src/tokens.ts` (new) | P1.2 |
| `src/index.ts` (new) | P1.2 |
| `src/useColorScheme.ts` (new) | P1.6 |
| `tsconfig.json` (new) | P1.2 |
| `.storybook/` (new) | P2.7 |
| `scripts/build-tokens.mjs` (new) | P2.8 |
| `scripts/check-contrast.mjs` (new) | P3.3 |
| `figma/tokens.json` (new) | P2.8 |
| `CHANGELOG.md` (new) | P3.2 |

---

# 4. Out of scope / explicit non‑recommendations

- **No paid services:** nothing here requires Figma paid plans, Tokens Studio paid features, Chromatic, or Zeroheight. Style Dictionary, Storybook, `wcag-contrast`, and Changesets are all free/open‑source.
- **No re‑write of the Tailwind v4 `@theme` architecture.** The `@theme` directive approach is sound and current. We only reorganize what lives in which `@theme` block.
- **No replacement of MUI.** MUI v7 stays; we only re‑wire its palette to CSS variables.
- **No new runtime CSS‑in‑JS layer.** The plan deliberately keeps CSS custom properties as the runtime source of truth to avoid bundle‑size and SSR complexity.

---

*End of plan. For questions or to begin implementation, start with the Sprint 1 items — they are all reversible, low‑risk, and fix live bugs.*
