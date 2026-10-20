# @pawhaven/eslint-plugin-design-colors

ESLint rules that keep PawHaven styles on the design system.

The list of valid tokens is **not** hard-coded in the plugin. At lint time it
is read from the design-system CSS, so the CSS stays the single source of
truth for the palette and a token can never be "valid" in the linter but
missing in the stylesheet.

## Rules

| Rule               | Severity | What it reports                                                                                                                                                                                                                        |
| ------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `no-unknown-token` | error    | A class that reads a token namespace but does not resolve to a token, a magic number in an arbitrary value, a `var(--token)` that bypasses the token utility, and a class that is neither a Tailwind utility nor a project `@utility`. |
| `no-raw-color`     | error    | A raw colour literal (hex, `rgb()`, `hsl()`, `oklch()`, CSS colour keyword) in a `className` arbitrary value or in a `style={{...}}` object.                                                                                           |
| `no-inline-style`  | warn     | A `style={{...}}` object on a JSX element. It stays a warning because the design system still has legitimate inline styles (scroll-snap).                                                                                              |

Rule ids are prefixed with the plugin shorthand: `@pawhaven/design-colors/`.

## Settings

```js
settings: {
  'design-colors': {
    // Paths relative to the repository root. A path may be a file or a
    // directory (which is scanned for `.css` files).
    cssFiles: [
      'packages/design-system/src/tokens',
      'packages/design-system/src/theme.css',
      'packages/design-system/src/utilities.css',
    ],
    // Extra CSS that defines domain tokens.
    extraCssFiles: [
      'apps/frontend/portal/src/shared/utils/rescueStatus/rescueStatusColors.css',
    ],
  },
},
```

The repository root is found by walking up from the plugin until a
`pnpm-workspace.yaml` is found. A configured path that does not exist is
reported as a lint error on the linted file — a misconfigured path is never
silently ignored. The parsed CSS is cached per process, so a full lint run
reads every CSS file exactly once.

From the CSS the plugin collects:

- every `--token-name:` declaration → the valid **token** set,
- every `@utility name` → the valid **project utility** set.

## Resolution

For one class:

1. the leading variants are stripped (`hover:bg-primary` → `bg-primary`),
2. the trailing opacity modifier is stripped (`ring-ring/50` → `ring-ring`),
3. an arbitrary value is allowed, unless it is a bare number
   (`p-[13]`) or it reads a design token directly
   (`bg-[var(--color-primary)]`),
4. a project `@utility` is always valid,
5. a class whose prefix is not token-backed is left to Tailwind,
6. otherwise the class must resolve to a token of the namespace its family
   reads (`bg-primary` → `--color-primary`).

The error message names the class, the token it looked for and the tokens
that do exist in that namespace.

## Tests

```bash
pnpm --filter @pawhaven/eslint-plugin-design-colors test
```
