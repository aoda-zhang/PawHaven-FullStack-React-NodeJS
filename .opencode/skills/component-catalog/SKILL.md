name: Component Catalog
version: 1.0.0
description: Tell agents which UI and frontend-core components are available, where they live, and how to use them.

Use when the agent needs to pick or reference a PawHaven component.

---

## Catalog rules

- Check `packages/ui/src/components/` for design-system UI components (11 total: button, carousel, form, loading, notification-banner, phase, phone-input, photo-placeholder, skeleton, timeline, toast).
- Check `packages/frontend-core/src/components/` for core frontend components (11 total: brand, content-fallback, error-display, file-download-button, language-selector, multi-image-upload, not-found, require-auth, router-error-fallback, suspense-wrapper, system-error).
- Every component folder now contains a `README.md` with its package path and import hint.
- Each package exports via `index.ts`; prefer importing from package root rather than deep paths when possible.

## How to recommend a component

1. Identify the need (e.g., error state, form input, brand header).
2. Search this catalog by purpose / folder name.
3. Confirm the folder has a `README.md` and an `index.ts` export.
4. Suggest the import path (`@pawhaven/ui` or `@pawhaven/frontend-core`).
5. If the agent needs props/details, read the source `index.ts` or component file inside the folder.

## Examples

- Error display: `packages/frontend-core/src/components/error-display`
- Button / loading / toast: `packages/ui/src/components/button`, `loading`, `toast`
- Auth gate: `packages/frontend-core/src/components/require-auth`
- Brand header: `packages/frontend-core/src/components/brand`

---

Do not invent components not listed above; if missing, ask the human to add a README and export.
