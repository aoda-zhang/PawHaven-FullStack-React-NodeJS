# Boundaries

The rule statements for every boundary in this repo. The doctors hold the commands that check them;
this file holds what the rule is.

## Dependency direction

```
packages/shared
  ← packages/design-system
    ← packages/ui
      ← packages/frontend-core
        ← apps/frontend/*

packages/shared  ←  apps/backend/*        (services never import each other)
```

A lower layer may never import an upper one. The checked violations are:

| Violation                                         | Checked by                                                                      |
| ------------------------------------------------- | ------------------------------------------------------------------------------- |
| `@pawhaven/ui` imports `@pawhaven/frontend-core`  | `boundary-doctor`                                                               |
| A package imports app feature code                | `boundary-doctor`                                                               |
| `apps/backend/**` imports a frontend package      | `typescript-doctor`                                                             |
| A backend service imports another backend service | [service boundaries](../../../../../../docs/architecture/service-boundaries.md) |

## Backend module boundary

- A module exports **its service and nothing else**. `exports: [SomeService]`.
- Another module reaches it through NestJS DI and the exported service. Never through its internal
  files, entities, its own Prisma model, or its controller.
- A module never imports another module's Zod schema. Schemas live in `@pawhaven/shared/types` and
  both sides import the same one.
- There is **no event bus**. Cross-module communication is an exported service method or it does not
  happen yet. Adding one is a design decision, not a convention.

## Frontend feature boundary

- A feature never imports another feature's internals. Shared code graduates to `@pawhaven/ui` (pure
  presentation) or `@pawhaven/frontend-core` (business-aware).
- Type-only sharing across the app shell is not this violation.
- The router is the composition root and imports every feature on purpose. It is exempt.

## Package boundary

A component or hook used by two or more features graduates out of a feature directory. A component
with exactly one consumer stays with it.

## Service boundary

The four services and their ownership are in
[service-boundaries.md](../../../../../../docs/architecture/service-boundaries.md). A change that gives one
service a responsibility another owns is an architecture change, not a feature.

## What a boundary change has to carry

1. The new owner, named.
2. Every call site that has to move, and whether it moves in the same change.
3. The contract between the two sides, at a code level `packages/shared/types`.
4. The `docs/architecture/` update, in the same change.
