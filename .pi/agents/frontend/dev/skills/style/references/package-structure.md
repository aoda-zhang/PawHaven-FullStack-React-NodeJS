# Design system package structure

## File layout

```
packages/design-system/
├── index.css           # CSS entry: tailwindcss + tokens + theme + utilities + base
└── src/
    ├── theme.css       # semantic token mappings, consumed by Tailwind (bg-primary, text-muted, …)
    ├── utilities.css   # custom @utility classes (btn-primary, card, input-field, etc.)
    └── tokens/         # primitive CSS @theme blocks
        ├── index.css      # barrel: one @import per token file
        ├── color.css       # 7 color scales: gray, orange, green, red, yellow, blue, brown
        ├── typography.css  # fonts: Inter/Nunito (sans), Poppins (heading), Merriweather (serif)
        ├── spacing.css     # spacing scale + container widths
        ├── radius.css      # xs → 3xl + full
        ├── shadow.css      # xs → xl + shadow colors
        ├── motion.css      # duration (75ms → 1000ms) + easing curves
        ├── breakpoint.css  # xs → 2xl
        ├── border.css      # 0 → 8px
        ├── opacity.css     # 0 → 100
        ├── sizing.css      # width/height primitives
        └── z-index.css     # 0 → 50 + auto
```

The load order in `index.css` is the dependency order: primitive `tokens/` first, then the
semantic `theme.css` mapping onto them, then `utilities.css` on top. A value that has to be
resolved in a different order will not compile into the expected class.

## Export surface

The package is CSS-only. `package.json` declares:

```json
"exports": {
  "./index.css": "./index.css",
  "./tokens": "./src/tokens/index.css"
}
```

There is no `main` and no `types`, so the package resolves only as a stylesheet. A TypeScript import
of token values — `import { color } from '@pawhaven/design-system'` — does not resolve, and there is
no typed token export list to read. A value needed outside a className comes from the CSS custom
property or from a Tailwind utility class instead.
