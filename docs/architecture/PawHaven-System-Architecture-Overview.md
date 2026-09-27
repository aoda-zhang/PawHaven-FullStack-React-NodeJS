# PawHaven — System Architecture Overview

> **Version**: v3.11 | **Date**: 2026-09-25
> **Design Philosophy**: Pragmatic service decomposition. Modular monolith inside core-service. Extract only when necessary.
>
> **Related Docs**: [Frontend Architecture](PawHaven-Frontend-Architecture.md) | [Backend Architecture](PawHaven-Backend-Architecture.md) | [Authentication Architecture](authentication-architecture.md)

---

## Table of Contents

1. [Architecture Philosophy](#1-architecture-philosophy)
2. [Service Decomposition — 4 Services](#2-service-decomposition--4-services)
3. [C4 Model — System Landscape](#3-c4-model--system-landscape)
4. [Data Architecture](#4-data-architecture)
5. [API Gateway Design](#5-api-gateway-design)
6. [Shared Kernel & Package Strategy](#6-shared-kernel--package-strategy)
7. [Security Architecture](#7-security-architecture)
8. [Observability & Operations](#8-observability--operations)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Design Decisions](#10-design-decisions)
11. [Module Boundary Enforcement](#11-module-boundary-enforcement)
12. [Why This Design Works](#12-why-this-design-works)

---

## 1. Architecture Philosophy

> **"Microservices are a means, not an end. The goal is maintainable, scalable software — not a specific number of services."**

### Core Principles

| #   | Principle                                       | What It Means                                                                                                                  |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| P1  | **Split by operational need, not domain count** | Extract a service only when it needs independent scaling, different tech stack, separate team, or different deployment cadence |
| P2  | **Monolith-first, module-always**               | core-service is a single deployable. Internally, every bounded context is a strict module with enforced boundaries             |
| P3  | **Internal modules = future services**          | Module boundaries are enforced by lint rules. Extraction is a deployment change, not a code rewrite                            |
| P4  | **Gateway as the only public surface**          | All external traffic flows through gateway. Internal services never exposed to the internet                                    |
| P5  | **Direct injection within, HTTP between**       | Exported service method for module-to-module within core-service. HTTP (via gateway proxy) between services                    |
| P6  | **One database, logically partitioned**         | MongoDB with collection-per-context naming convention. Separate DB only when data isolation is legally/operationally required  |

### The Extraction Trigger Rule

> **Don't extract a module from core-service until at least TWO of these are true:**
>
> 1. It needs **independent scaling** (different traffic/load patterns)
> 2. It needs a **different tech stack** (e.g., Python for ML matching)
> 3. A **different team** owns it
> 4. It has a **different deployment cadence** (releases on a different schedule)

---

## 2. Service Decomposition — 4 Services

### 2.1 The Architecture at a Glance

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Service 1: gateway                             │  │
│  │  Stateless — InternalJwtService (owner + refresh), ES256    │  │
│  │  JWT signer, allowlisted proxying, CORS, Trace ID, Logging  │  │
│  └──────────┬──────────┬──────────┬───────────────────────────┘  │
│             │          │          │                              │
│             ▼          ▼          ▼                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │ Service 2:   │ │ Service 3:   │ │ Service 4:   │               │
│  │ auth-service │ │ core-service │ │ document-    │               │
│  │              │ │ ┌──────────┐ │ │ service      │               │
│  │ Register     │ │ │ rescue   │ │ │              │               │
│  │ Login        │ │ │ report-  │ │ │  PDF render  │               │
│  │ JWT issue    │ │ │  animal  │ │ │  + download  │               │
│  │ Token refresh│ │ ├──────────┤ │ │  (no DB)     │               │
│  │ User + roles │ │ │ adoption │ │ │              │               │
│  │              │ │ ├──────────┤ │ │              │               │
│  └──────────────┘ │ │animal-   │ │ └──────────────┘               │
│                    │ │ follow   │ │                              │
│                    │ ├──────────┤ │                              │
│                    │ │  guide   │ │                              │
│                    │ ├──────────┤ │                              │
│                    │ │bootstrap │ │                              │
│                    │ ├──────────┤ │                              │
│                    │ │   home   │ │                              │
│                    │ └──────────┘ │                              │
│                    └──────────────┘                              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Why Each Service Exists

| #   | Service              | Why Separate?                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | If Merged, What Breaks?                                                                                                           |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **gateway**          | Stateless. Handles ALL traffic. Needs independent horizontal scaling. TLS termination, rate limiting, CORS — infrastructure concerns, not business logic.                                                                                                                                                                                                                                                                                                                                                              | Merging into core-service couples infrastructure scaling with business logic scaling. Gateway may need 5 pods while core needs 2. |
| 2   | **auth-service**     | Different security posture. Holds bcrypt hashes + JWT secrets. Independent security auditing. If auth is down, nothing works — circuit breaker needed.                                                                                                                                                                                                                                                                                                                                                                 | Merging into core-service means any core deployment risks auth downtime. Security audit scope expands to all business code.       |
| 3   | **core-service**     | The modular monolith. All 7 business modules live here as strict modules. Single deployable, single database. Internal module boundaries enforced by lint rules.                                                                                                                                                                                                                                                                                                                                                       | This IS the merge target. Everything that doesn't need operational isolation lives here.                                          |
| 4   | **document-service** | Stateless PDF render + download. Heavy deps (Puppeteer/Chromium), CPU spikes during render, different scaling model. **Never touches data** — no DB, no outbound calls, no catalog endpoint; every PDF is a template rendered from inbound **data** plus the **copy** it resolves from `@pawhaven/i18n` as a static package resource (see DD-10). Browser does not reach it — nothing in `apps/frontend` calls `/api/document`; the portal's PDF path is gateway → core-service → document-service over internal HTTP. | Merging into core-service means every core pod carries heavy dependencies. PDF generation spikes affect rescue API latency.       |
| 5   | _(not a service)_    | `apps/backend/config-service/` holds per-environment portal runtime config (`dev` / `test` / `uat` / `prod` YAML) and a Zod schema for it. It has no `package.json`, no NestJS module, no HTTP surface, and nothing reads the YAML.                                                                                                                                                                                                                                                                                    | n/a                                                                                                                               |

### 2.3 Service-to-Service Communication

```
gateway ──HTTP proxy──► auth-service       (auth endpoints)
gateway ──HTTP proxy──► core-service       (all business endpoints)

// document-service has no frontend caller: the portal's PDF path is
// gateway → core-service → document-service over internal HTTP.

core-service ──HTTP──► document-service    (POST /document-service/internal/pdf/render — render PDF template; no DB, no outbound calls, no catalog endpoint)

// Downstream services NEVER call auth-service to verify tokens:
// identity is delivered by the gateway as an ES256 internal JWT
// (x-gateway-jwt header) and verified by each service's InternalJwtGuard.

// All inter-module communication within core-service:
// direct injection of an exported service (zero network overhead)
```

---

## 3. C4 Model — System Landscape

### 3.1 Level 1: System Context

```
                    ┌─────────────────────┐
                    │     Reporter        │
                    │  (Mobile Browser)   │
                    └──────────┬──────────┘
                               │
                               ▼
┌──────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Rescuer    │────►│                 │◄────│   Adopter    │
│  (Web/Mobile)│     │   PawHaven      │     │  (Web/Mobile)│
└──────────────┘     │   Platform      │     └──────────────┘
                     │                 │
┌──────────────┐     └────────┬────────┘     ┌──────────────┐
│ Contributor  │────►         │         ◄────│   Shelter    │
│  (Web)       │              │              │   Admin      │
└──────────────┘              │              └──────────────┘
                              │
                     ┌────────┴────────┐
                     │  External       │
                     │  Services       │
                     │  · Email (SMTP) │
                     │  · Storage (S3) │
                     │  · Maps API     │
                     │  · Push (FCM)   │
                     └─────────────────┘
```

### 3.2 Level 2: Container Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PawHaven Platform                         │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Portal SPA    │  │   Admin SPA     │  │   Mobile PWA    │  │
│  │   (React)       │  │   (React)       │  │   (React)       │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                │
│                                ▼                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              gateway — Route 3000                              │  │
│  │  InternalJwtService · JWT signer · Proxy · CORS · Trace ID     │  │
│  └───┬──────────┬────────────┬────────────┬───────────────────┘  │
│      │          │            │            │                     │
│      ▼          ▼            ▼            ▼                     │
│  ┌────────┐ ┌────────────┐ ┌────────┐ ┌────────────┐          │
│  │ auth-  │ │ core-      │ │document│ │ config-    │          │
│  │ service│ │ service    │ │service │ │ service    │          │
│  │        │ │            │ │        │ │            │          │
│  │ D B    │ │ ┌────────┐ │ │ PDF    │ │ (static     │          │
│  │ (auth) │ │ │rescue  │ │ │render  │ │  config)   │          │
│  └────────┘ │ │report  │ │ └────────┘ └────────────┘          │
│             │ │adopt   │ │                                      │
│             │ │content │ │                                      │
│             │ │voluntr │ │                                      │
│             │ │notify  │ │                                      │
│             │ │achieve │ │                                      │
│             │ │profile │ │                                      │
│             │ │bootstrap│ │                                      │
│             │ └────────┘ │                                      │
│             │ Database     │                                      │
│             │ (core)      │                                      │
│             └────────────┘                                      │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │   Internal Communication:                                   │  │
│  │   · gateway → core/auth/document: HTTP proxy                │  │
│  │   · core → document: HTTP (POST /pdf/render) · core → auth: HTTP│  │
│  │   · module → module (within core): direct service injection  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Architecture

### 4.1 Databases and Collections

Two MongoDB datasources, one per service that has a Prisma schema. The database name is not fixed
in the repository — each service reads its own connection string from an environment variable.

```
┌─────────────────────────────────────────────────────────────┐
│  auth-service  —  MongoDB via Prisma (@pawhaven/shared prisma)│
│                                                             │
│  · User                                                     │
│      roles String[] · status · password hash · refreshToken  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  core-service  —  MongoDB via Prisma                         │
│                                                             │
│  Owned by modules:                                           │
│  · animalReports      rescue (read) + report-animal (write)  │
│  · AdoptablePet       adoption                                 │
│  · animal_follows     animal-follow   (no deletedAt)         │
│  · Menu               bootstrap                               │
│  · Role / Permission  bootstrap                               │
│  · RolePermission     bootstrap                               │
│  · MenuPermission     bootstrap                               │
│                                                             │
│  Defined but read by no code:                                │
│  · Route / RoutePermission                                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  document-service  —  no Prisma client, no database access   │
│  gateway           —  no database                            │
└─────────────────────────────────────────────────────────────┘
```

Only `AnimalFollow` carries an explicit `@@map`. The other nine core collections are named after
their Prisma model, so the collection names are `Menu`, `Role`, `Permission`, `RolePermission`,
`MenuPermission`, `Route`, `RoutePermission`, `animalReports`, and `AdoptablePet` — a mix of
PascalCase and camelCase, not a single convention.

**There is no object storage.** Animal photos are base64 data URLs stored inside the
`animalReports` document; PDFs are rendered on demand by document-service and never persisted.

### 4.2 Data Access Rules

| Rule                      | Enforcement                                                                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Each module owns its data | Only the owning module's service touches its collections                                                                                              |
| Cross-module data access  | Through the owning module's public service class, never direct DB access                                                                              |
| Soft delete               | `softDelete` Prisma extension, enabled for both services via `SharedModuleFeatures.PrismaModule`; 9 of core's 10 models declare `deletedAt DateTime?` |
| Versioning                | `versionExtension`, same registration. Only `Menu` and `Route` declare `version Int @default(1)`                                                      |
| Unfollow hard-deletes     | `AnimalFollow` has no `deletedAt`, so the extension does not apply and a removed follow is gone                                                       |

No geo query, full-text search, or search index exists. `locationObj` on `animalReports` is stored
and returned but never queried, and `RescueListItem.distance` is a hard-coded `0`.

---

## 5. API Gateway Design

### 5.1 Architecture

```
Client Request (httpOnly cookies)
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│                    gateway (no auth guards)              │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │  InternalJwtService — resolve identity (F1-F4)    │  │
│  │  · access-token verify / type / session cap /     │  │
│  │    logout revokes the DB refresh token            │  │
│  │  · proactive refresh window + single-flight       │  │
│  │  · unresolvable cookies → 401 + clear cookies     │  │
│  └───────────────────────┬──────────────────────────┘  │
│                          │ signs InternalJwt as        │
│                          │ ES256 JWT (TTL 45s, aud=svc)│
│  ┌───────────────────────▼──────────────────────────┐  │
│  │  ProxyController (@All('*path'))           │  │
│  │  Allowlisted prefix → microService (config map)   │  │
│  │  /api/core     → core-service    (internal-v1)    │  │
│  │  /api/auth     → auth-service    (internal-v1)    │  │
│  │  /api/document → document-service (internal-v1)   │  │
│  │  unknown prefix → 404 · /internal → 404 · .. →404 │  │
│  └───────────────────────┬──────────────────────────┘  │
│                          │ forwards x-gateway-jwt      │
│  ┌───────────────────────▼──────────────────────────┐  │
│  │              Cross-Cutting (proxy edge)           │  │
│  │  · strips inbound x-auth-* / x-gateway-* headers  │  │
│  │  · X-Trace-Id injection + propagation (=claims rid│  │
│  │  · 2xx JSON envelope wrapping                     │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
      │
      ▼
downstream service → InternalJwtGuard verifies the internal JWT
   (fail closed: decode kid allowlist → alg-pinned ES256
    → zod parse → lifetime cap → iat/skew → audience) → req.internalJwt
```

The gateway **does** proxy `/api/document` (the entry is present in every environment and no exclusion exists), but no frontend caller uses it: the browser reaches PDFs through core-service's `guide` module — `POST /api/core/guide/pdf` `{ template }` — which relays to document-service over internal HTTP. The locale travels as the `x-locale` header and is canonicalised to `en-US | zh-CN | de-DE`.

The gateway is the **only** place browser JWTs and cookies are handled. It does not enforce
route-level auth with decorators; instead it derives a typed identity per request, signs it as a
compact ES256 JWT (`x-gateway-jwt`) signed with the gateway's shared private key (`kid` `internal-v1` — every service holds the matching public key), and lets each downstream
service enforce its own endpoint policy.

The gateway has **no business logic** — its behavior is entirely config-driven, so its "routing
brain" lives in a dedicated `routing/` module rather than a generic `config/` folder:

- `src/config/` holds **only** the per-environment JSON files (`dev|test|uat|prod/env/index.json`).
  The JSON path is hard-pinned by `ConfigsModule`, so it cannot move.
- `src/routing/` holds the gateway-specific routing layer:
  - `micro-service.registry.ts` (`MicroServiceRegistry`) — the runtime prefix→service map.
    `ProxyService` and `InternalJwtTargetResolver` inject it to resolve a request's target host
    (`findByGatewayPrefix`) and the internal-JWT audience/secret (`findByName`).
  - `routing.module.ts` (`RoutingModule`) — provides `MicroServiceRegistry` and exports it;
    both `proxy/` and `internal-jwt/` import it (neither feature imports the other, avoiding an
    `internal-jwt → proxy` coupling).
- **Gateway config validation is now the single Zod gate.** The dead
  `routing/gateway-config.validator.ts` (`GatewayConfigValidator`, a constructor side-effect guard)
  has been deleted. Its rules — `internalJwt.ttlSeconds` must be within 30–60s and every enabled
  microservice must carry `internalJwt.keyId`/`secret` — were folded into the gateway's
  `src/config/Config.schema.ts`, which composes the shared Zod building blocks and is passed to
  `SharedModule.forRoot`. Validation runs inside the `load` factory and is enforced at bootstrap by
  `bootstrapApp()` (see Backend Architecture §5.5): on a bad config the gateway prints the report and
  `process.exit(1)` fires before `app.listen()`.

### 5.2 Endpoint Policy Decorators (Downstream)

Endpoint policy lives **with the downstream handlers**, not in the gateway:

```typescript
// Downstream (auth/core/document services) — any signed internal-JWT kind allowed
@Public()           // e.g. auth POST /login, /register, /refresh
@Get('login')
login() {}

// Optional auth — works with or without an identity (claims.kind = anonymous | authenticated)
@OptionalAuth()     // e.g. core GET /bootstrap, /home, rescue/adoption list reads
@Get('rescues')
listRescues() {}

// Default (no decorator) — authenticated identity required, e.g. auth GET /me
@Get('profile')
getProfile(@InternalJwt() claims: AuthenticatedInternalJwt) {}
// @InternalJwt({ allowAnonymous: true }) also returns claims on @OptionalAuth() routes.
```

See [authentication-architecture.md](authentication-architecture.md) for the full
internal-JWT wire format, guard behavior, config reference, and per-service endpoint policy.

---

## 6. Shared Kernel & Package Strategy

### 6.1 Package Dependency Graph

```
┌─────────────────────────────────────────────────────────┐
│                    packages/                              │
│                                                          │
│  ┌──────────────┐     (zero dependencies)                │
│  │   shared     │     Types, constants, Zod schemas,     │
│  │              │     event definitions, pure utilities  │
│  └──────┬───────┘                                        │
│         │                                                │
│    ┌────┴────────────────┐                               │
│    │                     │                               │
│    ▼                     ▼                               │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ backend-core │  │ frontend-core│                     │
│  │ Shared infra │  │ React:       │                     │
│  │ Prisma ext.  │  │ hooks, API   │                     │
│  │ HTTP client  │  │ client, utils│                     │
│  │ HttpClient   │  │              │                     │
│  └──────┬───────┘  └──────┬───────┘                     │
│         │                 │                              │
│    ┌────┴────┐       ┌────┴────┐                        │
│    ▼         ▼       ▼         ▼                        │
│  ┌──────┐┌──────┐ ┌──────┐┌──────────┐                 │
│  │design││  ui  │ │ i18n ││frontend- │                 │
│  │system││(comp │ │(react││core      │                 │
│  │(CSS  ││ lib) │ │-i18n)││(api,     │                 │
│  │tokens││      │ │      ││hooks)    │                 │
│  └──────┘└──────┘ └──────┘└──────────┘                 │
└─────────────────────────────────────────────────────────┘
```

### 6.2 What Goes Where

| Package                   | Contains                                                                                                                                                                                            | Must NOT Contain                                   |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `@pawhaven/shared`        | Zod schemas, TypeScript types, constants, event definitions, pure utility functions                                                                                                                 | React code, backend framework code, database logic |
| `@pawhaven/backend-core`  | SharedModule, PrismaModule, HttpClientModule, shared app bootstrap (`setupApp` via `./setup`), decorators, interceptors, Prisma extensions, the internal-JWT module (`dynamicModules/internalJwt/`) | Business logic, domain entities                    |
| `@pawhaven/frontend-core` | React hooks, API client, storage utilities, lazy loading helpers                                                                                                                                    | Business-specific components                       |
| `@pawhaven/design-system` | CSS tokens, Tailwind theme, theme configuration, CSS utilities                                                                                                                                      | React components                                   |
| `@pawhaven/ui`            | Reusable React components (Form\*, Loading, Toast, etc.)                                                                                                                                            | Business logic, API calls                          |
| `@pawhaven/i18n`          | Translation provider, locale files, language detection, and the PDF document copy under `locales/{locale}/documents/` (Node-only — excluded from the browser glob; see DD-10)                       | React components, business logic, runtime data     |

---

## 7. Security Architecture

### 7.1 Authentication Flow

```
Client (httpOnly cookies) → gateway
   │
   │ POST /api/auth/login (email + password)
   │ ← auth-service issues Token pair (access 3min prod / 5min dev, refresh 7d) as cookies
   │
   │ (subsequent requests carry cookies)
   ▼
gateway InternalJwtService — the ONLY JWT owner
   · verifies access token (signature, type:'access', session cap)
   · proactive refresh window; refresh single-flight via auth-service
   · unresolvable cookies → 401 + clear cookies (no silent anonymous)
   ▼
signs typed InternalJwt as compact ES256 JWT (aud = target service, TTL 45s)
   x-gateway-jwt  (kid in JOSE header, internal-v1)
   ▼
downstream service (auth/core/document)
   InternalJwtGuard verifies internal JWT (fail closed)
   default = authenticated required; @Public / @OptionalAuth allow anonymous
   handlers inject claims via @InternalJwt() — never request headers
```

### 7.2 Security Layers

| Layer            | Mechanism                                                                                                                                                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transport        | HTTPS (TLS 1.3)                                                                                                                                                                                                                           |
| Authentication   | Browser JWT verified at gateway; ES256 internal-JWT InternalJwt (45s TTL) verified downstream                                                                                                                                             |
| Authorization    | Roles travel in the JWT claims and are resolved by `bootstrap` into permission codes for menu filtering; **no endpoint denies access by role** — endpoint policy is authentication only (`@Public`/`@OptionalAuth`/default-authenticated) |
| Input Validation | Zod schemas via global validation pipe                                                                                                                                                                                                    |
| Rate Limiting    | Token bucket per IP + per user at gateway                                                                                                                                                                                                 |
| Data Privacy     | GPS fuzzing (displayArea, not exact coords post-rescue)                                                                                                                                                                                   |
| CSRF             | SameSite cookies + token header                                                                                                                                                                                                           |
| CORS             | Whitelist origins per environment; methods GET/POST/PUT/OPTIONS                                                                                                                                                                           |

---

## 8. Observability & Operations

### 8.1 Three Pillars

```
Logging           Metrics            Tracing
· Structured JSON · Request count    · X-Trace-Id across
· service tag     · p50/p95/p99      · all services
· traceId per log · Error rate       · compatible
· levels: info/   · Status codes
  warn/error      · DB query times
```

### 8.2 Health Checks

```
GET /health       → { status, db, uptime, version }
GET /health/live  → liveness probe (k8s)
GET /health/ready → readiness probe (k8s)
```

### 8.3 Structured Logging

```typescript
this.logger.log({
  message: 'Rescue case status changed',
  traceId: req.headers['x-trace-id'],
  service: 'core-service',
  module: 'rescue',
  data: { caseId, fromStatus: 'pending', toStatus: 'inProgress', operatorId },
});
```

### 8.4 Request Correlation (`x-trace-id`)

The gateway forwards an inbound `x-trace-id` header, or mints one with `crypto.randomUUID()` when absent, then echoes it on the proxied response so callers can correlate requests with gateway logs. The header name is defined once in `packages/backend-core/constants/httpHeaders.ts`. See Backend Architecture §5.8 for the full contract.

---

## 9. Deployment Architecture

### 9.1 MVP (Current → Month 3)

```
┌─────────────────────────────────────────────────────────┐
│  Single VPS / Container                                  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Docker Compose                                   │   │
│  │                                                    │   │
│  │  gateway:1    auth-service:1    core-service:2    │   │
│  │  document-service:1                               │   │
│  │                                                    │   │
│  │  MongoDB (2 databases: auth + core)                │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 9.2 Production (Phase 3+)

```
┌─────────────────────────────────────────────────────────┐
│  K8s Cluster                                            │
│                                                          │
│  gateway:     2-5 pods (HPA on CPU)                     │
│  auth:        2 pods                                    │
│  core:        2-5 pods (HPA on CPU)                     │
│  document:    1-2 pods (HPA on CPU)                     │
│                                                          │
│  Managed MongoDB (2 databases: auth + core)             │
└─────────────────────────────────────────────────────────┘
```

---

## 10. Design Decisions

> These design decisions are recorded inline in this overview, labelled `DD-n` (Design Decision). These inline entries ARE the record — there is no separate ADR filing series.

### DD-1: Modular Monolith Inside core-service

| Field            | Detail                                                                                                                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                                                                                                                                                                          |
| **Context**      | Product strategy defines 7 business modules. Premature microservice decomposition adds distribution complexity without proven value. All modules share NestJS + MongoDB tech stack, same team, same deployment cadence.                                           |
| **Decision**     | All 7 business modules live inside core-service as strict NestJS modules. Module boundaries enforced by ESLint rules. Communication by direct injection of an exported service.                                                                                   |
| **Consequences** | **Easier**: Fast iteration, simple deployment, zero network overhead for inter-module calls, easier debugging. **Harder**: Must maintain module boundary discipline; risk of accidental coupling. Mitigated by lint rules + architecture fitness functions in CI. |

### DD-2: 4-Service Split Rationale

| Field            | Detail                                                                                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                                                                                                                                                        |
| **Context**      | Need to determine which capabilities deserve their own deployable vs. living in core-service.                                                                                                                                                   |
| **Decision**     | 4 services: gateway (stateless, scaling), auth (security isolation), core (modular monolith), document (heavy deps, different resource profile).                                                                                                |
| **Consequences** | **Easier**: Each service scales independently, auth can be security-audited in isolation, PDF generation doesn't affect API latency. **Harder**: 4 deployables to manage. Acceptable — each has a clear operational reason to exist separately. |

### DD-3: MongoDB, One Database per Service That Owns Data

| Field            | Detail                                                                                                                                                                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                                                                                                                                                                                      |
| **Context**      | core-service's modules all run in one process against one MongoDB database. Need to prevent accidental cross-module data access while keeping operational simplicity.                                                                                                         |
| **Decision**     | One MongoDB database per service that has a Prisma schema — auth-service and core-service. Each module's service only touches its own models, and reaches another module's data through that module's public service class. No database-level access control between modules. |
| **Consequences** | **Easier**: One database to operate, back up, and monitor per service. **Harder**: No DB-level isolation between core-service's modules, so cross-module access is prevented only by code review and lint rules.                                                              |

### DD-4: Zod for Shared Schema Validation

| Field            | Detail                                                                                                                                                      |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                                                                    |
| **Context**      | Need type-safe validation working identically in frontend (form validation) and backend (request validation).                                               |
| **Decision**     | All DTOs and domain types defined as Zod schemas in `@pawhaven/shared`. Frontend uses `@hookform/resolvers/zod`. Backend uses `nestjs-zod` validation pipe. |
| **Consequences** | Single source of truth for validation. Automatic TypeScript type inference. ~12KB gzipped Zod in frontend — acceptable.                                     |

### DD-7: User-Tier `roles` vs RBAC `Role`, and core→auth counting over HTTP

| Field            | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Context**      | The homepage hero stat `totalVolunteers` was hardcoded (`VOLUNTEER_BASELINE = 120`). The real count of users who opted into the volunteer tier lives in auth-service's `User` model in the `pawhaven-auth` database, while home stats live in core-service. We needed a real count without leaking auth's DB into core-service.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Decision**     | 1) Add `roles String[] @default([])` to auth-service `User` — the **progressive access tier** (product §2.1: guest → registered → volunteer). This is independent of the `Role`/`Permission`/`RolePermission` models in core-service, which are resolved by `bootstrap` into permission codes for menu filtering and do **not** gate endpoints today. 2) Count users with `volunteer` by calling a new public auth-service endpoint `GET /api/auth/volunteer-count` from core-service via `HttpClientService` (the documented core→auth HTTP inter-service pattern) — NOT by giving core-service a direct Prisma connection to the auth database. 3) Assignment is `POST /api/auth/volunteer/opt-in` (authenticated); the portal does not call this endpoint today — the hook is reserved for the future volunteer-flow UI. |
| **Consequences** | **Easier**: preserves auth DB isolation (DD-2) — core-service never gets a live connection to the DB holding bcrypt hashes + JWT secrets; single source of truth for users stays in auth-service; no duplicated `User` Prisma model in core-service. **Harder**: homepage stats now depend on auth-service availability and add one internal HTTP hop per load (mitigated later by caching); core-service must register `HttpClientModule` and a `microServices.auth-service` host config.                                                                                                                                                                                                                                                                                                                                  |

### DD-8: Reporter display name travels as a claim, snapshotted at write time

| Field            | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| **Context**      | The first entry of the rescue timeline always rendered `Anonymous`. Three facts behind it: (1) the portal hardcoded the timeline `author`; (2) no identity path carried the reporter's display name — `username` was returned in the login/register/refresh **response bodies** but was absent from the access-token payload, from the gateway identity, and from the internal JWT; (3) the client-supplied `AnimalReportSchema.contactInfo.name` was hardcoded to `'Anonymous'` in the form and **never persisted** by `ReportAnimalService.create`, so it was validated and discarded. **Reporting is authenticated-only by construction — there is no guest or anonymous reporting path, and none must be introduced:** the portal gates `/report-animal` behind the `requireUser` loader (a server `/me` round-trip that redirects to login on failure, backed by a global 401 → login handler), and every core-service write route is default-authenticated. `common.anonymous` is therefore strictly a **display fallback for legacy rows**, never a reporting mode — a report always carries an authoritative `reporterId` even when its display name is unknown. Per DD-2 the users table lives in auth-service and core-service must not read it directly (DD-7). |
| **Decision**     | The display name flows server-side: auth-service adds `username` to the access-token payload → gateway `identityFromPayload` maps it into `InternalJwtIdentity` and `InternalJwtService` signs it into the internal JWT → `AuthenticatedInternalJwtSchema` gains `username?: string` → core-service persists `reporterName String?` on `animalReports` from `claims.username` at both write paths and returns it as `RescueReporterSchema.reporterName: string \| null`. The client-supplied `contactInfo.name` is **deleted** from the contract. The portal renders `reporterName ?? t('common.anonymous')`. Pre-existing rows are not backfilled (test system) and simply surface as anonymous.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Consequences** | **Easier**: the name is server-derived, so a caller cannot attribute a report to someone else; no core→auth HTTP hop or fan-out change for a display-only field; no new i18n keys; deleting `contactInfo.name` removes two competing "reporter name" sources. **Harder**: the name is denormalized from auth into core, so it is a point-in-time snapshot and does not follow later username changes (accepted — the timeline answers "who reported this", not "what are they called now"); a row with no stored name (pre-existing rows, or a user whose `username` is null) renders via the existing `common.anonymous` key — identity ownership stays in core-service regardless, because `reporterId` is always present. **Non-obvious constraint**: `verifyInternalJwt` → `parseClaims` runs `InternalJwtSchema.parse()`, and Zod strips unknown keys — any future claim **must** be added to `AuthenticatedInternalJwtSchema` or it is silently dropped at the service boundary rather than surfacing as an error. The wire-format sample in `authentication-architecture.md` (Trust Model: Internal JWT) enumerates the same claim surface and must be synced whenever it changes.                                                                                  |

### DD-6: Feature-Based Frontend Modules

| Field            | Detail                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                                                                                                          |
| **Context**      | 7 product modules need clear frontend organization.                                                                                                                                               |
| **Decision**     | `features/{module}/` with api/<module>.api.ts, <module>.queries.ts, <module>.queryKeys.ts, <module>.mutations.ts, components/, hooks/, types.ts, index.tsx per feature. No cross-feature imports. |
| **Consequences** | Clear ownership, independent development, easier code splitting. Lint rules enforce feature isolation.                                                                                            |

### DD-9: Follow Relations Live in Their Own Collection, and Unfollow Hard-Deletes

| Field            | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Context**      | Users follow rescue animals so they can return to them. Two cheaper-looking shapes exist: an array on the user document (`followedAnimalIds`) or an array on the animal document (`followerIds`). Both make the follower count a write into a document owned by a different module, and both grow an unbounded array inside a single document. The alternative — a dedicated join collection — costs one extra collection and a query for the count.                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Decision**     | A dedicated `animal_follows` collection owned by the `AnimalFollow` module (DD-3): one row per `(userId, animalId)`, with `@@unique([userId, animalId])` as the duplicate-follow guard and `@@index([animalId])` for the follower count. `follow` upserts on the compound key and recovers from a `P2002` unique-constraint violation by re-reading the winning row; `unfollow` deletes the row with `deleteMany`. All routes sit behind the gateway under `/api/core/animal-follow`; the status and follower-count reads are `@OptionalAuth()` so an expired session on the public rescue-detail page cannot 401 a visitor off that page, while the single status read (GET `:animalId/status`, which also returns the follower count) is `@OptionalAuth()`, so the rescue-detail page fires one anonymous-safe request; follow (POST) and unfollow (PUT) remain default-authenticated. |
| **Consequences** | **Easier**: the module owns its collection and never writes into the user or animal documents, so the module boundary holds; the follower count is an ordinary indexed query; and both writes are idempotent under retries, double-clicks and concurrent duplicate requests, so the client needs no special-case error handling. **Harder**: the follower count is a query rather than a denormalized counter, so it is not free with the animal read; and the module stores `animalId` as an opaque identifier and never reads the animal aggregate, so any surface needing animal details must resolve them separately — this is what keeps follow decoupled from the animal aggregate. **Non-obvious constraint**: unfollow must be a hard delete. A soft delete would leave the unique `(userId, animalId)` row in place and permanently block re-following.                         |

---

### DD-10: Single-Template PDF Engine — document-service is pure render/download; PDF copy is an i18n resource, PDF data is passed inbound

| Field               | Detail                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**          | Accepted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Context**         | document-service previously exposed multiple PDF APIs (e.g. `POST /document/pdf/create`, rescue/guides/preview routes) and held PDF content + a catalog + i18n namespaces. That made it a data owner and a browser-reachable surface, coupling document generation to domain knowledge it had no business knowing.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Decision**        | **Every PDF is a template behind ONE route.** document-service is PURE generation + download. Its data boundary is precise: **no DB, no outbound calls, no catalog endpoint** — it never fetches, stores or derives domain data. PDF content is split by kind, and the split is the decision: the **translatable copy** of every guide lives in `@pawhaven/i18n` (`locales/{locale}/documents/pdf/{slug}.json`, nested as `document.pdf.<slug>`, with the shell chrome `document.pdf.header` / `document.pdf.footer` beside it) and document-service reads it as a **static package resource** through the Node-safe `@pawhaven/i18n/resources` entry — `document.pdf.*` is the one content key space document-service owns; the **non-translatable data** (`provenance` today, per-template structured input in general) is assembled by core-service's `guide` module and passed inbound. The single contract is `POST /document-service/internal/pdf/render` with body `{ template: 'rescueGuide' \| 'firstAid' \| 'kittenCare' \| 'injuryResponse' (= templates/<slug>/), locale?: 'en-US' \| 'zh-CN' \| 'de-DE', data?: Record<string, unknown>, options?: {format, landscape, scale, margin, printBackground, displayHeaderFooter, preferCSSPageSize} }` — a `z.strictObject` (not a discriminated union), so an unknown template is a **400** (the enum rejects it) but `data` is an opaque generic record with no per-template validation. `options` is optional; omitting it reproduces the previously hardcoded config exactly (A4, margins `70px/70px/0/0`, `printBackground` / `displayHeaderFooter` true, `preferCSSPageSize` false); its defaults live in document-service (`PDF/engine/defaultOptions.ts`) because they are engine behaviour, not contract. The render response is raw PDF bytes with `Content-Type: application/pdf` + `Content-Length` only (document-service sets NO `Content-Disposition`). The browser-facing flow is `POST /api/core/guide/pdf { template }` (core streams PDF bytes back with `Content-Type: application/pdf`); the requested locale arrives as the `x-locale` header and is canonicalised by `normalizeLocale` (any non-canonical value → `en-US`). The gateway keeps a `/api/document` proxy entry in every environment, but no frontend caller uses it — the browser-facing contract is `POST /api/core/guide/pdf`, so in practice document-service is reached only through core-service. |
| **Amendment**       | **2026-09-19 (Option B) — DD-10 amended; locked decision D2 is superseded for the PDF surface only.** D2 said guide body content stays in core-service as domain data, not in i18n. Under Option B (user decision) the PDF's translatable copy moves into `@pawhaven/i18n` and is resolved by document-service. The old clause "no domain knowledge" was therefore false in substance and is replaced by the precise rule above. D2 remains in force for everything that is not PDF copy.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Consequences**    | **Easier**: document-service is stateless and trivially scalable; no data layer to secure; the copy lives in the one package that already owns the 3-locale sync rule; `data` stays with the domain that owns it (core-service `guide`). **Harder**: the 2-hop flow `browser POST /api/core/guide/pdf { template } → core POST /document-service/internal/pdf/render { template, locale, data: {} } → document-service resolves copy from i18n + renders React→HTML→Puppeteer PDF Buffer → core streams bytes`; and adding a guide touches 3 locale JSON files + 1 template folder + the `definePdfTemplate` registry entry (guarded by `satisfies Record<GuideSlug, …>`) + the `guideSlugs` enum in `@pawhaven/shared`. The render route is protected by the global `InternalJwtGuard`; core-service signs a complete `kind:'authenticated'` JWT (`aud:'document-service'`, `iat`/`exp`/`rid`/`sub`) with `INTERNAL_JWT_PRIVATE_KEY` / `kid:'internal-v1'`, and document-service trusts the `internal-v1` public key. The contract (`RenderPdfBodySchema`) lives in `@pawhaven/backend-core/types/Document.schema.ts` and is consumed identically on both sides.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| **Settled details** | `data` and the `locale` prop are **kept deliberately**: `data` is `Record<string, unknown>` and `.optional()` — generic by design, with no per-template validation at the contract boundary (each template component interprets whatever it receives, and today's only caller passes `data: {}`). Every template component receives `locale` even though no template reads it today — it is the render's own locale and is what `<html lang>` and the chrome are built from, so it is not a channel without a consumer. **Contacts (labels AND values) stay wholly in `@pawhaven/i18n`**: a locale's hotline is different content, not a translation of another locale's, and splitting label (i18n) from value (`data`) would create positional coupling that silently mis-pairs on reorder. **Still open:** whether the per-slug template components are merged into one is undecided; what is decided is the registry (keyed by `GuideSlug`) and the props contract `PdfTemplateProps<K>` — docs must not assert a template file count.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

---

## 11. Module Boundary Enforcement

### 11.1 ESLint Rules

```javascript
// .eslintrc.cjs — custom rules for core-service
{
  rules: {
    // No cross-module imports of internal files
    'import/no-restricted-paths': ['error', {
      zones: [
        {
          target: './src/modules/rescue',
          from: './src/modules/reporting',
          except: [], // No exceptions — use service classes or events
        },
        // ... same for every module pair
      ],
    }],
  },
}
```

### 11.2 CI Architecture Fitness Function

```bash
#!/bin/bash
# scripts/check-module-boundaries.sh
# Runs in CI — fails if any module imports another module's internals

# Check: No module imports another module's entities/use-cases directly
FORBIDDEN_IMPORTS=$(grep -r "from.*modules/\(rescue\|reporting\|adoption\|content\|volunteer\)" \
  apps/backend/core-service/src/modules/ \
  --include="*.ts" \
  | grep -v "modules/\1" \
  | grep -v "events/" \
  | grep -v "\.service" )

if [ -n "$FORBIDDEN_IMPORTS" ]; then
  echo "❌ Cross-module import detected. Use service classes or events instead."
  echo "$FORBIDDEN_IMPORTS"
  exit 1
fi
echo "✅ Module boundaries clean"
```

---

## 12. Why This Design Works

### 12.1 The Pragmatic Balance

| Concern             | How It's Addressed                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------- |
| **Scalability**     | Gateway + core scale independently. Document scales separately (heavy PDF).                  |
| **Maintainability** | 7 modules with enforced boundaries. Each module is independently understandable.             |
| **Extensibility**   | New product module = new folder in `modules/`. No new service needed.                        |
| **Deployability**   | 4 services. Each has a clear reason to exist. No "microservice for the sake of it."          |
| **Observability**   | Structured logging with module tag. Trace ID across all services.                            |
| **Future-proofing** | Modules can be extracted to separate services without code changes — just deployment config. |

### 12.2 When to Add a 5th Service

> **Only when at least TWO of these are true for a module:**
>
> 1. It needs independent scaling — a different traffic shape from the rest
> 2. It needs a different tech stack
> 3. A different team takes ownership
> 4. It has a different release cadence

### 12.3 What to Re-evaluate in 3 Months

- **`apps/backend/config-service/`**: the per-environment portal YAML is read by nothing. Either
  wire it into the portal's runtime config or delete the directory.
- **`Route` and `RoutePermission`**: defined in the Prisma schema, queried by no code. Either
  adopt them for server-driven routing or drop them from the schema.

---

> **Related Docs**: [Frontend Architecture](PawHaven-Frontend-Architecture.md) | [Backend Architecture](PawHaven-Backend-Architecture.md) | [Authentication Architecture](authentication-architecture.md)
