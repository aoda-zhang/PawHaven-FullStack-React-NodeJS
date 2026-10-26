# backend-core: the shared back-end contract

> This document covers **how the shared back-end layer is built**: what each module owns, how a
> service boots, and which invariants every service inherits. Architecture (what owns what) lives in
> [Backend Architecture](../context/backend-architecture.md).

## Why one shared layer

Four services share one operational contract: the same bootstrap, the same config validation, the
same internal-JWT rules, the same trace contract, the same HTTP client. `packages/backend-core` is
that contract. It depends on `packages/shared` and on nothing else in the workspace.

## Layout

| Path                               | Owns                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `setup/`                           | `bootstrapApp` and `configureApp` — the boot path every service calls                                |
| `decorators/`                      | `@Public`, `@OptionalAuth` auth-mode markers, plus `@NoSign` (exported, not read by any guard today) |
| `dynamic-modules/internal-jwt/`    | Sign, verify, guard, `@InternalJwt()`                                                                |
| `dynamic-modules/config-module/`   | Shared config-schema fragments and the config loader                                                 |
| `dynamic-modules/http-client/`     | `HttpClientService`, interceptors, Prisma error mapping                                              |
| `dynamic-modules/prisma/`          | `PrismaModule` plus the soft-delete and version extensions                                           |
| `dynamic-modules/shared.module.ts` | Wires pipe, interceptor and filter as `APP_PIPE`/`APP_INTERCEPTOR`/`APP_FILTER`                      |
| `trace/`                           | `resolveInboundTraceId`, the trace middleware                                                        |
| `logging/`                         | `TraceLogger` — JSON lines with service tag and trace id                                             |
| `middlewares/`                     | Locale middleware (excludes the `health` path)                                                       |
| `types/`, `constants/`, `utils/`   | Internal schemas (`Document.schema.ts`), header names, helpers                                       |

## The boot path

Every service's `main.ts` is the same two lines:

```ts
const app = await bootstrapApp(AppModule);
```

`bootstrapApp` creates the Nest app with buffered logs and `forceCloseConnections`, installs the
`TraceLogger`, reads `http.port` from validated config and listens. A config-validation error is
logged and rethrown **before** a listener opens — a service with a bad config refuses to boot rather
than reading `undefined` at request time.

`configureApp` installs the request pipeline: the trace middleware first (so every later log line
carries the id), then body parsing, cookies and CORS. The locale middleware is registered separately
by `MiddlewareModule`.

## Configuration

- Each service owns `src/config/Config.schema.ts`, composed from fragments in
  `dynamic-modules/config-module/configSchema.ts`.
- Values live in four environment files per service — `dev`, `test`, `uat`, `prod`. A key present in
  `dev` and absent from `prod` fails validation in `prod`; that is the intended outcome.
- `internalJwt.enabled` must be declared explicitly. Omitting it refuses the boot.
- `internalJwt.ttlSeconds` is validated to 30–60 seconds; every service ships `45`.

## Internal JWT

- The **gateway is the only signer**. It mints a compact ES256 JWT per hop, `kid` `internal-v1`,
  `aud` bound to the target service, TTL from `internalJwt.ttlSeconds` (45 s), header
  `x-gateway-jwt`.
- Verification is fail-closed: `kid` allowlist → algorithm pinned to ES256 → Zod parse of claims →
  lifetime cap → `iat`/skew → audience. A claim that is not in `AuthenticatedInternalJwtSchema` is
  stripped by Zod, not surfaced as an error — add new claims there or they silently disappear.
- No service reads a browser cookie or `authorization` header. Identity arrives only as
  `@InternalJwt()` claims.

## Auth modes

| Mode              | Meaning                                                                  |
| ----------------- | ------------------------------------------------------------------------ |
| _(no decorator)_  | Authenticated identity required — the default                            |
| `@Public()`       | Genuinely open (login, register, refresh, guide reads)                   |
| `@OptionalAuth()` | Works with or without identity; claims are anonymous or authenticated    |
| `@NoSign()`       | Metadata marker exported for a signing opt-out; no runner reads it today |

## HTTP client

`httpClientService.create(name)` reads the peer's URL from the service's `microServices` config and
signs an internal JWT per call — a service-to-service hop is authenticated exactly like a browser
hop. `options.traceId` propagates the id; a raw header is ignored by design. Axios errors are
normalized: timeout → 504, unreachable upstream → 503, upstream error keeps its status.
`retryCount`/`retryDelay` are validated config fields that nothing reads — a failed call fails once.

## Validation and envelopes

- `StandardSchemaValidationPipe` is registered globally as `APP_PIPE`; a route that declares
  `@Body({ schema })` is validated whether or not its author thought about it.
- `HttpSuccessInterceptor` wraps a bare payload in the success envelope. Return a bare payload;
  never build the envelope by hand. For raw bytes, write the response with `@Res()`, because the
  interceptor would JSON-wrap a buffer.
- `RenderPdfBodySchema` is a `z.strictObject`: an unknown key is a 400.

## Persistence

`PrismaModule` registers two extensions for every service that has a client: `softDelete`
(a `deletedAt` filter) and `versionExtension`. Nine of core-service's ten models declare
`deletedAt`; `AnimalFollow` deliberately does not (unfollow is a hard delete, otherwise the unique
`(userId, animalId)` row would block re-following). Only `Menu` and `Route` carry `version`.
