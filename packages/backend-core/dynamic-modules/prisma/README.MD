# Prisma Module

This module provides a dynamic, extensible Prisma ORM integration for PawHaven backend services, supporting multiple database engines with custom extensions.

## Purpose

- **Dynamic database configuration**: Configure Prisma per-service with different database engines
- **Prisma extensions support**: Add custom Prisma extensions for models, queries, and results
- **Multi-database support**: Support MongoDB, PostgreSQL, MySQL, etc. in different services
- **Global availability**: Registered globally, accessible throughout the application
- **Type-safe decorators**: Provides decorators to inject Prisma clients

## Components

### prisma.module.ts

Dynamic module that:

- Accepts database engine type and Prisma client configuration
- Applies default and custom Prisma extensions
- Manages database connection lifecycle ($connect on initialization)
- Provides database-specific injection tokens

### getPrismaInjectionToken.ts

Utility that generates database-specific injection tokens:

- `PRISMA_MONGODB_CLIENT` for MongoDB
- `PRISMA_POSTGRES_CLIENT` for PostgreSQL
- etc.

### prisma.decorators.ts

Provides decorators for injecting Prisma clients:

- `@InjectPrisma()` - Inject appropriate Prisma client based on database engine

### extensions/

Custom Prisma extensions for:

- Soft deletes
- Timestamps
- Custom query methods
- Result transformations

## Usage

### Basic Setup

Configure Prisma module in SharedModule:

```typescript
import { SharedModule, SharedModuleFeatures } from '@pawhaven/backend-core';
import { PrismaClient } from '@prisma/client';
import { DatabaseEngine } from '@pawhaven/backend-core/constants';

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: __dirname,
      modules: [
        {
          module: SharedModuleFeatures.PrismaModule,
          options: {
            databaseEngine: DatabaseEngine.MongoDB,
            Client: PrismaClient,
          },
        },
      ],
    }),
  ],
})
export class AppModule {}
```

### Injecting Prisma Client

Use the `@InjectPrisma()` decorator:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectPrisma } from '@pawhaven/backend-core';
import { DatabaseEngine } from '@pawhaven/backend-core/constants';

@Injectable()
export class UserService {
  constructor(
    @InjectPrisma(DatabaseEngine.MongoDB)
    private prisma: PrismaClient,
  ) {}

  async findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: CreateUserDto) {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
```

### Using Custom Extensions

Add custom Prisma extensions:

```typescript
import { SharedModuleFeatures } from '@pawhaven/backend-core';
import { DatabaseEngine } from '@pawhaven/backend-core/constants';

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: __dirname,
      modules: [
        {
          module: SharedModuleFeatures.PrismaModule,
          options: {
            databaseEngine: DatabaseEngine.MongoDB,
            Client: PrismaClient,
            extensions: [
              // Add custom extension for soft deletes
              {
                name: 'softDelete',
                model: {
                  $allModels: {
                    async softDelete(args: any) {
                      const context = Prisma.getExtensionContext(this);
                      return context.update({
                        ...args,
                        data: { deletedAt: new Date() },
                      });
                    },
                  },
                },
              },
            ],
          },
        },
      ],
    }),
  ],
})
export class AppModule {}
```

## Prisma Schema Setup

### Generate Prisma Client

Each service should have its Prisma schema and generate command:

```json
// package.json
{
  "scripts": {
    "prisma:generate": "prisma generate --schema=./src/prisma/schema.prisma"
  }
}
```

### Example Schema

```prisma
// src/prisma/mongodb/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  email     String   @unique
  username  String?
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
}
```

## Advanced Features

### Multiple Database Engines

Support multiple databases in one service:

```typescript
@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: __dirname,
      modules: [
        // MongoDB for user data
        {
          module: SharedModuleFeatures.PrismaModule,
          options: {
            databaseEngine: DatabaseEngine.MongoDB,
            Client: MongoClient,
          },
        },
        // PostgreSQL for analytics
        {
          module: SharedModuleFeatures.PrismaModule,
          options: {
            databaseEngine: DatabaseEngine.PostgreSQL,
            Client: PostgresClient,
          },
        },
      ],
    }),
  ],
})
export class AppModule {}
```

Inject different clients:

```typescript
@Injectable()
export class HybridService {
  constructor(
    @InjectPrisma(DatabaseEngine.MongoDB)
    private mongoClient: MongoClient,

    @InjectPrisma(DatabaseEngine.PostgreSQL)
    private postgresClient: PostgresClient,
  ) {}

  async createUserWithAnalytics(userData: any) {
    // Store user in MongoDB
    const user = await this.mongoClient.user.create({ data: userData });

    // Track in PostgreSQL
    await this.postgresClient.analytics.create({
      data: { userId: user.id, event: 'user_created' },
    });

    return user;
  }
}
```

### Custom Extensions

Create reusable extensions:

```typescript
// extensions/softDelete.extension.ts
export const softDeleteExtension = {
  name: 'softDelete',
  model: {
    $allModels: {
      async softDelete(args: any) {
        const context = Prisma.getExtensionContext(this);
        return context.update({
          ...args,
          data: { deletedAt: new Date() },
        });
      },

      async restore(args: any) {
        const context = Prisma.getExtensionContext(this);
        return context.update({
          ...args,
          data: { deletedAt: null },
        });
      },

      findManyActive(args: any) {
        const context = Prisma.getExtensionContext(this);
        return context.findMany({
          ...args,
          where: {
            ...args?.where,
            deletedAt: null,
          },
        });
      },
    },
  },
};
```

Usage:

```typescript
// Now use custom methods
await this.prisma.user.softDelete({ where: { id: userId } });
await this.prisma.user.restore({ where: { id: userId } });
const activeUsers = await this.prisma.user.findManyActive();
```

## Best Practices

1. **One schema per service**: Each microservice should manage its own Prisma schema
2. **Generate on install**: Add prisma:generate to postinstall script
3. **Handle connections**: The module handles connection lifecycle, don't manually connect
4. **Use transactions**: For complex operations requiring atomicity
5. **Index appropriately**: Add database indexes for frequently queried fields
6. **Validate before save**: Use DTOs and validation pipes before Prisma operations

### Example: Transaction

```typescript
async transferFunds(fromId: string, toId: string, amount: number) {
  return this.prisma.$transaction(async (tx) => {
    // Deduct from sender
    await tx.account.update({
      where: { id: fromId },
      data: { balance: { decrement: amount } },
    });

    // Add to receiver
    await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });

    // Log transaction
    await tx.transaction.create({
      data: { fromId, toId, amount },
    });
  });
}
```

## Database Migration

### Development

```bash
# Create migration
npm run prisma:migrate:dev

# Apply migration
npm run prisma:migrate:deploy
```

### Production

```bash
# Apply migrations in production
npm run prisma:migrate:deploy
```

## Troubleshooting

**Problem**: "Prisma Client not generated"  
**Solution**: Run `npm run prisma:generate` or check postinstall script

**Problem**: Cannot inject Prisma client (undefined)  
**Solution**: Ensure PrismaModule is configured in SharedModule, check database engine constant

**Problem**: Connection errors  
**Solution**: Verify DATABASE_URL in config, ensure database is running

**Problem**: Type errors with extended methods  
**Solution**: Regenerate Prisma client after adding extensions

## Database Engines

Supported database engines (defined in constants):

```typescript
export enum DatabaseEngine {
  MongoDB = 'MONGODB',
  PostgreSQL = 'POSTGRESQL',
  MySQL = 'MYSQL',
  SQLite = 'SQLITE',
}
```

## Extension Interface

```typescript
interface PrismaExtension {
  name?: string;
  query?: Record<string, unknown>; // Query-level extensions
  model?: Record<string, unknown>; // Model-level extensions
  result?: Record<string, unknown>; // Result-level extensions
  client?: Record<string, unknown>; // Client-level extensions
}
```

---

For questions or issues, contact the backend team.
