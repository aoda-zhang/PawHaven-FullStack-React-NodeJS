---
name: style
description: >
  Styling standards and design-token enforcement for the PawHaven portal. Semantic Tailwind
  utilities from `@pawhaven/design-system` only. No raw hex, no raw color names, no magic
  pixel values, no inline styles. Use when writing or reviewing any className.
  触发场景 / Trigger: style css className tailwind token color spacing theme dark mode 样式.
---

# Style

## Source of truth

Tokens live in `packages/design-system/src/tokens/`. Consume them as **semantic Tailwind
utilities**. Never read a token file to hand-write a value.

```tsx
// ✅ semantic utilities
<div className="bg-card text-text-secondary border-border hover:bg-muted" />

// ❌ raw values, always
<div style={{ background: '#1a1a1a' }} />
<div className="bg-[#1a1a1a] text-[#333]" />
<div className="text-gray-500" />
<div classNameName="p-[13px]" />
```

## Spacing, sizing, radius

- Use the scale: `p-4`, `gap-2`, `w-1/2`. Arbitrary values (`p-[13px]`) are banned.
- No raw `px` in arbitrary values or inline styles. No `style={{ width: '10px' }}`.
- Radius from the scale: `rounded`, `rounded-md`, `rounded-lg`, `rounded-full`.
- Layout containers: `max-w-6xl px-4` pattern, matching existing pages.

## Color

- Semantic only: `bg-primary text-primary-fg`, `bg-card`, `bg-muted`, `text-text-secondary`,
  `border-border`, `text-foreground`.
- Never a hex value. Never a raw Tailwind palette name (`gray-500`, `blue-600`).
- Never `var(--...)` directly, never a CSS variable bypass.
- Dark mode comes from the token set. Do not add a `dark:` variant to bypass it.
- No inline `style={{}}` for any static value — a utility class exists for it.

## Typography

- Scale utilities only: `text-sm`, `text-base`, `text-lg`, `font-medium`, `leading-relaxed`.
- No arbitrary `text-[14px]`, no arbitrary weight, no arbitrary line-height.

## Effects

- Shadows and filters from the scale: `shadow-sm`, `rounded-lg`. No arbitrary blur/filter values.

## Class composition

- Merge with `cn()` from `@pawhaven/frontend-core` when a component accepts `className`.
- Keep class lists flat and readable. Extract a constant when the list exceeds the line.
- No dynamic class string concatenation — no `` `bg-${color}` ``. Use a static map.

## Order

- Class order is enforced by `prettier-plugin-tailwindcss`. Do not hand-sort; run Prettier.

## Doctor

[style-doctor](../../../review/skills/style-doctor/SKILL.md) — the GATE for UI changes ·
Rule 1 raw hex · Rule 2 raw color names · Rule 3 CSS variable bypass ·
Rule 4/4b/4c/4d magic px and inline `style={{}}` · Rule 4e arbitrary font values ·
Rule 5 magic blur/filter · Rule 6 Prettier
