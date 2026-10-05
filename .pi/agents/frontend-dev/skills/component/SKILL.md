---
name: component
description: >
  Where a PawHaven component belongs and how to shape it. Placement is decided by reuse count and
  business coupling: feature-local, `@pawhaven/frontend-core` for shared app infrastructure, or
  `@pawhaven/ui` for pure presentation. Use when creating, moving, or promoting a component.
  触发场景 / Trigger: component placement promote shared ui package feature split extract refactor.
---

# Component

## Placement

Decide by **reuse count** and **business coupling**. Both must be answered.

| Reuse        | Business-coupled?     | Location                                              |
| ------------ | --------------------- | ----------------------------------------------------- |
| 1 feature    | —                     | `features/<feature>/components/<Name>.tsx`            |
| 3+ features  | yes — PawHaven domain | `packages/frontend-core/src/components/<kebab-name>/` |
| 3+ features  | no — generic          | `packages/ui/src/components/<kebab-name>/`            |
| 1–2 features | yes                   | keep local. Do not promote early                      |

- **3+ business components → `frontend-core`.** It already holds `RequireAuth`, `LanguageSelector`,
  `ErrorDisplay`, `NotFound`, `FileDownloadButton`, `MultiImageUpload`, `Brand`.
- **Pure, non-business → `ui`.** It already holds `form`, `button`, `skeleton`, `toast`, `timeline`,
  `carousel`, `phase`, `loading`, `photo-placeholder`, `phone-input`, `notification-banner`.
- `ui` must not import from `frontend-core`, from a feature, or from `app`. It receives props and
  children only.
- `frontend-core` must not import from `ui`'s internals, from a feature, or from `app`.
- Never import across two features directly. Promote, or pass through a route/layout.
- Feature-private helpers stay in the feature, not in `components/`.

## Anatomy

```tsx
import type { Pet } from '@pawhaven/shared/types';

import { cn } from '@pawhaven/frontend-core';

import { StatusBadge } from './StatusBadge';

export type PetCardProps = {
  pet: Pet;
  onSelect?: (id: string) => void;
};

export const PetCard = ({ pet, onSelect, className }: PetCardProps) => (
  <article
    className={cn('border-border bg-card rounded-lg border p-4', className)}
  >
    <StatusBadge status={pet.status} />
  </article>
);
```

- Accept `className` and merge with `cn()` when the parent may need layout control.
- Forward `data-*` and standard HTML attributes on DOM-rooting components.
- `children` for composition. Slots as named props only when a child needs a behaviour.
- No `PropTypes`. No default export.

## Composition over configuration

- A component that grows boolean props (`isPrimary`, `isLarge`, `isDisabled`, `isLoading`) becomes
  variants, or splits. Do not add a fifth boolean.
- Render children in a slot; do not compute JSX from props and pass it down.
- Do not import a component to decide whether to render it. Branch at the call site.

## Data

- Presentational components receive data as props. They do not fetch.
- A component that fetches belongs in a feature container, not in `ui` or `frontend-core`.

## Banned

| Banned                              | Use instead                            |
| ----------------------------------- | -------------------------------------- |
| `import` from another feature       | promote to `frontend-core`, or compose |
| fetch inside `ui` / `frontend-core` | pass data down as props                |
| `ui` importing `frontend-core`      | invert — pass `className` down         |
| boolean prop explosion              | variants or split                      |
| `export default`                    | named export                           |

## Doctor

[boundary-doctor](../../../../skills/code-review/boundary-doctor/SKILL.md) — package dependency direction ·
[architecture-doctor](../../../../skills/code-review/architecture-doctor/SKILL.md) — placement rules
