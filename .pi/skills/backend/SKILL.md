---
name: backend
description: >
  PawHaven backend implementation standards, verified against the real codebase. Covers the flat
  core-service module shape, the @pawhaven/backend-core export surface, MongoDB via @InjectPrisma,
  Zod schemas from @pawhaven/shared/types with inbound @Body({ schema }) AND outbound .parse(),
  and the gateway-owned auth boundary. Read before writing or changing any NestJS module, controller,
  service, Prisma model, or backend endpoint.
  Trigger: backend development NestJS module provider dependency injection decorator guard
  interceptor pipe filter middleware, controller endpoint route RESTful CRUD, service provider
  facade, prisma ORM schema model migration seed relation mongodb ObjectId, DTO validation zod schema
  parse request body response serialization, microservices event emitter inter-service communication,
  auth guard public optional internal jwt claims, shared types package import, monorepo workspace
  package export subpath.
---

# Backend Standards

Everything here was read out of the running codebase. Where the previous `.codebuddy/agents/backend.md`
disagreed with the code, the code won and the difference is called out under
[Corrections](#corrections-to-the-old-docs) — read that section before trusting any older note.

## Module shape

A core-service module is **flat**. There is no `entities/`, `use-cases/`, `events/`, or `DTO/`
directory, and no `index.ts` barrel.

```
src/modules/<name>/
├── <name>.module.ts        # @Module({ controllers, providers, exports })
├── <name>.service.ts       # the module's entire public API
├── <name>.controller.ts    # HTTP endpoints only
└── <name>.service.test.ts  # co-located vitest
```

Current modules: `adoption` · `animal-follow` · `bootstrap` · `guide` · `home` · `report-animal` ·
`rescue`. **Discover this list at runtime — do not trust it from memory or docs**, it changes as
features ship.

Export the service and nothing else. It is the only surface other modules may touch.

```typescript
@Module({
  controllers: [RescueController],
  providers: [RescueService],
  exports: [RescueService],
})
export class RescueModule {}
```

Auth, document, and config are **separate services**, not core-service modules. Do not add core
modules to them.

→ Full annotated module: [references/module-anatomy.md](./references/module-anatomy.md)

## `@pawhaven/backend-core` is the backend toolkit

It has **no `src/`** — source sits at the package root. Its root `index.ts` deliberately exports
**only** the core models; everything else must be imported by subpath, for performance.

```typescript
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import { OptionalAuth, Public } from '@pawhaven/backend-core/decorators';
import { InternalJwt } from '@pawhaven/backend-core/internal-jwt';
import type { AuthenticatedInternalJwt } from '@pawhaven/backend-core/types';
```

Other subpaths: `constants` · `decorators` · `internal-jwt` · `config-module` · `middlewares` ·
`trace` · `logging` · `types` · `setup` · `utils`. Root exports: `SharedModule` · `InternalJwtModule` ·
`InternalJwtGuard` · `InjectPrisma` · `SwaggerService` · `HttpClientService` ·
`collectServiceConfigSources`.

Never reach into another module's internals. It is a **convention, not a lint rule** — there is no
`no-restricted-imports` in `libs/eslint-config/`, so nothing will stop you but a reviewer will.

## Data and validation

Prisma targets **MongoDB**. The client is generated into `src/prisma/mongodb/client/` and reached
through the `@prismaClient` path alias. Inject it with a decorator, not a typed constructor param.

```typescript
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import { PrismaClient, type animalReports } from '@prismaClient/index.js';

@Injectable()
export class RescueService {
  constructor(
    @InjectPrisma(databaseEngines.mongodb)
    private readonly prisma: PrismaClient,
  ) {}
}
```

Validation is **Zod from `@pawhaven/shared/types`, at both edges.** Inbound, the schema object goes
to `@Body`. Outbound, the response is `.parse()`d before it leaves the service. Never redefine a
schema on the backend — if the type is not in `packages/shared`, that is the actual bug.

```typescript
// inbound
@Post()
create(@Body({ schema: CreateRescueDtoSchema }) dto: CreateRescueDto) { ... }

// outbound — validate before returning, do not trust the shape you built
return RescueListItemSchema.parse({ ... });
```

→ [references/data-and-validation.md](./references/data-and-validation.md)

## Auth boundary — non-negotiable

The **gateway alone** owns browser cookies and browser JWTs. It signs a short-lived **ES256** internal
JWT into `x-gateway-jwt` — a private key signs, a `kid`-keyed public key verifies; this is not HS256
and not a shared secret. Downstream services never see a browser token. A global `InternalJwtGuard`
verifies it and **fails closed**.

Endpoint policy is declared, never inferred:

| Decorator         | Meaning                                 |
| ----------------- | --------------------------------------- |
| _(none)_          | Authenticated. Default.                 |
| `@Public()`       | No identity required.                   |
| `@OptionalAuth()` | Identity used if present, not required. |

Read identity with `@InternalJwt()`, never by parsing headers or cookies directly. A handler that
does anything else is a **blocking** finding regardless of how clean it looks.

→ [references/auth-boundary.md](./references/auth-boundary.md)

## Conventions the linter will and will not catch

`libs/eslint-config/node.js` sets `max-classes-per-file`, `import/order` (with `newlines-between:
always`) as **warnings**, not errors, and switches `prettier/prettier` off there — root Prettier
still applies.

`no-console: 'off'` and `no-explicit-any`-as-warning are stated where they are enforced — in
[backend-doctor](../code-review/backend-doctor/SKILL.md), whose `rg` commands are the only check for
either. A `pnpm lint` pass does **not** prove module boundaries were respected either. Read the diff
for those yourself. Use NestJS's `Logger` (`private readonly logger = new Logger(X.name)`, as every
core-service module does) rather than `console` anyway — that is a project convention, not an
enforced rule.

Relative imports carry an explicit `.js` extension (ESM / NodeNext).

## Running the checks

```bash
pnpm --filter @pawhaven/core-service typecheck
pnpm --filter @pawhaven/core-service build
pnpm --filter @pawhaven/core-service test
cd apps/backend/core-service && npx prisma validate
```

The lint baseline and how to read it live in [testing-standards](../testing-standards/SKILL.md#baseline):
`pnpm lint` exits non-zero from pre-existing errors, so diff against the baseline before calling a
failure a regression you caused. Use `npx turbo run lint --continue` to see all of them; a plain
`pnpm lint` stops at the first failing package and hides the rest.

There is no cross-module import linter. Run the grep yourself when it matters:

```bash
grep -rE "from '.*modules/[a-z-]+/" apps/backend/core-service/src/modules/ --include="*.ts" \
  | grep -v "\.test\.ts"
```

## Corrections to the old docs

`.codebuddy/agents/backend.md` is gone and several of its claims were false — a flat module tree, no
event bus, MongoDB rather than a SQL Prisma client, no `ZodValidationPipe`. Do not reintroduce them.

→ [references/retired-harness-corrections.md](./references/retired-harness-corrections.md) — the
claim-by-claim list, and what each one is contradicted by.
