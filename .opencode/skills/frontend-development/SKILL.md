---
name: frontend-development
description: Implement frontend changes using PawHaven's canonical frontend patterns.
---

# Frontend Development

Load for React UI, routing, client state/data, UI packages, design tokens, or localization changes.

## Required actions

1. Read the relevant sections of `docs/context/frontend-architecture.md` and `docs/context/frontend-development-patterns.md`. Treat them as the source of truth; do not restate their rules here.
2. Implement only the approved change and follow those documents. If a required decision is not covered there, make the smallest justified addition and explain it.
3. When selecting or reusing a shared UI component, load `ui-component-catalog` and verify the component's source and exported types.
4. For API or shared-schema changes, trace the producer and consumers; load `backend-development` when backend files are in scope.
5. For React page or component changes, run the project's React Doctor check when available.
6. Report changed files, relevant patterns checked, exact checks and results, and unresolved gaps.
