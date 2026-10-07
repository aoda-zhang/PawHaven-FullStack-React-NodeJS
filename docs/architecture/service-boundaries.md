# Service Boundaries

Backend service boundaries in this project: the four services, how each one boots, the auth
boundary, and each service's real shape. A change that needs to cross one of these lines is an
architecture decision, not an import.

For the full auth design, see
[authentication-architecture.md](./authentication-architecture.md).

## Contents

- [1. The four services](#1-the-four-services)
- [2. `config-service` is not a service](#2-config-service-is-not-a-service)
- [3. Every service boots through `SharedModule`](#3-every-service-boots-through-sharedmodule)
- [4. The auth boundary](#4-the-auth-boundary)
- [5. `core-service`](#5-core-service)
- [6. Request and response shape](#6-request-and-response-shape)
- [7. `gateway`](#7-gateway)
- [8. `document-service`](#8-document-service)
- [9. Frontend axis](#9-frontend-axis)

## 1. The four services

| Service            | Package                      | Port | Owns                                            |
| ------------------ | ---------------------------- | ---- | ----------------------------------------------- |
| `gateway`          | `@pawhaven/gateway`          | 8080 | Browser-facing edge: cookies, rate limit, proxy |
| `core-service`     | `@pawhaven/core-service`     | 8081 | The seven feature modules                       |
| `auth-service`     | `@pawhaven/auth-service`     | 8082 | Register, login, refresh, token rotation        |
| `document-service` | `@pawhaven/document-service` | 8083 | Email, PDF rendering                            |

They are separate deployables with separate databases. A change that needs to cross
one of these lines is an architecture decision, not an import.

## 2. `config-service` is not a service

It has no `package.json`, no `src/`, no NestJS module, and no HTTP surface — and nothing
imports it. All it holds is `apps/backend/config-service/portal/config/` (per-environment YAML
plus `config.schema.ts`).

**Never**: give it an endpoint, list it as a deployable, count it in a service total, or describe
it as a microservice. There are four services.

## 3. Every service boots through `SharedModule`

```ts
SharedModule.forRoot({
  serviceRoot,
  serviceName,
  configSources,
  configSchema,
  modules,
});
```

NestJS features are attached through `SharedModuleFeatures` (observed: `PrismaModule`,
`SwaggerModule`) — not by hand-wiring providers in `app.module.ts`.

`SharedModule` registers `InternalJwtModule.forRoot(serviceName, configSources)`, which registers
the global guard:

```ts
{ provide: APP_GUARD, useExisting: InternalJwtGuard }
```

So the guard is global by construction. A service that omits `internalJwt.enabled` **refuses to
boot** — the module raises rather than running unprotected.

## 4. The auth boundary

- `gateway` declares `internalJwt.enabled: false` — it **signs** the internal JWT.
- Every downstream service declares `enabled: true` — they **verify** it.
- **The internal JWT is `ES256`**, hardcoded as `SIGNING_ALGORITHM` in both
  `packages/backend-core/dynamic-modules/internal-jwt/sign.ts` and `verify.ts`. It is signed with a
  private key and verified against a `kid`-keyed public key from `publicKeyByKeyId` — an asymmetric
  pair, not a shared secret. `HS256` appears nowhere in the backend source. Do not "correct" this to
  HS256, do not reach for `jwtSecret`, and do not trust a document that says otherwise.
- Handlers read identity through the `@InternalJwt()` parameter decorator.
- Endpoint policy is exactly three states:

| Decorator         | Meaning                        |
| ----------------- | ------------------------------ |
| `@Public()`       | No identity required           |
| `@OptionalAuth()` | Identity resolved when present |
| _(none)_          | **Authenticated** — default    |

`InternalJwtGuard` consults the reflector first: if `@Public()` or `@OptionalAuth()` is present it
passes through, otherwise it verifies. Both decorators live in
`packages/backend-core/decorators/authMode.decorator.ts`.

**Blocking violations**: reading a browser cookie or `Authorization` header in a downstream
service; parsing the `x-gateway-jwt` header by hand; leaving a state-changing endpoint without a
policy (which makes it authenticated — correct — unless it was meant to be public).

## 5. `core-service`

Seven modules: `adoption`, `animal-follow`, `bootstrap`, `guide`, `home`, `report-animal`,
`rescue`.

- Each module is **three source files** — `.controller.ts`, `.service.ts`, `.module.ts` — plus
  co-located `.test.ts` files. There are no `entities/`, `use-cases/`, `events/`, or `DTO/`
  subdirectories. Do not introduce a four-layer structure for one module.
- **Cross-module imports exist in exactly one place**: `home` imports `AdoptionModule` /
  `AdoptionService` and `RescueModule` / `RescueService`, through NestJS DI. That is the whole
  surface. Adding a second one needs a reason.
- **There is no event bus.** No EventEmitter, no queue, no pub/sub anywhere in the service. The
  supported cross-module path is a direct DI call to a sibling's public service. Introducing an
  event mechanism is an architecture decision.
- Data access goes through `PrismaClient` on MongoDB, wired by
  `SharedModuleFeatures.PrismaModule` with the `@prismaClient` import alias.

## 6. Request and response shape

```ts
// inbound — the schema validates at the boundary
@Post()
create(@Body({ schema: CreateRescueDtoSchema }) dto: CreateRescueDto) {}

// outbound — parse before returning, so the contract holds both ways
return RescueListItemSchema.parse(row);
```

- Schemas live in `packages/shared/types/*.schema.ts` and are imported as
  `@pawhaven/shared/types`. They are the single source of truth for a contract — do not redefine
  a DTO on one side.
- **`nestjs-zod` and `ZodValidationPipe` are not dependencies.** `zod` (v4) is a direct dependency
  of `auth-service` and `core-service` only. Do not add a validation library to solve a problem the
  `schema` option already solves.

## 7. `gateway`

| Directory      | Responsibility                                              |
| -------------- | ----------------------------------------------------------- |
| `identity`     | Resolve the caller, adopt and refresh cookies               |
| `internal-jwt` | Sign the short-lived ES256 internal JWT, resolve its target |
| `proxy`        | Forward to the target service (`proxy.service.ts`)          |
| `routing`      | Micro-service registry                                      |
| `throttle`     | Per-client rate limiting                                    |
| `config`       | `Config.schema.ts`                                          |

- Rate limiting is **in-process**: `MAX_TRACKED_CLIENTS = 10_000` backing a plain `Map`, registered
  as a global `APP_GUARD`. There is no Redis or external store — do not add one for scaling
  reasons without an architecture decision, and do not describe the limit as distributed.
- The only controller is `proxy.controller.ts`. The gateway has no business endpoints of its own;
  business routes are proxied.
- `assertSafePath` in `proxy.service.ts` refuses any path rewriting to `/internal`. Keep it intact —
  it is what stops public routes from reaching internal controllers.

## 8. `document-service`

Two modules: `email`, `pdf`. Three controllers — `email.controller.ts`, `pdf.controller.ts`
(public), and `internalPdf.controller.ts`.

- `InternalPdfController` is server-to-server and deliberately carries **no `@Public()`**, so the
  global guard rejects anonymous callers. It is reachable only from inside the cluster.
- Its handler writes with `@Res()` rather than returning a value, because the global
  `HttpSuccessInterceptor` would otherwise wrap the PDF buffer in the JSON envelope and corrupt the
  download. Any new binary endpoint needs the same treatment.
- PDF rendering launches headless Chromium at runtime via `puppeteer` +
  `@sparticuz/chromium`. The binary must be present in the environment — a missing Chromium is a
  deployment problem, not a code bug.

## 9. Frontend axis

`apps/frontend/portal` is the only frontend app — importing across apps is forbidden. Portal work is
organised by feature folder
(`apps/frontend/portal/src/features/*`: `animal-follow`, `auth`, `home`, `report-animal`,
`rescue-cases`, `rescue-detail`, `rescue-guide`), **not** by backend service. Feature-to-service
mapping is a documentation concern, not an import path.
