# Config Module

This module provides dynamic configuration loading for PawHaven backend services, supporting environment-specific YAML files and environment variable overrides.

## Purpose

- **Environment-based configuration**: Load different configs for development, staging, production
- **YAML + Environment Variables**: Supports YAML config files with env var overrides
- **Type-safe access**: Provides ConfigService for type-safe config access throughout the application
- **Global availability**: Registered globally, accessible in any module without imports

## Components

### configs.module.ts

A dynamic module that:

- Loads YAML configuration files based on `NODE_ENV`
- Merges YAML config with environment variables (env vars take precedence)
- Provides NestJS ConfigService for accessing configuration values
- Automatically validates and resolves configuration paths

## Usage

### Basic Setup

The Config module is included by default in SharedModule:

```typescript
import { SharedModule } from '@pawhaven/backend-core/dynamicModules/shared.module';

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: __dirname, // Used to resolve config file paths
    }),
  ],
})
export class AppModule {}
```

### Configuration Files

Create YAML config files in your service's `config/` directory:

```
apps/backend/auth-service/
├── src/
└── config/
    ├── development.yaml
    ├── staging.yaml
    └── production.yaml
```

Example `development.yaml`:

```yaml
auth:
  jwtSecret: 'dev-secret-key'
  jwtExpiresIn: 900

database:
  url: 'mongodb://localhost:27017/pawhaven-dev'

server:
  port: 3000
  corsOrigins:
    - 'http://localhost:5173'
```

### Environment Variables

Override YAML config using environment variables:

```bash
# .env or shell
AUTH_JWT_SECRET=production-secret-key
DATABASE_URL=mongodb://prod-server:27017/pawhaven
SERVER_PORT=8080
```

Environment variables take precedence over YAML values.

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

The module automatically resolves the runtime environment:

- `development` / `dev` → loads `config/development.yaml`
- `staging` / `stage` → loads `config/staging.yaml`
- `production` / `prod` → loads `config/production.yaml`

Set via `NODE_ENV`:

```bash
NODE_ENV=production npm start
```

### Configuration Merging Priority

1. **Environment Variables** (highest priority)
2. **YAML Config File**
3. **Default Values** in code (lowest priority)

### Nested Configuration Access

Use dot notation for nested values:

```yaml
# config/development.yaml
database:
  mongodb:
    url: 'mongodb://localhost:27017'
    options:
      retryWrites: true
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
5. **Document config**: Document all config options in YAML files with comments

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

```yaml
# config/development.yaml
auth:
  jwtSecret: 'dev-secret'
  jwtExpiresIn: 86400 # 24 hours for convenience

logging:
  level: 'debug'
```

### Production

```yaml
# config/production.yaml
auth:
  # Secret should come from env var in production
  jwtExpiresIn: 900 # 1 hour for security

logging:
  level: 'info'
```

## Troubleshooting

**Problem**: Config values are undefined  
**Solution**: Check serviceRoot path is correct, ensure YAML file exists for current NODE_ENV

**Problem**: Environment variables not overriding YAML  
**Solution**: Verify env var naming matches config path (use underscores for nested paths)

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
