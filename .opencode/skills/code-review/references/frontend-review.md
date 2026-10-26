# Frontend Code Review Reference

Load when the diff affects frontend code (React UI, routing, client state/data, UI packages, design tokens, or localization changes).

## Review checklist

- User-visible behavior and relevant state transitions
- React lifecycle, state, and query/cache correctness
- Route and authorization boundaries
- Accessible semantics and keyboard behavior (WCAG 2.1 AA)
- Localization across supported locales (i18n keys, pluralization, RTL)
- Shared UI and design-token use — **load `ui-component-catalog` to verify component reuse**
- Responsive behavior and regression coverage

## Canonical docs

- `docs/context/frontend-architecture.md`
- `docs/context/frontend-development-patterns.md`

Treat those documents as the canonical rules rather than restating them.

## Output

Report only evidence-backed defects or material risks, not personal preferences. Use the finding format defined by the Reviewer agent.
