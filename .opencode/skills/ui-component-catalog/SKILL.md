---
name: ui-component-catalog
description: Find and verify existing PawHaven @pawhaven/ui components before reuse or replacement.
---

# UI Component Catalog

Load when choosing, reusing, or replacing a shared UI component.

## Lookup

1. Search `references/component-index.md` using the intended behavior and synonyms.
2. Open the selected component's `README.md`.
3. Verify the source and exported types before relying on props or behavior.
4. Inspect its Storybook story and tests for usage and supported edge cases.
5. Prefer a suitable shared component over a local duplicate. If no match exists, search `packages/ui/src/components/`; do not invent a component.

## Imports

- Use `@pawhaven/ui` only for components exported by `packages/ui/src/index.ts`.
- Import form controls from `@pawhaven/ui/form` and use them within the required React Hook Form context.
- Follow the project's existing style setup and design tokens.

## Maintain the index

When a component is added, removed, renamed, or changes purpose, update only its relevant row in `references/component-index.md`. Keep the index a locator: keywords, purpose, and source/doc/test/story paths. Do not copy component README or API content into this Skill.
