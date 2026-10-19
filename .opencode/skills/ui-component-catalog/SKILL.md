---
name: ui-component-catalog
description: Find and correctly reuse PawHaven shared UI components. Use when implementing, refactoring, reviewing, or answering questions about UI components, forms, buttons, feedback, loading states, carousels, timelines, phone inputs, or the @pawhaven/ui library.
---

# UI component catalog

Use this skill to **find the right existing component**, not as a replacement for its documentation.

## Lookup workflow

1. Match the user's words and intended behavior against [the component index](references/component-index.md). Match synonyms and keywords, not only exact component names.
2. Open the selected component's `README.md` for its purpose and usage constraints.
3. Inspect the component source and exported types before writing code. The index is a locator, not an API contract.
4. Check the linked Storybook story for a real usage example and the component's test file for supported behavior and edge cases.
5. Prefer an existing shared component over a local duplicate. Do not assume a component supports a prop unless the source/type confirms it.
6. If several components match, compare their purpose and import path before choosing. Ask a concise question only when the UI intent remains ambiguous.
7. When no entry matches, search `packages/ui/src/components/` and `libs/ui-storybook/stories/`; do not invent a component.

## Import rules

- Components exported by `packages/ui/src/index.ts` can be imported from `@pawhaven/ui`.
- Form controls are exported from `@pawhaven/ui/form` and require a React Hook Form `FormProvider` / `useFormContext` context.
- Import shared UI styles through the existing application setup. Do not add ad hoc component CSS or magic values before checking the Design System tokens and current usage.
- Follow the component's existing accessibility semantics and test patterns.

## Keep the index useful

When a UI component is added, removed, renamed, or its purpose changes, update only the relevant row in `references/component-index.md`. Keep entries compact: purpose, matching keywords, and source/doc/test/story locations. **Do not copy component README contents or API documentation into this skill.**
