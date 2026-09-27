# Feature Docs

One document per **portal feature folder** — `apps/frontend/portal/src/features/*`. That is the
axis a user moves along: a route, a page, the components that make it up, and the backend behind
it. Where a backend module has no feature folder of its own, it is documented as a section of the
page that consumes it, not as a document of its own.

Gaps are recorded in a **What Does Not Exist** section, so each is stated once at the point it
matters rather than left for a reader to discover. The product ambition lives in
[`../product/`](../product/PawHaven-Product-Strategy-EN.md); these documents describe the system as
it is.

## Documents

| #   | Portal feature       | Document                                                 | Route                           |
| --- | -------------------- | -------------------------------------------------------- | ------------------------------- |
| 01  | `auth`               | [`01-auth.md`](01-auth.md)                               | `/auth/login`, `/auth/register` |
| 02  | `home`               | [`02-home.md`](02-home.md)                               | `/`                             |
| 03  | `report-animal`      | [`03-report-animal.md`](03-report-animal.md)             | `/report-animal` (auth-gated)   |
| 04  | `rescue-cases`       | [`04-rescue-cases.md`](04-rescue-cases.md)               | `/rescue-cases`                 |
| 05  | `rescue-detail`      | [`05-rescue-detail.md`](05-rescue-detail.md)             | `/rescue/detail/:animalID`      |
| 06  | `rescue-guide`       | [`06-rescue-guide.md`](06-rescue-guide.md)               | `/rescue/guides`                |
| 07  | _(none — `layout/`)_ | [`07-app-shell-bootstrap.md`](07-app-shell-bootstrap.md) | wraps every route               |

## How each document is organised

```
## 1. Sections            1.1, 1.2, 1.3 … — the parts of the page
## 2. End-to-End Flow      mermaid, loader → api → gateway → service → collection
## 3. Endpoints            method, path, policy, notes
## 4. Data Model           the Prisma models actually written
## 5. Frontend Files       the feature folder, file by file
## 6. What Does Not Exist  the gap, once, in detail
## 7. Related Docs
```

Not every document uses every chapter — a feature with one endpoint and no model has nothing to
put in §4.

## Two features without their own document

Both are real, working code with their own backend module. Neither is a portal feature folder, so
both live as sections:

- **`adoption`** → [Home §4](02-home.md#4-adoptable-pets-read-only). Read-only, has no route, and
  no detail endpoint with a caller. Its two `/adopt*` links on the homepage hit `NotFound`.
- **`animal-follow`** → [Rescue Detail §1.4](05-rescue-detail.md#14-follow). It _is_ a feature
  folder, but no route mounts it — `rescue-detail` imports `FollowButton` and `FollowerCount`
  across the feature boundary. It is the only place two features share UI without promotion to
  `packages/ui`.

## Service Boundaries

| Service            | Modules                                                                              |
| ------------------ | ------------------------------------------------------------------------------------ |
| `core-service`     | `adoption`, `animal-follow`, `bootstrap`, `guide`, `home`, `report-animal`, `rescue` |
| `auth-service`     | `auth`                                                                               |
| `document-service` | `email`, `pdf`                                                                       |
| `gateway`          | `identity`, `internal-jwt`, `proxy`, `routing`, `throttle`                           |

One collection, two features: `animalReports` is written by both `report-animal` and `rescue`, and
read by `rescue` and `home`. There is no `rescue_cases` table — **the report _is_ the case**.

## What Is Not Built

Each feature doc has the detail at the point it matters.

- **No domain events.** `@nestjs/event-emitter` is not installed. Modules coordinate by direct
  service injection instead.
- **No case lifecycle.** The 7-value `AnimalStatus` enum exists, only `pending` is ever written,
  and there is no transition endpoint or transition table. Both timelines in the UI are
  projections of that one field, not history.
- **No volunteer network.** Opting in sets a `volunteer` role string, and the opt-in endpoint has
  no caller in the portal. No profile, availability, capability, matching, or claiming.
- **No adoption applications.** The catalogue is read-only, has no detail route, and its
  `GET /:id` endpoint has no caller.
- **No notifications of any kind.** No module, no collection, no delivery.
- **No stories, no knowledge base, no achievements, no profile.** `Story.schema.ts` is exported
  from the shared barrel and consumed by nothing.
- **No RBAC guard.** Roles are stored and used to filter menus; no endpoint authorises on role.
- **No config-driven routes.** The route tree is a static literal; the `Route` model is unread.

## Known defects in the code

Distinct from gaps in the design — these are places where the implementation contradicts its own
contract. Each is documented at the point it occurs.

| Defect                                                                                                                                                                                                                              | Document                                                                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `contactInfo` is required by `AnimalReportSchema`, collected by the form, and **never persisted** — there is no contact field on the model                                                                                          | [Report §6.1](03-report-animal.md#61-contactinfo)                                             |
| The DTO's `status` enum is a 4-value **temperament** classification; the form collapses it to 2 values from an unrelated `urgent` boolean, then the service drops it. The model has a _different_, dead column also called `status` | [Report §6.2](03-report-animal.md#62-status--and-a-name-collision)                            |
| `statusDescription` stores a **rendered translation**, so the stored value depends on the submitter's locale                                                                                                                        | [Report §5](03-report-animal.md#5-data-model)                                                 |
| `distance` is hard-coded to `0` on both list and detail                                                                                                                                                                             | [Rescue Cases §4](04-rescue-cases.md#4-listing-behaviour)                                     |
| `findAll` applies `take` but no cursor, so `limit` truncates rather than paginates                                                                                                                                                  | [Rescue Cases §4](04-rescue-cases.md#4-listing-behaviour)                                     |
| A row failing `RescueListItemSchema.parse` is **skipped with a warning**, silently shortening the feed                                                                                                                              | [Rescue Cases §4](04-rescue-cases.md#4-listing-behaviour)                                     |
| The status chip is gated on `photos.length > 0`, so a photo-less report shows **no status at all**                                                                                                                                  | [Rescue Detail §1.1](05-rescue-detail.md#11-photo-hero)                                       |
| `VolunteerInfo` is called with `volunteer={undefined}`, so its entire populated branch is unreachable                                                                                                                               | [Rescue Detail §1.5](05-rescue-detail.md#15-volunteer-card)                                   |
| The detail page's share button has no `onClick`; `Hero`'s secondary button has none either                                                                                                                                          | [Rescue Detail §1.5](05-rescue-detail.md#15-volunteer-card) · [Home §1.1](02-home.md#11-hero) |
| `StrayCTA` is duplicated across `home` and `report-animal`, differing by one class                                                                                                                                                  | [Home §1.4](02-home.md#14-stray-cta)                                                          |
| `RescueCasesSection` is imported by `home` across a feature boundary and never promoted to `packages/ui`                                                                                                                            | [Home §1.2](02-home.md#12-rescue-cases)                                                       |
| `AdoptablePetsSection` carries a raw inline `style={{ scrollSnapType }}` — blocking per `style-doctor`                                                                                                                              | [Home §1.3](02-home.md#13-adoptable-pets)                                                     |
| `useLoaderData()` is cast `as HomeData` instead of parsed with `HomeDataSchema`                                                                                                                                                     | [Home §6](02-home.md#6-frontend-files)                                                        |
| `CaseDetail.tsx` is exported and used by nothing                                                                                                                                                                                    | [Rescue Cases §6](04-rescue-cases.md#6-the-status-ladder)                                     |
| **13 dead link targets** across the shell, footer, and homepage — all landing on `NotFound`, including `/rescues` as a near-miss for `/rescue-cases`                                                                                | [App Shell §1.3](07-app-shell-bootstrap.md#13-outlet-error-boundary-and-footer)               |
| A `Menu` with no `MenuPermission` rows is visible to everyone                                                                                                                                                                       | [App Shell §2](07-app-shell-bootstrap.md#2-boot-flow)                                         |
| A signed-in user with `roles: []` — every new registration — is a **guest** for menu purposes                                                                                                                                       | [App Shell §2](07-app-shell-bootstrap.md#2-boot-flow)                                         |
| The report success card fabricates a case number from the timestamp when the response carries no `id`                                                                                                                               | [Report §1.3](03-report-animal.md#13-success-card)                                            |

## Related

- [`../architecture/`](../architecture/) — a technical point or a problem's design in this project
- [`../product/`](../product/) — the product blueprint these features were meant to deliver
