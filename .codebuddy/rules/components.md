# Component Building Rules

Hard constraints for writing React components in this repo. These apply to **all** React/TSX code in `apps/` and `packages/` (feature components, shared `packages/ui` components, layout/route elements). A violation is a blocking finding in code review, regardless of how well the component otherwise works.

## 1. React 19 — no `forwardRef`

The repo runs **React 19** (`react`/`react-dom` are `^19.x`). In React 19, function components implicitly accept a `ref` prop, so `forwardRef` is **obsolete and must not be used**.

- ❌ `const X = forwardRef<HTMLInputElement, Props>((props, ref) => ...)` + `X.displayName = 'X'`
- ✅ Plain function component that receives `ref` in its props:

```tsx
// ref is a normal prop — set its type explicitly
interface StyledInputProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

const StyledInput = ({ className, ref, ...props }: StyledInputProps) => (
  <input ref={ref} className={className} {...props} />
);
```

Notes:

- `displayName` is no longer required for the ref fix — a named function/const already gives the devtools name. Set `displayName` only when you genuinely need a custom display string.
- This also applies to any custom component, hook wrapper, or third-party-lib `inputComponent` where a `ref` must reach a DOM node.

## 2. Props & API surface

- Define an explicit `Props`/`*Props` interface for every component; never use bare inline object params for externally-consumed components.
- Prefer composition + `children` over prop-drilling deep config; keep components single-responsibility.
- No business logic or side effects inside presentational components — they are `UI = f(props)`. Data fetching/state lives in feature containers or via TanStack Query. (See `principles/` and the react skill.)

## 3. Styling

- Use Tailwind utility classes with design tokens from `@pawhaven/design-system` only. No hardcoded colors, no inline `style={{}}`, no magic numbers. (See `documentation.md` / styling skill.)
- Centralize repeated class strings via `cn()` (`@pawhaven/frontend-core`) when reused across 2+ components.

## 4. Accessibility (a11y)

- Use semantic HTML (`button`, `input`, `nav`, `main`, `label`) — not divs with click handlers.
- Pass through `aria-*` and any `ref`/event props; do not swallow them.
- Interactive targets must be keyboard-operable; provide `alt`/`aria-label` for non-text content.

## 5. Types & purity

- `import type` for type-only imports (e.g. `import type { Ref } from 'react'`).
- Components must be deterministic given props — no hidden global state mutation.

---

**Scope reminder**: these rules are always-on for any TSX change. The orchestrator verifies compliance at pipeline stage transitions (STEP 5b of `pawhaven.md`); subagents must obey them without being reminded.
