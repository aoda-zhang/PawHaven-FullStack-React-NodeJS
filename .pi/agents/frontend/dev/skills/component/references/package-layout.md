# component — Shared Package Layout

Which folder a new file belongs in, what the barrels re-export, and which imports a
package is allowed to make. The naming and export rules live in `SKILL.md` §5.

## Contents

| Section                                           | What it answers                                 |
| ------------------------------------------------- | ----------------------------------------------- |
| [File and folder naming](#file-and-folder-naming) | What each file in a component folder is called  |
| [Directory layout](#directory-layout)             | Where components, utils, and barrels live       |
| [The `cn` rule](#the-cn-rule)                     | How a package imports its own class-name helper |
| [Barrel composition](#barrel-composition)         | What each barrel re-exports                     |

---

## File and folder naming

```
ComponentName.tsx         # One public component per file
ComponentName.test.tsx    # Co-located tests
ComponentName.module.css  # Co-located CSS modules (only when Tailwind can't express it)
index.ts                  # Barrel export — ONLY re-exports public components
```

---

## Directory layout

In `@pawhaven/ui`, **every pure component folder lives under `src/components/`**:

```
packages/ui/src/
  components/
    Loading/index.tsx
    Button/index.tsx
    Form/
      FormInput/index.tsx
      formBase.type.ts
  utils/cn.ts
  index.ts              # barrel → re-exports from ./components/*
```

- Component folder → `src/components/<Name>/`, entry file `index.tsx`.
- Compound families (e.g. `Form/*`) group under `components/<Family>/<SubName>/`,
  with shared prop types in a `<family>Base.type.ts` beside them.
- The top-level barrel re-exports each `components/<Name>` path.

---

## The `cn` rule

Shared helpers live at `src/utils/cn.ts` and are **package-local per package,
imported with a relative path**:

- `@pawhaven/ui` imports its own `cn` relatively — e.g. `../../utils/cn` from a
  component two levels down.
- `@pawhaven/frontend-core` keeps its **own** `src/utils/cn.ts` and imports it
  relatively (`../../utils/cn`). It must **not** depend on `@pawhaven/ui` for `cn`,
  which is what keeps `@pawhaven/ui` free of a `frontend-core` dependency.
- Do **not** use package subpaths (`@pawhaven/ui/utils/cn`) for an internal util in a
  `tsc`-compiled package. A subpath import is not a declared export map entry, so it
  resolves at dev time and breaks for consumers of the built output.

---

## Barrel composition

```tsx
// packages/ui/src/index.ts
export { Button, buttonVariants } from './components/Button';
export { Card } from './components/Card';
export { Modal, ModalHeader, ModalBody } from './components/Modal';
```

A barrel re-exports and nothing else: no logic, no re-formatting, no conditional
exports. A consumer that imports from the barrel gets the same name the component
was declared with, which is the point of the named-export rule.
