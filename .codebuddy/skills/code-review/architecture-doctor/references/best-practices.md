# Architecture Doctor — Best Practices

Companion to `SKILL.MD`. Load this only when doing deep architecture review.

## Dependency Direction (never invert)

```
shared ← design-system ← ui ← frontend-core ← portal / admin
shared ← backend services
```

- `@pawhaven/ui` must NOT import from `frontend-core` or features.
- `@pawhaven/frontend-core` must NOT import from `features`.
- `apps` depend on `packages`; packages never import `features`.
- Backend modules talk only via public service facade, never internal entities/use-cases/DTOs.

## Graduation Rule (component promotion)

- Used by **1 feature** → lives in `features/{Feature}/components/`.
- Used by **2+ features** and pure UI → graduate to `@pawhaven/ui`.
- Used by **2+ features** and business-aware → graduate to `@pawhaven/frontend-core`.
- Used by **3+ features** with complex state → consider its own package (needs README + tests).

## Quick Triage

1. Run `git diff --name-only develop...HEAD` to scope the review.
2. Blocking first: cross-module, cross-feature, inverted package deps.
3. Warnings: missing graduation, feature structure gaps, duplicate types, API inconsistency.
4. Suggestions: missing ADR for significant architecture change.

## Common Mistakes

- Importing a sibling feature's `types` directly → move shared types to `@pawhaven/shared`.
- Defining DTOs in both frontend and backend → Blocking (single source in `@pawhaven/shared`).
- Business logic for module B living in module A's service.
- Creating a module with no clear aggregate root.
- `useQuery` in `mutations.ts` or `useMutation` in `queries.ts` → move to the correct file.
- Duplicate exports across `queries.ts` and `mutations.ts` → keep each hook in exactly one file.
- Empty `queries.ts` / `mutations.ts` (`export {};` placeholder) → delete the file when no hook exists.
