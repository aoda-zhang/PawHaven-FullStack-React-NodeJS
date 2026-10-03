---
name: style
description: >
  Styling standards and design-token enforcement for the PawHaven portal. Semantic Tailwind
  utilities from `@pawhaven/design-system` only. No raw hex, no raw color names, no magic
  pixel values, no inline styles. Use when writing or reviewing any className.
  触发场景 / Trigger: style css className tailwind token color spacing theme dark mode 样式.
---

# Style

The token gate itself — where tokens live, what is forbidden, the scale — is stated **once** in the
`frontend` skill: [The styling gate](../../../../../skills/frontend/SKILL.md#the-styling-gate). That
file is the single source; `style-doctor` checks against it. Do not restate the forbidden list here,
because a list written twice is a list that will disagree with itself.

What is specific to **writing** a className:

```tsx
// ✅ semantic utilities from the token set
<div className="bg-card text-text-secondary border-border hover:bg-muted" />

// ❌ always
<div style={{ background: '#1a1a1a' }} />
<div className="bg-[#1a1a1a] text-[#333]" />
```

- **Merge with `cn()`** from `@pawhaven/frontend-core` whenever a component accepts `className`.
  Omitting it means a parent cannot adjust layout.
- **No dynamic class concatenation.** No `` `bg-${color}` `` — a static map of complete class strings,
  so Tailwind's scanner sees every literal.
- **Class order is Prettier's job.** `prettier-plugin-tailwindcss` runs at commit; do not hand-sort
  and do not fight it.
- **Extract to a constant** when a class list stops being readable on one line.

**When no token fits**, the answer is to add a token to `packages/design-system/src/tokens/` and use
the generated utility — not to reach for an arbitrary value. That is the whole decision, and it is
short enough to apply without thinking.

## Doctor

[style-doctor](../../../review/skills/style-doctor/SKILL.md) — the gate for UI changes, and it
enumerates every rule. Note that `pnpm token-check` does not currently run; the doctor's commands are
the gate until that is fixed.
