# Frontend Development Reference

Load for React UI, routing, client state/data, UI packages, design tokens, or localization changes.

## Required actions

1. Read the relevant sections of `docs/context/frontend-architecture.md` and `docs/context/frontend-development-patterns.md`. Treat them as the source of truth; do not restate their rules here.
2. Implement only the approved change and follow those documents. If a required decision is not covered there, make the smallest justified addition and explain it.
3. When selecting or reusing a shared UI component, load `ui-component-catalog` and verify the component's source and exported types.
4. For API or shared-schema changes, trace the producer and consumers; load `development` → `references/backend-development.md` when backend files are in scope.
5. For React page or component changes, run the project's React Doctor check when available.
6. Report changed files, relevant patterns checked, exact checks and results, and unresolved gaps.

## Canonical patterns cover

- Component structure: presentational vs container, hooks, composition
- State: React Query / SWR, Zustand / Context, form state (React Hook Form)
- Routing: React Router, route guards, lazy loading, params
- Design tokens: colors, spacing, typography, dark mode
- i18n: keys, pluralization, RTL, locale switching
- Accessibility: semantics, ARIA, focus management, testing
- Performance: memo, virtualization, code splitting, bundle analysis
