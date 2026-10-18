# Backend Architecture

> **Scope.** What each unit owns, and which direction the dependencies run. Every path is a locator;
> the code at that path is the authority. When they disagree, the code is right and this document is
> stale.
> For what a change must look like, read [Backend Development Patterns](backend-development-patterns.md).

## 1. Summary

Four services, two packages.

| Unit                         | Path                            | What it is for                                                                                                                                                                                             |
| ---------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@pawhaven/gateway`          | `apps/backend/gateway`          | The only process the browser reaches. It verifies the session, mints an internal token per hop, throttles, and wraps the response. It holds no business logic and no database.                             |
| `@pawhaven/core-service`     | `apps/backend/core-service`     | The business modules — rescue, report, adoption, home, guide, follow, bootstrap. A modular monolith: one deployable, one module per domain.                                                                |
| `@pawhaven/auth-service`     | `apps/backend/auth-service`     | Credentials and sessions. It issues and refreshes the browser cookies. It is the only service that writes user identity.                                                                                   |
| `@pawhaven/document-service` | `apps/backend/document-service` | Rendering and delivery. It turns a template plus a locale into PDF bytes, and sends mail. It holds no database and calls no other service.                                                                 |
| `@pawhaven/backend-core`     | `packages/backend-core`         | The shared back-end layer: `SharedModule`, the internal-JWT guard, sign and verify, the Prisma module, the service-to-service HTTP client, the trace contract, and the app bootstrap every service shares. |
| `@pawhaven/shared`           | `packages/shared`               | What both front and back end must agree on — Zod schemas, constants, pure utilities. It carries no UI code and no back-end code.                                                                           |

`@pawhaven/i18n` is listed in `core-service` and `document-service` dependencies, but only
`document-service` reads it, through its Node-only `@pawhaven/i18n/resources` entry.

## 2. Dependencies

```
  packages/shared
          │
          ▼
  packages/backend-core
          │
          ▼
  ┌───────────────┬───────────────┬───────────────────┐
  ▼               ▼               ▼                   ▼
  gateway    core-service    auth-service    document-service
                                │                   │
                                │                   ├──► @pawhaven/i18n/resources
                                │                   └──► design-system tokens → pdf.generated.css
                                │
   core-service ──HTTP──► auth-service
   core-service ──HTTP──► document-service
```

`shared` is the only layer both front and back end read, so it carries neither: it depends on nothing in
the workspace, and nothing may depend on it except `backend-core` and the services. `backend-core`
depends on `shared` and on nothing else in the workspace.

- `gateway` reads `backend-core` for the trace contract, the internal JWT, and the HTTP client. It is
  the only process that terminates a browser connection, so every response passes through it.
- `core-service` holds the business modules and is the only service with a Prisma schema beyond auth.
- `auth-service` is the only writer of the browser cookies. `core-service` calls it for the volunteer
  count in `home`.
- `document-service` reads design tokens through a prebuild step that compiles them into
  `pdf.generated.css`; the package itself is never imported at runtime.
- No service imports another service. A service reaches a peer over HTTP through
  `HttpClientService`, and a relative import that climbs into a sibling service directory fails
  `architecture-check`.

## 3. Modules inside `core-service`

Seven modules, each a folder with a controller, a service, and its tests.

```
apps/backend/core-service/src/modules/
├── rescue/          ├── adoption/      ├── guide/        ├── bootstrap/
├── report-animal/   ├── animal-follow/ └── home/
```

- A module's public surface is its exported service class. A module reaches a sibling only through
  NestJS dependency injection, and `home` → `rescue` and `home` → `adoption` is the one sanctioned
  pair — both halves are allowlisted in rule A3 of `scripts/check-architecture.mjs`.
- `report-animal` and `rescue` write and read the same `animalReports` collection. That coupling is in
  the data, not in code: neither module imports the other, and `report-animal` does not know the feed
  exists.
- There is no event bus. `@nestjs/event-emitter` is not a dependency.

## 4. The trust boundary

The browser holds two `HttpOnly` cookies. The gateway verifies them once and mints a 45-second ES256
token, audience-bound to the target service, that travels in `x-gateway-jwt`. No service reads a
cookie or an `authorization` header.

```
✅ A service trusts the internal JWT and nothing else
✅ The gateway strips every inbound x-auth-* and x-gateway-* header
✅ A route with no decorator is authenticated; @Public() and @OptionalAuth() are choices
✅ A service that omits internalJwt.enabled refuses to boot

❌ No service port is a public interface
❌ No path that rewrites to /internal is proxied
❌ No @nestjs/event-emitter, no broker
```

## 5. Related

- [Backend Development Patterns](backend-development-patterns.md) — what a change must look like.
- [Frontend Architecture](frontend-architecture.md) — the other half of the contract.
- [System Architecture Overview](system-architecture-overview.md) — the whole system.
