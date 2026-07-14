# ADR-002: Module Boundary Enforcement

| Field             | Value           |
| ----------------- | --------------- |
| **Status**        | Accepted        |
| **Date**          | 2026-07-14      |
| **Deciders**      | Architect Agent |
| **Supersedes**    | --              |
| **Superseded By** | --              |

## Context

PawHaven's backend uses a modular monolith architecture within `core-service`. Each module represents a bounded context with its own entities, use-cases, and events. Without clear boundary rules, modules can become tightly coupled through direct imports, defeating the purpose of the modular architecture.

The frontend follows a similar pattern with feature-based modules under `apps/frontend/portal/src/features/`. Cross-feature imports create the same coupling problem.

## Decision

### Backend Module Boundaries

```
ALLOWED:
  Module A → Module B's public service class (via NestJS DI)
  Module A → EventBus (publish typed events from @pawhaven/shared)
  Module A → @pawhaven/shared (shared types, schemas, constants)

FORBIDDEN (enforced by ESLint):
  Module A → Module B's internal files (entities/, use-cases/, DTO/)
  Module A → Module B's Prisma models directly
  Module A → Module B's controller
```

Enforcement: ESLint rule `no-restricted-imports` configured per module.

### Frontend Feature Boundaries

```
ALLOWED:
  Feature A → @pawhaven/ui (shared pure UI components)
  Feature A → @pawhaven/frontend-core (shared hooks, auth, API client)
  Feature A → @pawhaven/shared (shared types, schemas)
  Feature A → @pawhaven/i18n (translation)

FORBIDDEN (enforced by ESLint):
  Feature A → Feature B's internal files (components/, hooks/, apis/)
  Feature A → Feature B's index.tsx (direct component import)
```

### Component Graduation Rule

When a component is needed by 2+ features:

- **Pure UI** (no API calls, no auth, no business logic) → graduate to `@pawhaven/ui`
- **Business-common** (auth guards, domain widgets, API-aware) → graduate to `@pawhaven/frontend-core`

## Consequences

**Positive:**

- Each module/feature can evolve independently
- Changes in one module won't accidentally break another
- Clear graduation path for shared components
- ESLint provides automated enforcement — violations caught at lint time

**Negative:**

- Cross-module communication requires explicit event contracts or service facades
- Graduating a component requires moving files and updating imports
- New contributors must learn the boundary rules

## Alternatives Considered

| Option                                | Why Rejected                                                       |
| ------------------------------------- | ------------------------------------------------------------------ |
| No boundaries (free imports)          | Leads to spaghetti dependencies; impossible to refactor            |
| Microservices for every module        | Unnecessary complexity at current scale; added deployment overhead |
| Shared service layer only (no events) | Loses loose coupling benefits; creates direct dependency chains    |
