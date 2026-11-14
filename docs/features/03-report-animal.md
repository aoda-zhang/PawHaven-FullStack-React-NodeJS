# Feature: Report a Stray Animal (`portal/src/features/report-animal`)

> **Status**: Implemented · **Verified against**: `core-service/modules/report-animal`, `portal/features/report-animal`
> **Feature docs**: [README](README.md) · **Sources**: [Product Blueprint §3](../product/product-strategy.md) · [Design tokens](../../packages/design-system/src/tokens)

`/report-animal`, a public route that accepts both guest and authenticated submissions. One scrolling form that writes a single
row into `animalReports` with status `pending` — the same collection the rescue feed reads, so
**the report _is_ the case**.

## 1. Screens

One route, one page container (`index.tsx`), and one of three mutually exclusive card states.
The page is **not** a wizard: it is a single `<form>` that scrolls, with two fieldset cards and a
submit button.

### 1.1 Basics card

Heading from `reportAnimal.basics_title`, body `components/AnimalBasicsSection.tsx`. Rendered
field order:

| Order | Control              | Field                              | Notes                                       |
| ----- | -------------------- | ---------------------------------- | ------------------------------------------- |
| 1     | `LocationSection`    | `address`, `latitude`, `longitude` | Coordinates omitted unless both are set     |
| 2     | `FormRadio`          | `animalType`                       | `cat` \| `dog` \| `other`                   |
| 3     | `FormInput`          | `otherAnimalType`                  | Rendered only when `animalType === 'other'` |
| 4     | `AnimalCountStepper` | `animalCount`                      | −/+ , min 1                                 |
| 5     | `FormInput`          | `coatColor`                        |                                             |
| 6     | `FormRadio`          | `size`                             | `small` \| `medium` \| `large`              |
| 7     | `FormRadio`          | `age`                              | `baby` \| `adult` — only two buckets        |
| 8     | `PhotoUpload`        | `photos`                           | See [§4](#4-photos)                         |

Location is rendered **first**, above the animal attributes, which is the reverse of the reading
order the DTO uses.

### 1.2 Behaviour card

Heading from `reportAnimal.behavior_title`, body `components/BehaviorContactSection.tsx`:

| Order | Control          | Field          | Notes                                                                                              |
| ----- | ---------------- | -------------- | -------------------------------------------------------------------------------------------------- |
| 1     | `FormRadio`      | `behavior`     | `friendly \| wary \| aggressive \| unknown` — see [§6](#6-contract-persistence-details)   |
| 2     | `FormInput`      | `description`  | ≤ 200 chars, trimmed on submit                                                                     |
| 3     | `FormCheckbox`   | `urgent`       | Collapses the DTO's `status` enum to 2 values — see [§6](#6-contract-persistence-details) |
| 4     | `FormInput`      | `contactEmail` | Optional email address; validated only when provided                                              |

Ticking `urgent` also reveals a static `bg-error-light` note reading
`reportAnimal.emergency_note`.

`contactInfo.email` is optional. The form explains why a reachable email is recommended and confirms that it can be left blank.

The submit button is a `Button type="submit"` with `loading={isPending}` and
`disabled={isPending || isUploading}`, relabelled `reportAnimal.submitting` only while the create
request is pending. Photo uploads disable the button without changing its loading state or label.

A failed submission leaves the form editable. Photo-upload failures render inline above the photo
grid through `MultiImageUpload`'s `uploadError`. A submit failure that yields an inline key — a
response resolving without the server `id` — renders an inline `NotificationBanner` above the submit
button. HTTP 400, HTTP 429, HTTP 500, server, maintenance, network, auth, and permission failures are
surfaced by the shared `MutationCache` toast instead, so they are not duplicated inline.
`window.scrollTo(0, 0)` happens only on success.

### 1.3 Success card

Once `submitted` is true the form is replaced by a confirmation card: a `CheckCircle` in
`bg-success-light`, `reportAnimal.success_title`, the case number, a `success_volunteers` line, and
a button back to `/`. The page also calls `window.scrollTo(0, 0)` on success.

The success card renders only after `onSubmit` resolves with a real server `id`. The displayed case
number is `result.id` from the create response, and nothing is shown as a case number before that.
A response that resolves **without** an `id` leaves the form visible and sets
`reportAnimal.submit_failed`; no client-generated identifier and no placeholder case number exist.

### 1.4 Stray CTA

`components/StrayCTA.tsx` renders below the form. It is a near-verbatim copy of
`home/components/StrayCTA.tsx`, differing only by a `full-width` class. Both link to
`/report-animal` (live) and `/volunteer` (**dead route**). See
[Home §1.4](02-home.md#14-stray-cta).

## 2. End-to-End Flow

```mermaid
flowchart TD
    A[GET /report-animal<br/>public route · optional authentication] --> B[ReportAnimalForm<br/>one page · 2 fieldset cards]
    B --> C[AnimalBasicsSection<br/>location · type · count · colour · size · age · photos]
    C --> D[BehaviorContactSection<br/>behaviour · description · urgent · optional email]
    D --> E{client Zod validation}
    E -- fail --> B
    E -- pass --> F[uploadFiles(files, 'report-animal')<br/>Files → multipart]
    F --> G[POST /api/document/files<br/>guest allowed only for `report-animal` folder]
    G --> H[File storage<br/>provider-configurable<br/>stored file URLs]
    H --> I[map form values → AnimalReportDto<br/>urgent → status · behavior → statusDescription]
    I --> J[POST /api/core/report-animal<br/>optional authentication · reporterPhotos: [key]]
    J --> K[Gateway signs InternalJwt]
    K --> L[AnimalReportSchema inbound validation]
    L --> M[ReportAnimalService.create]
    M --> N[(animalReports<br/>animalStatus = pending<br/>reporter = authenticated claims or null for guests)]
    N --> O[Rescue feed reads the same collection]
    O --> P[Success card · case number]
```

`onSubmit` does the DTO mapping itself rather than submitting form values directly. The mapping is
where `animalType: 'other'` collapses to the free-text `otherAnimalType`, coordinates are omitted
unless both are present, and `status` is derived from the `urgent` checkbox.

## 3. Endpoint

| Method | Path                      | Policy        | Notes                                                                                                                                               |
| ------ | ------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/api/document/files`     | optional auth | document-service generic upload: multipart `files` + optional `folder`; images (JPEG/PNG/WebP), 5 MB each, max 5; storage provider is config-driven |
| POST   | `/api/core/report-animal` | optional auth | `AnimalReportSchema` inbound, `.parse()` outbound; `reporterPhotos` carries storage keys                                                            |

There is no list, read, update, or delete endpoint for reports. The feed reads them through the
rescue module's `GET /api/core/rescues` — see [Rescue Cases](04-rescue-cases.md).

## 4. Photos

Photos are uploaded before the report is submitted through document-service's file-upload API
`POST /api/document/files` (multipart `files`, optional `folder`). Anonymous callers are restricted
to the `report-animal` folder; authenticated callers retain the existing generic upload capability. Storage sits behind a **provider-agnostic** `FileStorage` port; the Vercel Blob adapter
is selected by `storage.provider`, so switching or adding a provider is a config + adapter change.
The reusable client helper is `uploadFiles(files, folder?)` in
`apps/frontend/portal/src/shared/api/file.api.ts`; the report form calls it with
`folder: 'report-animal'`, then submits `reporterPhotos` as the returned **storage keys** in the JSON body. The
endpoint accepts JPEG/PNG/WebP images up to 5 MB each, max 5 files (`FILE_UPLOAD_LIMITS`);
for the `report-animal` folder, FilesService also enforces JPEG/PNG and a 2 MB per-photo server-side limit, matching the form's picker and validation. `reporterPhotosSchema` enforces storage keys (2–5 entries) on the report endpoint as well.

An upload failure is reported inline by the photo control, above the image grid, not at the bottom of
the form.

document-service verifies each upload's **real bytes** against the declared MIME
(JPEG/PNG/WebP signatures), so a file cannot be relabelled, and throttles authenticated uploads per user
(20 requests / 100 MB per minute, per process). Guest uploads are not subject to the document-service per-user limiter; the gateway's existing global rate limit still applies. Uploads return only the **storage key**
(`report-animal/<short-uuid>.<ext>`, no original filename); the Vercel Blob host is never stored or returned. Core-service
derives display URLs at read time as `<BLOB_PUBLIC_BASE_URL>/<key>`, where `BLOB_PUBLIC_BASE_URL` is a
**required, validated** config that must route to the Blob store (reverse proxy or edge rewrite —
Vercel Blob has no native custom domain).

On Vercel, storage auth uses **OIDC** (`BLOB_STORE_ID` + the auto-injected
`VERCEL_OIDC_TOKEN`); `BLOB_READ_WRITE_TOKEN` is only the local fallback.

Consequence: `animalReports` documents store URLs, not bytes, so they stay small. Rescue list/detail
return those URLs directly; there is no photo decode/proxy endpoint. Already-stored base64 documents
are not migrated or specially handled.

## 5. Data Model

`animalReports` is shared with the rescue feature. The fields this feature writes:

| Field               | Type      | Source                                                                                                                                     |
| ------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `animalType`        | String    | `cat` \| `dog` \| `other` (+ free-text when other)                                                                                         |
| `animalCount`       | Int       | Stepper, ≥ 1                                                                                                                               |
| `age`               | String    | `baby` \| `adult` — only two buckets                                                                                                       |
| `size`              | String    | `small` \| `medium` \| `large`                                                                                                             |
| `appearance`        | Json      | `{ color }` and nothing else                                                                                                               |
| `locationObj`       | Json      | `{ address, latitude?, longitude? }`                                                                                                       |
| `animalStatus`      | String    | Always `pending` on write                                                                                                                  |
| `statusDescription` | String?   | The raw `behavior` enum value: `values.behavior ?? ''`                                                                                     |
| `description`       | String    | ≤ 200 chars, trimmed                                                                                                                       |
| `reporterPhotos`    | String[]  | Storage keys, 2–5 entries                                                                                                                  |
| `reporter`          | Object?   | Authenticated reporter identity; null for guest submissions                                         |
| `reporterEmail`     | String?   | Optional private contact email; excluded from public rescue DTOs                                                                                                 |
| `status`            | String    | `@default("active")` — **written by nothing, read by nothing.** Not the DTO's `status`; see [§6](#6-contract-persistence-details) |
| `deletedAt`         | DateTime? | Soft delete; this is what `findAll` actually filters on                                                                                    |

## 6. Contract persistence details

`ReportAnimalService.create` writes an **explicit field list** into Prisma:

```ts
data: {
  animalType, age, appearance, locationObj,
  animalStatus: AnimalStatus.PENDING, statusDescription, description,
  size, animalCount, reporter, reporterEmail, reporterPhotos,
}
```

`status` is validated in transit but is not persisted. The optional `contactInfo.email` is mapped to the private `reporterEmail` model field.

### 6.1 `contactInfo`

`AnimalReportSchema` accepts `contactInfo: { email? }`. The email is optional and validated only
when supplied. `ReportAnimalService.create` stores it in the private `reporterEmail` field for
follow-up. The create endpoint returns only the report ID, and public rescue list/detail DTOs never
select or serialize the email. No phone number is collected or stored.

### 6.2 `status` — and a name collision

`status` on the DTO is `z.enum(['dangerous', 'friendly', 'scared', 'other'])` — a **temperament**
classification, four values. The form never lets a user choose it. `onSubmit` writes:

```ts
status: values.urgent ? 'dangerous' : 'other',
```

so a four-value enum is collapsed to two by a boolean that means something else, and `friendly` and
`scared` are unreachable. The form's actual behaviour control is a _different_ four-value radio,
`BEHAVIORS = friendly | wary | aggressive | unknown`. The two vocabularies overlap on exactly one
value, `friendly`; `wary`/`aggressive`/`unknown` have no counterpart in `status`, and
`dangerous`/`scared` have no counterpart in `behavior`. The user's actual behaviour answer is
stored as the raw enum string in `statusDescription`, and an unrelated boolean is sent in its place.

The service then drops `status` too. The reason is almost certainly a **name collision**: the model
also has a column called `status`, defaulting to `"active"`, which is a soft-delete-style flag and
has nothing to do with temperament. Nothing writes that column — `create` omits it, so it takes the
default — and nothing reads it either, since `findAll` filters on `deletedAt: { isSet: false }`
rather than on `status`. It is a dead column whose name shadows a live contract field.

Net effect: **the only behaviour signal that survives is the raw `behavior` string in
`statusDescription`**, and the `dangerous` value the form can send goes nowhere.
`RescueListItemSchema` and `RescueDetailSchema` expose `statusDescription` only as an optional
free string and expose neither enum, so the rescue feed cannot distinguish a dangerous animal from
a friendly one.

## 7. Frontend Files

| File                                        | Role                                                                                                                          |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `route.tsx`                                 | `reportAnimalRoute`; public route with optional authentication                                                              |
| `index.tsx`                                 | Page container; exports `ReportAnimal`                                                                                        |
| `components/ReportAnimalForm.tsx`           | RHF form; uploads photos, maps form values to the DTO, and owns the success card                                              |
| `components/AnimalBasicsSection.tsx`        | §1.1                                                                                                                          |
| `components/LocationSection.tsx`            | Address + coordinates                                                                                                         |
| `components/PhotoUpload.tsx`                | `photos` field via `MultiImageUpload`; count/size/type validation, and forwards the upload error for rendering above the grid |
| `components/AnimalCountStepper.tsx`         | Count −/+                                                                                                                     |
| `components/BehaviorContactSection.tsx`     | §1.2                                                                                                                          |
| `components/StrayCTA.tsx`                   | §1.4 — duplicated from `home`                                                                                                 |
| `components/types.ts`                       | Re-exports `ANIMAL_TYPES`, `SIZES`, `BEHAVIORS`, `RescueAgeValues` and their types from `@pawhaven/shared/types`              |
| `utils/reportSubmitError.ts`                | Maps submit failures to the inline message key; returns `null` for errors already shown by the shared toast                   |
| `api/reportAnimal.api.ts` / `.mutations.ts` | The call; the mutation invalidates the rescue-feed and home keys                                                              |
| `../../shared/api/file.api.ts`              | `uploadFiles(files, folder?)` — generic Blob upload helper (shared, not feature-local)                                        |
| `tests/`                                    | Component, validation, DTO-mapping and API tests, plus `ReportAnimal.submit` (400/429/500, unreadable photos, real `id`)      |

Validation is schema-first on both sides, and the two schemas are deliberately different shapes:
`createReportAnimalFormSchema(messages)` builds a client Zod schema with translated messages,
while the server independently parses `AnimalReportSchema`. They are not shared, because `File`
cannot cross the wire and data URLs cannot exist in a form value.

## 8. What Does Not Exist

- **No wizard, no steps, no progress indicator.** One scrolling form.
- **No edit or delete.** A submitted report is immutable through the API, and there is no delete
  path at all.
- **No duplicate detection.** No radius/species dedupe, no `guestToken`.
- **Guest submission is supported.** Guests can submit reports and photos without an account. Their reporter identity is null; an optional email is stored privately. There is no guest report-management or edit/delete endpoint.
- **No urgency tiers.** `low/medium/high/critical` does not exist. The one `urgent` boolean is
  folded into a temperament enum the user never sees and the service then discards — see
  [§6.2](#62-status--and-a-name-collision). Nothing downstream can tell an urgent report from a
  calm one.
- **No stored behaviour classification.** The user's `behavior` answer survives only as a raw,
  untyped string in `statusDescription`; the `status` enum designed to carry it is dropped.
- **Private contact retention.** An optional `reporterEmail` is stored for follow-up and excluded from public rescue DTOs — see [§6.1](#61-contactinfo).
- **No case creation step, no volunteer notification, no content recommendation.** The report is
  the case; there is no event bus and no other module reacts to it.
- **No geocoding.** `address` is typed; nothing resolves it to coordinates, and the feed renders
  neither.
- **No draft saving.** A reload loses the whole form, including already-decoded photo data URLs.

## 9. Related Docs

- [Rescue Cases](04-rescue-cases.md) — reads the same `animalReports` collection
- [Home](02-home.md) — surfaces the newest reports; owns the other `StrayCTA` copy
- [Auth](01-auth.md) — public reporting with optional authentication
- [Product Blueprint §3 (Discovery)](../product/product-strategy.md) — the intended
  version of this flow, including guest submission and duplicate detection
