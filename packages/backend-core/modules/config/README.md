# Config Module

This module provides dynamic configuration loading for PawHaven backend services, using environment-specific JSON bundles and environment variable interpolation.

## Purpose

- **Environment-based configuration**: Load a distinct JSON bundle for each runtime environment (`dev`, `uat`, `test`, `prod`)
- **JSON + Environment Variables**: Bundles `src/config/<env>/env/index.json` and resolves `${VAR}` placeholders from environment variables
- **Type-safe access**: Provides ConfigService for type-safe config access throughout the application
- **Global availability**: Registered globally, accessible in any module without imports

## Components

### configs.module.ts

A dynamic module that:

- Bundles the JSON configuration for the resolved runtime environment
- Resolves `${VAR}` placeholders from environment variables
- Provides NestJS ConfigService for accessing configuration values
- Fails at startup when `APP_ENV` is missing or unsupported, and validates the bundle against the optional service schema

## Usage

### Basic Setup

The Config module is included by default in SharedModule. Each service bundles its own JSON
configuration and passes the collected sources to `forRoot`:

```typescript
import { join } from 'node:path';

import {
  collectServiceConfigSources,
  SharedModule,
} from '@pawhaven/backend-core';

const configContext = import.meta.webpackContext('./config', {
  recursive: true,
  regExp: /\/env\/index\.json$/,
});

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: join(import.meta.dirname, '..'),
      serviceName: 'auth-service',
      configSources: collectServiceConfigSources(configContext),
    }),
  ],
})
export class AppModule {}
```

### Configuration Files

Configuration lives in a JSON bundle per environment, under the service's `src/config/` directory:

```text
apps/backend/auth-service/
├── src/
│   └── config/
│       ├── Config.schema.ts
│       ├── dev/env/index.json
│       ├── uat/env/index.json
│       ├── test/env/index.json
│       └── prod/env/index.json
└── .env.example
```

Example `src/config/dev/env/index.json`:

```json
{
  "http": {
    "port": 8082,
    "prefix": "auth-service"
  },
  "auth": {
    "jwtSecret": "${JWT_SECRET}",
    "jwtExpiresIn": 300
  },
  "internalJwt": {
    "enabled": true,
    "audience": "auth-service",
    "publicKeys": {
      "internal-v1": "${INTERNAL_JWT_PUBLIC_KEY}"
    },
    "ttlSeconds": 45,
    "clockSkewSeconds": 30
  },
  "dbConnections": [
    {
      "enable": true,
      "options": {
        "name": "AUTH_SERVICE_MONGODB",
        "uri": "${AUTH_SERVICE_MONGODB}"
      }
    }
  ]
}
```

auth-service's schema requires the `internalJwt` block, so the bundle is not valid without it: keep
verification enabled (`enabled: true`), let `audience` name the service that verifies the token, and
give `publicKeys` at least one key id. core-service uses the same verifying shape; the gateway, which
signs the token, also carries `keyId` and `privateKey`.

The `import.meta.webpackContext` regular expression above decides which bundles exist at runtime: only
`src/config/<env>/env/index.json` files are collected, keyed by their environment directory. There is
no YAML file and no merge step.

### Environment Variables

String values in the JSON bundle may contain `${VAR}` placeholders, which the module resolves from
environment variables at startup:

```bash
# .env or shell
JWT_SECRET=dev-secret-key
AUTH_SERVICE_MONGODB=mongodb://localhost:27017/pawhaven-dev
```

The service root's `.env.local.<env>`, `.env.<env>`, `.env.local` and `.env` files are loaded, with
an already-set process environment variable winning over the files. A missing placeholder logs a
warning and resolves to an empty string.

### Accessing Configuration

Inject ConfigService and access configuration values:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}

  getJwtSecret(): string {
    // Type-safe access with default value
    return this.configService.get<string>('auth.jwtSecret', 'default-secret');
  }

  getDatabaseUrl(): string {
    return this.configService.get<string>('database.url');
  }

  getPort(): number {
    return this.configService.get<number>('server.port', 3000);
  }

  // Access nested configuration
  getCorsOrigins(): string[] {
    return this.configService.get<string[]>('server.corsOrigins', []);
  }
}
```

### Using in Module Configuration

Common pattern for configuring other modules:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('auth.jwtSecret'),
        signOptions: {
          expiresIn: configService.get<number>('auth.jwtExpiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AuthModule {}
```

## Configuration Structure

### Runtime Environment Resolution

The module automatically resolves the runtime environment from `APP_ENV`. Only `dev`, `uat`, `test`, and `prod` are accepted; any other value (or a missing `APP_ENV`) fails at startup:

- `dev` → bundles `src/config/dev/env/index.json`
- `uat` → bundles `src/config/uat/env/index.json`
- `test` → bundles `src/config/test/env/index.json`
- `prod` → bundles `src/config/prod/env/index.json`

Set via `APP_ENV`:

```bash
APP_ENV=prod npm start
```

`APP_ENV` is the application selector, not the framework mode. `NODE_ENV` keeps its usual meaning
for Node, Express and the hosting platform — Docker images set `NODE_ENV=production`, and Vercel
forces it — so it never chooses the bundle. A cluster pod receives `APP_ENV` from the
`pawhaven-env` ConfigMap; a local run receives it from `.env` or the shell.

There is no fallback: a missing or unrecognised value throws before any bundle loads, so a service
never runs with another environment's configuration.

### Configuration Resolution

1. **`src/config/<env>/env/index.json`** — the bundled JSON is the base configuration
2. **`${VAR}` placeholders** — resolved from environment variables and `.env` files
3. **Default Values** passed to `configService.get` in code (lowest priority)

Keys declared in the bundle take precedence over same-named environment variables; the environment
supplies `${VAR}` placeholder values.

### Nested Configuration Access

Use dot notation for nested values:

`src/config/dev/env/index.json`:

```json
{
  "database": {
    "mongodb": {
      "url": "mongodb://localhost:27017",
      "options": {
        "retryWrites": true
      }
    }
  }
}
```

```typescript
// Access nested values
const mongoUrl = configService.get<string>('database.mongodb.url');
const retryWrites = configService.get<boolean>(
  'database.mongodb.options.retryWrites',
);
```

## Best Practices

1. **Never commit secrets**: Use environment variables for sensitive data
2. **Provide defaults**: Always provide sensible defaults in code
3. **Validate early**: Throw errors on startup if required config is missing
4. **Type safety**: Use TypeScript interfaces for config shapes
5. **Document config**: Document all config options in the service's `src/config/<env>/env/index.json` and its schema

### Example with Validation

```typescript
@Injectable()
export class MyService {
  private readonly jwtSecret: string;

  constructor(configService: ConfigService) {
    this.jwtSecret = configService.get<string>('auth.jwtSecret');
    if (!this.jwtSecret) {
      throw new Error('JWT secret is required but not configured!');
    }
  }
}
```

## Environment-Specific Configs

### Development

`src/config/dev/env/index.json`:

```json
{
  "http": {
    "env": "dev",
    "port": 8082,
    "prefix": "auth-service"
  },
  "auth": {
    "jwtSecret": "${JWT_SECRET}",
    "jwtExpiresIn": 300
  },
  "internalJwt": {
    "enabled": true,
    "audience": "auth-service",
    "publicKeys": {
      "internal-v1": "${INTERNAL_JWT_PUBLIC_KEY}"
    },
    "ttlSeconds": 45,
    "clockSkewSeconds": 30
  },
  "cors": {
    "origin": ["http://localhost:3001"]
  }
}
```

### Production

`src/config/prod/env/index.json`:

```json
{
  "http": {
    "env": "prod",
    "port": 8082,
    "prefix": "auth-service"
  },
  "auth": {
    "jwtSecret": "${JWT_SECRET}",
    "jwtExpiresIn": 300
  },
  "internalJwt": {
    "enabled": true,
    "audience": "auth-service",
    "publicKeys": {
      "internal-v1": "${INTERNAL_JWT_PUBLIC_KEY}"
    },
    "ttlSeconds": 45,
    "clockSkewSeconds": 30
  },
  "cors": {
    "origin": ["https://pawhaven.work"]
  }
}
```

The secret stays in the environment through `${JWT_SECRET}`; a bundle never carries it. `test` and
`uat` bundles follow the same shape under their own directories.

## Troubleshooting

**Problem**: Config values are undefined  
**Solution**: Check the `serviceRoot` and the webpack context; `src/config/<env>/env/index.json` must exist for the current `APP_ENV` and match `/env/index.json`

**Problem**: A `${VAR}` placeholder resolves to an empty string  
**Solution**: Set the variable in the shell or one of the service's `.env` files; a missing placeholder warns once per variable

**Problem**: "Cannot read property of undefined"  
**Solution**: Use optional chaining or provide default values when accessing config

## Extension

### Custom Config Resolution

Extend the module to support additional config sources:

1. Modify `configs.module.ts` to add new resolution logic
2. Update `resolveAppConfig` utility in `@pawhaven/shared/utils`
3. Document new config source in this README

### Type-Safe Configuration

Create interfaces for your config:

```typescript
// config.interface.ts
export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: number;
}

export interface AppConfig {
  auth: AuthConfig;
  database: DatabaseConfig;
  server: ServerConfig;
}

// Usage
const authConfig = configService.get<AuthConfig>('auth');
```

---

For questions or issues, contact the backend team.
