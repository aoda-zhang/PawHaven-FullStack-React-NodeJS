# arch-01 — Who owns a rescue photo, and where does it live

**Category:** architecture · **Primary surface:** core-service + document-service + the portal
upload path · **Risk band:** PII in a persisted document, read on an unauthenticated route

## Task prompt

> We need to add image resizing and thumbnail generation to rescue photos. Before anyone picks a
> service, work out what actually happens to a photo today: where it is produced, where it is
> stored, which service reads it back, and which service would be the honest owner of processing.
> Then write the decision down with the boundary you would defend in review.

## Expected classification (§6)

```json
{
  "taskType": "architecture-change",
  "secondaryTasks": ["documentation"],
  "scope": [
    "backend",
    "core-service",
    "document-service",
    "api",
    "database",
    "frontend",
    "documentation"
  ],
  "complexity": "high",
  "risk": "high",
  "confidence": 0.8,
  "workflow": "architecture-change",
  "requiredAgents": [
    "scout",
    "oracle",
    "architect",
    "backend",
    "tester",
    "reviewer"
  ],
  "requiredVerification": [
    "pnpm --filter @pawhaven/core-service test",
    "pnpm --filter @pawhaven/document-service test",
    "pnpm typecheck"
  ],
  "requiresClarification": true,
  "clarificationReason": "Object storage is not in the repo. Whether image processing belongs in document-service, in core-service, or in a new service changes what the decision commits the team to."
}
```

Accept `risk: high` or `critical` — photos are PII and `GET /rescues/:id/photo/:index` is
`@OptionalAuth()`. Accept `requiresClarification: true`, or `false` only when the run states the
storage assumption it made and writes it down. `taskType: feature` is a classification failure: the
run must not ship resizing as a side effect.

## Workflow route

`/architecture-change`. The deliverable is the traced current state plus a proposed boundary, not
code. A run that implements resizing without a landed decision has skipped the prompt's own gate.

## Observable success criteria

1. The current path is traced end to end with real file and symbol citations, each one verified to
   exist:
   - **produced** in the browser —
     `apps/frontend/portal/src/features/report-animal/utils/readFilesAsDataUrls.ts` calls
     `FileReader.readAsDataURL`, driven by
     `apps/frontend/portal/src/features/report-animal/components/PhotoUpload.tsx`.
   - **validated** by `reporterPhotosSchema` in `packages/shared/types/ReportAnimal.schema.ts` —
     2 to 5 photos (`REPORT_PHOTO_LIMITS`), prefix-checked against `supportedPhotoPrefixes`
     (JPG/JPEG/PNG), and size-checked by decoding the base64 length arithmetically rather than by
     reading the bytes.
   - **transported** inside the report body —
     `apps/frontend/portal/src/features/report-animal/api/reportAnimal.api.ts` posts
     `/core/report-animal` with the data URLs inline in the JSON DTO. There is no upload endpoint.
   - **persisted** by `ReportAnimalService.create`
     (`apps/backend/core-service/src/modules/report-animal/reportAnimal.service.ts`) into
     `reporterPhotos: dto.reporterPhotos` on `model animalReports`
     (`apps/backend/core-service/src/prisma/mongodb/schema.prisma`, `reporterPhotos String[]`) —
     the base64 strings sit inside the Mongo document.
   - **read back** by `RescueService.decodePhoto`
     (`apps/backend/core-service/src/modules/rescue/rescue.service.ts`), which strips the
     `data:` prefix and the `;base64,` marker and returns `{ mimeType, buffer }`;
     `RescueController.findPhoto` streams it with `Cache-Control: public, max-age=31536000,
immutable`. `buildPhotoUrl` synthesises the URL clients fetch.
2. The trace states explicitly that `document-service` has **no upload or image module** —
   `apps/backend/document-service/src/modules/` contains exactly `email/` and `pdf/`. Any claim that
   it already processes images, or that an upload endpoint exists to extend, is false at this commit
   and is a blocking finding.
3. The write and the read live in different modules of the same service and disagree about the
   format boundary: the writer accepts whatever `AnimalReportSchema` allowed, the reader requires a
   data URL and returns `undefined` for anything else — which `findPhoto` turns into a 404. A
   record with a non-data-URL photo is therefore invisible rather than broken. The decision must
   say where that check belongs after the change.
4. The proposed boundary is stated as a decision, not a preference: which service owns processing,
   what crosses the wire, what the persisted shape becomes, and what happens to the rows already
   stored as data URLs (backfill, dual-read, or accept-and-stop). `AGENTS.md` describes
   document-service as "Upload, PDF generation, email, image processing"; the run must either
   reconcile that claim with the code or record it as a documentation defect — silently working
   around it is the failure.
5. Cost and blast radius are quantified against the real constraints, not hand-waved: the gateway's
   `http.maxJsonBodySize` is `100mb`
   (`apps/backend/gateway/src/config/dev/env/index.json`), photos ride inside that JSON body, and
   Mongo's document limit is the ceiling the current design is actually running into. A decision
   that does not mention how it avoids re-encoding the existing inline base64 has not done the work.
6. Access posture is addressed: the photo route is `@OptionalAuth()` and its cache header is
   `public` + one year + `immutable`, so a photo URL is a bearer capability for PII. Whatever the
   new storage is, the decision keeps or deliberately changes that, and says which.
7. The output is a written decision artefact —
   `docs/architecture/<new photo-ownership doc>.md`, wired from `docs/README.md` — there is no
   per-directory index under `docs/architecture/`, so the entry point is `docs/README.md` — plus a `/handoff` with Doc Impact = `create` or `update`. `AGENTS.md` requires the
   matching architecture doc to move in the same change as the architecture.

## What a good run must produce

The traced path with every hop cited and verified · the explicit statement that no upload endpoint
exists today · the current-vs-proposed boundary in one comparison · the migration story for
existing data-URL rows · the access/caching consequence · the `AGENTS.md` discrepancy called out ·
the decision document · `<result>` with a `<verification>` block naming the commands run to confirm
each cited path exists. No push, no PR, no commit, and no implementation.

## Real surfaces involved

- `apps/frontend/portal/src/features/report-animal/utils/readFilesAsDataUrls.ts`,
  `components/PhotoUpload.tsx`, `components/ReportAnimalForm.tsx`, `api/reportAnimal.api.ts`,
  `tests/PhotoUpload.test.tsx`.
- `packages/shared/types/ReportAnimal.schema.ts` — `photoDataUrlSchema`, `supportedPhotoPrefixes`,
  `REPORT_PHOTO_LIMITS`, `reporterPhotosSchema`.
- `apps/backend/core-service/src/modules/report-animal/reportAnimal.service.ts`,
  `reportAnimal.controller.ts`.
- `apps/backend/core-service/src/modules/rescue/rescue.service.ts` — `findPhoto`, `decodePhoto`,
  `buildPhotoUrl`, `findPhotoBearingIds`; `rescue.controller.ts` — `findPhoto`, `PHOTO_CACHE_CONTROL`.
- `apps/backend/core-service/src/prisma/mongodb/schema.prisma` — `model animalReports`,
  `reporterPhotos String[]`.
- `apps/backend/document-service/src/modules/` — `email/`, `pdf/` only; `pdf.service.ts`,
  `internalPdf.controller.ts`, `pdfPayloadSize.guard.ts`, `templates/` — the only existing
  document-ish surface.
- `apps/backend/gateway/src/config/dev/env/index.json` — `http.maxJsonBodySize`,
  `auth.*`, `microServices[].gatewayPrefix` (`/api/core`, `/api/document`).
- `packages/i18n/locales/*/imageUpload.json` — the upload copy the portal already carries.
- `docs/architecture/PawHaven-Backend-Architecture.md`, `docs/architecture/PawHaven-System-Architecture-Overview.md`,
  `docs/features/03-report-animal.md`, `docs/features/04-rescue-cases.md`.

## Known trap

There is no object storage, no S3 client, and no upload endpoint anywhere in the repo. A run that
proposes "store photos in S3 and have document-service resize them" has anchored on an infrastructure
surface that does not exist here, and every subsequent step — bucket, SDK, presigned URLs, lifecycle —
is invented. The honest current state is: base64 data URLs inside a Mongo document, validated at
the schema, streamed back by core-service, capped by the gateway's JSON body limit.

Second trap: `packages/design-system/scripts/` holds only `build-tokens.mjs` and
`build-tokens.css` at this commit, while both `packages/design-system/package.json` and the root
`package.json` reference a `token-check` script that is not on disk. So a run citing
`pnpm token-check` as evidence for anything in this area is citing a command that cannot run.
