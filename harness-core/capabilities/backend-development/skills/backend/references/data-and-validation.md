# Data and Validation

## Contents

- [Prisma is MongoDB](#prisma-is-mongodb)
- [Injection uses a decorator](#injection-uses-a-decorator)
- [Model style](#model-style)
- [Validation at both edges](#validation-at-both-edges)
- [Soft delete in queries](#soft-delete-in-queries)
- [After a schema change](#after-a-schema-change)

## Prisma is MongoDB

Schema: `apps/backend/core-service/src/prisma/mongodb/schema.prisma`. Generated client lands in
`src/prisma/mongodb/client/` and is reached through the `@prismaClient` alias.

```jsonc
// apps/backend/core-service/tsconfig.json
"paths": {
  "@prismaClient/*": ["./src/prisma/mongodb/client/*"],
  "@prismaClient": ["src/prisma/mongodb/client"]
}
```

```jsonc
// apps/backend/core-service/package.json — a link: dependency, not a version range
"dependencies": {
  "@prismaClient/index.js": "link:./src/prisma/mongodb/client"
}
```

## Injection uses a decorator

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

`databaseEngines` is an enum covering `mysql` · `postgresql` · `sqlite` · `sqlserver` · `mongodb` ·
`redis` · `clickhouse` · `elasticsearch` · `kafka` · `dynamodb`. Pass the engine explicitly —
`@pawhaven/backend-core` is built for multi-engine setups, and hardcoding an assumption here is how
the next migration breaks.

## Model style

MongoDB-flavoured Prisma, not relational:

```prisma
model animalReports {
  id        String    @id @default(auto()) @map("_id") @db.ObjectId
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime?

  status String @default("active")

  animalType        String
  age               String
  appearance        Json
  locationObj       Json
  animalStatus      String @default("pending")
  statusDescription String?
  description       String
  size              String
  animalCount       Int
  reporter          Reporter?
  reporterPhotos    String[]

  @@index([animalStatus])
}
```

Conventions to keep:

- `id` is `String @id @default(auto()) @map("_id") @db.ObjectId` — not `Int @default(autoincrement())`.
- `createdAt` / `updatedAt` / `deletedAt` on every model. **`deletedAt` is soft delete** — queries
  filter on `deletedAt: { isSet: false }`. Forgetting that filter surfaces deleted records.
- Flexible shape goes in `Json` columns (`appearance`, `locationObj`).
- Model names are frequently **not** singular (`animalReports`); the table-ish name is in the
  identifier itself rather than `@@map`.
- Declare indexes for anything you filter or sort on.

## Validation at both edges

Zod schemas live in `@pawhaven/shared/types` and are **shared with the frontend**. Never define one
in a backend module — a type that only the backend knows about is a contract waiting to drift.

**Inbound** — hand the schema object to `@Body`:

```typescript
@Post()
create(@Body({ schema: CreateRescueDtoSchema }) dto: CreateRescueDto) { ... }
```

Query and param inputs are typed loosely at the decorator and normalised in the service, because
everything off the URL is a string:

```typescript
const parsedLimit = Number(limit);
const take =
  Number.isInteger(parsedLimit) && parsedLimit > 0 ? parsedLimit : undefined;
```

**Outbound** — `.parse()` before the value leaves the service. The service builds the object, so
validate it rather than trusting the shape you just assembled:

```typescript
return RescueListItemSchema.parse({ ...record /* mapped fields */ });
```

Both edges are real in `rescue.service.ts`. Skipping the outbound parse means a Prisma field rename
silently ships a malformed payload to the client.

## Soft delete in queries

```typescript
const rescues = await this.prisma.animalReports.findMany({
  where: {
    deletedAt: { isSet: false },
    ...(status ? { animalStatus: status } : {}),
  },
  orderBy: { createdAt: 'desc' },
  take,
  select: { id: true, animalType: true /* … */ },
});
```

Use `select` to pull only what the response needs — it keeps the `.parse()` honest, because you
cannot accidentally validate against fields you never fetched.

## After a schema change

```bash
cd apps/backend/core-service
npx prisma validate
npx prisma generate
```

`generate` writes into `src/prisma/mongodb/client/`, which is deliberately **excluded from the
pnpm workspace** in `pnpm-workspace.yaml` (`**/src/prisma/**/client`) so generated clients are never
treated as workspace packages. Do not "fix" that exclusion.

`db push` against a shared environment is a destructive operation — confirm before running it.
