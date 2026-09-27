# Feature: Home (`portal/src/features/home`)

> **Status**: Implemented · **Verified against**: `core-service/modules/home`, `core-service/modules/adoption`, `portal/features/home`
> **Feature docs**: [README](README.md) · **Sources**: [Product Blueprint §3, §9](../product/PawHaven-Product-Strategy-EN.md) · [Frontend Architecture](../architecture/PawHaven-Frontend-Architecture.md) · [Design tokens](../../packages/design-system/src/tokens)

The public landing page, `/`. It is the only page that aggregates two backend modules into one
request, and the only place the adoptable-pets catalogue appears at all.

## 1. Sections

`Home.tsx` renders four sections in this order, in a single `flex flex-col` column:

| Order | Section        | Component                                    | Data key        |
| ----- | -------------- | -------------------------------------------- | --------------- |
| 1     | Hero           | `components/Hero.tsx`                        | `heroStats`     |
| 2     | Rescue cases   | `rescue-cases/components/RescueCasesSection` | `latestRescues` |
| 3     | Adoptable pets | `components/AdoptablePetsSection.tsx`        | `adoptablePets` |
| 4     | Stray CTA      | `components/StrayCTA.tsx`                    | static          |

`Home.tsx` and `Hero.tsx` **each call `useLoaderData()` independently** on the same route. Both
read the same `HomeData`; neither receives it as a prop.

### 1.1 Hero

`components/Hero.tsx`. Two-column on `lg+` (`lg:w-7/12` copy, `lg:w-5/12` image, image
`hidden` below `lg`), copy-only below that. The banner is a static `/images/hero-banner.webp`
declared with a module-level `preload(..., { as: 'image' })`, not a CMS asset.

It holds the three hero stats, mapping `heroStats` through `toLocaleString()` against
`home.hero_stat_rescues` / `_adopted` / `_volunteers`. Two CTAs: the primary navigates to
`/report-animal`, the secondary is a second `<button>` in the same group with no `onClick` — a
dead control.

The headline uses `<Trans i18nKey="home.hero_headline" components={{ highlight: <em className="text-primary not-italic" /> }} />`,
so the highlighted span is a component slot rather than a concatenated string.

### 1.2 Rescue cases

`RescueCasesSection` imported from `../rescue-cases/components/`. This is a **cross-feature
import**: `home` does not own it and `packages/ui` does not either, so a component used by two
features has not been promoted out of `rescue-cases`. Full detail in
[Rescue Cases](04-rescue-cases.md).

The homepage passes `showStatusSummary={false}` and omits `isLoading`, so the pending/in-progress
counter the section can render is suppressed and the skeleton is never shown — the loader has
already resolved by the time `Home` renders.

### 1.3 Adoptable pets

`components/AdoptablePetsSection.tsx` + `AdoptablePetsSectionSkeleton.tsx` + `components/PetCard.tsx`.
A horizontal scroller of `PetCard`s. The section is **presentational** — it takes
`pets`, `onPetClick`, `onSeeAll`, `isLoading` and fetches nothing; the loader supplies the rows.

It carries a raw inline `style={{ scrollSnapType: 'x mandatory' }}` for the scroller, which
`style-doctor` treats as a blocking violation.

**Both of its links are dead.** `onPetClick` navigates to `/adopt/detail/${id}` and `onSeeAll` to
`/adopt`. Neither path is in `routePaths` or `router.tsx`, so both land on the `path: '*'`
`NotFound` route. The backend has a matching `GET /api/core/adoptable-pets/:id` endpoint with **no
caller** — the same unfinished work seen from both ends.

### 1.4 Stray CTA

`components/StrayCTA.tsx`. A full-bleed gradient band with a `PawPrint` mark, a heading and
description taken from the `footer.*` namespace, and two buttons: `/report-animal` (works) and
`/volunteer` (**dead route**).

**`StrayCTA` is duplicated.** A near-verbatim copy lives at
`features/report-animal/components/StrayCTA.tsx`, differing only by a `full-width` class on the
outer `<section>`. Two features use it, so by the project's own graduation rule it belongs in
`packages/ui`; today it is a copy-paste that will drift.

## 2. End-to-End Flow

```mermaid
flowchart TD
    A[GET /] --> B[rootRoute loader<br/>rootLoader → GET /core/bootstrap]
    B --> C[homeRoute loader<br/>homeLoader → GET /core/home]
    C --> D[Home.tsx · useLoaderData]
    D --> E[Hero · RescueCasesSection<br/>AdoptablePetsSection · StrayCTA]
    E --> F{click a case}
    F --> G[/rescue/detail/:id]
    E --> H{click a pet}
    H --> I[/adopt/detail/:id → NotFound]
    E --> J{CTA secondary}
    J --> K[/volunteer → NotFound]
```

Two loaders, two TanStack Query caches. `rootLoader` primes bootstrap and returns
`EMPTY_BOOTSTRAP` without any request on the login and register paths; `homeLoader` primes the
home content. Both use `queryClient.ensureQueryData`, so a revisit is served from cache rather than
refetched. `rootShouldRevalidate` re-runs the root loader only when crossing between an auth page
and a non-auth page.

## 3. Endpoint

`GET /api/core/home` · `@OptionalAuth()` · `core-service/modules/home`.

`HomeService.getHomeData` fans out three reads in parallel:

| Read            | Source                                                                               |
| --------------- | ------------------------------------------------------------------------------------ |
| `heroStats`     | `animalReports.count()`, `adoptablePet.count()`, auth-service `GET /volunteer-count` |
| `latestRescues` | `RescueService.findAll(undefined, featureFlag.latestRescueLimit)`                    |
| `adoptablePets` | `AdoptionService.findAll(undefined, featureFlag.adoptablePetLimit)`                  |

Both limits come from `featureFlag.*` in config, not from query parameters.

### 3.1 Hero stats

```
totalRescues    = animalReports where deletedAt not set
totalAdopted    = animalReports where animalStatus = 'adopted'
                 + adoptablePet where adoptionStatus = 'adopted'
totalVolunteers = auth-service GET /volunteer-count
```

Two caveats, both load-bearing:

- `totalAdopted` sums two collections, and **no code ever writes `animalStatus: 'adopted'`** — see
  [Rescue Cases §5](04-rescue-cases.md#5-status). The rescue half of that number is structurally
  zero, so the figure is really "adopted pets in the hand-maintained catalogue".
- The `volunteer-count` call is a genuine cross-service HTTP hop, wrapped in a `try/catch` that
  logs a warning and falls back to `0`. The page renders a `0` volunteer count rather than an
  error when `auth-service` is unreachable.

## 4. Adoptable Pets (read-only)

The `adoption` module has no portal feature folder of its own. It exists only as
[§1.3](#13-adoptable-pets) of this page.

| Method | Path                           | Policy            | Notes                                          |
| ------ | ------------------------------ | ----------------- | ---------------------------------------------- |
| GET    | `/api/core/adoptable-pets`     | `@OptionalAuth()` | `?status=` `?limit=`                           |
| GET    | `/api/core/adoptable-pets/:id` | `@OptionalAuth()` | 400 if missing or soft-deleted — **no caller** |

`findAll` filters `deletedAt: { isSet: false }`, optionally `adoptionStatus`, orders by
`createdAt` desc, and applies `take`. As with the rescue feed, `limit` truncates rather than
paging.

`AdoptablePet` in `apps/backend/core-service/src/prisma/mongodb/schema.prisma`:

| Field            | Type     | Notes                                                  |
| ---------------- | -------- | ------------------------------------------------------ |
| `id`             | ObjectId | `@map("_id")`                                          |
| `name`           | String   |                                                        |
| `animalType`     | String   |                                                        |
| `age`            | String   | Free text here, **not** `baby \| adult` as in rescues  |
| `sex`            | String   |                                                        |
| `breed`          | String   |                                                        |
| `location`       | String   | A single string, not the rescue location object        |
| `waitingDays`    | Int      |                                                        |
| `tags`           | String[] |                                                        |
| `photo`          | String   | One photo, as a URL — not the base64 array rescues use |
| `rescuedFrom`    | String   |                                                        |
| `rescueDuration` | String   | Free text, not a number                                |
| `medicalRecords` | String[] |                                                        |
| `temperament`    | String   |                                                        |
| `adoptionStatus` | String   | `@default("available")`, indexed                       |

`adoptionStatus` is an unconstrained string. The code reads the literal `adopted` when counting for
the hero stats, and the schema comment names `available | pending | adopted`, but no enum or
validation constrains writes.

**There is no link between a pet and a rescue case** — no `caseId`, no `rescueCaseId`, no foreign
key. The blueprint has `AWAITING_ADOPTION` produce a listing; the code has no such rule. `HomeService`
queries the two collections in parallel and returns them side by side.

## 5. Data Model

No homepage-owned collection. `HomeData` (`packages/shared/types/Home.schema.ts`) is a read model
assembled at request time: `heroStats`, `latestRescues`, `adoptablePets`.

## 6. Frontend Files

| File                                                | Role                                           |
| --------------------------------------------------- | ---------------------------------------------- |
| `route.tsx`                                         | `homeRoute` (index), `homeLoader`              |
| `Home.tsx`                                          | §1                                             |
| `components/Hero.tsx`                               | §1.1                                           |
| `components/AdoptablePetsSection.tsx`               | §1.3 — inline `style`, blocking `style-doctor` |
| `components/AdoptablePetsSectionSkeleton.tsx`       | Loading state, unused on this route            |
| `components/PetCard.tsx`                            | One pet                                        |
| `components/StrayCTA.tsx`                           | §1.4 — duplicated in `report-animal`           |
| `api/home.api.ts` / `.queries.ts` / `.queryKeys.ts` | The call and its cache key                     |
| `types.ts`                                          | Section-local types                            |
| `tests/AdoptablePetsSection.test.tsx`               | The only test                                  |

`homeRoute` is the only route in `router.tsx` that is **not** `lazy:` — it passes `Component: Home`
directly, so the homepage is in the main bundle.

`useLoaderData()` is cast `as HomeData` rather than parsed with `HomeDataSchema`, so a malformed
response surfaces as a render error instead of a parse error.

## 7. What Does Not Exist

- **No map.** The rescue section is a horizontal card list. `locationObj` is stored and returned
  but never rendered as a pin, and `distance` is a hard-coded `0`.
- **No stories, no knowledge base, no search, no filters.** The blueprint homepage has five content
  sections; this one has four, two of which are static.
- **No species/status/radius filtering.** `GET /core/rescues` accepts `status` and `limit`, and the
  homepage passes neither a status nor a user-chosen limit.
- **No featured/curated state.** Ordering is `createdAt` desc.
- **No server-side search.**
- **No adoption flow.** The catalogue is read-only: no applications, no agreements, no
  finalisation, and no way to create, update, or delete a pet — there
  is no seed script and no admin path, so the collection is populated by hand.
- **No linkage to a rescue case**, so `AWAITING_ADOPTION` creates nothing.
- **No CMS.** The hero banner and every headline are build-time assets and translation keys.

## 8. Related Docs

- [Rescue Cases](04-rescue-cases.md) — the feed §1.2 embeds
- [App Shell & Bootstrap](07-app-shell-bootstrap.md) — the other boot-time request
- [Product Blueprint §3 (Discovery), §9 (Adoption)](../product/PawHaven-Product-Strategy-EN.md) —
  the intended section list and adoption flow
