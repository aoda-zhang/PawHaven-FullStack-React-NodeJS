# Architecture Rules

> **Applies to**: All agents. Defines architecture-level constraints for the PawHaven codebase.
> **Complements**: Architecture docs in `knowledge/`, architecture-doctor in `skills/code-review/`.

## 1. Module Responsibility

- Each backend module in `core-service` owns ONE domain aggregate root.
- Frontend features in `features/<Name>/` own ALL business logic for that feature.
- Shared packages have a strict dependency direction (see Rule 2).

## 2. Dependency Direction

```
shared ← design-system ← ui ← frontend-core ← portal / admin
shared ← backend services
```

- `shared`: Zero dependencies (leaf package)
- `design-system`: Depends on `shared` for type tokens only
- `ui`: Pure UI — depends on `design-system` + `shared`, NEVER on `frontend-core` or features
- `frontend-core`: Shared business infrastructure — depends on `shared` + `ui` + `design-system`, NEVER on features
- Apps (`portal`, `admin`): Import from packages, NEVER from other apps

## 3. Cross-Module Communication (Backend)

- ✅ Module A → Module B's public service class (via NestJS DI)
- ✅ Module A → EventBus (publish typed event, Module B subscribes)
- ❌ Module A → Module B's internal files (entities, use-cases, DTOs)
- ❌ Module A → Module B's Prisma models directly

## 4. Cross-Feature Isolation (Frontend)

- Features in `features/<Name>/` are isolated — NO cross-feature imports allowed.
- If a component is needed by 2+ features, graduate to `@pawhaven/ui` (pure UI) or `@pawhaven/frontend-core` (business-common).
- `@pawhaven/shared` is the ONLY shared source for types and schemas.

## 5. New Feature Default

- New features default to a **new module in core-service** (backend) and a **new feature directory** (frontend).
- A new deployable service requires explicit justification: independent scaling, separate DB, different tech stack.

## 6. API Design Consistency

- REST endpoints use plural resource naming: `/api/rescues`, `/api/stories`
- All controllers use `ZodValidationPipe` from `nestjs-zod`
- Controllers → Service (facade) → Use-Case. Other modules → Service (DI).
- API contracts live in `packages/shared/` as Zod schemas + TypeScript types.

## 7. ADR Requirements

Create an ADR for: architecture paradigm change, cross-cutting concern (3+ modules), irreversible decision, non-obvious trade-off.

ADR template: `knowledge/ADR/ADR-001-template.md`
