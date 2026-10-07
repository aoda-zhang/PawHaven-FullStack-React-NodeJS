---
name: backend
description: >
  How to implement a backend change in PawHaven. Covers the flat core-service module shape, the
  service-facade rule, Prisma via @InjectPrisma, Zod schemas from @pawhaven/shared/types validated at
  both edges, the declared endpoint auth policy, and the commands that check the result.
  Read before writing or changing any NestJS module, controller, service, Prisma model, or endpoint.
  Trigger: backend development NestJS module provider dependency injection decorator guard
  interceptor pipe filter middleware, controller endpoint route RESTful CRUD, service provider
  facade, prisma ORM schema model migration seed relation mongodb ObjectId, DTO validation zod schema
  parse request body response serialization, microservices inter-service communication,
  auth guard public optional internal jwt claims, shared types package import, monorepo workspace
  package export subpath.
---

# Backend

## Module shape

A core-service module is **flat**: exactly one module, one service, one controller, one co-located
test. No `entities/`, `use-cases/`, `events/`, `DTO/`, and no `index.ts` barrel.

```
apps/backend/core-service/src/modules/<name>/
├── <name>.module.ts        # @Module({ controllers, providers, exports })
├── <name>.service.ts       # the module's entire public API
├── <name>.controller.ts    # HTTP endpoints only
└── <name>.service.test.ts  # co-located vitest
```

Export the service and nothing else. It is the only surface another module may touch.

```typescript
@Module({
  controllers: [RescueController],
  providers: [RescueService],
  exports: [RescueService],
})
export class RescueModule {}
```

- Register a new module in the app module's `imports`.
- Relative imports carry an explicit `.js` extension (ESM / NodeNext). `./rescue.service` will not
  resolve.
- The current module list, the module's internal structure, and the repository's boundary rules are
  owned by the architecture docs, not this skill:
  [module structure](../../../../../docs/architecture/PawHaven-Backend-Architecture.md#12-internal-module-structure)
  and [service boundaries](../../../../../docs/architecture/service-boundaries.md).
- Auth, document, and config are separate services, not core-service modules.

→ Full annotated module: [references/module-anatomy.md](./references/module-anatomy.md)

## Imports from `@pawhaven/backend-core`

The root `index.ts` exports the core models only. Everything else is imported by subpath.

```typescript
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import { OptionalAuth, Public } from '@pawhaven/backend-core/decorators';
import { InternalJwt } from '@pawhaven/backend-core/internal-jwt';
import type { AuthenticatedInternalJwt } from '@pawhaven/backend-core/types';
```

Other subpaths: `config-module` · `middlewares` · `trace` · `logging` · `setup` · `utils`.
Root exports: `SharedModule` · `InternalJwtModule` · `InternalJwtGuard` · `InjectPrisma` ·
`SwaggerService` · `HttpClientService` · `collectServiceConfigSources`.

## Data and validation

Prisma targets MongoDB and is injected by decorator, not a typed constructor param.

```typescript
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
schema on the backend — if the type is not in `packages/shared`, that is the bug.

```typescript
// inbound
@Post()
create(@Body({ schema: CreateRescueDtoSchema }) dto: CreateRescueDto) { ... }

// outbound — validate before returning, do not trust the shape you built
return RescueListItemSchema.parse({ ... });
```

→ Model rules, the Prisma double, and the error-path shape: [references/data-and-validation.md](./references/data-and-validation.md)

## Endpoint auth policy

The gateway owns browser cookies and browser JWTs and signs the internal JWT the service sees.
Declare the policy; never infer it.

| Decorator         | Meaning                                 |
| ----------------- | --------------------------------------- |
| _(none)_          | Authenticated. Default.                 |
| `@Public()`       | No identity required.                   |
| `@OptionalAuth()` | Identity used if present, not required. |

Read identity with `@InternalJwt()`. Never parse a header or a cookie directly — a handler that does
is a blocking finding regardless of how clean it looks.

→ [references/auth-boundary.md](./references/auth-boundary.md). The trust model itself is owned by
[authentication-architecture.md](../../../../../docs/architecture/authentication-architecture.md).

## Conventions

- Log through the NestJS `Logger` (`private readonly logger = new Logger(X.name)`), not `console`.
  This is a project convention, not a lint rule.
- Catch broadly in the service, log the detail, throw a generic `BadRequestException` /
  `NotFoundException`. The client never sees Prisma's error text.
- `pnpm lint` does not prove module boundaries were respected. Read the diff, and run the grep:

```bash
grep -rE "from '.*modules/[a-z-]+/" apps/backend/core-service/src/modules/ --include="*.ts" \
  | grep -v "\.test\.ts"
```

## Running the checks

```bash
pnpm --filter @pawhaven/core-service typecheck
pnpm --filter @pawhaven/core-service build
pnpm --filter @pawhaven/core-service test
cd apps/backend/core-service && npx prisma validate
```

`pnpm lint` exits non-zero on a clean change. The baseline it is diffed against, and every known
pre-existing backend finding, are owned by [docs/quality](../../../../../docs/quality/README.md).

## Related

- Boundaries and rule statements: [architecture-design → boundaries](../../../architecture-planning/skills/architecture-design/references/boundaries.md)
- Types: [typescript](../../../development-foundations/skills/typescript/SKILL.md)
- Tests: [testing-standards](../../../testing/skills/testing-standards/SKILL.md)
- Backend checks: [code-review](../../../code-review/skills/code-review/SKILL.md)
