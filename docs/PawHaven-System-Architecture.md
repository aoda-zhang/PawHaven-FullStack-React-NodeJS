# PawHaven — System Architecture Design

> **Version**: v2.0 | **Date**: 2024-12-01
> **Based on**: [PawHaven-Product-Strategy.md](./PawHaven-Product-Strategy.md)  
> **Design Philosophy**: Pragmatic service decomposition. Modular monolith inside core-service. Extract only when necessary.

---

## Table of Contents

1. [Architecture Philosophy](#1-architecture-philosophy)
2. [Service Decomposition ��� 5 Services](#2-service-decomposition--5-services)
3. [Core-Service: The Modular Monolith](#3-core-service-the-modular-monolith)
4. [Bounded Contexts as NestJS Modules](#4-bounded-contexts-as-nestjs-modules)
5. [C4 Model — System Landscape](#5-c4-model--system-landscape)
6. [Data Architecture](#6-data-architecture)
7. [API Gateway Design](#7-api-gateway-design)
8. [Event-Driven Communication (In-Process)](#8-event-driven-communication-in-process)
9. [Shared Kernel & Package Strategy](#9-shared-kernel--package-strategy)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Security Architecture](#11-security-architecture)
12. [Observability & Operations](#12-observability--operations)
13. [Deployment Architecture](#13-deployment-architecture)
14. [Architecture Decision Records](#14-architecture-decision-records)
15. [Module Boundary Enforcement](#15-module-boundary-enforcement)
16. [Why This Design Works](#16-why-this-design-works)

---

## 1. Architecture Philosophy

> **"Microservices are a means, not an end. The goal is maintainable, scalable software — not a specific number of services."**

### Core Principles

| #   | Principle                                       | What It Means                                                                                                                  |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| P1  | **Split by operational need, not domain count** | Extract a service only when it needs independent scaling, different tech stack, separate team, or different deployment cadence |
| P2  | **Monolith-first, module-always**               | core-service is a single deployable. Internally, every bounded context is a strict NestJS module                               |
| P3  | **Internal modules = future services**          | Module boundaries are enforced by lint rules. Extraction is a deployment change, not a code rewrite                            |
| P4  | **Gateway as the only public surface**          | All external traffic flows through gateway. Internal services never exposed to the internet                                    |
| P5  | **Event-driven within, REST between**           | In-process EventEmitter for module-to-module within core-service. HTTP (via gateway proxy) between services                    |
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

| #   | Service              | Why Separate?                                                                                                                                                           | If Merged, What Breaks?                                                                                                           |
| --- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **gateway**          | Stateless. Handles ALL traffic. Needs independent horizontal scaling. TLS termination, rate limiting, CORS — infrastructure concerns, not business logic.               | Merging into core-service couples infrastructure scaling with business logic scaling. Gateway may need 5 pods while core needs 2. |
| 2   | **auth-service**     | Different security posture. Holds bcrypt hashes + JWT secrets. Independent security auditing. If auth is down, nothing works — circuit breaker needed.                  | Merging into core-service means any core deployment risks auth downtime. Security audit scope expands to all business code.       |
| 3   | **core-service**     | The modular monolith. All 7 business modules live here as strict NestJS modules. Single deployable, single database. Internal module boundaries enforced by lint rules. | This IS the merge target. Everything that doesn't need operational isolation lives here.                                          |
| 4   | **document-service** | Heavy dependencies (Puppeteer ~300MB). Different resource profile — CPU/memory spikes during PDF generation. Different scaling model.                                   | Merging into core-service means every core pod carries Puppeteer. PDF generation spikes affect rescue API latency.                |
| 5   | **config-service**   | Currently serves static menu/route config. Future: centralized feature flags, dynamic config. Separate so config changes don't require core-service redeploy.           | Could merge into core-service today. Kept separate for future centralized config strategy. Re-evaluate in 3 months.               |

### 2.3 Service-to-Service Communication

```
gateway ──HTTP proxy──► auth-service       (auth endpoints)
gateway ──HTTP proxy──► core-service       (all business endpoints)
gateway ──HTTP proxy──► document-service   (file/PDF endpoints)
gateway ──HTTP proxy──► config-service     (menu/route endpoints)

core-service ──HTTP──► document-service    (generate PDF, send email)
core-service ──HTTP──► auth-service        (verify token, fetch user)

// All inter-module communication within core-service:
// In-process NestJS EventEmitter (zero network overhead)
```

---

## 3. Core-Service: The Modular Monolith

### 3.1 Why a Modular Monolith?

> **core-service is one deployable, but it is NOT one big ball of mud.**

It is a **modular monolith**: a single process where each business capability lives in a strict NestJS module with enforced boundaries. Modules communicate through defined interfaces (service classes + events), never by importing each other's internals.

### 3.2 Internal Module Structure

```
apps/backend/core-service/src/modules/
│
├── rescue/                    # 🐾 Rescue Case Management
│   ├── rescue.module.ts       #   Module definition
│   ├── rescue.service.ts      #   Public API (what other modules can call)
│   ├── rescue.controller.ts   #   HTTP endpoints
│   ├── entities/              #   Domain entities (not Prisma models)
│   │   ├── rescue-case.entity.ts
│   │   ├── status-transition.entity.ts
│   │   └── rescue-timeline.entity.ts
│   ├── use-cases/             #   Application use cases
│   │   ├── create-rescue-case.usecase.ts
│   │   ├── transition-status.usecase.ts
│   │   └── get-rescue-timeline.usecase.ts
│   ├── events/                #   Events this module publishes
│   │   └── rescue.events.ts
│   └── DTO/                   #   Request/Response DTOs
│
├── reporting/                 # 📋 Stray Animal Reporting
│   ├── reporting.module.ts
│   ├── reporting.service.ts
│   ├── reporting.controller.ts
│   ├── use-cases/
│   │   ├── submit-report.usecase.ts
│   │   └── assess-urgency.usecase.ts
│   ├── events/
│   │   └── reporting.events.ts
│   └── DTO/
│
├── adoption/                  # 🏠 Adoption Matching
│   ├── adoption.module.ts
│   ├── adoption.service.ts
│   ├── adoption.controller.ts
│   ├── use-cases/
│   │   ├── create-listing.usecase.ts
│   │   ├── submit-application.usecase.ts
│   │   └── match-adoptions.usecase.ts
│   ├── events/
│   │   └── adoption.events.ts
│   └── DTO/
│
├── content/                   # 💝 Stories & Knowledge Base
│   ├── content.module.ts
│   ├── content.service.ts
│   ├── content.controller.ts
│   ├── use-cases/
│   ├── events/
│   └── DTO/
│
├── volunteer/                 # 🤝 Volunteer Collaboration
│   ├── volunteer.module.ts
│   ├── volunteer.service.ts
│   ├── volunteer.controller.ts
│   ├── use-cases/
│   ├── events/
│   └── DTO/
│
├── notification/              # 🔔 Notifications
│   ├── notification.module.ts
│   ├── notification.service.ts
│   ├── notification.controller.ts
│   └── events/                #   Only subscribes, never publishes domain events
│       └── notification.handlers.ts
│
├── achievement/               # 🏅 Achievements & Badges
│   ├── achievement.module.ts
│   ├── achievement.service.ts
│   ├── achievement.controller.ts
│   └── events/
│       └── achievement.handlers.ts
│
├── profile/                   # 👤 User Profile (aggregated view)
│   ├── profile.module.ts
│   ├── profile.service.ts
│   └── profile.controller.ts
│
└── bootstrap/                 # 🔧 System bootstrap (existing)
    ├── bootstrap.module.ts
    ├── bootstrap.service.ts
    └── bootstrap.controller.ts
```

### 3.3 Module Communication Rules

```
✅ ALLOWED:
  Module A → Module B's public service class (via NestJS DI)
  Module A → EventBus (publish event, Module B subscribes)
  Module A → Shared kernel (@pawhaven/shared types/constants)

❌ FORBIDDEN (enforced by ESLint):
  Module A → Module B's internal files (entities, use-cases, DTOs)
  Module A → Module B's Prisma models directly
  Module A → Module B's controller

Enforcement: eslint-plugin-import with custom rules
  "modules/*/entities/**" → only importable from same module
  "modules/*/use-cases/**" → only importable from same module
```

### 3.4 Example: How Reporting → Rescue Works

```typescript
// ============================================================
// Module: reporting
// File: reporting/use-cases/submit-report.usecase.ts
// ============================================================

@Injectable()
export class SubmitReportUseCase {
  constructor(
    private readonly eventBus: EventEmitter2, // NestJS event bus
    private readonly prisma: PrismaClient, // Own module's DB access
  ) {}

  async execute(dto: SubmitReportDto): Promise<StrayReport> {
    // 1. Persist the report in reporting's own collection
    const report = await this.prisma.strayReport.create({ data: dto });

    // 2. Auto-assess urgency
    const urgency = this.assessUrgency(dto.urgencyIndicators);

    // 3. Publish domain event — Rescue module subscribes to this
    await this.eventBus.emitAsync('stray.animal.reported', {
      type: 'stray.animal.reported',
      version: 1,
      timestamp: new Date().toISOString(),
      payload: {
        reportId: report.id,
        animalType: dto.animalType,
        location: dto.location,
        urgency,
        photos: dto.photos,
        reporterId: dto.reporterId,
      },
    });

    return report;
  }
}

// ============================================================
// Module: rescue
// File: rescue/events/rescue.handlers.ts
// ============================================================

@Injectable()
export class RescueEventHandlers {
  constructor(private readonly createRescueCase: CreateRescueCaseUseCase) {}

  @OnEvent('stray.animal.reported')
  async handleStrayReported(event: StrayAnimalReportedEvent) {
    // Anti-Corruption Layer: translate external event → internal command
    await this.createRescueCase.execute({
      animalId: this.generateAnimalId(),
      source: 'report',
      sourceId: event.payload.reportId,
      status: 'pending',
      urgency: event.payload.urgency,
      location: event.payload.location,
      animalType: event.payload.animalType,
      photos: event.payload.photos,
    });
  }
}
```

**Key points:**

- Reporting module does NOT import anything from Rescue module
- Reporting module does NOT know how RescueCase is created
- Communication is through a typed event (defined in `@pawhaven/shared`)
- Rescue module's event handler applies an Anti-Corruption Layer to translate the external event into its internal command
- If we ever extract Rescue into its own service, we change `EventEmitter2` → message broker. Zero code changes in the module itself.

---

## 4. Bounded Contexts as NestJS Modules

### 4.1 Context Map (Same DDD Rigor, Fewer Deployables)

```
┌──────────────────────────────────────────────────────────────────┐
│                     PawHaven Domain (DDD)                         │
│                                                                  │
│  All live inside core-service as NestJS modules:                 │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Reporting   │    │   Rescue     │    │  Adoption    │       │
│  │  Module      │◄──►│   Module     │◄──►│  Module      │       │
│  │              │    │  (CORE)      │    │              │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │               │
│         │    ┌──────────────┼──────────────┐    │               │
│         │    │              │              │    │               │
│         ▼    ▼              ▼              ▼    ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Content    │    │  Volunteer   │    │   Profile    │       │
│  │   Module     │    │  Module      │    │   Module     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐                           │
│  │ Notification │    │ Achievement  │   (Subscribe-only modules)│
│  │   Module     │    │   Module     │                           │
│  └──────────────┘    └──────────────┘                           │
│                                                                  │
│  Separate services (own deployables):                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Auth       │    │  Document    │    │   Config     │       │
│  │   Service    │    │  Service     │    │   Service    │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Module Details (Core Domain)

#### Rescue Module (the heart of the system)

| Aspect               | Detail                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------ |
| **Responsibility**   | Rescue case lifecycle: creation → 7-stage state machine → timeline → outcome               |
| **Core Aggregates**  | `RescueCase`, `StatusTransition` (timeline entry)                                          |
| **Invariants**       | Status can only transition along defined paths; every transition records timestamp + actor |
| **Owns Collections** | `rescueCases`, `statusTransitions`                                                         |
| **Publishes**        | `RescueCaseReported`, `RescueStatusChanged`, `RescueCaseCompleted`                         |
| **Subscribes to**    | `StrayAnimalReported`, `VolunteerClaimed`, `AdoptionFinalized`                             |

#### Reporting Module

| Aspect               | Detail                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------- |
| **Responsibility**   | Stray animal report intake: photos, GPS, condition assessment, urgency auto-determination |
| **Core Aggregates**  | `StrayReport`, `UrgencyAssessment`                                                        |
| **Invariants**       | Report must have photos + location + animal type; urgency auto-calculated                 |
| **Owns Collections** | `strayReports`, `urgencyAssessments`                                                      |
| **Publishes**        | `StrayAnimalReported`                                                                     |
| **Subscribes to**    | Nothing (upstream only)                                                                   |

#### Adoption Module

| Aspect               | Detail                                                                          |
| -------------------- | ------------------------------------------------------------------------------- |
| **Responsibility**   | Adoption listing, application, matching, approval, post-adoption follow-up      |
| **Core Aggregates**  | `AdoptionListing`, `AdoptionApplication`, `AdoptionAgreement`                   |
| **Invariants**       | Only "Awaiting Adoption" animals can be listed; one animal = one active listing |
| **Owns Collections** | `adoptionListings`, `adoptionApplications`, `adoptionAgreements`                |
| **Publishes**        | `AdoptionFinalized`, `AdoptionApplicationSubmitted`                             |
| **Subscribes to**    | `RescueStatusChanged` (to "awaitingAdoption")                                   |

#### Content Module (Stories + Knowledge Base)

| Aspect               | Detail                                                                                |
| -------------------- | ------------------------------------------------------------------------------------- |
| **Responsibility**   | Rescue stories, knowledge base articles, content moderation                           |
| **Core Aggregates**  | `Story`, `KnowledgeArticle`, `ContentReview`                                          |
| **Invariants**       | Stories must reference a completed RescueCase; medical articles require expert review |
| **Owns Collections** | `stories`, `knowledgeArticles`, `contentReviews`, `tags`                              |
| **Publishes**        | `StoryPublished`, `ArticlePublished`                                                  |
| **Subscribes to**    | `RescueCaseCompleted` (triggers story invitation)                                     |

#### Volunteer Module

| Aspect               | Detail                                                                           |
| -------------------- | -------------------------------------------------------------------------------- |
| **Responsibility**   | Volunteer profile, capability matching, case claiming, availability management   |
| **Core Aggregates**  | `VolunteerProfile`, `CaseClaim`, `VolunteerStats`                                |
| **Invariants**       | One active claim per volunteer per case; capability must match case requirements |
| **Owns Collections** | `volunteerProfiles`, `caseClaims`, `volunteerStats`                              |
| **Publishes**        | `VolunteerClaimed`, `VolunteerUnavailable`                                       |
| **Subscribes to**    | `RescueCaseReported` (triggers matching + notification)                          |

### 4.3 Module Details (Supporting/Generic)

| Module           | Type                 | Responsibility                                                             | Owns Collections                           |
| ---------------- | -------------------- | -------------------------------------------------------------------------- | ------------------------------------------ |
| **Notification** | Subscribe-only       | Consumes domain events → push/email/in-app notifications                   | `notifications`, `notificationPreferences` |
| **Achievement**  | Subscribe-only       | Consumes domain events → badge/milestone calculation                       | `achievements`, `milestones`               |
| **Profile**      | Read-only aggregator | Aggregates user data across modules (reports, rescues, adoptions, stories) | None (reads from other modules' services)  |
| **Bootstrap**    | System               | Menu/route configuration, app initialization (existing)                    | `menus`, `routes`, `roles`, `permissions`  |

---

## 5. C4 Model — System Landscape

### 5.1 Level 1: System Context

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

### 5.2 Level 2: Container Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PawHaven Platform                         │
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Portal SPA    │  │   Admin SPA     │  │   Mobile PWA    │  │
│  │   (React 19)    │  │   (React 19)    │  │   (React 19)    │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                │
│                                ▼                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              gateway (NestJS) — Port 3000                │   │
│  │  JWT Verify · Rate Limit · Proxy · CORS · Trace ID      │   │
│  └───┬──────────┬────────────┬────────────┬────────────────┘   │
│      │          │            │            │                     │
│      ▼          ▼            ▼            ▼                     │
│  ┌────────┐ ┌────────────┐ ┌────────┐ ┌────────────┐          │
│  │ auth-  │ │ core-      │ │document│ │ config-    │          │
│  │ service│ │ service    │ │service │ │ service    │          │
│  │ :3001  │ │ :3002      │ │ :3003  │ │ :3004      │          │
│  │        │ │            │ │        │ │            │          │
│  │ MongoDB│ │ ┌────────┐ │ │MongoDB │ │ (static     │          │
│  │ (auth) │ │ │rescue  │ │ │(docs)  │ │  YAML)     │          │
│  └────────┘ │ │report  │ │ └────────┘ └────────────┘          │
│             │ │adopt   │ │                                      │
│             │ │content │ │                                      │
│             │ │voluntr │ │                                      │
│             │ │notify  │ │                                      │
│             │ │achieve │ │                                      │
│             │ │profile │ │                                      │
│             │ │bootstrap│ │                                      │
│             │ └────────┘ │                                      │
│             │ MongoDB     │                                      │
│             │ (core)      │                                      │
│             └────────────┘                                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   Internal Communication:                                 │   │
│  │   · gateway → services: HTTP proxy                       │   │
│  │   · core → document/auth: HTTP (NestJS HttpService)      │   │
│  │   · module → module (within core): EventEmitter2          │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Architecture

### 6.1 Database Strategy

```
┌─────────────────────────────────────────────────────────┐
│              MongoDB (single cluster)                    │
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

### 6.2 Core Data Models

#### RescueCase (Rescue module — `rescue_cases` collection)

```prisma
model RescueCase {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?         // soft delete
  version     Int      @default(1)  // optimistic concurrency

  animalID    String   @unique   // "PH-2025-0001"
  name        String
  description String
  location    Json                // { address, lat, lng, displayArea }
  status      RescueStatus       // pending | inProgress | treated | recovering | awaitingAdoption | adopted | failed
  animalType  AnimalType         // cat | dog | other
  age         AgeRange           // baby | young | adult | senior
  condition   Json               // { hasInjury, injuryDesc, behavior, appearance }
  photos      String[]           // S3 URLs
  urgency     UrgencyLevel       // normal | urgent | critical

  reporterId   String?
  reporterName String?

  timeline     StatusTransition[]

  @@index([status])
  @@index([urgency])
  @@index([createdAt])
}
```

#### StatusTransition (Rescue module — `rescue_transitions` collection)

```prisma
model StatusTransition {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  createdAt   DateTime @default(now())

  rescueCaseId String   @db.ObjectId
  rescueCase   RescueCase @relation(fields: [rescueCaseId], references: [id])

  fromStatus  RescueStatus?
  toStatus    RescueStatus
  content     String?
  photos      String[]
  operator    Json             // { id, name, role }
  location    Json?

  @@index([rescueCaseId])
  @@index([createdAt])
}
```

#### VolunteerProfile (Volunteer module — `volunteer_profiles` collection)

```prisma
model VolunteerProfile {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  updatedAt   DateTime @updatedAt

  userId      String   @unique       // references auth-service User ID
  city        String
  district    String?
  location    Json                   // { lat, lng } for geo queries
  availability Availability         // weekdayEvenings | weekends | anytime
  transport   TransportMode         // walking | bike | car

  experience   ExperienceLevel      // beginner | experienced | veteran | vet
  specialties  AnimalType[]
  taskTypes    RescueTaskType[]     // onSite | transport | foster | trap

  isVerified   Boolean  @default(false)
  isOnline     Boolean  @default(false)

  stats        Json                  // denormalized: { totalRescues, successfulRescues, avgResponseMin }

  @@index([userId])
  @@index([city, isOnline])
}
```

### 6.3 Data Access Rules

| Rule                             | Enforcement                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------ |
| Each module owns its collections | Only the owning module's Prisma service accesses its collections               |
| Cross-module data access         | Through the owning module's public service class, never direct DB access       |
| Collection naming                | `{module}_{entity}` — makes ownership clear, enables future DB split           |
| Shared Prisma extensions         | Soft-delete + versioning via `@pawhaven/backend-core` — applied to all modules |
| Geo queries                      | MongoDB `$near` via Prisma raw queries (Volunteer module)                      |
| Full-text search                 | MongoDB Atlas Search on `knowledge_articles` collection (Content module)       |

---

## 7. API Gateway Design

### 7.1 Architecture (Same as Existing, Enhanced)

```
Client Request
      │
      ▼
┌─────────────────────────────────────────────────────────┐
│                    gateway (NestJS)                       │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │ Public Routes│  │ JWT Guard   │  │ Rate Limiter    │  │
│  │ @Public()   │  │ (verify)    │  │ (per IP/user)   │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
│         │                │                  │           │
│         └────────────────┼──────────────────┘           │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Proxy Router                         │  │
│  │  /api/auth/*       → auth-service:3001           │  │
│  │  /api/rescues/*    → core-service:3002           │  │
│  │  /api/reports/*    → core-service:3002           │  │
│  │  /api/adoptions/*  → core-service:3002           │  │
│  │  /api/stories/*    → core-service:3002           │  │
│  │  /api/knowledge/*  → core-service:3002           │  │
│  │  /api/volunteers/* → core-service:3002           │  │
│  │  /api/notifications/* → core-service:3002        │  │
│  │  /api/profile/*    → core-service:3002           │  │
│  │  /api/files/*      → document-service:3003       │  │
│  │  /api/config/*     → config-service:3004         │  │
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

### 7.2 Auth Guard Decorators (Existing Pattern)

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

## 8. Event-Driven Communication (In-Process)

### 8.1 Event Catalog

```
Within core-service (NestJS EventEmitter2):

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

### 8.2 Implementation

```typescript
// Phase 1 (MVP): In-process
// @nestjs/event-emitter (EventEmitter2) — already available in NestJS
// Zero infrastructure. Zero latency. Works within a single process.

// Phase 3+ (if core-service is split):
// Replace EventEmitter2 with RabbitMQ / Redis Streams
// Module code unchanged — only the transport layer changes
```

### 8.3 Event Schema (in @pawhaven/shared)

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

## 9. Shared Kernel & Package Strategy

### 9.1 Package Dependency Graph

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
│  │ NestJS:      │  │ React:       │                     │
│  │ SharedModule │  │ hooks, API   │                     │
│  │ PrismaModule │  │ client, utils│                     │
│  │ HttpClient   │  │              │                     │
│  └──────┬───────┘  └──────┬───────┘                     │
│         │                 │                              │
│    ┌────┴────┐       ┌────┴────┐                        │
│    ▼         ▼       ▼         ▼                        │
│  ┌──────┐┌──────┐ ┌──────┐┌──────────┐                 │
│  │design││  ui  │ │ i18n ││frontend- │                 │
│  │system││(MUI  │ │(react││core      │                 │
│  │(CSS  ││ comps│ │-i18n)││(api,     │                 │
│  │tokens││      │ │      ││hooks)    │                 │
│  └──────┘└──────┘ └──────┘└──────────┘                 │
└─────────────────────────────────────────────────────────┘
```

### 9.2 What Goes Where

| Package                   | Contains                                                                                          | Must NOT Contain                        |
| ------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `@pawhaven/shared`        | Zod schemas, TypeScript types, constants, event definitions, pure utility functions               | React code, NestJS code, database logic |
| `@pawhaven/backend-core`  | SharedModule, PrismaModule, HttpClientModule, decorators, guards, interceptors, Prisma extensions | Business logic, domain entities         |
| `@pawhaven/frontend-core` | React hooks, API client, storage utilities, lazy loading helpers                                  | Business-specific components            |
| `@pawhaven/design-system` | CSS tokens, Tailwind theme, MUI theme, CSS utilities                                              | React components                        |
| `@pawhaven/ui`            | Reusable React components (Form\*, Loading, Toast, etc.)                                          | Business logic, API calls               |
| `@pawhaven/i18n`          | Translation provider, locale files, language detection                                            | Business content                        |

---

## 10. Frontend Architecture

### 10.1 Feature-Based Module Structure

```
apps/frontend/portal/src/
├── features/                    # Feature modules (aligned with bounded contexts)
│   ├── reporting/               # Stray animal report flow
│   │   ├── apis/                #   queries.ts, requests.ts
│   │   ├── components/          #   ReportForm, StepIndicator, UrgencyBanner
│   │   ├── hooks/               #   useReportSubmission, useGeolocation
│   │   ├── types.ts
│   │   └── index.tsx
│   │
│   ├── rescues/                 # Rescue case browsing + detail
│   │   ├── apis/
│   │   ├── components/          #   RescueCard, RescueTimeline, StatusBadge, RescueFilter
│   │   └── index.tsx
│   │
│   ├── adoption/                # Adoption listing + application
│   │   ├── apis/
│   │   ├── components/          #   AdoptionCard, MatchScore, ApplicationForm
│   │   └── index.tsx
│   │
│   ├── stories/                 # Rescue stories
│   │   ├── apis/
│   │   ├── components/          #   StoryCard, StoryEditor, BeforeAfterSlider
│   │   └── index.tsx
│   │
│   ├── knowledge/               # Knowledge base
│   │   ├── apis/
│   │   ├── components/          #   ArticleCard, CategoryNav, SearchBar
│   │   └── index.tsx
│   │
│   ├── volunteer/               # Volunteer dashboard
│   │   ├── apis/
│   │   ├── components/          #   VolunteerProfile, CaseFeed, ClaimButton
│   │   └── index.tsx
│   │
│   ├── profile/                 # User profile + achievements
│   │   ├── apis/
│   │   ├── components/          #   ProfileCard, AchievementBadge, ActivityFeed
│   │   └── index.tsx
│   │
│   └── auth/                    # Login + Register
│       ├── apis/
│       └── index.tsx
│
├── layout/                      # Root layout
│   ├── RootLayout.tsx
│   ├── Header.tsx
│   ├── Footer.tsx
│   └── MobileNav.tsx
│
├── providers/                   # App-wide providers
│   ├── AppProvider.tsx          #   ErrorBoundary + I18n + Store + Query
│   ├── QueryProvider.tsx        #   TanStack Query
│   └── StoreProvider.tsx        #   Redux
│
├── router/
│   ├── routePaths.ts
│   └── AppRouterProvider.tsx
│
└── store/
    └── globalReducer.ts         # Auth state, notification state
```

### 10.2 State Management Strategy

| State Type           | Tool                             | Rationale                                                   |
| -------------------- | -------------------------------- | ----------------------------------------------------------- |
| **Server state**     | **TanStack Query**               | Caching, background refetch, optimistic updates, pagination |
| **Client state**     | **Redux Toolkit** (existing)     | Auth status, UI toggles                                     |
| **Form state**       | **React Hook Form + Zod**        | Existing pattern, type-safe validation                      |
| **URL state**        | **React Router search params**   | Filters, pagination, search — shareable/bookmarkable        |
| **Persistent state** | **Redux Persist + localStorage** | Auth tokens, preferences                                    |

### 10.3 Component Design Rules

```
Feature components (features/*/components/)
  ✅ Can import: @pawhaven/ui, @pawhaven/design-system, @pawhaven/frontend-core, @pawhaven/i18n
  ✅ Can import: ../../shared/ (feature-internal)
  ❌ Must NOT import: other features directly

Shared components (packages/ui/)
  ✅ Can import: @pawhaven/design-system, @pawhaven/frontend-core
  ❌ Must NOT import: any feature, any app-specific code

Layout components (layout/)
  ✅ Can import: @pawhaven/ui, router, providers
  ✅ Orchestrates: header, footer, sidebar, main content
```

---

## 11. Security Architecture

### 11.1 Authentication Flow

```
Client → gateway → auth-service
                     │
                     │ POST /auth/login (email + password)
                     │ ← JWT pair (access 15min, refresh 7d)
                     │
Client → gateway (Authorization: Bearer <access_token>)
           │
           │ JWT Guard verifies signature
           │ Injects headers: X-Auth-User-Id, X-Auth-User-Roles
           │
           ▼
         core-service (trusts headers — internal network only)
```

### 11.2 Security Layers

| Layer            | Mechanism                                                |
| ---------------- | -------------------------------------------------------- |
| Transport        | HTTPS (TLS 1.3)                                          |
| Authentication   | JWT (RS256), verified at gateway                         |
| Authorization    | RBAC — roles + permissions, checked at gateway + service |
| Input Validation | Zod schemas via nestjs-zod global pipe                   |
| Rate Limiting    | Token bucket per IP + per user at gateway                |
| Data Privacy     | GPS fuzzing (displayArea, not exact coords post-rescue)  |
| CSRF             | SameSite cookies + token header                          |
| CORS             | Whitelist origins per environment                        |

---

## 12. Observability & Operations

### 12.1 Three Pillars

```
Logging           Metrics            Tracing
· Structured JSON · Request count    · X-Trace-Id across
· service tag     · p50/p95/p99      · all services
· traceId per log · Error rate       · OpenTelemetry
· levels: info/   · Status codes     · compatible
  warn/error      · DB query times
```

### 12.2 Health Checks

```
GET /health       → { status, db, uptime, version }
GET /health/live  → liveness probe (k8s)
GET /health/ready → readiness probe (k8s)
```

### 12.3 Structured Logging

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

## 13. Deployment Architecture

### 13.1 MVP (Current → Month 3)

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
│  │  MongoDB:1 (with 3 databases)                     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 13.2 Production (Phase 3+)

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
│  MongoDB Atlas (managed)                                │
│  S3-compatible storage                                  │
│  Redis (rate limiting, optional cache)                  │
└─────────────────────────────────────────────────────────┘
```

---

## 14. Architecture Decision Records

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

| Field            | Detail                                                                                                           |
| ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Status**       | Accepted                                                                                                         |
| **Context**      | 7 product modules need clear frontend organization.                                                              |
| **Decision**     | `features/{module}/` with apis/, components/, hooks/, types.ts, index.tsx per feature. No cross-feature imports. |
| **Consequences** | Clear ownership, independent development, easier code splitting. Lint rules enforce feature isolation.           |

---

## 15. Module Boundary Enforcement

### 15.1 ESLint Rules

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

### 15.2 CI Architecture Fitness Function

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

## 16. Why This Design Works

### 16.1 The Pragmatic Balance

| Concern             | How It's Addressed                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------- |
| **Scalability**     | Gateway + core scale independently. Document scales separately (heavy PDF).                  |
| **Maintainability** | 7 modules with enforced boundaries. Each module is independently understandable.             |
| **Extensibility**   | New product module = new folder in `modules/`. No new service needed.                        |
| **Deployability**   | 5 services. Each has a clear reason to exist. No "microservice for the sake of it."          |
| **Observability**   | Structured logging with module tag. Trace ID across all services.                            |
| **Future-proofing** | Modules can be extracted to separate services without code changes — just deployment config. |

### 16.2 When to Add a 6th Service

> **Only when at least TWO of these are true for a module:**
>
> 1. It needs independent scaling (e.g., Notification module gets 10x traffic)
> 2. It needs a different tech stack (e.g., Python ML for adoption matching)
> 3. A different team takes ownership
> 4. It has a different release cadence

### 16.3 What to Re-evaluate in 3 Months

- **config-service**: If it stays as static YAML serving, merge into core-service
- **Notification module**: If push/email volume grows significantly, consider extracting
- **Content module (Knowledge Base)**: If search becomes a core feature, consider dedicated search service

---

> **Next Steps**: API contract design (OpenAPI specs), database migration plan for new modules, frontend component tree per feature.
