---
name: frontend-development
description: Implement React UI, routes, client state, design-system, localization, and frontend package changes using PawHaven's canonical patterns.
---

# Frontend development entry point

Use for React pages/components, routes, browser state, frontend data access, UI packages, design tokens, or localization.

1. Read `docs/context/frontend-architecture.md` for ownership/dependency direction and `docs/context/frontend-development-patterns.md` for implementation rules. Read relevant sections only.
2. For component selection/reuse, load `ui-component-catalog` first. Verify README, source/exported types, story, and tests; the index is not an API contract.
3. Preserve page ownership, query/mutation boundaries, shared schemas, localization, and design tokens. Do not duplicate a schema, component, query key, or token.
4. If API/shared schema boundaries change, trace producer and consumer; load `backend-development` when backend files are in scope.
5. Add/update tests only within approved scope. Use existing scripts and conventions; do not invent scripts or install a framework.
6. For React page/component changes, run the project's React Doctor check when available and report the exact result.
7. Hand off changed files, states covered, checks, and remaining risks.
