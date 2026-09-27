# PawHaven — Backend Architecture

> **Version**: v3.11 | **Date**: 2026-09-25
> **Related Docs**: [System Architecture Overview](PawHaven-System-Architecture-Overview.md) | [Frontend Architecture](PawHaven-Frontend-Architecture.md)

---

## Table of Contents

1. [Core-Service: The Modular Monolith](#1-core-service-the-modular-monolith)
2. [Bounded Contexts as NestJS Modules](#2-bounded-contexts-as-nestjs-modules)
3. [Module Boundary Enforcement](#3-module-boundary-enforcement)
4. [Document Service — PDF Engine](#4-document-service--pdf-engine-single-template)
5. [Tech Stack](#5-tech-stack)

---

## 1. Core-Service: The Modular Monolith

### 1.1 Why a Modular Monolith?

> **core-service is one deployable, but it is NOT one big ball of mud.**

It is a **modular monolith**: a single process where each business capability lives in a strict NestJS module with enforced boundaries. Modules communicate by injecting each other's exported service, never by importing each other's internals.

### 1.2 Internal Module Structure

Seven modules, each exactly three source files plus a co-located test:

```
apps/backend/core-service/src/modules/
│
├── rescue/                    # 🐾 Rescue case feed and detail
│   ├── rescue.module.ts
│   ├── rescue.service.ts
│   ├── rescue.controller.ts
│   └── rescue.service.test.ts, rescue.controller.test.ts
│
├── report-animal/             # 📋 Stray animal reporting
│   ├── reportAnimal.module.ts
│   ├── reportAnimal.service.ts
│   ├── reportAnimal.controller.ts
│   └── reportAnimal.service.test.ts, report-animal.controller.test.ts
│
├── adoption/                  # 🏠 Adoptable pet catalogue (read-only)
│   ├── adoption.module.ts
│   ├── adoption.service.ts
│   └── adoption.controller.ts
│
├── animal-follow/             # 🔖 Per-user animal bookmarks
│   ├── animalFollow.module.ts
│   ├── animalFollow.service.ts
│   └── animalFollow.controller.ts
│
├── guide/                     # 📚 Rescue guide PDFs
│   ├── guide.module.ts
│   ├── guide.service.ts
│   ├── guide.controller.ts
│   └── guide.service.test.ts
│
├── home/                      # 🏠 Homepage aggregate read model
│   ├── home.module.ts
│   ├── home.service.ts
│   └── home.controller.ts
│
└── bootstrap/                 # 🔧 Server-driven navigation
    ├── bootstrap.module.ts
    ├── bootstrap.service.ts
    └── bootstrap.controller.ts
```

The shape is flat by design. There are **no** `entities/`, `use-cases/`, `DTO/`, or `events/`
subdirectories anywhere under `core-service/src/modules/`. Each module's public surface is its
exported service class; DTOs are Zod schemas in `@pawhaven/shared`, not per-module classes.

### 1.3 Module Communication Rules

```
ALLOWED:
  Module A → Module B's public service class (via NestJS DI)
  Module A → Shared kernel (@pawhaven/shared types/constants)

FORBIDDEN (enforced by ESLint):
  Module A → Module B's internal files
  Module A → Module B's Prisma models directly
  Module A → Module B's controller
```

There is **no event bus** — `@nestjs/event-emitter` is not a dependency and `EventEmitter2`
appears nowhere. Modules coordinate by direct injection of an exported service, which means a
dependency is visible in a constructor signature rather than hidden in a string-keyed publish.

`home` is the only module that imports another module: it injects `AdoptionService` and
`RescueService` in `home.service.ts` to assemble the homepage read model in parallel. Every other
module stands alone.

```typescript
// apps/backend/core-service/src/modules/home/home.service.ts
constructor(
  @InjectPrisma(databaseEngines.mongodb) private readonly prisma: PrismaClient,
  private readonly adoptionService: AdoptionService,
  private readonly rescueService: RescueService,
  private readonly httpClientService: HttpClientService,
) {}
```

### 1.4 Example: How Reporting Feeds the Feed

Reporting and rescue write and read the same collection, so the coupling is in the data, not in
the code — there is no handoff step to show.

`ReportAnimalService.create` inserts one row into `animalReports` with `animalStatus: 'pending'`.
`RescueService.findAll` reads `animalReports` back out. Nothing is dispatched between the two
modules, and neither imports the other; `report-animal` does not know the feed exists.

---

## 2. Bounded Contexts as NestJS Modules

### 2.1 Context Map

```
┌──────────────────────────────────────────────────────────────────┐
│                     PawHaven Domain                               │
│                                                                  │
│  Seven NestJS modules inside core-service:                       │
│                                                                  │
│  ┌──────────────────┐                                            │
│  │  home            │  reads from ↓                              │
│  │  (aggregate)     │                                            │
│  └────────┬─────────┘                                            │
│           │                                                      │
│     ┌─────┴──────┬──────────────┬──────────────┐                 │
│     ▼            ▼              ▼              ▼                 │
│  ┌────────┐  ┌─────────┐   ┌──────────┐   ┌──────────┐          │
│  │ rescue │  │ adoption │   │report-   │   │animal-   │          │
│  │        │  │          │   │animal    │   │follow    │          │
│  └───┬────┘  └──────────┘   └──────────┘   └──────────┘          │
│      │                                                          │
│      └── shares `animalReports` ──► written by report-animal     │
│                                                                  │
│  ┌──────────┐   ┌──────────┐                                      │
│  │  guide   │   │bootstrap │   stand alone                       │
│  └────┬─────┘   └──────────┘                                      │
│       │ HTTP (internal client)                                    │
│       ▼                                                          │
│  document-service                                                │
│                                                                  │
│  Separate deployables: auth-service · document-service           │
│  config-service: not implemented                                 │
└──────────────────────────────────────────────────────────────────┘
```

Two relationships exist. `home` **reads** `rescue` and `adoption` through their exported services —
the only code-level dependency in core-service. `rescue` and `report-animal` **share** the
`animalReports` collection without importing each other, so a report is immediately a feed row.

### 2.2 Module Details

| Module            | Responsibility                                                                                         | Public service methods                         | Owns collections                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------ |
| **rescue**        | Public feed and single-animal detail over reported animals, plus one-photo-per-request image streaming | `findAll` `findOne` `findPhoto` `create`       | `animalReports` (read + create)                              |
| **report-animal** | Write one stray animal report with base64 photos and a reporter snapshot                               | `create`                                       | `animalReports` (write)                                      |
| **adoption**      | Read-only catalogue of adoptable pets; no create, update, or delete                                    | `findAll` `findOne`                            | `adoptablePet`                                               |
| **animal-follow** | Per-user follow bookmark and per-animal follower count                                                 | `follow` `unfollow` `getStatus`                | `animalFollow`                                               |
| **home**          | Homepage aggregate: hero stats + newest rescues + newest adoptable pets                                | `getHomeData` `getStats`                       | none — reads other modules' collections                      |
| **guide**         | Validate a guide slug, then relay PDF rendering to document-service                                    | `renderGuidePdf`                               | none — templates live in document-service                    |
| **bootstrap**     | Server-driven navigation: resolve roles → permissions → visible menus                                  | `getBootstrapData` `getAppMenus` `addMenuItem` | `Menu` `Role` `Permission` `RolePermission` `MenuPermission` |

`Route` and `RoutePermission` are defined in the schema and read by no code — the frontend route
tree is a static literal. See [§1.3](#13-module-communication-rules) for how modules reach each
other.

### 2.3 Notes on the Core Domain

**`report-animal` and `rescue` both write `animalReports`.** There is no separate case table. The two
services are near-duplicate inserts that differ only in DTO and in which fields they copy; the
portal uses `report-animal`, and nothing calls `POST /core/rescues`.

**`adoption` is read-only.** `findAll` and `findOne` are the whole service. There is no write path,
no seed script, and no admin route, so `adoptablePet` is populated by hand.

**`home` owns no collection.** It composes a read model at request time from three sources —
`animalReports`, `adoptablePet`, and an HTTP call to auth-service for the volunteer count.

### 2.4 AnimalFollow Module (Supporting)

Following an animal is its own module rather than a field on an existing aggregate. `AnimalFollowModule` registers one controller and one service, and exports the service so other modules can consume it through NestJS DI instead of its Prisma model.

**API surface** (all routes are behind the gateway, so the public path prefix is `/api/core`):

| Method | Path                                       | Endpoint policy         |
| ------ | ------------------------------------------ | ----------------------- |
| `POST` | `/api/core/animal-follow/:animalId`        | Default (authenticated) |
| `PUT`  | `/api/core/animal-follow/:animalId`        | Default (authenticated) |
| `GET`  | `/api/core/animal-follow/:animalId/status` | `@OptionalAuth()`       |

**Response shapes** — `POST` and `PUT` return `{ animalId, isFollowing, followedAt, followerCount }`: the mutation response carries the animal's follower count, so the client never has to follow a write with a separate count request. `GET :animalId/status` returns the same combined shape `{ animalId, isFollowing, followedAt, followerCount }` — it is the single read that answers both "is the current user following?" and "how many followers does this animal have?", so the rescue-detail page fires exactly one request.

One read route answers anonymous callers, and it returns both pieces of information. The follower count is simply public information, and the follow status is optional-auth because the portal cannot reliably tell a live session from a dead one the client is still rendering: the signed-in profile lives in a Redux slice persisted to localStorage and is only cleared on explicit logout, so a visitor whose session cookie expired without logging out still looks signed in. That stale profile fired the status query, and the 401 it received hit the portal's query-level 401 handler, which redirected the visitor off the **public** rescue-detail page to the login screen. Answering anonymous callers with `200 { animalId, isFollowing: false, followedAt: null, followerCount: 0 }` instead removes that failure. The handler injects claims with `@InternalJwt({ allowAnonymous: true })`, so an anonymous identity arrives as a claim rather than throwing in the decorator, and `getStatus` narrows the claim union and short-circuits to a null user id instead of reading `claims.sub`. The remaining two routes — follow and unfollow — are default-authenticated, and this policy does not extend to them: a visitor carrying a stale profile still renders the follow control, and clicking it still fails with 401. That is pre-existing profile-persistence behaviour rather than something this policy introduced. The anonymous payload needs no frontend accommodation either, because `AnimalFollowResultSchema` already declares `followedAt: z.string().nullable()` and `followerCount: z.number().int()`, so the anonymous payload validates against the contract and no consumer changes. Endpoint policy semantics are defined in [Authentication Architecture](authentication-architecture.md).

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

## 3. Module Boundary Enforcement

### 3.1 ESLint Rules

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

### 3.2 CI Architecture Fitness Function

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

## 4. Document Service — PDF Engine (Single-Template)

document-service is **pure generation + download**. Its data boundary is: **no database, no outbound HTTP calls, no catalog endpoint**. Every PDF is a template rendered from two inputs — the non-translatable `data` the caller passes inbound, and the translatable **copy** it resolves itself from `@pawhaven/i18n` (`locales/{locale}/documents/pdf/{slug}.json`, nested `document.pdf.<slug>`) as a static package resource. That key space is the only content document-service owns; it never reads a database or calls another service to obtain content.

### 4.1 The Single Route Contract

```
POST /document-service/internal/pdf/render
Content-Type: application/json
Authorization: internal JWT (kind:'authenticated', aud:'document-service', kid:'internal-v1')

{
  "template": "rescueGuide" | "firstAid" | "kittenCare" | "injuryResponse",
                                                         // required; === templates/<slug>/
  "locale": "en-US" | "zh-CN" | "de-DE",                 // required; canonical codes only
  "data": { ... },                                       // required; per-template, non-translatable
  "options": {                                           // optional; omitted ⇒ engine defaults
    "format": "A4" | "A3" | "A5" | "LETTER" | "LEGAL" | "TABLOID",
    "landscape": true,
    "scale": 1,
    "margin": { "top": "70px", "bottom": "70px", "left": "0", "right": "0" },
    "printBackground": true,
    "displayHeaderFooter": true,
    "preferCSSPageSize": false
  }
}
```

`template` is `GuideSlugSchema` — literally the folder names under `templates/<slug>/`. `RenderPdfBodySchema` is a
`z.strictObject` — an unknown key is a 400 rather than a silently ignored paper size. `data` is
`z.record(z.string(), z.unknown()).optional()`: an opaque generic record with no per-template validation at the
contract boundary (each template component interprets whatever it receives). `options` is a 7-field
`z.strictObject` — an unknown key is a 400 rather than a silently ignored paper size. `headerTemplate` /
`footerTemplate` (raw HTML into Chromium), `path`, `timeout`, `waitUntil` and `pageRanges` are deliberately **not**
exposed: the chrome is ours, and the rest are DoS or stability surface.

Translatable copy (brand / title / subtitle / sections / checklist / contacts / disclaimer) is **not** in the request:
document-service resolves it from `@pawhaven/i18n` at render time via `useTranslation()` — there is no per-slug copy schema at the contract boundary (§4.6). Contacts —
labels **and** values — live wholly in i18n, because a locale's hotline is different content, not a translation, and
splitting label from value across i18n and `data` would create positional coupling that silently mis-pairs on reorder.

Response = **raw PDF bytes** with `Content-Type: application/pdf` + `Content-Length` only. document-service sets **NO** `Content-Disposition` — the caller (core-service) owns the download headers. A `pdf-payload-size.guard` caps request body size and returns `413` past the limit.

### 4.2 The PDF Module (`src/modules/PDF/`)

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

### 4.3 Auth & Reachability

The render route is protected by the global `InternalJwtGuard` (registered via `SharedModule.forRoot` with `internalJwt.enabled: true`). core-service signs a complete `kind:'authenticated'` JWT (`aud:'document-service'`, `iat`/`exp`/`rid`/`sub`) with `INTERNAL_JWT_PRIVATE_KEY` / `kid:'internal-v1'`; document-service trusts the `internal-v1` public key.

The gateway keeps an `/api/document` proxy entry, but no frontend caller uses it. The browser reaches PDFs through core-service's `guide` module (see [§2.2](#22-module-details)), which relays to `POST /document-service/internal/pdf/render` over internal HTTP and streams the bytes back with download headers.

### 4.4 Shared Schemas

The render + guide contracts are defined in `packages/shared` / `packages/backend-core` so both sides validate identically:

| Location                                         | Purpose                                                                                                                                                                     |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/backend-core/types/Document.schema.ts` | `RenderPdfBodySchema` — `z.strictObject({ template: GuideSlugSchema, locale?, data?, options? })`; `EmailTemplateSchema`                                                    |
| `packages/shared/types/Guide.schema.ts`          | `guideSlugs` / `GuideSlugSchema`, `guideLocales` / `GuideLocaleSchema`, `normalizeLocale`, guide catalog schemas                                                            |
| `packages/shared/types/pdf/Options.schema.ts`    | `pdfOptionsSchema`, `pdfMarginSchema`, `PdfPaperFormatSchema`                                                                                                               |
| `packages/shared/types/pdf/Data.schema.ts`       | `pdfSectionSchema`, `pdfChecklistSchema`, `pdfContactItemSchema`, `pdfContactsSchema`, `pdfProvenanceSchema` — building blocks, not composed into a single `data` validator |
| `packages/shared/types/pdf/template.schema.ts`   | `pdfTemplateCopySchemas` / `pdfTemplateDataSchemas` (per-slug) + `PdfTemplateProps<K>`                                                                                      |
| `packages/shared/types/pdf/options.schema.ts`    | `pdfOptionsSchema` — the 7-field `options` whitelist (`z.strictObject`)                                                                                                     |

`options` **defaults** are deliberately _not_ shared: `defaultPdfOptions` / `resolvePdfOptions` live in
`apps/backend/document-service/src/modules/PDF/engine/defaultOptions.ts`, because they are engine behaviour owned by
the service, not part of the contract. Omitting `options` reproduces the previously hardcoded config exactly — A4,
margins `70px / 70px / 0 / 0`, `printBackground` and `displayHeaderFooter` true, `preferCSSPageSize` false.

The full render pipeline — why React + Puppeteer, how `engine/index.css` becomes the inlined PDF stylesheet, and the
print-layout constraints (`min-h-screen` = one page, header/footer living in the `margin` bands, Tailwind's scan set) —
is documented in **`PawHaven-PDF-Generation.md`**.

### 4.5 The 3-Hop Flow

```
Browser  POST /api/core/guide/pdf  { template }          (locale: x-locale header → normalizeLocale)
   │
   ▼  core-service `guide` module:
      GuideSlugSchema.safeParse(template) → 400 (BadRequestException) on miss,
      locale = normalizeLocale(x-locale header)
core    POST /document-service/internal/pdf/render  { template, locale, data: {} }
   │
   ▼  document-service resolves COPY from @pawhaven/i18n (`document.pdf.<slug>`, via `useTranslation`),
      renders React → HTML → Puppeteer PDF Buffer
core    streams PDF bytes to browser with Content-Type: application/pdf
```

**Copy vs data** — the split is by kind, not by file location. Everything a translator writes (brand, title,
subtitle, sections, checklist, contacts, disclaimer) is **copy** and lives in
`packages/i18n/locales/{locale}/documents/pdf/{slug}.json`, nested as `document.pdf.<slug>`; document-service resolves
it at render time via `useTranslation()` with per-component `keyPrefix`. A missing key falls back to the key string —
there is no schema validation of the copy at the contract boundary.
Everything that is not translatable (`provenance` today, per-template structured input in general) is **data** and is
what core-service would send if it had any; today the only caller passes `data: {}`.
The render locale drives `<html lang>` and the chrome; template components read their own copy through
`useTranslation()` on the per-request i18next instance, so no component takes a `locale` prop.

**Adding a guide** therefore touches: 3 locale JSON files + 1 template folder + the `definePdfTemplate` registry entry. The `satisfies Record<GuideSlug, …>` lock on `templateRegistry` makes a new slug a compile error there; the slug must also be added to `guideSlugs` in `packages/shared/types/Guide.schema.ts`.

### 4.6 PDF Strings — shared i18n, one locale vocabulary, `documents/` is Node-only

document-service no longer ships an i18n runtime of its own (the `i18n` npm package, `src/i18n/i18n.config.ts` and `src/i18n/{en,zh,de}.json` were deleted). Every localized string it renders comes from the shared package — the chrome **and** each guide's body copy:

| Location                                                            | Role                                                                                                                                 |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/i18n/locales/{locale}/documents/pdf/{slug}.json`          | **Node-only** guide copy — nested as `document.pdf.<slug>` (brand / title / subtitle / sections / checklist / contacts / disclaimer) |
| `packages/i18n/locales/{locale}/documents/pdf/{header,footer}.json` | PDF chrome — `document.pdf.header.tagline`, `document.pdf.footer.copyright`                                                          |
| `packages/i18n/resources.js`                                        | Node-safe entry: reads `documents/` with `fs`; exports `documentI18n` and `documentFallbackLocale`                                   |
| `packages/i18n/supportedLngs.js`                                    | single canonical locale list, re-used by the Node entry                                                                              |

Five rules hold this boundary:

- **One locale vocabulary, strictly canonical.** `guideLocales` in `packages/shared/types/Guide.schema.ts` is the single source: `en-US | zh-CN | de-DE`. `normalizeLocale` is **strict** — a canonical code maps to itself and anything else (`en`, `en-GB`, `zh-Hans-CN`, `de-AT`, comma/quality strings) falls back to `en-US`. There is deliberately no language-subtag folding: the language selector is wired to `supportedLngs`, so the backend only ever receives canonical codes.
- **Copy lives in i18n, data stays in core-service.** The guide's translatable **copy** is `document.pdf.<slug>` in `@pawhaven/i18n`; the non-translatable **data** is assembled by core-service's `guide` module and passed inbound. (Locked decision D2 — "guide body content stays in core-service, not in i18n" — is **superseded for the PDF surface** by the Option B decision recorded in DD-10.)
- **`documents/` is Node-only, excluded from the browser bundle.** `packages/i18n/index.js` globs `./locales/*/*.json` — **one** segment, deliberately — so `documents/` (≈15 KB per locale, the largest group in the package) is loaded only by `resources.js`, which reads it from disk with `fs`. Two consequences are why the glob must stay one segment: (1) PDF copy is never shipped to the browser, and (2) the top-level key collisions `documents/pdf/rescueGuide.json` vs UI `rescueGuide.json` and `documents/pdf/footer.json` vs UI `footer.json` cannot happen, so the "filename === unique top-level key" invariant of the per-locale merge holds. Widening the glob back to `./locales/**/*.json` re-ships the copy to every browser and silently shadows PDF copy with UI keys. If PDF copy is ever needed in the browser, the lever is this glob — not an i18next namespace.
- **The Node entry is Node-safe.** `@pawhaven/i18n` (browser) pulls `react` / `react-i18next` / the language detector; `@pawhaven/i18n/resources` uses `i18next` core + `fs`-read JSON only, so a backend can import it without a DOM. `packages/i18n/resources.d.ts` types that entry: it exports `documentI18n: i18n` (a fully initialised i18next instance) and `documentFallbackLocale: 'en-US'` — no separate `translateDocument` / `getDocumentObject` helpers. `document` is an ordinary top-level business key in that instance (i18next's single default `translation` namespace), not a namespace of its own; portal UI keys keep living in the browser instance's flat key space.
- **One locale source per render.** `locale` is the validated request body's `locale` when present, otherwise it is resolved from the request headers (`x-locale` → `locale` → `accept-language`, canonicalised by `normalizeLocale`) and passed to `buildPdf` as `headerLocale`, which uses `body.locale ?? headerLocale`. That single locale drives `documentI18n.cloneInstance({ lng })`, `<html lang>`, and the chrome — one clone per request, so concurrent renders in different locales never share i18next state.

## 5. Tech Stack

### 5.1 Core

| Category            | Technology | Notes              |
| ------------------- | ---------- | ------------------ |
| **Framework**       | NestJS     | Modular monolith   |
| **Language**        | TypeScript | Strict mode        |
| **Runtime**         | Node.js    |                    |
| **Package Manager** | pnpm       | Workspace monorepo |

### 5.2 Database & ORM

| Category         | Technology | Notes                                                         |
| ---------------- | ---------- | ------------------------------------------------------------- |
| **Database**     | MongoDB    | One per service with a Prisma schema (auth, core)             |
| **ODM/ORM**      | Prisma     | Type-safe queries; `softDelete` + `version` extensions active |
| **Blob storage** | none       | Photos are base64 inside the document; PDFs are never stored  |

### 5.3 Communication

| Category             | Technology                     | Notes                                           |
| -------------------- | ------------------------------ | ----------------------------------------------- |
| **Within a module**  | Direct method calls            | One service class per module                    |
| **Within a service** | Exported service via NestJS DI | Module-to-module: `home` → `rescue`, `adoption` |
| **Between services** | HTTP (`HttpClientService`)     | `core` → `auth`, `core` → `document`            |

There is no event bus and no message broker — neither is a dependency.

### 5.4 Validation & Shared

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

### 5.5 Bootstrap & Config Validation

Startup is **fail-fast**. `setup/bootstrap.ts` exposes `bootstrapApp()`, which wraps `NestFactory.create` in a try/catch. If a service's environment config is invalid, validation throws `ServiceConfigValidationError`; the catch prints the multiline report and rethrows so `process.exit(1)` fires **before** `app.listen()` — no HTTP listener is ever opened.

Each service composes its schema from shared Zod building blocks:

- `packages/backend-core/dynamic-modules/config-module/configValidation.ts` — `validateServiceConfig`, `formatConfigIssues`, `ServiceConfigValidationError`.
- `packages/backend-core/dynamic-modules/config-module/configSchema.ts` — reusable schema fragments.
- `apps/backend/<svc>/src/config/Config.schema.ts` (gateway / auth / core / document) — the per-service schema, passed to `SharedModule.forRoot`.
- `configs.module.ts` — validation runs **inside** the `load` factory so it sees the fully-resolved env (including `ConfigModule` interpolations).

The `validate` / `validationSchema` hooks were **rejected** because they execute _before_ the `load` factories run, so they never see the resolved env and cannot validate the real config. Required leaves use `.min(1)`, so a missing `${VAR}` (which resolves to `''`) is caught rather than silently defaulting.

On failure the process prints, e.g.:

```
configuration is invalid — refusing to start
  DBConnections: required, received ""
```

### 5.6 Security

| Category               | Technology                                                                                                                                                                                                                | Notes                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Browser sessions**   | Cookie-based JWT — owned by gateway `InternalJwtService` only                                                                                                                                                             | Access 3min prod / 5min dev, Refresh 7d                                                                                          |
| **Service-to-service** | ES256 internal JWT `InternalJwt` in `x-gateway-jwt` (45s TTL)                                                                                                                                                             | Verified by downstream `InternalJwtGuard`; no `x-auth-*` header trust                                                            |
| **Authorization**      | Roles and permissions are modelled (auth-service `User.roles`, core-service `Role`/`Permission`/`RolePermission`/`MenuPermission`/`RoutePermission`) and resolved by `bootstrap` into permission codes for menu filtering | **No endpoint denies access by role** — endpoint policy is authentication (`@Public`/`@OptionalAuth`/default-authenticated) only |
| **Rate Limiting**      | Token bucket                                                                                                                                                                                                              | Per IP + per user at gateway                                                                                                     |
| **Transport**          | HTTPS (TLS 1.3)                                                                                                                                                                                                           |                                                                                                                                  |

### 5.7 Deployment & Infrastructure

| Category           | Technology       | Notes                                                                                                                                             |
| ------------------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MVP Deployment** | Docker Compose   | Single VPS                                                                                                                                        |
| **Production**     | Kubernetes + HPA | Phase 3+                                                                                                                                          |
| **Managed DB**     | MongoDB Atlas    | Production                                                                                                                                        |
| **Cache**          | none             | Rate limiting is an in-process `Map` in `GatewayThrottleGuard`, capped at 10 000 clients — it resets on restart and is not shared across replicas |

### 5.8 Observability

Every request carries a single correlation id, **`x-trace-id`**, whose name is the single source in `packages/backend-core/constants/httpHeaders.ts`. The id is minted once, survives every hop, and is visible to the user in the response header of every browser request.

#### Where it comes from

`packages/backend-core/trace/traceContext.ts` owns the whole contract:

- `resolveInboundTraceId(headers)` reuses a caller's `x-trace-id` when it is safe, otherwise mints a UUID. This is the **only** place inbound resolution happens — `traceMiddleware` and the gateway proxy both defer to it, so a request can never end up with two ids.
- Inbound values are **sanitized, not trusted**. A reflected value must be non-empty, ≤ 64 chars, and match `^[A-Za-z0-9._:-]+$`. The value is echoed straight into a response header, and `res.setHeader` throws on CR/LF, so a caller-supplied `x-trace-id: bad\r\nx-injected: 1` is discarded in favour of a fresh id rather than reflected.

#### Ambient propagation (`AsyncLocalStorage`)

`runWithTrace(traceId, fn)` opens an `AsyncLocalStorage` scope; `getTraceId()` reads it back. In-house rather than a dependency, and scoped to a single concern.

`traceMiddleware` (registered as the **first** `app.use()` in `configureApp`, so it runs before body parsing and applies to all four services without per-app wiring):

1. resolves the id and writes it to `req.headers` **and** `res.setHeader` — the latter is why gateway-originated responses that never touch `ProxyService` (401 from the identity resolver, 429 from the throttle guard, 404/400 from proxy path validation, `/health`) are still traceable;
2. wraps `next()` in `runWithTrace`, so handlers and every async continuation inherit the id;
3. emits an access log on `res.on('finish')` — `METHOD path status durationMs trace=<id>`, escalating to `warn` at 4xx and `error` at 5xx. The id is read from the closure, not the ambient store, so the log does not depend on how the response happened to be written.

#### Service-to-service hops

`HttpClientInstance` takes `traceId: options?.traceId ?? getTraceId() ?? generateTraceId()` and applies it **last** in the header spread, so the outbound `x-trace-id` always equals `context.traceId` and cannot be clobbered by a raw header. Overriding goes through the dedicated `traceId` option precisely so there is only one authoritative value for a call.

The same value is set as the internal JWT's **`rid`** claim, so the token a callee verifies and the header it receives describe the same request. `InternalJwtGuard.reportTraceIdMismatch()` cross-checks the two: a disagreement is logged as a warning and the header wins, because `rid` carries no authorization meaning — failing closed there would risk breaking live flows for a diagnosability-only signal.

#### Log correlation

`TraceLogger` (`packages/backend-core/logging/`) is a `ConsoleLogger` that stamps `[trace=<id>]` onto every line and is installed as the Nest logger in `bootstrapApp`. Routing the whole application through one logger is what makes the id useful — there is no call site to remember to annotate, so every existing `new Logger(X).warn(...)` in every service is correlated for free. Lines outside a request scope render `[trace=-]`.

The id is resolved **at log-call time, not at write time**. Nest buffers startup logs (`bufferLogs: true`) and flushes them from `app.listen()`, which runs outside any request; reading the store lazily at write time would attribute those lines to whichever request happened to be in flight.

#### Error responses

`HttpExceptionFilter` sets the header and adds `traceId` to the response envelope, preferring a trace id carried on the exception payload over the ambient one — `HttpClientInstance` attaches the id of the hop that actually broke, so the caller is pointed at the failing hop rather than the hop that noticed. Only the object payload form is read: `HttpException` returns its response verbatim, so `new HttpException('some message', 400)` yields a bare string that would otherwise be copied into the `traceId` field.

#### A real three-hop chain

`POST /core/guide/pdf` (core-service `GuideController`) → `GuideService` → `POST /internal/pdf/render` (document-service `InternalPdfController`) exercises the full path: gateway → core-service → document-service, with one id throughout.

`internal/pdf/render` carries no `@Public()`, so `InternalJwtGuard` protects it; the gateway refusing to proxy any path that rewrites to `/internal` is a second line of defence. The response is written with `@Res()` rather than returned, because the global success interceptor would otherwise wrap the PDF buffer in the JSON envelope and corrupt the download. `core-service` validates the guide slug against `GuideSlugSchema` before spending a document-service call, and forwards `x-locale` explicitly because `PdfService` resolves the rendering locale from that **header**, not the body.

### 5.9 Code Quality

| Category            | Technology                        | Notes                       |
| ------------------- | --------------------------------- | --------------------------- |
| **Linting**         | ESLint                            | Module boundary enforcement |
| **Formatting**      | Prettier                          | Centralized config          |
| **Git Hooks**       | Husky + lint-staged               | Pre-commit checks           |
| **Commit Standard** | Commitlint (Conventional Commits) |                             |

---

> **Related Docs**: [System Architecture Overview](PawHaven-System-Architecture-Overview.md) | [Frontend Architecture](PawHaven-Frontend-Architecture.md)
