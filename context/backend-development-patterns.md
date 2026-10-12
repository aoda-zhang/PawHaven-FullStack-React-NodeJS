# PawHaven — Backend Development Patterns

> **This document answers one question: what a change to this backend must look like.**
> For where files live and what owns them, read [Backend Architecture](backend-architecture.md) — §1 for the
> units, §2 for dependency direction, §3 for modules. This document contains no file map and repeats no
> architecture rule.

---

## 1. The shape of every change

1. **Narrow.** Touch only what the request needs. Exploring is free; extending the change is not.
2. **Semantics over comments.** Intent lives in names, types, and structure. Before writing a comment,
   ask whether well-named code says it better; if it does, do not write the comment. A comment earns its
   place only when the reason cannot be expressed in code, and then it states why, never what.
3. **One owner per fact.** A schema, a constant, a type, a port, a template has exactly one home. Point
   at it; do not copy it.
4. **Gate-clean.** Every claim you make is checked by a command you can name and show output from.
5. **Never commit or push.** Finishing a change is not committing it.

## 2. Recipes

### 2.1 New business module

1. Create `apps/backend/core-service/src/modules/<kebab-name>/` with `<name>.module.ts`,
   `<name>.service.ts`, `<name>.controller.ts`.
2. Keep the shape flat — no `entities/`, `use-cases/`, `dto/`, or `events/` subdirectories. A DTO is a
   Zod schema in `@pawhaven/shared`, not a class.
3. Register the module in `app.module.ts`.
4. Controller paths are kebab-case resource names (`rescues`, `animal-follow`); the non-plural names
   (`home`, `guide`, `bootstrap`) are page names, not a pattern to copy.
5. Pair it with a portal feature directory.
6. A new deployable service needs an explicit justification. A new module does not.

### 2.2 New endpoint

1. No auth decorator means authenticated. Add `@Public()` or `@OptionalAuth()` only when the route is
   genuinely open — forgetting a decorator denies access rather than leaking it.
2. Bind the body: `@Body({ schema: SharedSchema }) dto: SharedType`. An untyped body is a defect.
3. Inject claims with `@InternalJwt()`; pass `{ allowAnonymous: true }` where an anonymous caller is
   legitimate.
4. Return a bare payload. `HttpSuccessInterceptor` wraps it — never build the envelope yourself.
5. Returning bytes? Write the response with `@Res()`. The interceptor would wrap a buffer in JSON and
   corrupt it.
6. Use `HTTP_STATUS` for every status. Never a literal.

### 2.3 Calling another service

| File                             | Owns                     | Rule                                          |
| -------------------------------- | ------------------------ | --------------------------------------------- |
| `httpClientService.create(name)` | the peer and its URL     | the only way out of the process               |
| the call site                    | the path and the payload | the path carries the peer's own prefix        |
| `options.traceId`                | the outbound trace id    | never override it with a raw header           |
| `returnResponse: true`           | `set-cookie` and headers | the default mode returns the parsed body only |

- The client signs an internal JWT per call, so a service-to-service hop is authenticated exactly as a
  browser hop is.
- Axios errors are normalized: a timeout becomes 504, a missing upstream becomes 503, an upstream
  error keeps its status.
- `retryCount` and `retryDelay` are validated but read by nothing. A failed call fails once.

### 2.4 Module talking to a module

Import nothing from a sibling module folder. Export the service from its module and inject it. The one
sanctioned pair is `home` → `rescue` and `home` → `adoption`, and both halves are allowlisted in rule A3
of `scripts/check-architecture.mjs`.

Any new cross-module path is an architecture decision: add the allowlist entry in the same change and
say in the feature doc why the boundary moved.

### 2.5 Shared schema or constant

| Situation                                         | Home                                     |
| ------------------------------------------------- | ---------------------------------------- |
| A request body or response both sides read        | `packages/shared/types/<Name>.schema.ts` |
| An HTTP status, a locale code, a business message | `packages/shared/constants/`             |
| Something only the back end uses                  | `packages/backend-core/`                 |

- The TS type is `z.infer` of the schema. Read enum members off the schema instead of repeating the
  literal union.
- A new key in `packages/shared` must break nothing at build time; both sides compile against it.

### 2.6 Configuration key

1. Add the field to `apps/backend/<service>/src/config/Config.schema.ts`.
2. Add a value to **all four** environment files — `dev`, `test`, `uat`, `prod` — in the same change.
3. Use `${VAR}` for anything secret and read it through config resolution, never `process.env` directly.
4. Reuse a fragment from `packages/backend-core/dynamic-modules/config-module/configSchema.ts` before
   writing a new one.

A key present in `dev` and absent from `prod` fails validation in `prod`. That is the intended outcome —
the service refuses to boot rather than reading `undefined` at request time. Required leaves use
`.min(1)` so an unset `${VAR}` is caught rather than silently empty.

### 2.7 New service

1. Create `apps/backend/<name>-service/` with `main.ts` calling `bootstrapApp(AppModule)`, an
   `app.module.ts` using `SharedModule.forRoot`, and `src/config/`.
2. Declare `serviceName`, `http.prefix`, and a config schema. Declare `internalJwt.enabled` explicitly —
   omitting it refuses the boot rather than defaulting open.
3. Add a `microServices` entry to the gateway **and** to every service that will call it, with
   `gatewayPrefix` and `pathRewrite`.
4. Give it a port. `config-service` has none and is not a service; rule A5 fails a config that counts it
   as a deployable.

Routing needs no code change — the gateway reads config.

### 2.8 Trace id

Never mint one. `resolveInboundTraceId` is the only place it happens, and `traceMiddleware` is
registered first in `configureApp` so it runs before body parsing. To pass an id on a service-to-service
call, use the `traceId` option; a raw header is clobbered by design.

### 2.9 Test

- Vitest, co-located beside the source as `*.test.ts`.
- A guard test must fail without the guard. An authentication change without one is not finished.
- Test what a caller can observe: the status, the envelope, the header. Do not restate the
  implementation.
- `auth-service` has no tests today. That is a gap, not a pattern.

## 3. Validation and types

| Situation                        | Home                                           |
| -------------------------------- | ---------------------------------------------- |
| The browser sends or receives it | `packages/shared/types/<Name>.schema.ts`       |
| Only the back end reads it       | `packages/backend-core/types/<Name>.schema.ts` |
| It is one route's own shape      | nowhere — inline, or reuse the closest schema  |

- There are no DTO classes. A payload is a Zod schema; the TS type is `z.infer` of it. `class FooDto {}`
  does not exist in this codebase.
- `StandardSchemaValidationPipe` is registered globally as `APP_PIPE` in `SharedModule`, so no service
  opts in. A route that declares `@Body({ schema })` is validated whether or not the author thought about
  it.
- A route with no schema is unvalidated. `@Query` and `@Param` are read as primitives today
  (`Number(limit)`, `id: string`) — do not add a hand-rolled guard in the service for what a schema on the
  route would catch at the boundary.
- `RenderPdfBodySchema` is a `z.strictObject`: an unknown key is a 400, not a silently ignored option.
  Prefer strict at a boundary that has a stable caller.

## 4. Boundaries while coding

- No service imports another service. When one seems necessary, use `HttpClientService` or move the
  shared logic into `backend-core`.
- Every deviation is an explicit entry in the relevant allowlist of `scripts/check-architecture.mjs` and a
  note in the affected feature's document. An unlisted deviation fails the gate.
- No `EventEmitter2`, no broker. Neither is a dependency, and a string-keyed publish hides a dependency
  that a constructor signature would show.
- No new `config-service` entry that looks like a port, a service list, or an endpoint.

## 5. Hand off

| Check                  | Command                                          | Scope                                                         |
| ---------------------- | ------------------------------------------------ | ------------------------------------------------------------- |
| Types                  | `pnpm --filter @pawhaven/core-service typecheck` | the service and its imports                                   |
| Lint and format        | `pnpm lint`                                      | turbo across workspaces                                       |
| Tests                  | `pnpm --filter @pawhaven/core-service test`      | the service; `gateway` and `document-service` carry their own |
| Boundaries             | `pnpm architecture-check`                        | A1–A5                                                         |
| Documentation links    | `pnpm check:links`                               | every relative link resolves                                  |
| Shared package changed | `pnpm build:libs`                                | downstream services consume `dist`, not source                |

Report what you checked and what you deliberately left alone. Name the command and its output for every
claim; a plausible summary is not a pass.

## 6. Related

- [Backend Architecture](backend-architecture.md) — where files live, what owns them.
- [Frontend Development Patterns](frontend-development-patterns.md) — the other half of a contract change.
- `docs/features/` — the as-built record of each feature, written after the change lands.
