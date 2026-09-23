# PawHaven — Backend Architecture

> **Version**: v3.10 | **Date**: 2026-09-19
> **Related Docs**: [System Architecture Overview](./PawHaven-System-Architecture-Overview.md) | [Frontend Architecture](./PawHaven-Frontend-Architecture.md)

---

## Table of Contents

1. [Core-Service: The Modular Monolith](#1-core-service-the-modular-monolith)
2. [Bounded Contexts as NestJS Modules](#2-bounded-contexts-as-nestjs-modules)
3. [Event-Driven Communication (In-Process)](#3-event-driven-communication-in-process)
4. [Module Boundary Enforcement](#4-module-boundary-enforcement)
5. [Document Service — PDF Engine](#5-document-service--pdf-engine)
6. [Tech Stack](#6-tech-stack)

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

├── guide/                     # 📚 Guide Documents (PDF catalog; passes non-translatable data inbound)
│   ├── guide.module.ts
│   ├── guide.controller.ts
│   ├── guide.service.ts
│   ├── guide.catalog.ts       # owns per-slug base filename + category
│   ├── guide-document.client.ts  # internal HTTP client → document-service
│   └── (PDF copy lives in @pawhaven/i18n, not here — see §5.5)
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
├── animal-follow/             # 🔖 Animal Follow (supporting: per-user bookmarks)
│   ├── animal-follow.module.ts
│   ├── animal-follow.service.ts
│   └── animal-follow.controller.ts
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

| Module           | Type                 | Responsibility                                                                                                                                                                              | Owns Collections                                                        |
| ---------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Notification** | Subscribe-only       | Consumes domain events → push/email/in-app notifications                                                                                                                                    | `notifications`, `notificationPreferences`                              |
| **Achievement**  | Subscribe-only       | Consumes domain events → badge/milestone calculation                                                                                                                                        | `achievements`, `milestones`                                            |
| **Profile**      | Read-only aggregator | Aggregates user data across modules (reports, rescues, adoptions, stories)                                                                                                                  | None (reads from other modules' services)                               |
| **AnimalFollow** | Supporting           | Per-user "follow this animal" bookmarks and the per-animal follower count                                                                                                                   | `animal_follows`                                                        |
| **Guide**        | Core (new)           | PDF catalog (title/description read from `@pawhaven/i18n`) + passes non-translatable `data` inbound to the single-template PDF engine; relays render to document-service over internal HTTP | None (stateless; `data` passed inbound; copy lives in `@pawhaven/i18n`) |
| **Bootstrap**    | System               | Menu/route configuration, app initialization (existing)                                                                                                                                     | `menus`, `routes`, `roles`, `permissions`                               |

### 2.4 AnimalFollow Module (Supporting)

Following an animal is its own module rather than a field on an existing aggregate. `AnimalFollowModule` registers one controller and one service, and exports the service so other modules can consume it through NestJS DI instead of its Prisma model.

**API surface** (all routes are behind the gateway, so the public path prefix is `/api/core`):

| Method | Path                                       | Endpoint policy         |
| ------ | ------------------------------------------ | ----------------------- |
| `POST` | `/api/core/animal-follow/:animalId`        | Default (authenticated) |
| `PUT`  | `/api/core/animal-follow/:animalId`        | Default (authenticated) |
| `GET`  | `/api/core/animal-follow/:animalId/status` | `@OptionalAuth()`       |

**Response shapes** — `POST` and `PUT` return `{ animalId, isFollowing, followedAt, followerCount }`: the mutation response carries the animal's follower count, so the client never has to follow a write with a separate count request. `GET :animalId/status` returns the same combined shape `{ animalId, isFollowing, followedAt, followerCount }` — it is the single read that answers both "is the current user following?" and "how many followers does this animal have?", so the rescue-detail page fires exactly one request.

One read route answers anonymous callers, and it returns both pieces of information. The follower count is simply public information, and the follow status is optional-auth because the portal cannot reliably tell a live session from a dead one the client is still rendering: the signed-in profile lives in a Redux slice persisted to localStorage and is only cleared on explicit logout, so a visitor whose session cookie expired without logging out still looks signed in. That stale profile fired the status query, and the 401 it received hit the portal's query-level 401 handler, which redirected the visitor off the **public** rescue-detail page to the login screen. Answering anonymous callers with `200 { animalId, isFollowing: false, followedAt: null, followerCount: 0 }` instead removes that failure. The handler injects claims with `@InternalJwt({ allowAnonymous: true })`, so an anonymous identity arrives as a claim rather than throwing in the decorator, and `getStatus` narrows the claim union and short-circuits to a null user id instead of reading `claims.sub`. The remaining two routes — follow and unfollow — are default-authenticated, and this policy does not extend to them: a visitor carrying a stale profile still renders the follow control, and clicking it still fails with 401. That is pre-existing profile-persistence behaviour rather than something this policy introduced. The anonymous payload needs no frontend accommodation either, because `AnimalFollowResultSchema` already declares `followedAt: z.string().nullable()` and `followerCount: z.number().int()`, so the anonymous payload validates against the contract and no consumer changes. Endpoint policy semantics are defined in [Authentication Architecture](./authentication-architecture.md).

**Data model** — the module owns one collection, `animal_follows`:

```prisma
model AnimalFollow {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  userId    String
  animalId  String

  @@unique([userId, animalId])
  @@index([animalId])
  @@map("animal_follows")
}
```

The relation is deliberately a **dedicated collection**, not `followedAnimalIds` on the user document and not `followerIds` on the animal document. The `@@unique([userId, animalId])` compound index is the duplicate-follow guard, and `@@index([animalId])` serves the follower count.

**Idempotency** — `follow` upserts on the `(userId, animalId)` compound key and recovers from a `P2002` unique-constraint violation by re-reading the winning row, so a double-click or two concurrent requests converge on one row and the same `followedAt`. `unfollow` uses `deleteMany`, so unfollowing something not followed succeeds as a no-op. **Unfollow hard-deletes the row**: a soft delete would leave the unique row in place and permanently block re-following.

**Ownership** — the module never reads the rescue/animal aggregate. It stores `animalId` as an opaque identifier, and the follow status it returns carries only `{ animalId, isFollowing, followedAt }` alongside the per-animal count, so the follow feature does not depend on the animal model.

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

## 5. Document Service — PDF Engine (Single-Template)

document-service is **pure generation + download**. Its data boundary is: **no database, no outbound HTTP calls, no catalog endpoint**. Every PDF is a template rendered from two inputs — the non-translatable `data` the caller passes inbound, and the translatable **copy** it resolves itself from `@pawhaven/i18n` (`locales/{locale}/documents/pdf/{slug}.json`, nested `document.pdf.<slug>`) as a static package resource. That key space is the only content document-service owns; it never reads a database or calls another service to obtain content.

### 5.1 The Single Route Contract

```
POST /document-service/pdf/render
Content-Type: application/json
Authorization: internal JWT (kind:'authenticated', aud:'document-service', kid:'core-v1')

{
  "template": "rescueGuide" | "firstAid" | "kittenCare" | "injuryResponse",
                                                         // required; === templates/<slug>/
  "locale": "en-US" | "zh-CN" | "de-DE",                 // required; canonical codes only
  "data": { ... },                                       // required; per-template, non-translatable
  "options": {                                           // optional; omitted ⇒ engine defaults
    "format": "A4" | "A3" | "A5" | "LETTER" | "LEGAL" | "TABLOID",
    "landscape": true,
    "scale": 1,
    "margin": { "top": "120px", "bottom": "50px", "left": "0", "right": "0" },
    "printBackground": true,
    "displayHeaderFooter": true,
    "preferCSSPageSize": false
  }
}
```

`template` is `GuideSlugSchema` — literally the folder names under `templates/<slug>/`. `RenderPdfBodySchema` is a
`z.discriminatedUnion('template', …)`, so `data` is validated against **that** template's schema: an unknown template
or a payload that does not match its template is a **400**, not a bare cast. `options` is a 7-field
`z.strictObject` — an unknown key is a 400 rather than a silently ignored paper size. `headerTemplate` /
`footerTemplate` (raw HTML into Chromium), `path`, `timeout`, `waitUntil` and `pageRanges` are deliberately **not**
exposed: the chrome is ours, and the rest are DoS or stability surface.

Translatable copy (brand / title / subtitle / sections / checklist / contacts / disclaimer) is **not** in the request:
document-service resolves it from `@pawhaven/i18n` and validates it with a per-slug copy schema (§5.5). Contacts —
labels **and** values — live wholly in i18n, because a locale's hotline is different content, not a translation, and
splitting label from value across i18n and `data` would create positional coupling that silently mis-pairs on reorder.

Response = **raw PDF bytes** with `Content-Type: application/pdf` + `Content-Length` only. document-service sets **NO** `Content-Disposition` — the caller (core-service) owns the download headers. A `pdf-payload-size.guard` caps request body size and returns `413` past the limit.

### 5.2 The PDF Module (`src/modules/PDF/`)

| File                        | Role                                                                                                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `template.ts`               | Template **registry**: one entry per `GuideSlug` (`copySchema` + `dataSchema` + `Component`), `satisfies Record<GuideSlug, …>`; resolves copy under `document.pdf.<slug>` via the per-request `documentI18n` clone; `getPdfTemplate(slug)` is the only lookup |
| `engine/defaultOptions.ts`  | `defaultPdfOptions` + `resolvePdfOptions` — owner of the `options` defaults (engine behaviour)                                                                                                                                                                |
| `engine/chrome.tsx`         | `CommonHeader` / `CommonFooter` shared across all templates                                                                                                                                                                                                   |
| `engine/styles.ts`          | Compiled PDF stylesheet (`pdf.generated.css`)                                                                                                                                                                                                                 |
| `pdf-payload-size.guard.ts` | 413 payload-size cap                                                                                                                                                                                                                                          |
| `PDF.controller.ts`         | single `POST /pdf/render`                                                                                                                                                                                                                                     |
| `PDF.service.ts`            | `renderPdf` — React → HTML → Puppeteer PDF `Buffer`; `<html lang={locale}>`; **no DB, no fetch**                                                                                                                                                              |

The registry is what the contract binds to, so the number of template _component files_ is an implementation detail:
each entry renders `PdfTemplateProps<K>` (`{ copy, data, locale }`) and nothing outside the registry needs to know how
the components are factored.

### 5.3 Auth & Reachability

The render route is protected by the global `InternalJwtGuard` (registered via `SharedModule.forRoot` with `internalJwt.enabled: true`). core-service signs a complete `kind:'authenticated'` JWT (`aud:'document-service'`, `iat`/`exp`/`rid`/`sub`) with `INTERNAL_JWT_PRIVATE_KEY_CORE` / `kid:'core-v1'`; document-service trusts the `core-v1` public key.

The gateway's `/api/document` proxy entry is **removed** — document-service is **core-only**, not browser-reachable. The browser reaches PDFs through core-service's `guide` module (see §2.3), which relays to `POST /document-service/pdf/render` over internal HTTP and streams the bytes back with download headers.

### 5.4 Shared Schemas

The render + guide contracts are defined in `packages/shared` / `packages/backend-core` so both sides validate identically:

| Location                                         | Purpose                                                                                                                                                      |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/backend-core/types/document.schema.ts` | `RenderPdfBodySchema` — `z.discriminatedUnion('template', …)`; `EmailTemplateSchema` (the email bodies' template key, renamed from `DocumentTemplateSchema`) |
| `packages/shared/types/guide.schema.ts`          | `guideSlugs` / `GuideSlugSchema`, `guideLocales` / `GuideLocaleSchema`, `normalizeLocale`, guide catalog + document schemas                                  |
| `packages/shared/types/pdf/copy.schema.ts`       | `pdfGuideCopySchema` (brand/title/subtitle/sections/checklist/contacts/disclaimer) + `guideCopyKey(slug)`                                                    |
| `packages/shared/types/pdf/data.schema.ts`       | `pdfGuideDataSchema` — non-translatable `data` (`provenance`); `z.strictObject` so a caller still sending copy fields gets a loud 400                        |
| `packages/shared/types/pdf/template.schema.ts`   | `pdfTemplateCopySchemas` / `pdfTemplateDataSchemas` (per-slug) + `PdfTemplateProps<K>`                                                                       |
| `packages/shared/types/pdf/options.schema.ts`    | `pdfOptionsSchema` — the 7-field `options` whitelist (`z.strictObject`)                                                                                      |

`options` **defaults** are deliberately _not_ shared: `defaultPdfOptions` / `resolvePdfOptions` live in
`apps/backend/document-service/src/modules/PDF/engine/defaultOptions.ts`, because they are engine behaviour owned by
the service, not part of the contract. Omitting `options` reproduces the previously hardcoded config exactly — A4,
margins `120px / 50px / 0 / 0`, `printBackground` and `displayHeaderFooter` true, `preferCSSPageSize` false.

The full render pipeline — why React + Puppeteer, how `engine/index.css` becomes the inlined PDF stylesheet, and the
print-layout constraints (`min-h-screen` = one page, header/footer living in the `margin` bands, Tailwind's scan set) —
is documented in **`PawHaven-PDF-Generation.md`**.

### 5.5 The 3-Hop Flow

```
Browser  GET /api/core/guide/documents/:slug/file        (locale: x-locale header → normalizeLocale)
   │
   ▼  core-service `guide` module: GuideSlugSchema.safeParse(slug) → 404 on miss,
      assert the locale's copy parses (pdfGuideCopySchema) → 404 if that locale has no copy,
      send the NON-TRANSLATABLE data only
core    POST /document-service/pdf/render  { template, locale, data, options? }
   │
   ▼  document-service resolves COPY from @pawhaven/i18n (`document.pdf.<slug>`, via `useTranslation`),
      parses it with the per-slug copy schema, renders React → HTML → Puppeteer PDF Buffer
core    relays PDF bytes to browser with Content-Disposition (${base}-${locale}.pdf),
        Content-Language, Cache-Control
```

**Copy vs data** — the split is by kind, not by file location. Everything a translator writes (brand, title,
subtitle, sections, checklist, contacts, disclaimer) is **copy** and lives in
`packages/i18n/locales/{locale}/documents/pdf/{slug}.json`, nested as `document.pdf.<slug>`; document-service resolves
it at render time, so a missing or malformed translation is a 404 before the render rather than a blank PDF.
Everything that is not translatable (`provenance` today, per-template structured input in general) is **data** and is
the only thing core-service sends. `data` is required to be generic and per-template — every template declares its own
shape — and the render locale drives `<html lang>` and the chrome; template components read their own copy through
`useTranslation()` on the per-request i18next instance, so no component takes a `locale` prop.

**Adding a guide** therefore touches: 3 locale files + 1 template folder + 3 schema entries (copy map, data map,
registry). The three `satisfies Record<GuideSlug, …>` locks make a new slug a compile error at every one of them.

### 5.6 PDF Strings — shared i18n, one locale vocabulary, `documents/` is Node-only

document-service no longer ships an i18n runtime of its own (the `i18n` npm package, `src/i18n/i18n.config.ts` and `src/i18n/{en,zh,de}.json` were deleted). Every localized string it renders comes from the shared package — the chrome **and** each guide's body copy:

| Location                                                            | Role                                                                                                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/i18n/locales/{locale}/documents/pdf/{slug}.json`          | **Node-only** guide copy — nested as `document.pdf.<slug>` (brand / title / subtitle / sections / checklist / contacts / disclaimer) |
| `packages/i18n/locales/{locale}/documents/pdf/{header,footer}.json` | PDF chrome — `document.pdf.header.tagline`, `document.pdf.footer.copyright`                                                          |
| `packages/i18n/resources.js`                                        | Node-safe entry: reads `documents/` with `fs`; exports `documentI18n` (plus `translateDocument`, `getDocumentObject`)                |
| `packages/i18n/supportedLngs.js`                                    | single canonical locale list, re-used by the Node entry                                                                              |

Five rules hold this boundary:

- **One locale vocabulary, strictly canonical.** `guideLocales` in `packages/shared/types/guide.schema.ts` is the single source: `en-US | zh-CN | de-DE`. `normalizeLocale` is **strict** — a canonical code maps to itself and anything else (`en`, `en-GB`, `zh-Hans-CN`, `de-AT`, comma/quality strings) falls back to `en-US`. There is deliberately no language-subtag folding: the language selector is wired to `supportedLngs`, so the backend only ever receives canonical codes.
- **Copy lives in i18n, data stays in core-service.** The guide's translatable **copy** is `document.pdf.<slug>` in `@pawhaven/i18n`; the non-translatable **data** is assembled by core-service's `guide` module and passed inbound. (Locked decision D2 — "guide body content stays in core-service, not in i18n" — is **superseded for the PDF surface** by the Option B decision recorded in DD-10.)
- **`documents/` is Node-only, excluded from the browser bundle.** `packages/i18n/index.js` globs `./locales/*/*.json` — **one** segment, deliberately — so `documents/` (≈15 KB per locale, the largest group in the package) is loaded only by `resources.js`, which reads it from disk with `fs`. Two consequences are why the glob must stay one segment: (1) PDF copy is never shipped to the browser, and (2) the top-level key collisions `documents/pdf/rescueGuide.json` vs UI `rescueGuide.json` and `documents/pdf/footer.json` vs UI `footer.json` cannot happen, so the "filename === unique top-level key" invariant of the per-locale merge holds. Widening the glob back to `./locales/**/*.json` re-ships the copy to every browser and silently shadows PDF copy with UI keys. If PDF copy is ever needed in the browser, the lever is this glob — not an i18next namespace.
- **The Node entry is Node-safe.** `@pawhaven/i18n` (browser) pulls `react` / `react-i18next` / the language detector; `@pawhaven/i18n/resources` uses `i18next` core + `fs`-read JSON only, so a backend can import it without a DOM. `packages/i18n/resources.d.ts` types that entry: `translateDocument: (...) => string` and `getDocumentObject: (...) => unknown` — the object reader returns `unknown` on purpose, and the caller parses it with a Zod copy schema. `document` is an ordinary top-level business key in that instance (i18next's single default `translation` namespace), not a namespace of its own; portal UI keys keep living in the browser instance's flat key space.
- **One locale source per render.** `locale` is the validated request body's `locale` when present, otherwise it is resolved from the request headers (`x-locale` → `locale` → `accept-language`, canonicalised by `normalizeLocale`) and passed to `buildPdf` as `headerLocale`, which uses `body.locale ?? headerLocale`. That single locale drives `documentI18n.cloneInstance({ lng })`, `<html lang>`, and the chrome — one clone per request, so concurrent renders in different locales never share i18next state.

## 6. Tech Stack

### 6.1 Core

| Category            | Technology | Notes              |
| ------------------- | ---------- | ------------------ |
| **Framework**       | NestJS     | Modular monolith   |
| **Language**        | TypeScript | Strict mode        |
| **Runtime**         | Node.js    |                    |
| **Package Manager** | pnpm       | Workspace monorepo |

### 6.2 Database & ORM

| Category           | Technology    | Notes                                 |
| ------------------ | ------------- | ------------------------------------- |
| **Database**       | MongoDB       | Single cluster, collection-per-module |
| **ODM/ORM**        | Prisma        | Type-safe queries, migrations         |
| **Object Storage** | S3-compatible | Photos, images, PDFs                  |

### 6.3 Communication

| Category                    | Technology                            | Notes                                |
| --------------------------- | ------------------------------------- | ------------------------------------ |
| **In-Process Events**       | @nestjs/event-emitter (EventEmitter2) | Module-to-module within core-service |
| **Inter-Service**           | HTTP (NestJS HttpService)             | Between separate deployables         |
| **Message Broker (future)** | RabbitMQ / Redis Streams              | Phase 3+, replaces EventEmitter2     |

### 6.4 Validation & Shared

| Category          | Technology             | Notes                                                                                                                                    |
| ----------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Validation**    | Zod + nestjs-zod       | Schemas in @pawhaven/shared                                                                                                              |
| **Shared Kernel** | @pawhaven/shared       | Types, constants, event schemas                                                                                                          |
| **Backend Core**  | @pawhaven/backend-core | SharedModule, PrismaModule, `dynamicModules/` (incl. `internalJwt/` — guard, decorators, sign/verify), shared app bootstrap (`setupApp`) |

All services share one bootstrap: `NestFactory.create(AppModule, { bodyParser: false })` then
`setupApp(app)` from `@pawhaven/backend-core/setup`, which applies the body-size limit
(`http.maxJsonBodySize`), `http.prefix`, helmet, CORS, cookie-parser and shutdown hooks.
`bodyParser: false` is mandatory — otherwise Nest registers its own unlimited parser first and
the configured limit is silently bypassed. URI versioning and the strict `ValidationPipe` are
opt-in per service.

### 6.5 Security

| Category               | Technology                                                    | Notes                                                                 |
| ---------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Browser sessions**   | Cookie-based JWT — owned by gateway `InternalJwtService` only | Access 3min prod / 5min dev, Refresh 7d                               |
| **Service-to-service** | HS256 internal JWT `InternalJwt` in `x-gateway-jwt` (45s TTL) | Verified by downstream `InternalJwtGuard`; no `x-auth-*` header trust |
| **Authorization**      | RBAC                                                          | Role + permission checks                                              |
| **Rate Limiting**      | Token bucket                                                  | Per IP + per user at gateway                                          |
| **Transport**          | HTTPS (TLS 1.3)                                               |                                                                       |

### 6.6 Deployment & Infrastructure

| Category           | Technology       | Notes                         |
| ------------------ | ---------------- | ----------------------------- |
| **MVP Deployment** | Docker Compose   | Single VPS                    |
| **Production**     | Kubernetes + HPA | Phase 3+                      |
| **Managed DB**     | MongoDB Atlas    | Production                    |
| **Cache**          | Redis            | Rate limiting, optional cache |

### 6.7 Observability

| Category    | Technology      | Notes                          |
| ----------- | --------------- | ------------------------------ |
| **Tracing** | OpenTelemetry   | X-Trace-Id across all services |
| **Logging** | Structured JSON | Service + module tags          |

### 6.8 Code Quality

| Category            | Technology                        | Notes                       |
| ------------------- | --------------------------------- | --------------------------- |
| **Linting**         | ESLint                            | Module boundary enforcement |
| **Formatting**      | Prettier                          | Centralized config          |
| **Git Hooks**       | Husky + lint-staged               | Pre-commit checks           |
| **Commit Standard** | Commitlint (Conventional Commits) |                             |

---

> **Related Docs**: [System Architecture Overview](./PawHaven-System-Architecture-Overview.md) | [Frontend Architecture](./PawHaven-Frontend-Architecture.md)
