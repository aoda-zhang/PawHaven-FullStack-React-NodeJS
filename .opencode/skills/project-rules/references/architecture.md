# Architecture Rules

> **Applies to**: All agents. Defines architecture-level constraints for the PawHaven codebase.
> **Complements**: Architecture docs in `docs/`, architecture-doctor in `skills/code-review/`.

## 1. Module Responsibility

- Each backend module in `core-service` owns one domain slice — a resource (`rescues`,
  `adoptable-pets`, `animal-follow`) or a page (`home`, `guide`, `bootstrap`).
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

- ✅ Module A → Module B's public service class, through NestJS DI
- ❌ Module A → Module B's internal files
- ❌ Module A → Module B's Prisma models directly
- ❌ An event bus, queue, or pub/sub — none exists in this repo

**The supported path is a direct DI call, and there is exactly one of them today**: `home` →
`adoption` and `home` → `rescue`. A second cross-module edge needs a reason. Adding an event
mechanism is an architecture decision, not an implementation detail. Details in
[services](./services.md) §5.

## 4. Cross-Feature Isolation (Frontend)

- Features in `features/<Name>/` are isolated — NO cross-feature imports allowed.
- If a component is needed by 2+ features, graduate to `@pawhaven/ui` (pure UI) or `@pawhaven/frontend-core` (business-common).
- `@pawhaven/shared` is the ONLY shared source for types and schemas.

## 5. New Feature Default

- New features default to a **new module in core-service** (backend) and a **new feature directory** (frontend).
- A new deployable service requires explicit justification: independent scaling, separate DB, different tech stack.

## 6. API Design Consistency

- Controller paths are kebab-case and name the resource: `rescues`, `adoptable-pets`,
  `animal-follow`, `report-animal`. Naming is **not** uniformly plural — `home`, `guide`, and
  `bootstrap` are not.
- Inbound validation uses the NestJS `schema` option: `@Body({ schema: XSchema })`.
  `nestjs-zod` and `ZodValidationPipe` are not dependencies (see [services](./services.md) §6).
- Controllers → Service. Other modules → the sibling's Service, through DI. **There is no
  Use-Case layer** — a module is three files.
- API contracts live in `packages/shared/types/*.schema.ts` as Zod schemas plus TypeScript types,
  imported as `@pawhaven/shared/types`.

## 7. Architecture Decisions

No ADR records — do NOT create `ADR/` files. When a decision changes the architecture (paradigm change, cross-cutting concern, irreversible or non-obvious trade-off), update the living architecture docs in `docs/` directly so they stay current.

## 8. No Hardcoded Business Values

Any value that expresses a **business or operational decision** must come from configuration — never from a literal in source code.

```ts
// ❌ WRONG — a business decision frozen in source
const ADOPTABLE_PET_LIMIT = 6;
const VOLUNTEER_BASELINE = 120;
const MAX_ROUTE_DEPTH = 3;

// ✅ CORRECT — read from config, fail fast when missing
const limit = configService.getOrThrow<number>('home.adoptablePetLimit');
```

**Where config lives**: `apps/backend/<service>/src/config/<env>/env/index.json` (dev / test / uat / prod), read through `ConfigService` with `getOrThrow`. The path is hard-pinned by `ConfigsModule` — `describeSources` names it explicitly — so it cannot move, and `${...}` placeholders resolve from `.env*` / `process.env`, which are merged underneath the JSON.

**Why**: these values are operational, not structural. Product owners tune them per environment — more carousel items in prod, a smaller page size in test — without a code change, PR, or release. A literal forces a deploy for a tuning decision and silently applies one environment's choice to all four.

**Classification**

| Value                                                                 | Belongs in       | Examples                                                                                            |
| --------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------- |
| Business rule, threshold, limit, quota, baseline figure, page size    | **Config**       | `home.adoptablePetLimit`, `home.volunteerBaseline`, `http.maxJsonBodySize`, `auth.sessionExpiresIn` |
| Protocol / structural constant that cannot vary without a code change | **Source const** | `BYTES_PER_MB`, HTTP status codes, Zod schema limits that _define_ the API contract                 |
| Derived from another constant                                         | **Source const** | `BYTES_PER_KB * BYTES_PER_KB`                                                                       |

**No fallbacks.** Missing config must fail loudly at startup via `getOrThrow` — never degrade to a default. A silent default hides a broken deployment until it is in front of users.

> **Lint-clean is not the goal — configurability is.** Extracting a literal into a named const (`const MAX_ROUTE_DEPTH = 3`) satisfies `no-magic-numbers` but still violates this rule. When a business value is flagged as a magic number, the fix is to move it to config, not to name it.

**Review enforcement**: a reviewer seeing a new/edited `const` whose name reads like a business quantity (LIMIT, BASELINE, MAX__, MIN__, *_COUNT, *_SIZE, *_THRESHOLD, *_DAYS) must flag it and require config. Existing violations are grandfathered but must not be copied into new code.
