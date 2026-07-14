# PawHaven — Backend Architecture

> **Version**: v3.0 | **Date**: 2026-07-10
> **Related Docs**: [System Architecture Overview](./PawHaven-System-Architecture-Overview.md) | [Frontend Architecture](./PawHaven-Frontend-Architecture.md)

---

## Table of Contents

1. [Core-Service: The Modular Monolith](#1-core-service-the-modular-monolith)
2. [Bounded Contexts as NestJS Modules](#2-bounded-contexts-as-nestjs-modules)
3. [Event-Driven Communication (In-Process)](#3-event-driven-communication-in-process)
4. [Module Boundary Enforcement](#4-module-boundary-enforcement)

---

## 1. Core-Service: The Modular Monolith

### 1.1 Why a Modular Monolith?

> **core-service is one deployable, but it is NOT one big ball of mud.**

It is a **modular monolith**: a single process where each business capability lives in a strict NestJS module with enforced boundaries. Modules communicate through defined interfaces (service classes + events), never by importing each other's internals.

### 1.2 Internal Module Structure

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

### 1.3 Module Communication Rules

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

### 1.4 Example: How Reporting → Rescue Works

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

## 2. Bounded Contexts as NestJS Modules

### 2.1 Context Map (Same DDD Rigor, Fewer Deployables)

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

### 2.2 Module Details (Core Domain)

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

### 2.3 Module Details (Supporting/Generic)

| Module           | Type                 | Responsibility                                                             | Owns Collections                           |
| ---------------- | -------------------- | -------------------------------------------------------------------------- | ------------------------------------------ |
| **Notification** | Subscribe-only       | Consumes domain events → push/email/in-app notifications                   | `notifications`, `notificationPreferences` |
| **Achievement**  | Subscribe-only       | Consumes domain events → badge/milestone calculation                       | `achievements`, `milestones`               |
| **Profile**      | Read-only aggregator | Aggregates user data across modules (reports, rescues, adoptions, stories) | None (reads from other modules' services)  |
| **Bootstrap**    | System               | Menu/route configuration, app initialization (existing)                    | `menus`, `routes`, `roles`, `permissions`  |

---

## 3. Event-Driven Communication (In-Process)

### 3.1 Event Catalog

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

### 3.2 Implementation Strategy

```typescript
// Phase 1 (MVP): In-process
// @nestjs/event-emitter (EventEmitter2) — already available in NestJS
// Zero infrastructure. Zero latency. Works within a single process.

// Phase 3+ (if core-service is split):
// Replace EventEmitter2 with RabbitMQ / Redis Streams
// Module code unchanged — only the transport layer changes
```

### 3.3 Event Schema (in @pawhaven/shared)

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

## 4. Module Boundary Enforcement

### 4.1 ESLint Rules

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

### 4.2 CI Architecture Fitness Function

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

## 5. Tech Stack

### 5.1 Core

| Category            | Technology | Notes              |
| ------------------- | ---------- | ------------------ |
| **Framework**       | NestJS     | Modular monolith   |
| **Language**        | TypeScript | Strict mode        |
| **Runtime**         | Node.js    |                    |
| **Package Manager** | pnpm       | Workspace monorepo |

### 5.2 Database & ORM

| Category           | Technology    | Notes                                 |
| ------------------ | ------------- | ------------------------------------- |
| **Database**       | MongoDB       | Single cluster, collection-per-module |
| **ODM/ORM**        | Prisma        | Type-safe queries, migrations         |
| **Object Storage** | S3-compatible | Photos, images, PDFs                  |

### 5.3 Communication

| Category                    | Technology                            | Notes                                |
| --------------------------- | ------------------------------------- | ------------------------------------ |
| **In-Process Events**       | @nestjs/event-emitter (EventEmitter2) | Module-to-module within core-service |
| **Inter-Service**           | HTTP (NestJS HttpService)             | Between separate deployables         |
| **Message Broker (future)** | RabbitMQ / Redis Streams              | Phase 3+, replaces EventEmitter2     |

### 5.4 Validation & Shared

| Category          | Technology             | Notes                              |
| ----------------- | ---------------------- | ---------------------------------- |
| **Validation**    | Zod + nestjs-zod       | Schemas in @pawhaven/shared        |
| **Shared Kernel** | @pawhaven/shared       | Types, constants, event schemas    |
| **Backend Core**  | @pawhaven/backend-core | SharedModule, PrismaModule, guards |

### 5.5 Security

| Category           | Technology      | Notes                        |
| ------------------ | --------------- | ---------------------------- |
| **Authentication** | JWT (RS256)     | Access 15min, Refresh 7d     |
| **Authorization**  | RBAC            | Role + permission checks     |
| **Rate Limiting**  | Token bucket    | Per IP + per user at gateway |
| **Transport**      | HTTPS (TLS 1.3) |                              |

### 5.6 Deployment & Infrastructure

| Category           | Technology       | Notes                         |
| ------------------ | ---------------- | ----------------------------- |
| **MVP Deployment** | Docker Compose   | Single VPS                    |
| **Production**     | Kubernetes + HPA | Phase 3+                      |
| **Managed DB**     | MongoDB Atlas    | Production                    |
| **Cache**          | Redis            | Rate limiting, optional cache |

### 5.7 Observability

| Category    | Technology      | Notes                          |
| ----------- | --------------- | ------------------------------ |
| **Tracing** | OpenTelemetry   | X-Trace-Id across all services |
| **Logging** | Structured JSON | Service + module tags          |

### 5.8 Code Quality

| Category            | Technology                        | Notes                       |
| ------------------- | --------------------------------- | --------------------------- |
| **Linting**         | ESLint                            | Module boundary enforcement |
| **Formatting**      | Prettier                          | Centralized config          |
| **Git Hooks**       | Husky + lint-staged               | Pre-commit checks           |
| **Commit Standard** | Commitlint (Conventional Commits) |                             |

---

> **Related Docs**: [System Architecture Overview](./PawHaven-System-Architecture-Overview.md) | [Frontend Architecture](./PawHaven-Frontend-Architecture.md)
