# PawHaven — System Architecture Overview

> **Version**: v3.0 | **Date**: 2026-07-10
> **Design Philosophy**: Pragmatic service decomposition. Modular monolith inside core-service. Extract only when necessary.
>
> **Related Docs**: [Frontend Architecture](./PawHaven-Frontend-Architecture.md) | [Backend Architecture](./PawHaven-Backend-Architecture.md)

---

## Table of Contents

1. [Architecture Philosophy](#1-architecture-philosophy)
2. [Service Decomposition — 5 Services](#2-service-decomposition--5-services)
3. [C4 Model — System Landscape](#3-c4-model--system-landscape)
4. [Data Architecture](#4-data-architecture)
5. [API Gateway Design](#5-api-gateway-design)
6. [Event-Driven Communication (In-Process)](#6-event-driven-communication-in-process)
7. [Shared Kernel & Package Strategy](#7-shared-kernel--package-strategy)
8. [Security Architecture](#8-security-architecture)
9. [Observability & Operations](#9-observability--operations)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Architecture Decision Records](#11-architecture-decision-records)
12. [Module Boundary Enforcement](#12-module-boundary-enforcement)
13. [Why This Design Works](#13-why-this-design-works)

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
| P5  | **Event-driven within, HTTP between**           | In-process event bus for module-to-module within core-service. HTTP (via gateway proxy) between services                       |
| P6  | **One database, logically partitioned**         | MongoDB with collection-per-context naming convention. Separate DB only when data isolation is legally/operationally required  |

### The Extraction Trigger Rule

> **Don't extract a module from core-service until at least TWO of these are true:**
>
> 1. It needs **independent scaling** (different traffic/load patterns)
> 2. It needs a **different tech stack** (e.g., Python for ML matching)
> 3. A **different team** owns it
> 4. It has a **different deployment cadence** (releases on a different schedule)

---

## 2. Service Decomposition — 5 Services

### 2.1 The Architecture at a Glance

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Service 1: gateway                             │  │
│  │  Stateless — Auth guard (JWT verify), Rate limiting,       │  │
│  │  Request proxying, CORS, Trace ID injection, Logging       │  │
│  └──────────┬──────────┬──────────┬──────────┬────────────────┘  │
│             │          │          │          │                   │
│             ▼          ▼          ▼          ▼                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ Service 2:   │ │ Service 3:   │ │ Service 4:   │            │
│  │ auth-service │ │ core-service │ │ document-    │            │
│  │              │ │              │ │ service      │            │
│  │ Register     │ │ ┌──────────┐ │ │              │            │
│  │ Login        │ │ │ Rescue   │ │ │ File upload  │            │
│  │ JWT issue    │ │ │ Cases     │ │ │ PDF generate │            │
│  │ Token refresh│ │ │ Timeline  │ │ │ Email send   │            │
│  │ Role/Perm    │ │ ├──────────┤ │ │ Image process│            │
│  │              │ │ │ Reporting│ │ │              │            │
│  └──────────────┘ │ │ Reports  │ │ └──────────────┘            │
│                    │ │ Urgency  │ │                             │
│  ┌──────────────┐  │ ├──────────┤ │                             │
│  │ Service 5:   │  │ │ Adoption │ │                             │
│  │ config-      │  │ │ Listings │ │                             │
│  │ service      │  │ │ Apply    │ │                             │
│  │              │  │ ├──────────┤ │                             │
│  │ Menu config  │  │ │ Content  │ │                             │
│  │ Route config │  │ │ Stories  │ │                             │
│  │ Feature flags│  │ │ Knowledge│ │                             │
│  │ (future)     │  │ ├──────────┤ │                             │
│  └──────────────┘  │ │Volunteer │ │                             │
│                    │ │ Profile  │ │                             │
│                    │ │ Matching │ │                             │
│                    │ ├──────────┤ │                             │
│                    │ │Notificat.│ │                             │
│                    │ │ Push/Mail│ │                             │
│                    │ ├──────────┤ │                             │
│                    │ │Achieve-  │ │                             │
│                    │ │ ment     │ │                             │
│                    │ ├──────────┤ │                             │
│                    │ │ Profile  │ │                             │
│                    │ └──────────┘ │                             │
│                    └──────────────┘                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Why Each Service Exists

| #   | Service              | Why Separate?                                                                                                                                                    | If Merged, What Breaks?                                                                                                           |
| --- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **gateway**          | Stateless. Handles ALL traffic. Needs independent horizontal scaling. TLS termination, rate limiting, CORS — infrastructure concerns, not business logic.        | Merging into core-service couples infrastructure scaling with business logic scaling. Gateway may need 5 pods while core needs 2. |
| 2   | **auth-service**     | Different security posture. Holds bcrypt hashes + JWT secrets. Independent security auditing. If auth is down, nothing works — circuit breaker needed.           | Merging into core-service means any core deployment risks auth downtime. Security audit scope expands to all business code.       |
| 3   | **core-service**     | The modular monolith. All 7 business modules live here as strict modules. Single deployable, single database. Internal module boundaries enforced by lint rules. | This IS the merge target. Everything that doesn't need operational isolation lives here.                                          |
| 4   | **document-service** | Heavy dependencies. Different resource profile — CPU/memory spikes during PDF generation. Different scaling model.                                               | Merging into core-service means every core pod carries heavy dependencies. PDF generation spikes affect rescue API latency.       |
| 5   | **config-service**   | Currently serves static menu/route config. Future: centralized feature flags, dynamic config. Separate so config changes don't require core-service redeploy.    | Could merge into core-service today. Kept separate for future centralized config strategy. Re-evaluate in 3 months.               |

### 2.3 Service-to-Service Communication

```
gateway ──HTTP proxy──► auth-service       (auth endpoints)
gateway ──HTTP proxy──► core-service       (all business endpoints)
gateway ──HTTP proxy──► document-service   (file/PDF endpoints)
gateway ──HTTP proxy──► config-service     (menu/route endpoints)

core-service ──HTTP──► document-service    (generate PDF, send email)
core-service ──HTTP──► auth-service        (verify token, fetch user)

// All inter-module communication within core-service:
// In-process event bus (zero network overhead)
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
│  │  Auth Guard · Rate Limit · Proxy · CORS · Trace ID              │  │
│  └───┬──────────┬────────────┬────────────┬───────────────────┘  │
│      │          │            │            │                     │
│      ▼          ▼            ▼            ▼                     │
│  ┌────────┐ ┌────────────┐ ┌────────┐ ┌────────────┐          │
│  │ auth-  │ │ core-      │ │document│ │ config-    │          │
│  │ service│ │ service    │ │service │ │ service    │          │
│  │        │ │            │ │        │ │            │          │
│  │ D B    │ │ ┌────────┐ │ │D B     │ │ (static     │          │
│  │ (auth) │ │ │rescue  │ │ │(docs)  │ │  config)   │          │
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
│  │   · gateway → services: HTTP proxy                          │  │
│  │   · core → document/auth: HTTP                              │  │
│  │   · module → module (within core): event bus                 │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 4. Data Architecture

### 4.1 Database Strategy

```
┌─────────────────────────────────────────────────────────┐
│              Database (single cluster)                    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Database: pawhaven-auth                          │   │
│  │  · users, roles, permissions, refreshTokens       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Database: pawhaven-core                          │   │
│  │                                                    │   │
│  │  Collections (prefixed by module):                 │   │
│  │  · rescue_cases          (Rescue module)          │   │
│  │  · rescue_transitions    (Rescue module)          │   │
│  │  · stray_reports         (Reporting module)       │   │
│  │  · urgency_assessments   (Reporting module)       │   │
│  │  · adoption_listings     (Adoption module)        │   │
│  │  · adoption_applications (Adoption module)        │   │
│  │  · adoption_agreements   (Adoption module)        │   │
│  │  · stories               (Content module)         │   │
│  │  · knowledge_articles    (Content module)         │   │
│  │  · content_reviews       (Content module)         │   │
│  │  · volunteer_profiles    (Volunteer module)       │   │
│  │  · case_claims           (Volunteer module)       │   │
│  │  · notifications         (Notification module)    │   │
│  │  · notification_prefs    (Notification module)    │   │
│  │  · achievements          (Achievement module)     │   │
│  │  · milestones            (Achievement module)     │   │
│  │  · menus, routes, roles  (Bootstrap module)       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Database: pawhaven-docs                          │   │
│  │  · fileReferences                                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  External: S3-compatible Object Storage           │   │
│  │  · Animal photos, story images, PDFs              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Data Access Rules

| Rule                             | Enforcement                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------ |
| Each module owns its collections | Only the owning module's data service accesses its collections                 |
| Cross-module data access         | Through the owning module's public service class, never direct DB access       |
| Collection naming                | `{module}_{entity}` — makes ownership clear, enables future DB split           |
| Shared extensions                | Soft-delete + versioning via `@pawhaven/backend-core` — applied to all modules |
| Geo queries                      | Geospatial queries via raw database queries (Volunteer module)                 |
| Full-text search                 | Search index on `knowledge_articles` collection (Content module)               |

---

## 5. API Gateway Design

### 5.1 Architecture

```
Client Request
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│                    gateway                                │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Public Routes│  │ Auth Guard  │  │ Rate Limiter    │  │
│  │ @Public()   │  │ (verify)    │  │ (per IP/user)   │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         │                │                  │           │
│         └────────────────┼──────────────────┘           │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Proxy Router                         │  │
│  │  /api/auth/*       → auth-service                 │  │
│  │  /api/rescues/*    → core-service                 │  │
│  │  /api/reports/*    → core-service                 │  │
│  │  /api/adoptions/*  → core-service                 │  │
│  │  /api/stories/*    → core-service                 │  │
│  │  /api/knowledge/*  → core-service                 │  │
│  │  /api/volunteers/* → core-service                 │  │
│  │  /api/notifications/* → core-service              │  │
│  │  /api/profile/*    → core-service                 │  │
│  │  /api/files/*      → document-service             │  │
│  │  /api/config/*     → config-service               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Cross-Cutting                         │  │
│  │  · X-Trace-Id injection + propagation             │  │
│  │  · User context headers (X-Auth-User-Id, Roles)   │  │
│  │  · Structured request/response logging            │  │
│  │  · Response header sanitization                   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Auth Guard Decorators

```typescript
// Public — no auth required
@Public()
@Get('health')
healthCheck() {}

// Optional auth — works with or without JWT
@OptionalAuth()
@Get('rescues')
listRescues() {}

// Protected — JWT required
@Get('profile')
getProfile(@AuthUser() user: User) {}
```

---

## 6. Event-Driven Communication (In-Process)

### 6.1 Event Catalog

```
Within core-service (event bus):

Reporting Module publishes:
  StrayAnimalReported → Rescue Module (creates case)
                       → Volunteer Module (matches volunteers)
                       → Notification Module (notifies nearby volunteers)
                       → Content Module (recommends relevant articles)

Rescue Module publishes:
  RescueCaseReported → Volunteer Module (matching)
                      → Notification Module (notify nearby)

  RescueStatusChanged → Adoption Module (if awaitingAdoption → create listing)
                       → Notification Module (notify reporter/followers)
                       → Achievement Module (check milestones)

  RescueCaseCompleted → Content Module (invite story writing)
                       → Achievement Module (award badges)
                       → Volunteer Module (update stats)

Volunteer Module publishes:
  VolunteerClaimed → Rescue Module (update status to inProgress)
                    → Notification Module (notify reporter)

Adoption Module publishes:
  AdoptionFinalized → Rescue Module (update status to adopted)
                     → Content Module (invite adoption story)
                     → Achievement Module (award badges)
```

### 6.2 Implementation

```
Phase 1 (MVP): In-process event bus
Zero infrastructure. Zero latency. Works within a single process.

Phase 3+ (if core-service is split):
Replace in-process event bus with message broker
Module code unchanged — only the transport layer changes
```

### 6.3 Event Schema (in @pawhaven/shared)

```typescript
// packages/shared/events/rescue.events.ts
import { z } from 'zod';

export const RescueStatusChangedEventSchema = z.object({
  type: z.literal('rescue.status.changed'),
  version: z.literal(1),
  timestamp: z.string().datetime(),
  payload: z.object({
    caseId: z.string(),
    animalId: z.string(),
    fromStatus: z.string(),
    toStatus: z.string(),
    operatorId: z.string(),
    operatorRole: z.enum(['reporter', 'volunteer', 'shelter', 'system']),
  }),
});
```

---

## 7. Shared Kernel & Package Strategy

### 7.1 Package Dependency Graph

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

### 7.2 What Goes Where

| Package                   | Contains                                                                                          | Must NOT Contain                                   |
| ------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `@pawhaven/shared`        | Zod schemas, TypeScript types, constants, event definitions, pure utility functions               | React code, backend framework code, database logic |
| `@pawhaven/backend-core`  | SharedModule, PrismaModule, HttpClientModule, decorators, guards, interceptors, Prisma extensions | Business logic, domain entities                    |
| `@pawhaven/frontend-core` | React hooks, API client, storage utilities, lazy loading helpers                                  | Business-specific components                       |
| `@pawhaven/design-system` | CSS tokens, Tailwind theme, theme configuration, CSS utilities                                    | React components                                   |
| `@pawhaven/ui`            | Reusable React components (Form\*, Loading, Toast, etc.)                                          | Business logic, API calls                          |
| `@pawhaven/i18n`          | Translation provider, locale files, language detection                                            | Business content                                   |

---

## 8. Security Architecture

### 8.1 Authentication Flow

```
Client → gateway → auth-service
                     │
                     │ POST /auth/login (email + password)
                     │ ← Token pair (access 15min, refresh 7d)
                     │
Client → gateway (Authorization: Bearer <access_token>)
           │
           │ Auth Guard verifies token
           │ Injects headers: X-Auth-User-Id, X-Auth-User-Roles
           │
           ▼
         core-service (trusts headers — internal network only)
```

### 8.2 Security Layers

| Layer            | Mechanism                                                |
| ---------------- | -------------------------------------------------------- |
| Transport        | HTTPS (TLS 1.3)                                          |
| Authentication   | Token-based, verified at gateway                         |
| Authorization    | RBAC — roles + permissions, checked at gateway + service |
| Input Validation | Zod schemas via global validation pipe                   |
| Rate Limiting    | Token bucket per IP + per user at gateway                |
| Data Privacy     | GPS fuzzing (displayArea, not exact coords post-rescue)  |
| CSRF             | SameSite cookies + token header                          |
| CORS             | Whitelist origins per environment                        |

---

## 9. Observability & Operations

### 9.1 Three Pillars

```
Logging           Metrics            Tracing
· Structured JSON · Request count    · X-Trace-Id across
· service tag     · p50/p95/p99      · all services
· traceId per log · Error rate       · compatible
· levels: info/   · Status codes
  warn/error      · DB query times
```

### 9.2 Health Checks

```
GET /health       → { status, db, uptime, version }
GET /health/live  → liveness probe (k8s)
GET /health/ready → readiness probe (k8s)
```

### 9.3 Structured Logging

```typescript
this.logger.log({
  message: 'Rescue case status changed',
  traceId: req.headers['x-trace-id'],
  service: 'core-service',
  module: 'rescue',
  data: { caseId, fromStatus: 'pending', toStatus: 'inProgress', operatorId },
});
```

---

## 10. Deployment Architecture

### 10.1 MVP (Current → Month 3)

```
┌─────────────────────────────────────────────────────────┐
│  Single VPS / Container                                  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Docker Compose                                   │   │
│  │                                                    │   │
│  │  gateway:1    auth-service:1    core-service:2    │   │
│  │  document:1   config-service:1                    │   │
│  │                                                    │   │
│  │  Database:1 (with 3 databases)                    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 10.2 Production (Phase 3+)

```
┌─────────────────────────────────────────────────────────┐
│  K8s Cluster                                            │
│                                                          │
│  gateway:     2-5 pods (HPA on CPU)                     │
│  auth:        2 pods                                    │
│  core:        2-5 pods (HPA on CPU)                     │
│  document:    1-2 pods (HPA on CPU)                     │
│  config:      1 pod                                     │
│                                                          │
│  Managed Database                                       │
│  Object storage                                         │
│  Cache layer (rate limiting)                            │
└─────────────────────────────────────────────────────────┘
```

---

## 11. Architecture Decision Records

### ADR-001: Modular Monolith Inside core-service

| Field            | Detail                                                                                                                                                                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                                                                                                                                                                          |
| **Context**      | Product strategy defines 7 business modules. Premature microservice decomposition adds distribution complexity without proven value. All modules share NestJS + MongoDB tech stack, same team, same deployment cadence.                                           |
| **Decision**     | All 7 business modules live inside core-service as strict NestJS modules. Module boundaries enforced by ESLint rules. Communication via in-process EventEmitter2.                                                                                                 |
| **Consequences** | **Easier**: Fast iteration, simple deployment, zero network overhead for inter-module calls, easier debugging. **Harder**: Must maintain module boundary discipline; risk of accidental coupling. Mitigated by lint rules + architecture fitness functions in CI. |

### ADR-002: 5-Service Split Rationale

| Field            | Detail                                                                                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                                                                                                                                                        |
| **Context**      | Need to determine which capabilities deserve their own deployable vs. living in core-service.                                                                                                                                                   |
| **Decision**     | 5 services: gateway (stateless, scaling), auth (security isolation), core (modular monolith), document (heavy deps, different resource profile), config (separate deploy for config changes).                                                   |
| **Consequences** | **Easier**: Each service scales independently, auth can be security-audited in isolation, PDF generation doesn't affect API latency. **Harder**: 5 deployables to manage. Acceptable — each has a clear operational reason to exist separately. |

### ADR-003: MongoDB with Collection-per-Module

| Field            | Detail                                                                                                                                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                                                                                                                                                                   |
| **Context**      | All core-service modules share one MongoDB database. Need to prevent accidental cross-module data access while keeping operational simplicity.                                                                                                             |
| **Decision**     | Single database `pawhaven-core` with collection naming convention `{module}_{entity}`. Each module's Prisma service only accesses its own collections. Cross-module data access through public service classes only.                                       |
| **Consequences** | **Easier**: Single DB to operate, backup, and monitor. **Harder**: No DB-level access control between modules (mitigated by code-level enforcement). Future: if a module needs data isolation, split its collections into a separate DB — no code changes. |

### ADR-004: Zod for Shared Schema Validation

| Field            | Detail                                                                                                                                                                      |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                                                                                    |
| **Context**      | Need type-safe validation working identically in frontend (form validation) and backend (request validation).                                                               |
| **Decision**     | All DTOs, event schemas, and domain types defined as Zod schemas in `@pawhaven/shared`. Frontend uses `@hookform/resolvers/zod`. Backend uses `nestjs-zod` validation pipe. |
| **Consequences** | Single source of truth for validation. Automatic TypeScript type inference. ~12KB gzipped Zod in frontend — acceptable.                                                     |

### ADR-005: In-Process Events → Future Message Broker

| Field            | Detail                                                                                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                                                                                                     |
| **Context**      | Modules need to react to events in other modules without tight coupling.                                                                                                                     |
| **Decision**     | Phase 1: NestJS EventEmitter2 (in-process). Phase 3+: migrate to message broker only if/when modules are extracted from core-service.                                                        |
| **Consequences** | **Easier**: Zero infrastructure, zero latency, simple debugging. **Harder**: Events are lost on process restart (acceptable for Phase 1 — events are not the system of record; database is). |

### ADR-006: Feature-Based Frontend Modules

| Field            | Detail                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                                                                                                          |
| **Context**      | 7 product modules need clear frontend organization.                                                                                                                                               |
| **Decision**     | `features/{module}/` with api/<module>.api.ts, <module>.queries.ts, <module>.queryKeys.ts, <module>.mutations.ts, components/, hooks/, types.ts, index.tsx per feature. No cross-feature imports. |
| **Consequences** | Clear ownership, independent development, easier code splitting. Lint rules enforce feature isolation.                                                                                            |

---

## 12. Module Boundary Enforcement

### 12.1 ESLint Rules

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

### 12.2 CI Architecture Fitness Function

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

## 13. Why This Design Works

### 13.1 The Pragmatic Balance

| Concern             | How It's Addressed                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------- |
| **Scalability**     | Gateway + core scale independently. Document scales separately (heavy PDF).                  |
| **Maintainability** | 7 modules with enforced boundaries. Each module is independently understandable.             |
| **Extensibility**   | New product module = new folder in `modules/`. No new service needed.                        |
| **Deployability**   | 5 services. Each has a clear reason to exist. No "microservice for the sake of it."          |
| **Observability**   | Structured logging with module tag. Trace ID across all services.                            |
| **Future-proofing** | Modules can be extracted to separate services without code changes — just deployment config. |

### 13.2 When to Add a 6th Service

> **Only when at least TWO of these are true for a module:**
>
> 1. It needs independent scaling (e.g., Notification module gets 10x traffic)
> 2. It needs a different tech stack (e.g., Python ML for adoption matching)
> 3. A different team takes ownership
> 4. It has a different release cadence

### 13.3 What to Re-evaluate in 3 Months

- **config-service**: If it stays as static YAML serving, merge into core-service
- **Notification module**: If push/email volume grows significantly, consider extracting
- **Content module (Knowledge Base)**: If search becomes a core feature, consider dedicated search service

---

> **Related Docs**: [Frontend Architecture](./PawHaven-Frontend-Architecture.md) | [Backend Architecture](./PawHaven-Backend-Architecture.md)
