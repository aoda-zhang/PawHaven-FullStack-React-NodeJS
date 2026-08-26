# style-doctor — Best Practices

Companion to `SKILL.MD`. Load when auditing styling against `@pawhaven/design-system`.

## The single decision flow (replaces all "don't" lists)

```
Need a visual value?
  ├─ 1. Custom utility in utilities.css?        → use it (btn-primary, card, input-field)
  ├─ 2. Semantic token in theme.css?            → use the class (bg-primary, text-muted)
  ├─ 3. Primitive token in src/tokens/*.css?        → use standard class (p-4, rounded-lg)
  └─ 4. None exist                              → add a token first, then use it
```

If you follow this, you never hardcode, never use magic numbers, never bypass the system.

## Forbidden (Blocking)

- Hex colors: `#fff`, `#f7823a` → use `bg-surface-primary`.
- CSS variable bypass: `bg-[var(--color-primary)]` → use `bg-primary`.

## Discouraged (Warning)

- Raw Tailwind color names: `text-red-500`, `bg-blue-100` → semantic tokens.
- Magic pixel/blur: `w-[317px]`, `mt-[12px]`, `backdrop-blur-[12px]` → spacing/scale.
- `style={{}}` with static values → utility classes (inline only for runtime-dynamic values).

## Discovery

Never rely solely on `tailwind.config.*`. Use the three-strategy discovery in `SKILL.MD`;
fail-fast if zero frontend source dirs are found. Always print the discovered dirs in the report.

## Prettier

Run `npx prettier --check "apps/**/*.{ts,tsx}" "packages/**/*.{ts,tsx}"` — warnings only.
