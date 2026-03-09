# DynamicModules

This directory contains dynamic, reusable NestJS modules and global providers for the PawHaven backend. These modules are designed to be imported and configured flexibly in different services, providing shared infrastructure such as configuration, HTTP client, Prisma, Swagger, and more.

## Purpose

- **Centralize common infrastructure**: Avoid code duplication by providing shared modules (e.g., config, HTTP client, Prisma, Swagger, etc.).
- **Dynamic configuration**: Many modules expose a `forRoot` or similar method to allow per-service configuration.
- **Global providers**: Some modules (like interceptors, filters, pipes) are registered globally for all routes.
- **Consistent error handling and validation**: By centralizing interceptors, filters, and pipes, all services benefit from unified response formatting, exception handling, and validation.

## Design Philosophy

**SharedModule is for predefined shared infrastructure only.**

- Service-specific modules should be imported directly in the service's `AppModule`, not through `SharedModule.forRoot()`.
- `SharedModule` only accepts predefined modules from `SharedModuleFeatures` enum (PrismaModule, SwaggerModule, MonitoringModule).
- For custom providers or service-specific modules, add them directly to your service's module imports/providers.

### Example

```typescript
// ✅ Correct: Use SharedModule for predefined modules
@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: __dirname,
      serviceName: 'auth-service',
      modules: [
        { module: SharedModuleFeatures.PrismaModule, options: {...} },
        { module: SharedModuleFeatures.SwaggerModule },
      ],
    }),
    AuthModule,        // ← Service-specific module
    EmailModule,       // ← Service-specific module
  ],
})
export class AppModule {}

// ❌ Incorrect: Don't pass custom providers to SharedModule
SharedModule.forRoot({
  providers: [CustomService, CustomGuard],  // ← Not supported
})
```

## Structure Overview

- `configModule/` — Dynamic configuration module for loading and providing config values from environment or files.
- `httpClient/` — HTTP client module, interceptors, and exception filters. Provides outbound HTTP utilities and global error formatting.
- `prisma/` — Dynamic Prisma module for database access, supporting per-service configuration.
- `swagger/` — Swagger module for API documentation, auto-generates OpenAPI docs for your service.
- `shared.module.ts` — The main entry point for importing predefined shared modules. Handles dynamic assembly of infrastructure modules.
- `sharedModule.type.ts` — Types for dynamic module options, ensuring type safety and extensibility.

## How to Use

### 1. Import SharedModule in your service

```typescript
import { SharedModule } from '@pawhaven/backend-core/dynamicModules/shared.module';

@Module({
  imports: [
    SharedModule.forRoot({
      serviceRoot: __dirname, // Used for config resolution
      modules: [
        // Add extra modules as needed, e.g. { module: SharedModuleFeatures.PrismaModule, options: { ... } }
      ],
      providers: [
        // Add extra providers as needed, e.g. custom guards/interceptors
      ],
    }),
  ],
})
export class AppModule {}
```

### 2. JWT Authentication

- The JWT guard and strategy are registered globally. Use `@UseGuards(AuthGuard('jwt'))` for per-route protection, or rely on the global guard for all routes.
- Configure your JWT secret and expiration in your config files (e.g., `.env`, config service). The strategy will throw an error if the secret is missing.
- The guard will automatically extract the user from the token and attach it to the request object.

### 3. Add New Dynamic Modules or Providers

- **To add a new module (e.g., a new database or monitoring module):**
  1. Implement the module in this directory, following the NestJS module pattern.
  2. Update `SharedModuleFeatures` and `loadExtraModules` in `shared.module.ts` to support the new module.
  3. Optionally, update types in `sharedModule.type.ts` for type safety.
  4. Document the new module and its usage in this README.
- **To add a new global provider (e.g., a new guard/interceptor):**
  1. Implement the provider (class).
  2. Add it to `getDefaultProviders` in `shared.module.ts` so it is registered globally.
  3. Optionally, export it for use in other modules.

### 4. Configuration and Lifecycle

- All modules that require configuration should use the `forRoot` or `registerAsync` pattern for flexibility.
- Providers registered in `getDefaultProviders` are singletons and global for the entire application.
- If you need per-request or scoped providers, register them in the `providers` array passed to `forRoot`.

### 5. Error Handling and Best Practices

- Use the provided `HttpExceptionFilter` for consistent error responses across all services.
- Use the `HttpSuccessInterceptor` to wrap successful responses in a standard format.
- Always validate incoming data using the global `ZodValidationPipe` or your own validation pipe.
- Keep shared logic generic and stateless where possible to maximize reusability.
- When adding new modules/providers, always update this README and provide usage examples.

## Extending

- Always use the `forRoot` pattern for modules that require configuration.
- Keep shared logic generic and stateless where possible.
- Document any new modules or providers in this README for team clarity.
- Prefer composition over inheritance for new modules.
- Write tests for new modules/providers to ensure reliability across services.

## Example: Adding a New Module

Suppose you want to add a `MonitoringModule`:

1. Create `monitoring/monitoring.module.ts` in this directory.
2. Add a case in `loadExtraModules` in `shared.module.ts`:
   ```typescript
   case SharedModuleFeatures.MonitoringModule:
     return MonitoringModule;
   ```
3. Add `MonitoringModule` to `SharedModuleFeatures` enum/type in `sharedModule.type.ts`.
4. Document usage and configuration here in the README.

## Maintenance

- When adding new modules/providers, always update this README.
- Ensure all modules are properly exported and tested in at least one service.
- Keep dependencies up to date and avoid tight coupling between modules.
- Review and refactor shared logic regularly to keep it clean and maintainable.

---

For questions, suggestions, or contributions, please contact the backend maintainers or open a pull request.
