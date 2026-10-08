# Module Anatomy

## Contents

- [The four files](#the-four-files)
- [`rescue.module.ts`](#rescuemodulets)
- [`rescue.service.ts`](#rescueservicets)
- [`rescue.controller.ts`](#rescuecontrollerts)
- [Adding a module](#adding-a-module)
- [Module communication](#module-communication)

A complete, real core-service module. Read `rescue` alongside this.

## The four files

```
apps/backend/core-service/src/modules/rescue/
├── rescue.module.ts
├── rescue.service.ts
├── rescue.controller.ts
└── rescue.service.test.ts
```

That is the whole shape. No subdirectories, no barrel file.

## `rescue.module.ts`

```typescript
import { Module } from '@nestjs/common';

import { RescueController } from './rescue.controller.js';
import { RescueService } from './rescue.service.js';

@Module({
  controllers: [RescueController],
  providers: [RescueService],
  exports: [RescueService],
})
export class RescueModule {}
```

Two things to copy:

- **Relative imports end in `.js`.** The backend is ESM / NodeNext; `./rescue.service` will not
  resolve.
- **`exports` contains the service and nothing else.** The service is the module's entire public
  API. Adding an entity, a controller, or an internal helper to `exports` widens the surface other
  modules can reach into, which is exactly what the boundary discipline forbids.

## `rescue.service.ts`

The service owns Prisma access, the domain logic, and response validation.

```typescript
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { databaseEngines } from '@pawhaven/backend-core/constants';
import {
  RescueListItemSchema,
  RescueDetailSchema,
  type RescueListItem,
} from '@pawhaven/shared/types';
import type { AuthenticatedInternalJwt } from '@pawhaven/backend-core/types';
import { PrismaClient, type animalReports } from '@prismaClient/index.js';

@Injectable()
export class RescueService {
  private readonly logger = new Logger(RescueService.name);

  constructor(
    @InjectPrisma(databaseEngines.mongodb)
    private readonly prisma: PrismaClient,
  ) {}

  async create(dto: CreateRescueDto, claims: AuthenticatedInternalJwt) {
    try {
      return await this.prisma.animalReports.create({
        data: {
          ...dto,
          reporter: {
            reporterID: claims.sub,
            reporterName: claims.username?.trim() || null,
          },
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create rescue: ${dto.animalType}`, error);
      throw new BadRequestException('Failed to create rescue record');
    }
  }
}
```

Points worth copying:

- `private readonly logger = new Logger(X.name)` — a real `Logger`, not `console`. The linter allows
  `console` here, so this is a convention you have to keep by hand.
- **Identity comes from the `claims` argument, not from a header.** The controller injects it via
  `@InternalJwt()` and passes it down. A service never reads `x-gateway-jwt` itself.
- **Catch broadly, log the detail, throw a generic `BadRequestException`.** The Prisma error may
  carry field names and constraint text; the client gets a flat message.
- Types imported from `@prismaClient/index.js` — value import for `PrismaClient`, `type` import for
  model types.
- Queries use `select` to shape exactly what the response needs, then validate the result.

## `rescue.controller.ts`

The controller is transport only: decorators, `@Body` / `@Query` / `@Param`, delegate to the service.

```typescript
import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OptionalAuth } from '@pawhaven/backend-core/decorators';
import { InternalJwt } from '@pawhaven/backend-core/internal-jwt';
import type { AuthenticatedInternalJwt } from '@pawhaven/backend-core/types';
import {
  CreateRescueDtoSchema,
  type CreateRescueDto,
} from '@pawhaven/shared/types';
import { RescueService } from './rescue.service.js';

@ApiTags('rescues')
@Controller('rescues')
export class RescueController {
  constructor(private readonly rescueService: RescueService) {}

  @Post()
  @ApiOperation({ summary: 'Create a rescue record' })
  create(
    @Body({ schema: CreateRescueDtoSchema }) dto: CreateRescueDto,
    @InternalJwt() claims: AuthenticatedInternalJwt,
  ) {
    return this.rescueService.create(dto, claims);
  }

  @OptionalAuth()
  @Get()
  findAll(@Query('status') status?: string, @Query('limit') limit?: string) {
    return this.rescueService.findAll(status /* … */);
  }
}
```

- **`@Body({ schema: XSchema })`** — pass the Zod schema object, not a pipe. There is no
  `ZodValidationPipe` in this repo and `nestjs-zod` is not installed.
- **No `@Public()` on `create`** — omitting a decorator means authenticated. That is the default
  policy; be explicit with `@OptionalAuth()` / `@Public()` only when you mean something other than
  "requires identity".
- `@ApiOperation` summaries are Swagger-facing; keep them meaningful.

## Adding a module

1. `ls apps/backend/core-service/src/modules/` — confirm the module does not already exist.
2. Create the four files above.
3. Register the module in the app module's `imports`.
4. Add any new Zod schema to `packages/shared` — never define one locally.
5. If the module needs a Prisma model, add it to `src/prisma/mongodb/schema.prisma`, then run
   `npx prisma generate` from `apps/backend/core-service`.

## Module communication

```
✅  Module A → Module B's exported service, via NestJS DI
✅  Module A → @pawhaven/shared (types, schemas, constants)

❌  Module A → another module's service internals, entities, or controller
❌  Module A → another module's Prisma model directly
```

There is **no event bus in this codebase** — `@nestjs/event-emitter` is not a dependency and
`EventEmitter2` appears nowhere. Cross-module communication happens through an exported service
method, or does not happen yet. Introducing one is a design decision, not a convention to follow.
