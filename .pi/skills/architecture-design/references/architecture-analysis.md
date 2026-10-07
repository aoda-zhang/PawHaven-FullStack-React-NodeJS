# Architecture Analysis

## Placement Decision Tree

```
Q1  Does an existing module already own this?
    → ls apps/backend/core-service/src/modules/ and compare against the feature's domain
    → YES: extend it. Stop.

Q2  Is this a genuinely new bounded context?
    → Own aggregate root? Own business rules that change independently?
    → YES: new module in core-service
    → NO: extend the closest existing module. Stop.

Q3  Does it need its own deployable?
    → Independent scaling? Separate database? Different runtime constraints?
    → YES: new service — RARE
    → NO: new module in core-service (default)
```

**Default to a new module in `core-service`.** A new service is the expensive answer; reach for it
only when a module boundary genuinely cannot hold the coupling. Auth, document, and config are the
only services that are _not_ core modules — do not add core modules to them.

An abstraction with one caller is a candidate for inlining, not extraction. A new module for a single
feature is usually premature.

## Impact Analysis Checklists

### API

| Question                 | Check                                                                   |
| ------------------------ | ----------------------------------------------------------------------- |
| New endpoints?           | method, path, purpose, request body, response                           |
| Modified endpoints?      | what changes, who consumes the old shape                                |
| New shared types?        | Zod schemas to add in `packages/shared` — never redefine a DTO per side |
| Auth policy per endpoint | default-authenticated, `@OptionalAuth()`, or `@Public()`                |
| Gateway route changes?   | new path needs a proxy entry in `gateway`                               |

### Database

| Question       | Check                                                                         |
| -------------- | ----------------------------------------------------------------------------- |
| Schema change? | the model, the field, and whether existing documents have it                  |
| Query impact   | every read that has to filter or index the new field                          |
| Soft delete    | a new query that does not carry the soft-delete filter                        |
| Regeneration   | `npx prisma generate` from `apps/backend/core-service` after the schema moves |

The Prisma and MongoDB rules themselves are owned by
[the backend data reference](../../backend/references/data-and-validation.md).

### Frontend

| Question            | Check                                                                            |
| ------------------- | -------------------------------------------------------------------------------- |
| New feature folder? | `apps/frontend/portal/src/features/<name>/`, or an addition to an existing one   |
| State placement     | server data in TanStack Query, client state in Redux, never server data in Redux |
| Copy                | every user-facing string through `t()`, all three locales in the same change     |
| Styling             | `@pawhaven/design-system` tokens only                                            |

The portal's current structure is owned by
[frontend-portal.md](../../../../docs/frontend-portal.md).

## Risk Classification

| Level      | Criteria                                                                                       | Example                                 |
| ---------- | ---------------------------------------------------------------------------------------------- | --------------------------------------- |
| **High**   | Breaking migration, auth flow change, cross-service dependency, changing a core model's schema | New JWT requirement                     |
| **Medium** | New module others depend on, performance-critical endpoint, contract change on shared type     | New field on shared DTO                 |
| **Low**    | Isolated new feature, no existing data or contract affected                                    | Standalone module with no inbound calls |

For anything above Low: state **what could go wrong**, **the mitigation**, and **the rollback**. A design with no rollback story for a High-risk change is not finished.
